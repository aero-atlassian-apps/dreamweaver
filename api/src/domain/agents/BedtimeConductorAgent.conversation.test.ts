import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { InMemoryAgentMemory } from '../../infrastructure/memory/InMemoryAgentMemory'
import { MockAIService } from '../../infrastructure/adapters/MockAIService'
import { LoggerPort } from '../../application/ports/LoggerPort'
import { PromptAdapter } from '../../infrastructure/ai/PromptAdapter'
import { InMemorySessionState } from '../../infrastructure/adapters/InMemorySessionState'
import type { AgentThoughtInput, AgentThoughtOutput } from '../../application/ports/AIServicePort'

class MockBrain extends MockAIService {
    async generateAgentThought(input: AgentThoughtInput): Promise<AgentThoughtOutput> {
        // The observation combines user input and memory context.
        if ((input.userMessage || '').includes('dragons')) {
            return {
                goals_considered: ['RECOGNITION'],
                conflicts_identified: null,
                trade_off_made: null,
                thought: 'Thinking about dragons from memory.',
                action: 'REPLY',
                confidence: 1.0,
                reasoning: 'Thinking about dragons from memory.',
                parameters: { reply: 'I remember we talked about this before!' }
            }
        }
        return {
            goals_considered: ['RELAXATION'],
            conflicts_identified: null,
            trade_off_made: null,
            thought: 'Standard greeting',
            action: 'REPLY',
            confidence: 0.9,
            reasoning: 'Standard greeting',
            parameters: { reply: 'Hello there.' }
        }
    }
}

describe('BedtimeConductorAgent (ReAct Conversation)', () => {
    let agent: BedtimeConductorAgent
    let memory: InMemoryAgentMemory
    let mockLogger: LoggerPort
    let brain: MockBrain

    beforeEach(() => {
        memory = new InMemoryAgentMemory()
        mockLogger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }
        brain = new MockBrain()
        const sessionState = new InMemorySessionState()
        const resilienceEngine = { assessFailure: async () => ({ action: 'FALLBACK', model: 'edge', estimatedCost: 0 }) }
        agent = new BedtimeConductorAgent(brain, new PromptAdapter(), sessionState, resilienceEngine as any, memory, mockLogger)
        vi.clearAllMocks()
    })

    it('should maintain a thought process (Transparency)', async () => {
        const { trace, reply } = await agent.processTurn('Hello', {
            userId: '123e4567-e89b-12d3-a456-426614174005', sessionId: '123e4567-e89b-12d3-a456-426614174006'
        })

        expect(trace.length).toBeGreaterThan(0)
        expect(trace[0].thought).toBe('Standard greeting')
        expect(reply).toBeDefined()
    })

    it('should verify episodic recall', async () => {
        // 1. Store a memory
        const ctx = { userId: '123e4567-e89b-12d3-a456-426614174005', sessionId: '123e4567-e89b-12d3-a456-426614174006' };
        await memory.store('User loves dragons', 'EPISODIC', ctx, ctx)

        // 2. Ask about it
        const { reply, trace } = await agent.processTurn('Tell me about dragons', ctx)

        // 3. Verify Observation in Trace (The Agent "Saw" the memory)
        expect(trace[0].thought).toContain('Thinking about dragons')

        // 4. Verify AI Response triggered by memory
        expect(reply).toContain('I remember we talked about this before')
    })
})
