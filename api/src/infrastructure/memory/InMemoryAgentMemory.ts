/**
 * InMemoryAgentMemory - A lightweight "Hippocampus" for R5.3.
 * 
 * Stores memories in a simple local array.
 * In production (R6+), this will be replaced by Supabase Vector Store.
 */
import { AgentMemoryPort, AgentContext, MemoryRecord, MemoryType } from '../../application/ports/AgentMemoryPort.js'

export class InMemoryAgentMemory implements AgentMemoryPort {
    private memories: MemoryRecord[] = []

    // Pre-seed some "Procedural" knowledge for 2026 Agentic behavior
    constructor() {
        this.memories.push(
            {
                id: 'proc_1',
                type: 'PROCEDURAL',
                content: 'If time is past 8 PM, bias towards CALMING themes.',
                confidence: 0.9,
                timestamp: new Date()
            },
            {
                id: 'proc_2',
                type: 'PROCEDURAL',
                content: 'If child age < 5, limit story duration to SHORT.',
                confidence: 0.95,
                timestamp: new Date()
            }
        )
    }

    async retrieve(query: string, context: AgentContext, type?: MemoryType, limit: number = 5): Promise<MemoryRecord[]> {
        // Simple keyword match for MVP "RAG"
        // In R6+ this simulates vector search + metadata filtering
        const results = this.memories.filter(m => {
            // 1. Filter by Type
            if (type && m.type !== type) return false

            // 2. Filter by Context (Metadata)
            // Ideally we check userId ownership
            // if (m.metadata?.userId && m.metadata.userId !== context.userId) return false 

            // 3. Episodic Filtering (Session)
            if (type === 'EPISODIC' && context.sessionId) {
                if (m.metadata?.['sessionId'] !== context.sessionId) return false
            }

            // 4. Content Match (Simple inclusion for MVP)
            if (query === '*') return true
            return m.content.toLowerCase().includes(query.toLowerCase())
        })

        return results.slice(0, limit)
    }

    async store(content: string, type: MemoryType, context: AgentContext, metadata?: Record<string, unknown>): Promise<void> {
        this.memories.push({
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type,
            content,
            confidence: 1.0,
            timestamp: new Date(),
            metadata
        })
    }

    private themeScores = new Map<string, number>()

    // R8 Stubs for InMemory
    async trackOutcome(theme: string, outcome: 'POSITIVE' | 'NEGATIVE', context: AgentContext): Promise<void> {
        const current = this.themeScores.get(theme) || 1.0
        const delta = outcome === 'POSITIVE' ? 1.0 : -0.5
        this.themeScores.set(theme, current + delta)
    }

    async getThemeStats(context: AgentContext, limit: number = 3): Promise<{ theme: string; score: number }[]> {
        return Array.from(this.themeScores.entries())
            .map(([theme, score]) => ({ theme, score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
    }

    async trackPreferencePair(winTheme: string, loseTheme: string, context: AgentContext): Promise<void> {
        void winTheme
        void loseTheme
    }
}
