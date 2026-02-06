/**
 * AgentMemoryPort - The "Hippocampus" of the Agent.
 * 
 * Allows agents to retrieve and store context (preferences, facts, past procedural knowledge).
 * In 2026, this would wrap a Vector DB (Supabase pgvector) and a Graph DB.
 */

export interface AgentContext {
    userId: string
    sessionId?: string
    accessToken?: string // [SEC-02] Required for RLS-compliant DB access
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
     * @param context Contextual keys (userId, sessionId, etc.)
     * @param type Optional filter by memory type
     * @param limit Optional limit on results
     */
    retrieve(query: string, context: AgentContext, type?: MemoryType, limit?: number): Promise<MemoryRecord[]>

    /**
     * Store a new memory.
     */
    store(content: string, type: MemoryType, context: AgentContext, metadata?: Record<string, unknown>): Promise<void>

    /**
     * R8: Tracks the outcome of a story theme to update preference scores.
     * @param theme The theme to update (e.g. "dragons")
     * @param outcome Whether the reaction was POSITIVE (sleep/like) or NEGATIVE (skip/cry)
     * @param context Contextual keys (userId required)
     */
    trackOutcome(theme: string, outcome: 'POSITIVE' | 'NEGATIVE', context: AgentContext): Promise<void>

    /**
     * Retrieving top performing themes based on historical success rates.
     * @param context Contextual keys (userId required)
     * @param limit Max number of top themes to return.
     */
    getThemeStats(context: AgentContext, limit?: number): Promise<{ theme: string, score: number }[]>

    /**
     * R10: Stores a pairwise preference (DPO learning loop).
     * @param winTheme The preferred theme
     * @param loseTheme The rejected theme
     * @param context Contextual keys (userId required)
     */
    trackPreferencePair(winTheme: string, loseTheme: string, context: AgentContext): Promise<void>
}
