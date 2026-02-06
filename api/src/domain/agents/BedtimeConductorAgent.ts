
/**
 * BedtimeConductorAgent (Backend)
 * 
 * The "Brain" of the bedtime routine.
 * Responsibilities:
 * 1. Orchestrates the session
 * 2. Refines simple user requests into context-aware prompts
 * 3. Manages active goals (Sleep, Education, Bonding)
 */

import { StoryBeatCompletedEvent, SleepCueDetectedEvent } from '../../application/ports/EventBusPort.js'
import { AgentContextSchema, SessionConfigSchema } from '../schemas/AgentSchemas.js' // [NEW] Validation
import { ActiveGoal } from '../entities/ActiveGoal.js'
import { Suggestion } from '../entities/Suggestion.js'
import { AgentMemoryPort } from '../../application/ports/AgentMemoryPort.js'
import { SessionStatePort, SessionState } from '../../application/ports/SessionStatePort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'
import { AmbientContext, AmbientContextPort } from '../../application/ports/AmbientContextPort.js'
import { AIServicePort } from '../../application/ports/AIServicePort.js'
import { PromptServicePort } from '../../application/ports/PromptServicePort.js'
import { SafetyGuardian } from '../services/SafetyGuardian.js'
import { AtomOfThoughtEngine, ThoughtStep, Goal, SessionPhase } from '../services/AtomOfThoughtEngine.js'
import { TraceRepositoryPort } from '../../application/ports/TraceRepositoryPort.js'
import { ResilienceStrategyPort } from '../../application/ports/ResilienceStrategyPort.js'
import { SessionPlanner, AgendaItem } from '../services/SessionPlanner.js'
import { QualityGate } from '../services/QualityGate.js'

/**
 * ReasoningTrace - Transparency for the Agent's decision making.
 */
export interface ReasoningTrace {
    type: 'trace_object' // [AI-02] Explicit Artifact Type
    goals_considered: string[]
    conflict_detected: boolean
    conflicts_identified?: string
    trade_off_made?: string
    thought: string
    action: string
    confidence: number
    timestamp: Date
    resilience_meta?: {
        failure_encountered?: string
        correction_attempted?: boolean
        recovery_cost_usd?: number
    }
}

/**
 * SessionConfig - Domain-native representation of story generation parameters.
 */
export interface SessionConfig {
    theme: string
    duration?: 'short' | 'medium' | 'long'
    style?: string
    childName?: string
    childAge?: number
}

export interface ConductSessionResult {
    refinedRequest: SessionConfig
    reasoningTrace: ReasoningTrace[]
    contextualNotes?: string // Extra context for story weaver
}

export interface AgentContext {
    childName?: string
    childAge?: number
    currentMood?: 'energetic' | 'calm' | 'tired' | 'fussy'
    recentInterests?: string[]
    userId?: string
    sessionId?: string
    traceId?: string
    accessToken?: string // [SEC-02]
    envContext?: AmbientContext | null
    [key: string]: unknown
}

export class BedtimeConductorAgent {
    private memory: AgentMemoryPort | undefined
    private sessionState: SessionStatePort | undefined // [NEW] Synced State
    private logger: LoggerPort
    private aiService: AIServicePort // New Brain Dependency
    private promptService: PromptServicePort
    private resilienceEngine: ResilienceStrategyPort
    private traceRepository: TraceRepositoryPort | undefined // [TRACE-01]
    private qualityGate: QualityGate | undefined // [2026] Quality Gate


    constructor(
        aiService: AIServicePort,
        promptService: PromptServicePort,
        sessionState: SessionStatePort,
        resilienceEngine: ResilienceStrategyPort,
        memory?: AgentMemoryPort,
        logger?: LoggerPort,
        traceRepository?: TraceRepositoryPort,
        qualityGate?: QualityGate
    ) {
        this.aiService = aiService
        this.promptService = promptService
        this.sessionState = sessionState
        this.resilienceEngine = resilienceEngine
        this.memory = memory
        this.logger = logger || { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }
        this.traceRepository = traceRepository
        this.qualityGate = qualityGate

        this.logger.info('[BedtimeConductor] Initialized with Real Agentic Brain (Gemini) + Resilience')
    }

