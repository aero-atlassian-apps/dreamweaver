
/**
 * BedtimeConductorAgent (Backend)
 * 
 * The "Brain" of the bedtime routine.
 * Responsibilities:
 * 1. Orchestrates the session
 * 2. Refines simple user requests into context-aware prompts
 * 3. Manages active goals (Sleep, Education, Bonding)
 */

import { GenerateStoryRequest } from '../../application/use-cases/GenerateStoryUseCase'
import { StoryBeatCompletedEvent } from '../../application/ports/EventBusPort'
import { ActiveGoal } from '../entities/ActiveGoal'
import { Suggestion } from '../entities/Suggestion'
import { AgentMemoryPort, AgentContext as MemoryContext } from '../../application/ports/AgentMemoryPort'
import { LoggerPort } from '../../application/ports/LoggerPort'

/**
 * ReasoningTrace - Transparency for the Agent's decision making.
 */
export interface ReasoningTrace {
    step: 'THOUGHT' | 'ACTION' | 'OBSERVATION' | 'CONCLUSION'
    content: string
    timestamp: Date
}

export interface ConductSessionResult {
    refinedRequest: GenerateStoryRequest
    reasoningTrace: ReasoningTrace[]
}

export interface AgentContext {
    childName?: string
    childAge?: number
    currentMood?: 'energetic' | 'calm' | 'tired' | 'fussy'
    recentInterests?: string[]
}

export class BedtimeConductorAgent {
    private activeGoal: ActiveGoal | null = null
    private memory: AgentMemoryPort | undefined
    private logger: LoggerPort

    constructor(memory?: AgentMemoryPort, logger?: LoggerPort) {
        this.memory = memory
        this.logger = logger || { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }
    }

    /**
     * Handles story beat completions to update goal progress.
     */
    handleStoryBeat(event: StoryBeatCompletedEvent): void {
        if (!this.activeGoal || this.activeGoal.status !== 'active') return

        const { beatIndex, totalBeats } = event.payload
        const progress = Math.round(((beatIndex + 1) / totalBeats) * 100)

        this.activeGoal.updateProgress(progress)

        if (progress >= 100) {
            this.activeGoal.markAchieved()
            this.logger.info(`[BedtimeConductor] Goal achieved: ${this.activeGoal.description}`)
        } else {
            this.logger.debug(`[BedtimeConductor] Goal progress: ${progress}%`)
        }
    }

    /**
     * Sets the active goal for the next session.
     */
    setGoal(type: 'STORY_COMPLETED' | 'CHILD_ASLEEP', minutes: number): void {
        this.activeGoal = ActiveGoal.createNew({
            type,
            targetMinutes: minutes
        })
    }
    /**
     * Conducts a "ReAct" (Reason-Act) session to determine the best story parameters.
     * Replaces the simple `refineStoryRequest`.
     */
    async conductStorySession(request: GenerateStoryRequest, context: AgentContext = {}): Promise<ConductSessionResult> {
        const trace: ReasoningTrace[] = []
        const refined = { ...request }

        // Step 1: Initial Thought (Context Analysis)
        trace.push({
            step: 'THOUGHT',
            content: `User wants "${request.theme}". Context: Moon=${context.currentMood}, Age=${context.childAge || '?'}. Time=${new Date().toLocaleTimeString()}`,
            timestamp: new Date()
        })

        // Step 2: Action (Memory Retrieval)
        if (this.memory) {
            trace.push({ step: 'ACTION', content: 'Checking procedural memory for bedtime rules', timestamp: new Date() })

            const memories = await this.memory.retrieve('bedtime rules', { userId: 'system' }, 'PROCEDURAL')

            trace.push({
                step: 'OBSERVATION',
                content: `Found ${memories.length} rules. Top: ${memories[0]?.content || 'None'}`,
                timestamp: new Date()
            })

            // Apply procedural knowledge
            for (const mem of memories) {
                // Heuristic application of rules (Mocking the LLM logic for R5.3)
                if (mem.content.includes('8 PM') && new Date().getHours() >= 20) {
                    if (!refined.duration) refined.duration = 'short'
                }
                if (mem.content.includes('age < 5') && (context.childAge || 10) < 5) {
                    if (!refined.duration) refined.duration = 'short'
                }
            }
        }

        // Step 3: Thought (Refinement)
        // Legacy Mood Logic preserved but wrapped in thought
        trace.push({ step: 'THOUGHT', content: 'Analyzing mood for pacing adjustments...', timestamp: new Date() })

        if (context.currentMood === 'tired') {
            refined.duration = 'short'
            trace.push({ step: 'CONCLUSION', content: 'Child is tired -> Enforcing SHORT duration.', timestamp: new Date() })
        } else if (context.currentMood === 'energetic') {
            refined.duration = 'medium'
            trace.push({ step: 'CONCLUSION', content: 'Child is energetic -> Setting MEDIUM duration to settle them down.', timestamp: new Date() })
        } else {
            trace.push({ step: 'CONCLUSION', content: 'Mood neutral. Keeping standard parameters.', timestamp: new Date() })
        }

        return {
            refinedRequest: refined,
            reasoningTrace: trace
        }
    }

