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
    customPrompt?: string // Allows the agent to provide a fully constructed prompt
    traceId?: string
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

export interface AgentThoughtInput {
    systemPrompt: string
    userMessage?: string
    messageHistory?: { role: 'user' | 'model', content: string }[]
    jsonSchema?: unknown // Optional schema for strict structured output
    traceId?: string
}

export interface AgentThoughtOutput {
    goals_considered: string[]
    conflicts_identified: string | null
    trade_off_made: string | null
    thought: string
    reasoning: string // deprecated but kept for stability
    action: string
    confidence: number
    parameters?: Record<string, unknown>
}


export interface AIServicePort {
    /**
     * Generate a complete story based on input parameters.
     */
    generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput>

    /**
     * Generate a structured agent thought (Reasoning + Action).
     * Used for the Bedtime Conductor's ReAct loop.
     */
    generateAgentThought(input: AgentThoughtInput): Promise<AgentThoughtOutput>

    /**
     * Generate a story stream (yields text chunks as they are generated).
     * Used for real-time playback/display.
     */
    generateStoryStream(input: GenerateStoryInput): AsyncGenerator<string, void, unknown>

    /**
     * Start a Bidirectional Live Session (WebSocket).
     * Used for real-time multimodal interaction (Audio/Text in <-> Audio/Text out).
     */
    startLiveSession(options?: LiveSessionOptions): Promise<LiveSessionPort>

    /**
     * Generic structured output generation using JSON Schema.
     * Useful for extracting data like facts, timeline events, etc.
     */
    generateStructured<T = unknown>(input: { systemPrompt?: string, userMessage: string, schema: unknown, traceId?: string }): Promise<T>
}

export interface LiveSessionOptions {
    systemInstruction?: string
    voiceName?: string
    model?: string
    responseModalities?: string[]
    tools?: unknown
}

/**
 * LiveSessionPort - Controls a real-time multimodal session
 */
export interface LiveSessionPort {
    sendAudio(chunk: ArrayBuffer): void
    sendText(text: string): void

    // Event Handlers
    onAudio(handler: (chunk: ArrayBuffer) => void): void
    onText(handler: (text: string) => void): void
    onToolCall(handler: (toolCall: unknown) => void): void
    onInterruption(handler: () => void): void
    onClose(handler: (code?: number, reason?: string) => void): void

    sendToolResponse(response: unknown): void
    disconnect(): void
}