    private async _getOrInitState(sessionId: string, userId: string): Promise<SessionState> {
        if (!this.sessionState) throw new Error("SessionState unavailable")
        let state = await this.sessionState.get(sessionId)
        if (!state) {
            state = {
                sessionId,
                userId,
                phase: 'IDLE',
                activeIntent: 'IDLE',
                emotionalTone: 0.5,
                context: {},
                updatedAt: new Date()
            }
            await this.sessionState.set(sessionId, state)
        } else if (!state.activeGoals && state.activeGoal) {
            state.activeGoals = [state.activeGoal]
            await this.sessionState.set(sessionId, state)
        }
        return state
    }

    /**
     * Helper to hydrate state and get the active goal.
     */
    private async _hydrateActiveGoalHelper(sessionId: string, userId: string): Promise<{ state: SessionState, activeGoal: ActiveGoal | null }> {
        const state = await this._getOrInitState(sessionId, userId)
        const goalProps = state.activeGoals?.[0] ?? state.activeGoal
        const activeGoal = goalProps ? ActiveGoal.create(goalProps) : null
        return { state, activeGoal }
    }

    /**
     * Conducts a "ReAct" (Reason-Act) session to determine the best story parameters.
     * Uses Gemini to reason about the request + context.
     */
    async conductStorySession(config: SessionConfig, context: AgentContext = {}): Promise<ConductSessionResult> {
        // [VAL-01] Validate Inputs
        const validatedConfig = SessionConfigSchema.parse(config)
        const validatedContext = AgentContextSchema.parse(context)

        const sessionId = validatedContext.sessionId || context.sessionId || `session_${Date.now()}`
        const userId = validatedContext.userId || 'anon'

        // 0. Hydrate State
        let state = await this._getOrInitState(sessionId, userId)
        const activeGoalProps = state.activeGoals?.[0] ?? state.activeGoal
        const activeGoal = activeGoalProps ? ActiveGoal.create(activeGoalProps) : null

        if (!state.sessionStartTime) {
            state.sessionStartTime = new Date()
            state.phase = AtomOfThoughtEngine.transition(state.phase, 'START') // IDLE -> ONBOARDING
            await this.sessionState!.set(sessionId, state)
        }

        // [AI-01] Explicit Goal Planning
        const agenda = SessionPlanner.generateAgenda(config.duration)
        this.logger.info('[BedtimeConductor] Session Agenda Generated (Autonomy)', { agenda })

        // 1. Observe (Environment + Memory)
        const envContext = context.envContext

        let memoryContext = ''
        if (this.memory && userId !== 'anon') {
            // A. Contextual Preferences (from pairwise choices & outcome tracking)
            const preferenceContext = await this.retrievePreferenceContext(config.theme, context as AgentContext & { userId: string })

            // B. Semantic/Episodic Memories (Recent turns/facts)
            const memories = await this.memory.retrieve(config.theme, { userId, sessionId }, 'PREFERENCE', 3)
            const episodicStr = memories.map((m: any) => m.content).join('; ')

            memoryContext = `${preferenceContext}\nOther facts: ${episodicStr}`
        }

        const observation = this.promptService.formatAgentObservation({
            userMessage: this.promptService.getStartStoryTrigger(config.theme),
            childName: context.childName,
            childAge: context.childAge,
            currentMood: context.currentMood,
            activeGoal: activeGoal ? `${activeGoal.type} (${activeGoal.description})` : undefined,
            envContext: envContext ? `${envContext.timeOfDay}, ${envContext.weather.condition}` : 'Unknown',
            memoryContext: memoryContext || 'None'
        })

        let attempts = 0
        const maxAttempts = 3
        let currentError: unknown = null
        let accumulatedCost = 0

        while (attempts < maxAttempts) {
            attempts++
            try {
                // 2. Multi-Goal Reasoning (The Brain)
                const rawThought = await this.aiService.generateAgentThought({
                    systemPrompt: this.promptService.getConductorSystemPrompt(),
                    userMessage: observation,
                    traceId: context.traceId
                })

                // 2.5 Deterministic Arbitration (AoT Engine)
                const arbitrated = AtomOfThoughtEngine.arbitrate({
                    goals_considered: rawThought.goals_considered,
                    conflicts_identified: rawThought.conflicts_identified,
                    trade_off_made: rawThought.trade_off_made,
                    thought: rawThought.thought,
                    action: rawThought.action,
                    confidence: rawThought.confidence,
                    parameters: rawThought.parameters
                }, {
                    timeOfDay: envContext?.timeOfDay || 'Unknown',
                    childAge: context.childAge || 5,
                    childMood: context.currentMood || 'calm',
                    activeGoals: AtomOfThoughtEngine.getStandardGoals(),
                    currentPhase: state.phase
                })

                const trace: ReasoningTrace = {
                    type: 'trace_object', // [AI-02]
                    goals_considered: arbitrated.goals_considered,
                    conflict_detected: !!arbitrated.conflicts_identified,
                    conflicts_identified: arbitrated.conflicts_identified || undefined,
                    trade_off_made: arbitrated.trade_off_made || undefined,
                    thought: arbitrated.thought,
                    action: arbitrated.action,
                    confidence: arbitrated.confidence,
                    timestamp: new Date()
                }

                // [TRACE-01] Persist Trace
                if (this.traceRepository) {
                    await this.traceRepository.save(trace).catch(err => this.logger.error('Trace save failed', err))
                }

                if (currentError) {
                    // Log that we recovered
                    trace.resilience_meta = {
                        failure_encountered: String(currentError),
                        correction_attempted: true,
                        recovery_cost_usd: accumulatedCost
                    }
                }

                // 3. Action execution
                const refined = { ...config }

                // Update State with last suggested theme
                state = await this._getOrInitState(sessionId, userId) // Re-fetch to ensure freshness
                state.lastSuggestedTheme = refined.theme
                await this.sessionState!.set(sessionId, state)

                const durationParam = arbitrated.parameters?.['duration']
                if (durationParam === 'short' || durationParam === 'medium' || durationParam === 'long') {
                    refined.duration = durationParam
                }

                return {
                    refinedRequest: refined,
                    reasoningTrace: [trace],
                    contextualNotes: memoryContext
                }

            } catch (error: unknown) {
                currentError = error
                this.logger.error(`[BedtimeConductor] Attempt ${attempts} failed`, error)

                // 4. Autonomous Resilience Check
                try {
                    // [2026] Enhance Error Mapping
                    let failureType: any = 'UNKNOWN'
                    if (error instanceof Error && error.name === 'QualityGateError') {
                        failureType = 'QUALITY_BREACH'
                    }

                    const resiliencePlan = await this.resilienceEngine.assessFailure({
                        type: failureType,
                        context: { error: error instanceof Error ? error.message : String(error) },
                        attempt: attempts,
                        costSoFar: accumulatedCost
                    })

                    this.logger.info(`[BedtimeConductor] Resilience Strategy: ${resiliencePlan.action}`)
                    accumulatedCost += resiliencePlan.estimatedCost

                    if (resiliencePlan.action === 'ABORT' || resiliencePlan.action === 'FALLBACK') {
                        break; // Exit loop to return fallback
                    } else if (resiliencePlan.action === 'DEGRADE_SERVICE') {
                        // [2026] Safe Mode Trigger
                        // Return immediate safe response, bypassing further AI generation
                        return {
                            refinedRequest: config,
                            reasoningTrace: [{
                                type: 'trace_object',
                                goals_considered: ['SAFETY', 'RECOVERY'],
                                conflict_detected: true,
                                thought: 'Quality Gate Breached. Engaging Safe Mode.',
                                action: 'SAFE_MODE',
                                confidence: 1.0,
                                timestamp: new Date(),
                                resilience_meta: {
                                    failure_encountered: 'QUALITY_BREACH',
                                    correction_attempted: true
                                }
                            }],
                            contextualNotes: 'Safe Mode active.'
                        }
                    } else if (resiliencePlan.action === 'RETRY' || resiliencePlan.action === 'SELF_CORRECT') {
                        if (resiliencePlan.parameters) {
                            const backoffMs = typeof resiliencePlan.parameters['backoffMs'] === 'number'
                                ? resiliencePlan.parameters['backoffMs']
                                : (typeof resiliencePlan.parameters['timeoutMs'] === 'number' ? resiliencePlan.parameters['timeoutMs'] : undefined)
                            if (typeof backoffMs === 'number' && Number.isFinite(backoffMs) && backoffMs > 0) {
                                const safeMs = Math.min(30_000, Math.max(50, Math.floor(backoffMs)))
                                await new Promise(resolve => setTimeout(resolve, safeMs))
                            }
                        }
                        continue
                    }
                } catch (resilienceError) {
                    this.logger.error('Resilience Engine itself failed', resilienceError)
                    break
                }
            }
        }

        // Fallback default
        return {
            refinedRequest: config,
            reasoningTrace: [{
                type: 'trace_object', // [AI-02]
                goals_considered: ['RECOVERY'],
                conflict_detected: true,
                thought: `Brain failed after ${attempts} attempts. Falling back to defaults. Error: ${String(currentError)}`,
                action: 'START_STORY',
                confidence: 0.1,
                timestamp: new Date(),
                resilience_meta: {
                    failure_encountered: String(currentError),
                    correction_attempted: attempts > 1,
                    recovery_cost_usd: accumulatedCost
                }
            }]
        }
    }

