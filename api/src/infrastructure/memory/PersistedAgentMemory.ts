/**
 * PersistedAgentMemory
 * 
 * A file-system based implementation of AgentMemoryPort for R7.1.
 * Ensures memories survive server restarts (unlike the previous InMemory adapter).
 * 
 * NOTE: In R8/Production this should be replaced by Supabase Vector Store.
 */
import { AgentMemoryPort, AgentContext, MemoryRecord, MemoryType } from '../../application/ports/AgentMemoryPort'
import fs from 'fs/promises'
import path from 'path'
import { join } from 'path'

// Define the shape of our localized database
interface MemoryDatabase {
    memories: MemoryRecord[]
    themeScores: Record<string, number> // R8: Theme -> Score
    version: number
}

export class PersistedAgentMemory implements AgentMemoryPort {
    private dbPath: string
    private memories: MemoryRecord[] = []
    private themeScores: Record<string, number> = {}
    private initialized: boolean = false

    constructor(storageDir: string = './data') {
        // Ensure absolute path if needed, or relative to cwd
        this.dbPath = join(process.cwd(), storageDir, 'agent_memory.json')
    }

    private async init(): Promise<void> {
        if (this.initialized) return

        try {
            await fs.mkdir(path.dirname(this.dbPath), { recursive: true })
            const data = await fs.readFile(this.dbPath, 'utf-8')
            const db = JSON.parse(data) as MemoryDatabase
            this.memories = db.memories
            this.themeScores = db.themeScores || {} // Backwards compatibility
        } catch (error) {
            // If file doesn't exist, start fresh with procedural defaults
            this.memories = this.getDfaultProceduralMemories()
            this.themeScores = {}
            await this.persist()
        }
        this.initialized = true
    }

    private getDfaultProceduralMemories(): MemoryRecord[] {
        return [
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
        ]
    }

    private async persist(): Promise<void> {
        const db: MemoryDatabase = {
            memories: this.memories,
            themeScores: this.themeScores,
            version: 2 // Bump version for R8
        }
        await fs.writeFile(this.dbPath, JSON.stringify(db, null, 2), 'utf-8')
    }

    async retrieve(query: string, context: AgentContext, type?: MemoryType, limit: number = 5): Promise<MemoryRecord[]> {
        await this.init()

        const results = this.memories.filter(m => {
            // 1. Filter by Type
            if (type && m.type !== type) return false

            // 2. Episodic Filtering (Session)
            if (type === 'EPISODIC' && context.sessionId) {
                if (m.metadata?.sessionId !== context.sessionId) return false
            }

            // 3. Simple Search
            if (query === '*') return true
            return m.content.toLowerCase().includes(query.toLowerCase())
        })

        // Sort by timestamp desc (newest first) for context
        return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit)
    }

    async store(content: string, type: MemoryType, context: AgentContext, metadata?: Record<string, unknown>): Promise<void> {
        await this.init()

        this.memories.push({
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type,
            content,
            confidence: 1.0,
            timestamp: new Date(),
            metadata
        })

        await this.persist()
    }

    async trackOutcome(theme: string, outcome: 'POSITIVE' | 'NEGATIVE'): Promise<void> {
        await this.init()

        const currentScore = this.themeScores[theme] || 0
        const delta = outcome === 'POSITIVE' ? 1 : -0.5

        this.themeScores[theme] = Math.round((currentScore + delta) * 10) / 10 // Avoid floating point drift

        await this.persist()
    }

    async getThemeStats(limit: number = 3): Promise<{ theme: string; score: number }[]> {
        await this.init()

        return Object.entries(this.themeScores)
            .map(([theme, score]) => ({ theme, score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
    }
}
