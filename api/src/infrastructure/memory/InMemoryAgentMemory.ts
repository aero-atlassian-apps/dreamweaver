/**
 * InMemoryAgentMemory - A lightweight "Hippocampus" for R5.3.
 * 
 * Stores memories in a simple local array.
 * In production (R6+), this will be replaced by Supabase Vector Store.
 */
import { AgentMemoryPort, AgentContext, MemoryRecord, MemoryType } from '../../application/ports/AgentMemoryPort'

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

    async retrieve(query: string, context: AgentContext, type?: MemoryType): Promise<MemoryRecord[]> {
        // Simple keyword match for MVP "RAG"
        return this.memories.filter(m => {
            const typeMatch = type ? m.type === type : true
            // In a real vector DB, this would be semantic similarity.
            // Here we just return everything relevant to the 'context' logic we built in the constructor.
            return typeMatch
        })
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
}