    /**
     * Handles story beat completions to update goal progress.
     */
    /**
     * Handles story beat completions to update goal progress.
     */
    async handleStoryBeat(event: StoryBeatCompletedEvent): Promise<void> {
        const payload = event.payload as any
        const sessionId = payload.context?.sessionId || payload.sessionId || 'session_default'
        const userId = payload.context?.userId || payload.userId || 'anon'

        const { state, activeGoal } = await this._hydrateActiveGoalHelper(sessionId, userId)
        if (!activeGoal || activeGoal.status !== 'active') return

        const { beatIndex, totalBeats } = payload
        const progress = Math.round(((beatIndex + 1) / totalBeats) * 100)

        activeGoal.updateProgress(progress)

        if (progress >= 100) {
            activeGoal.markAchieved()
            this.logger.info(`[BedtimeConductor] Goal achieved: ${activeGoal.description}`)
        }

        const updated = activeGoal.toJSON()
        const stack = [...(state.activeGoals || [])]
        if (stack.length > 0) {
            stack[0] = updated
        } else {
            stack.unshift(updated)
        }

        if (progress >= 100) {
            stack.shift()
        }

        state.activeGoals = stack.length > 0 ? stack : undefined
        state.activeGoal = stack[0] || undefined
        await this.sessionState!.set(sessionId, state)
    }

