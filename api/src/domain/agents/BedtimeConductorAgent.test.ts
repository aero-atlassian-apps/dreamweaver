import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { PersistedAgentMemory } from '../../infrastructure/memory/PersistedAgentMemory'
import { MockAIService } from '../../infrastructure/adapters/MockAIService'
import { PromptAdapter } from '../../infrastructure/ai/PromptAdapter'
import { InMemorySessionState } from '../../infrastructure/adapters/InMemorySessionState'
import fs from 'fs/promises'

const TEST_DIR_AGENT = './test-data-agent'

class MockBrain extends MockAIService {
    async generateAgentThought(input: any): Promise<any> {
        // Simple mock logic for testing the ReAct loops
        if (input.userMessage.includes('Hello')) {
            return {
                goals_considered: ['BONDING', 'SUGGESTION'],
                thought: 'User greeted, I should suggest something they like.',
                reasoning: 'Deprecated',
                action: 'SUGGEST',
                confidence: 0.9,
                parameters: { reply: 'Hello! I recommend dragons.' }
            }
        }
        if (input.userMessage.includes('decision to offer')) {
            return {
                goals_considered: ['TAILORING'],
                thought: 'Age < 5, so I will shorten the story.',
                action: 'START_STORY',
                confidence: 0.95,
                parameters: { duration: 'short' }
            }
        }
        if (input.userMessage.includes('No')) {
            return {
                goals_considered: ['RECOVERY'],
                thought: 'User rejected. TRIGGERING REFLECTION to find alternatives.',
                action: 'REPLY',
                confidence: 0.85,
                parameters: { reply: 'I understand. Let\'s try something else.' }
            }
        }
        return {
            goals_considered: ['RELAXATION'],
            thought: 'Standard processing',
            action: 'REPLY',
            confidence: 0.8,
            parameters: { reply: 'I am listening.' }
        }
    }
}

describe('BedtimeConductorAgent (R8 Logic)', () => {
    let memory: PersistedAgentMemory
    let agent: BedtimeConductorAgent
    let brain: MockBrain
    const promptService = new PromptAdapter()

    beforeEach(async () => {
        try { await fs.rm(TEST_DIR_AGENT, { recursive: true, force: true }) } catch { }
        memory = new PersistedAgentMemory(TEST_DIR_AGENT)
        brain = new MockBrain()
        const sessionState = new InMemorySessionState()
        const resilienceEngine = { assessFailure: async () => ({ action: 'FALLBACK', model: 'edge', estimatedCost: 0 }) }
        agent = new BedtimeConductorAgent(brain, promptService, sessionState, resilienceEngine as any, memory)
    })

    afterEach(async () => {
        try { await fs.rm(TEST_DIR_AGENT, { recursive: true, force: true }) } catch { }
    })

    it('should suggest content on Hello', async () => {
        // Pre-seed a good thought
        await memory.trackOutcome('dragons', 'POSITIVE', { userId: '123e4567-e89b-12d3-a456-426614174008' })

        const { reply } = await agent.processTurn('Hello', { sessionId: '123e4567-e89b-12d3-a456-426614174007', userId: '123e4567-e89b-12d3-a456-426614174008' })

        expect(reply).toContain('recommend')
        expect(reply).toContain('dragons')
    })

    it('should reflect and offer alternative on No', async () => {
        // Seed dragon preference
        await memory.trackOutcome('dragons', 'POSITIVE', { userId: '123e4567-e89b-12d3-a456-426614174008' })

        // 1. Initial suggestion (Dragons)
        await agent.processTurn('Hello', { sessionId: '123e4567-e89b-12d3-a456-426614174007', userId: '123e4567-e89b-12d3-a456-426614174008' })

        // 2. Rejection
        const { reply, trace } = await agent.processTurn('No, I hate dragons', { sessionId: '123e4567-e89b-12d3-a456-426614174007', userId: '123e4567-e89b-12d3-a456-426614174008' })

        // Check our MockBrain reasoning
        expect(trace.find(t => t.thought.includes('TRIGGERING REFLECTION'))).toBeDefined()
        expect(reply).toContain('try something else')
    })
})
