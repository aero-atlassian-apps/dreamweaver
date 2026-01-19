
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
import { AgentMemoryPort, AgentContext as MemoryContext } from '../../application/ports/AgentMemoryPort'

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

    constructor(memory?: AgentMemoryPort) {
        this.memory = memory
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
            console.log(`[BedtimeConductor] Goal achieved: ${this.activeGoal.description}`)
        } else {
            console.log(`[BedtimeConductor] Goal progress: ${progress}%`)
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

    // ... (Goal Tracking logic would be ported here as we scale)
}