    /**
     * R8: Handling Sleep Cues (Implicit Positive Feedback)
     */
    /**
     * R8: Handling Sleep Cues (Implicit Positive Feedback)
     */
    async handleSleepCueDetected(event: SleepCueDetectedEvent): Promise<void> {
        const payload = event.payload as any
        const sessionId = payload.context?.sessionId
        const userId = payload.context?.userId

        if (!sessionId || !userId || !this.sessionState) return

        const { state } = await this._hydrateActiveGoalHelper(sessionId, userId)

        if (!state.lastSuggestedTheme || !this.memory) return

        // Signal Extraction: sleep-to-time
        if (state.sessionStartTime) {
            const now = new Date()
            const diffMs = now.getTime() - new Date(state.sessionStartTime).getTime()
            const diffMins = Math.round(diffMs / 60000)
            this.logger.info(`[BedtimeConductor] Signal Extracted: Sleep-to-Time = ${diffMins} minutes`)

            state.phase = AtomOfThoughtEngine.transition(state.phase, 'SLEEP_DETECTED') // [ARC-01]
        }

        this.logger.info(`[BedtimeConductor] Sleep detected! attributing success to theme: ${state.lastSuggestedTheme}`)

        const context = payload.context as AgentContext
        if (context && context.userId) {
            const memoryContext = context as AgentContext & { userId: string }
            await this.memory.trackOutcome(state.lastSuggestedTheme, 'POSITIVE', memoryContext)
            await this.memory.trackOutcome(state.lastSuggestedTheme, 'POSITIVE', memoryContext) // Double weight
        }

        state.lastSuggestedTheme = undefined // Clear theme
        await this.sessionState.set(sessionId, state)
    }

