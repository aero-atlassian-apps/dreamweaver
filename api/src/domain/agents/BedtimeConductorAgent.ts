
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

export interface AgentContext {
    childName?: string
    childAge?: number
    currentMood?: 'energetic' | 'calm' | 'tired' | 'fussy'
    recentInterests?: string[]
}

export class BedtimeConductorAgent {
    /**
     * Refines a raw story request based on agentic goals and context.
     * This transforms a simple "Tell me a story about space" into a tailored prompt.
     */
    refineStoryRequest(request: GenerateStoryRequest, context: AgentContext = {}): GenerateStoryRequest {
        const refined = { ...request }

        // 1. Goal: Induce Sleep (Mood-based pacing)
        if (context.currentMood === 'tired') {
            refined.duration = 'short'
            // In a real LLM prompt, we would append instruction: "Use soothing, repetitive language."
        } else if (context.currentMood === 'energetic') {
            refined.duration = 'medium'
            // Instruction: "Start with action, but gradually slow down the pacing."
        }

        // 2. Goal: Personalization (Age appropriate)
        if (context.childAge && context.childAge < 4) {
            // Instruction: "Use simple sentences and focus on sensory details."
        }

        console.log(`[BedtimeConductor] Refined request: ${JSON.stringify(request)} -> ${JSON.stringify(refined)}`)
        return refined
    }

    // ... (Goal Tracking logic would be ported here as we scale)
}
