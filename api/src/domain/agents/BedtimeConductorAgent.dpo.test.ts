/**
 * BedtimeConductor Real DPO Test (R8)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { PromptAdapter } from '../../infrastructure/ai/PromptAdapter'
import { PersistedAgentMemory } from '../../infrastructure/memory/PersistedAgentMemory'
import fs from 'fs/promises'

import { MockAIService } from '../../infrastructure/adapters/MockAIService'
import { InMemorySessionState } from '../../infrastructure/adapters/InMemorySessionState'

const TEST_DIR_DPO = './test-data-dpo'

class MockBrain extends MockAIService {
    async generateAgentThought(input: any): Promise<any> {
        if (input.userMessage.includes('Hello')) {
            const theme = input.userMessage.toLowerCase().includes('space') ? 'space' : 'dragons'
            return {
                goals_considered: ['BONDING'],
                thought: `Suggesting ${theme}`,
                action: 'SUGGEST',
                confidence: 0.9,
                parameters: { theme, reply: `How about ${theme}?` }
            }
        }
        if (input.userMessage.includes('No')) {
            return {
                goals_considered: ['RECOVERY'],
                thought: 'User rejected.',
                action: 'REPLY',
                confidence: 0.8,
                parameters: { reply: 'Okay, sorry.' }
            }
        }
        return {
            goals_considered: ['RELAXATION'],
            thought: 'Acceptance!',
            action: 'REPLY',
            confidence: 0.8,
            parameters: { reply: 'Great!' }
        }
    }
}

describe('BedtimeConductorAgent (Real DPO)', () => {
    let memory: PersistedAgentMemory
    let agent: BedtimeConductorAgent
    let brain: MockBrain

    beforeEach(async () => {
        try { await fs.rm(TEST_DIR_DPO, { recursive: true, force: true }) } catch { }
        memory = new PersistedAgentMemory(TEST_DIR_DPO)
        brain = new MockBrain()
        const sessionState = new InMemorySessionState()
        const resilienceEngine = { assessFailure: async () => ({ action: 'FALLBACK', model: 'edge', estimatedCost: 0 }) }
        agent = new BedtimeConductorAgent(brain, new PromptAdapter(), sessionState, resilienceEngine as any, memory)
    })

    afterEach(async () => {
        try { await fs.rm(TEST_DIR_DPO, { recursive: true, force: true }) } catch { }
    })

    it('should actually penalize the tracked theme on rejection', async () => {
        // 1. Seed 'Dragons' as positive so it gets suggested
        const ctx = { userId: '123e4567-e89b-12d3-a456-426614174004' }
        await memory.trackOutcome('dragons', 'POSITIVE', ctx) // Score: 1

        // 2. Trigger suggestion (Agent sets lastSuggestedTheme = 'dragons')
        await agent.processTurn('Hello', { sessionId: 's1', userId: '123e4567-e89b-12d3-a456-426614174004' })

        // 3. User rejects
        await agent.processTurn('No', { sessionId: 's1', userId: '123e4567-e89b-12d3-a456-426614174004' })

        // 4. Check memory - Score should decrease
        const stats = await memory.getThemeStats(ctx, 10)
        const dragonStat = stats.find(s => s.theme === 'dragons')

        // Started at 1.0. Rejection = -0.5. Result should be 0.5.
        expect(dragonStat?.score).toBe(0.5)
    })

    it('should actually reinforce the tracked theme on acceptance', async () => {
        const ctx = { userId: '123e4567-e89b-12d3-a456-426614174004' }
        await memory.trackOutcome('space', 'POSITIVE', ctx) // Score: 1

        await agent.processTurn('Hello space', { sessionId: 's1', userId: '123e4567-e89b-12d3-a456-426614174004' }) // Suggests space

        await agent.processTurn('Yes please', { sessionId: 's1', userId: '123e4567-e89b-12d3-a456-426614174004' })

        const stats = await memory.getThemeStats(ctx, 10)
        const spaceStat = stats.find(s => s.theme === 'space')

        // 1.0 + 1.0 = 2.0
        expect(spaceStat?.score).toBe(2.0)
    })
})