    /**
     * Sets the active goal for the next session.
     */
    async setGoal(sessionId: string, userId: string, type: 'STORY_COMPLETED' | 'CHILD_ASLEEP', minutes: number): Promise<void>
    async setGoal(type: 'STORY_COMPLETED' | 'CHILD_ASLEEP', minutes: number): Promise<void>
    async setGoal(
        a: string,
        b: string | number,
        c?: 'STORY_COMPLETED' | 'CHILD_ASLEEP',
        d?: number
    ): Promise<void> {
        const isLegacy = (a === 'STORY_COMPLETED' || a === 'CHILD_ASLEEP') && typeof b === 'number'
        const sessionId = isLegacy ? 'session_default' : a
        const userId = isLegacy ? 'anon' : (b as string)
        const type = isLegacy ? (a as 'STORY_COMPLETED' | 'CHILD_ASLEEP') : (c as 'STORY_COMPLETED' | 'CHILD_ASLEEP')
        const minutes = isLegacy ? (b as number) : (d as number)

        const state = await this._getOrInitState(sessionId, userId)
        const goal = ActiveGoal.createNew({ type, targetMinutes: minutes })
        const goalJson = goal.toJSON()
        const existing = state.activeGoals || (state.activeGoal ? [state.activeGoal] : [])
        state.activeGoals = [goalJson, ...existing].slice(0, 5)
        state.activeGoal = state.activeGoals[0]
        await this.sessionState!.set(sessionId, state)
    }