    /**
     * @deprecated Use conductStorySession for full ReAct capabilities
     */
    refineStoryRequest(request: GenerateStoryRequest, context: AgentContext = {}): GenerateStoryRequest {
        // Fallback to new logic but drop traces (shim)
        // In a real async-to-sync refactor we'd need to handle promises, 
        // but for R5.3.X we update the use-case to await the new method.
        // For strictly sync callers (if any), we keep the old logic duplicated or stubbed.

        const refined = { ...request }

        // 1. Goal: Induce Sleep (Mood-based pacing)
        if (context.currentMood === 'tired') {
            refined.duration = 'short'
        } else if (context.currentMood === 'energetic') {
            refined.duration = 'medium'
        }

        // 2. Goal: Personalization (Age appropriate)
        if (context.childAge && context.childAge < 4) {
            // ...
        }

        return refined
    }

    /**
     * Processes a conversational turn with the user.
     * Uses a ReAct loop to maintain context and memory.
     */
    async processTurn(userMessage: string, context: AgentContext & { sessionId: string, userId: string }): Promise<{ reply: string, trace: ReasoningTrace[] }> {
        const trace: ReasoningTrace[] = []

        // 1. THOUGHT: Create Intent
        trace.push({
            step: 'THOUGHT',
            content: `User said: "${userMessage}". Context: Session=${context.sessionId}. Identifying intent...`,
            timestamp: new Date()
        })

        // 2. ACTION: Check Episodic Memory for context
        let memoryContext = ''
        if (this.memory) {
            trace.push({ step: 'ACTION', content: 'Retrieving conversational context (Episodic Memory)...', timestamp: new Date() })
            const memories = await this.memory.retrieve(userMessage, { userId: context.userId, sessionId: context.sessionId }, 'EPISODIC', 3)

            if (memories.length > 0) {
                memoryContext = `[Memory Recalled]: ${memories.map(m => m.content).join('; ')}`
                trace.push({ step: 'OBSERVATION', content: `Found memories: ${memories.map(m => m.content).join('; ')}`, timestamp: new Date() })
            } else {
                trace.push({ step: 'OBSERVATION', content: 'No relevant past memories found.', timestamp: new Date() })
            }
        }

        // 3. REASONING: Formulate Response
        trace.push({ step: 'THOUGHT', content: `Formulating response based on input + memory: ${memoryContext || 'None'}`, timestamp: new Date() })

        // Mock LLM Logic for R7 (simulating a "Chat" model)
        let reply = ''
        if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
            reply = "Hello! I'm your Bedtime Conductor. Shall we pick a story theme?"
        } else if (userMessage.toLowerCase().includes('no')) {
            reply = "That's okay! We can wait or try something else. What are you in the mood for?"
        } else {
            // Generic echo with memory context
            // In real implementations, this calls the LLM with the constructed prompt
            reply = `I hear you want "${userMessage}". Let me see what I can do. `
            if (memoryContext) reply += "(I remember we talked about this before!)"
        }

        trace.push({ step: 'CONCLUSION', content: `Replying: "${reply}"`, timestamp: new Date() })

        // 4. SIDE EFFECT: Save this turn to memory
        if (this.memory) {
            await this.memory.store(
                `User said: ${userMessage} | Agent replied: ${reply}`,
                'EPISODIC',
                { userId: context.userId, sessionId: context.sessionId },
                { sessionId: context.sessionId }
            )
        }

        return { reply, trace }
    }

    /**
     * R8: Proactive Suggestions
     * Uses Procedural Memory (Stats) to suggest successful themes.
     */
    async generateSuggestions(context: AgentContext): Promise<Suggestion[]> {
        if (!this.memory) return []

        const stats = await this.memory.getThemeStats(3)
        const suggestions: Suggestion[] = []

        // Strategy 1: Exploit (Pick top performing themes)
        for (const stat of stats) {
            suggestions.push({
                id: `sugg_${Date.now()}_${stat.theme}`,
                title: `A story about ${stat.theme}`,
                theme: stat.theme,
                reasoning: `Highly successful theme (Score: ${stat.score}) in previous sessions.`,
                confidence: 0.9
            })
        }

        // Strategy 2: Explore (If few memories, suggest safe defaults)
        if (suggestions.length < 3) {
            const defaults = ['space', 'dragons', 'ocean']
            for (const def of defaults) {
                if (!suggestions.find(s => s.theme === def)) {
                    suggestions.push({
                        id: `sugg_def_${def}`,
                        title: `Adventure in ${def}`,
                        theme: def,
                        reasoning: 'Standard safe default for new explorers.',
                        confidence: 0.5
                    })
                }
                if (suggestions.length >= 3) break
            }
        }

        return suggestions
    }

    // ... (Goal Tracking logic would be ported here as we scale)
}
