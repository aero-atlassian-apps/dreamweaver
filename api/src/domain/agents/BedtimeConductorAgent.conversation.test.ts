/**
 * BedtimeConductorAgent Conversational Logic Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BedtimeConductorAgent, ReasoningTrace } from './BedtimeConductorAgent'
import { InMemoryAgentMemory } from '../../infrastructure/memory/InMemoryAgentMemory'
import { LoggerPort } from '../../application/ports/LoggerPort'

describe('BedtimeConductorAgent (ReAct Conversation)', () => {
    let agent: BedtimeConductorAgent
    let memory: InMemoryAgentMemory
    let mockLogger: LoggerPort

    beforeEach(() => {
        memory = new InMemoryAgentMemory()
        mockLogger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }
        agent = new BedtimeConductorAgent(memory, mockLogger)
    })

    it('should maintain a thought process (Transparency)', async () => {
        const { trace, reply } = await agent.processTurn('Hello', {
            userId: 'u1', sessionId: 's1'
        })

        expect(trace.length).toBeGreaterThan(0)
        expect(trace[0].step).toBe('THOUGHT')
        expect(reply).toContain("Hello")
        expect(mockLogger.info).not.toHaveBeenCalled() // The use case logs, not the agent (except for goal)
    })

    it('should verify episodic recall', async () => {
        // 1. Store a memory
        await memory.store('User loves dragons', 'EPISODIC', { userId: 'u1', sessionId: 's1' }, { sessionId: 's1' })

        // 2. Ask about it (Using keyword matching for MVP)
        const { reply, trace } = await agent.processTurn('dragons', { userId: 'u1', sessionId: 's1' })

        // 3. Verify Observation
        const observation = trace.find(t => t.step === 'OBSERVATION')
        expect(observation).toBeDefined()
        expect(observation?.content).toContain('User loves dragons')

        // 4. Verify Reply acknowledgement
        expect(reply).toContain('I remember we talked about this before')
    })
})