    /**
     * Processes a conversational turn with the user.
     * NOW uses Real AI instead of string matching.
     */
    async processTurn(userMessage: string, context: AgentContext & { sessionId: string, userId: string }): Promise<{ reply: string, trace: ReasoningTrace[] }> {
        // [VAL-02] Validate Context
        const validatedContext = AgentContextSchema.parse(context) // Will throw if userId is invalid UUID
        const { sessionId, userId } = context // We use the passed ones which are now validated (if present in schema)
        let { state, activeGoal } = await this._hydrateActiveGoalHelper(sessionId, userId)
        let accumulatedCost = 0 // [2026] Track resilience cost per turn

        // 1.2 Learning Loop: Check for positive/negative triggers in the USER message
        let rejectedTheme: string | null = null
        // Track stats for UCR (Unattended Completion Rate)
        const currentInteractions = ((state.context['interactions'] as number) || 0) + 1
        let currentInterventions = ((state.context['interventions'] as number) || 0)

        if (state.lastSuggestedTheme && this.memory) {
            const lower = userMessage.toLowerCase()
            if (lower.match(/\b(no|hate|dislike|stop|bad|don't)\b/)) {
                rejectedTheme = state.lastSuggestedTheme
                await this.memory.trackOutcome(state.lastSuggestedTheme, 'NEGATIVE', { userId: context.userId })
                state.lastSuggestedTheme = undefined
                currentInterventions++ // Negative feedback is an intervention
            } else if (lower.match(/\b(yes|love|like|good|great|ok|okay)\b/)) {
                await this.memory.trackOutcome(state.lastSuggestedTheme, 'POSITIVE', { userId: context.userId })
                state.lastSuggestedTheme = undefined
            }
        }

        state.context['interactions'] = currentInteractions
        state.context['interventions'] = currentInterventions
        await this.sessionState!.set(sessionId, state)

        // 1.5 Extract context
        let memoryContext = ''
        if (this.memory) {
            const memories = await this.memory.retrieve(userMessage, { userId: context.userId, sessionId: context.sessionId }, 'EPISODIC', 3)
            memoryContext = memories.map((m: any) => m.content).join('; ')
        }

        const observation = this.promptService.formatAgentObservation({
            userMessage,
            childName: context.childName,
            childAge: context.childAge,
            currentMood: context.currentMood,
            activeGoal: activeGoal ? `${activeGoal.type} (${activeGoal.description})` : undefined,
            memoryContext: memoryContext || 'None'
        })

        // 2. Multi-Goal Reasoning
        try {
            // [2026] Quality Gate: Check UCR (Unattended Completion Rate) inside protection block
            if (this.qualityGate && currentInteractions > 0) {
                const ucr = 1.0 - (currentInterventions / currentInteractions)
                this.qualityGate.checkMetric('UCR', ucr)
            }

            const start = Date.now()
            const thought = await this.aiService.generateAgentThought({
                systemPrompt: this.promptService.getConductorSystemPrompt(),
                userMessage: observation,
                traceId: context.traceId
            })
            const end = Date.now()
            if (this.qualityGate) {
                this.qualityGate.checkMetric('LATENCY_MS', end - start)
            }

            const trace: ReasoningTrace = {
                type: 'trace_object', // [AI-02]
                goals_considered: thought.goals_considered || ['RELAXATION', 'BONDING'],
                conflict_detected: !!thought.conflicts_identified,
                conflicts_identified: thought.conflicts_identified || undefined,
                trade_off_made: thought.trade_off_made || undefined,
                thought: thought.thought,
                action: thought.action,
                confidence: thought.confidence || 0.9,
                timestamp: new Date()
            }

            // [TRACE-01] Persist Trace
            if (this.traceRepository) {
                await this.traceRepository.save(trace).catch(err => this.logger.error('Trace save failed', err))
            }

            // 3. Extract Reply
            const replyParam = thought.parameters?.['reply']
            const reply = (typeof replyParam === 'string' ? replyParam : null) || thought.thought || "I'm here."

            // temporal awareness for learning loop
            const themeParam = thought.parameters?.['theme']
            if (thought.action === 'SUGGEST' && typeof themeParam === 'string') {
                // Update state
                state = await this._getOrInitState(sessionId, userId)
                state.lastSuggestedTheme = themeParam
                await this.sessionState!.set(sessionId, state)

                // Record Pairwise Preference (DPO signal)
                if (rejectedTheme && this.memory) {
                    await this.memory.trackPreferencePair(themeParam, rejectedTheme, { userId: context.userId })
                    this.logger.info(`[BedtimeConductor] Pairwise Preference Recorded: ${themeParam} > ${rejectedTheme}`)
                }
            }

            return { reply, trace: [trace] }

        } catch (e: unknown) {
            void e
            return {
                reply: "I'm having trouble thinking right now, but I'm here. Let's just relax.",
                trace: [{
                    type: 'trace_object',
                    goals_considered: ['SAFETY', 'RECOVERY'],
                    conflict_detected: true,
                    thought: `Critical System Failure (Outer Catch): ${String(e)}. Engaging Emergency Safe Mode.`,
                    action: 'SAFE_MODE',
                    confidence: 1.0,
                    timestamp: new Date(),
                    resilience_meta: {
                        failure_encountered: 'CRITICAL_SYSTEM_FAILURE',
                        correction_attempted: false,
                        recovery_cost_usd: accumulatedCost // accumulatedCost is in scope (outer let)
                    }
                }]
            }
        }
    }

    /**
     * R8: Proactive Suggestions (Hybrid: Memory + AI)
     */
    async generateSuggestions(context: AgentContext): Promise<Suggestion[]> {
        const suggestions: Suggestion[] = []
        if (this.memory && context.userId) { // Ensure userId
            const stats = await this.memory.getThemeStats(context as AgentContext & { userId: string }, 2)
            for (const stat of stats) {
                suggestions.push({
                    id: `sugg_mem_${Date.now()}_${context.userId || 'anon'}_${stat.theme}`,
                    title: `A story about ${stat.theme}`,
                    theme: stat.theme,
                    reasoning: `You loved this before! (Score: ${stat.score})`,
                    confidence: 0.9
                })
            }
        }

        if (suggestions.length === 0) {
            suggestions.push({
                id: 'sugg_def_space',
                title: 'Space Adventure',
                theme: 'Space',
                reasoning: 'A classic favorite.',
                confidence: 0.5
            })
        }

        return suggestions
    }

    /**
     * Aggregates preference stats and pairwise learning data into a readable context string.
     */
    private async retrievePreferenceContext(theme: string, context: AgentContext & { userId: string }): Promise<string> {
        if (!this.memory) return 'No preference data.'

        try {
            const stats = await this.memory.getThemeStats(context, 3)
            const topThemes = stats.map((s: any) => `${s.theme} (score: ${s.score})`).join(', ')
            const statsContext = topThemes ? `Historical Top Interests: ${topThemes}` : 'No historical interests yet.'

            return `[PREFERENCE_CONTEXT]: ${statsContext}`
        } catch (e: unknown) {
            this.logger.error('Failed to retrieve preference context', e)
            return 'Preference retrieval degraded.'
        }
    }
}
