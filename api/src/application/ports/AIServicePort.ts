/**
 * AIServicePort - Interface for AI text generation services
 * 
 * This port defines the contract for any AI service that can generate story content.
 * Implementations can be Gemini, OpenAI, Anthropic, etc.
 */

export interface GenerateStoryInput {
    theme: string
    childName?: string
    childAge?: number
    style?: 'adventure' | 'fantasy' | 'bedtime' | 'educational'
    duration?: 'short' | 'medium' | 'long'
}

export interface GenerateStoryOutput {
    title: string
    content: string
    metadata?: {
        theme?: string
        readingLevel?: string
        tone?: string
    }
}

// Alias for backward compatibility if needed, or just use Output
export type GeneratedStory = GenerateStoryOutput

export interface AIServicePort {
    /**
     * Generate a complete story based on input parameters
     */
    generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput>
}
