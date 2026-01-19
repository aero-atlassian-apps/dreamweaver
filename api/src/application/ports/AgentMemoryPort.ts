/**
 * AgentMemoryPort - The "Hippocampus" of the Agent.
 * 
 * Allows agents to retrieve and store context (preferences, facts, past procedural knowledge).
 * In 2026, this would wrap a Vector DB (Supabase pgvector) and a Graph DB.
 */

export interface AgentContext {
    userId: string
    sessionId?: string
    [key: string]: unknown
}

export type MemoryType = 'EPISODIC' | 'SEMANTIC' | 'PROCEDURAL' | 'PREFERENCE'

export interface MemoryRecord {
    id: string
    type: MemoryType
    content: string
    confidence: number
    timestamp: Date
    metadata?: Record<string, unknown>
}

export interface AgentMemoryPort {
    /**
     * Retrieve relevant memories for the current context.
     * @param query The search query or intent
     * @param context Contextual keys (userId, etc.)
     * @param type Optional filter by memory type
     */
    retrieve(query: string, context: AgentContext, type?: MemoryType): Promise<MemoryRecord[]>

    /**
     * Store a new memory.
     */
    store(content: string, type: MemoryType, context: AgentContext, metadata?: Record<string, unknown>): Promise<void>
}
