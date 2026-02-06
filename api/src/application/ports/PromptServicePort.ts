/**
 * PromptServicePort - Interface for retrieving AI System Prompts and Templates.
 * 
 * Part of Clean Architecture: Domain defines the interface, Infrastructure implements it.
 */

export interface AgentPromptVariables {
    childName?: string
    childAge?: number
    currentMood?: string
    envContext?: string
    memoryContext?: string
    activeGoal?: string
    userMessage?: string
    history?: string
}

export interface StoryPromptVariables {
    theme: string
    childName?: string
    childAge?: number
    style?: string
    duration?: string
    memoryContext?: string
    unlockedCompanions?: string[]
    reinstantiateContext?: {
        originalTitle: string
        originalTheme: string
        structure: string
    }
    forStreaming?: boolean
}

export interface LivePromptVariables {
    childName?: string
    childAge?: number
}

export interface PromptServicePort {
    getConductorSystemPrompt(): string
    formatAgentObservation(vars: AgentPromptVariables): string
    getStoryPrompt(vars: StoryPromptVariables): string
    getLiveSystemPrompt(vars: LivePromptVariables): string
    getSafetyValidatorSystemPrompt(vars: { childAge: number }): string
    getMemorySummarizerSystemPrompt(): string
    getVerificationValidatorSystemPrompt(vars: { type: string }): string
    getMemoryCuratorSystemPrompt(): string
    getSleepPacingOverrideInstruction(): string

    /**
     * R11: Start story trigger (versioned)
     */
    getStartStoryTrigger(theme: string): string

    /**
     * R11: Safety fallback story (versioned)
     */
    getSafetyFallback(): string
}
