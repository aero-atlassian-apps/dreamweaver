/**
 * BedtimeConductor Sleep Logic Test (R8)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { PersistedAgentMemory } from '../../infrastructure/memory/PersistedAgentMemory'
import { MockAIService } from '../../infrastructure/adapters/MockAIService'
import { PromptAdapter } from '../../infrastructure/ai/PromptAdapter'
import { InMemorySessionState } from '../../infrastructure/adapters/InMemorySessionState'
import { SleepCueDetectedEvent } from '../../application/ports/EventBusPort'
import fs from 'fs/promises'

const TEST_DIR_SLEEP = './test-data-sleep'

class MockBrain extends MockAIService {
    async generateAgentThought(input: any): Promise<any> {
        return {
            goals_considered: ['BONDING'],
            thought: 'Suggesting dragons.',
            action: 'SUGGEST',
            confidence: 0.9,
            parameters: { theme: 'dragons', reply: 'I recommend dragons.' }
        }
    }
}

describe('BedtimeConductorAgent (Sleep Logic)', () => {
    let memory: PersistedAgentMemory
    let agent: BedtimeConductorAgent
    let brain: MockBrain
    let sessionState: InMemorySessionState

    beforeEach(async () => {
        try { await fs.rm(TEST_DIR_SLEEP, { recursive: true, force: true }) } catch { }
        memory = new PersistedAgentMemory(TEST_DIR_SLEEP)
        brain = new MockBrain()
        sessionState = new InMemorySessionState()
        const resilienceEngine = { assessFailure: async () => ({ action: 'FALLBACK', model: 'edge', estimatedCost: 0 }) }
        agent = new BedtimeConductorAgent(brain, new PromptAdapter(), sessionState, resilienceEngine as any, memory)
    })

    afterEach(async () => {
        try { await fs.rm(TEST_DIR_SLEEP, { recursive: true, force: true }) } catch { }
    })

    it('should handle sleep cues (R8)', async () => {
        const userId = '123e4567-e89b-12d3-a456-426614174010'
        const sessionId = 'session_sleep'

        // Arrange: Active Session
        await sessionState.set(sessionId, {
            sessionId,
            userId,
            phase: 'STORYTELLING',
            activeIntent: 'IDLE',
            emotionalTone: 0.5, // Required
            context: {}, // Required
            updatedAt: new Date(),
            lastSuggestedTheme: 'dragons',
            sessionStartTime: new Date(Date.now() - 1000 * 60 * 10) // 10 mins ago
        })

        // Act: Sleep Detected
        await agent.handleSleepCueDetected({
            id: 'evt_2', type: 'SLEEP_CUE_DETECTED', timestamp: new Date(), requestId: 'req_2',
            payload: {
                userId,
                sessionId,
                confidence: 0.9,
                cue: 'silence',
                source: 'sentinel',
                context: { userId, sessionId }
            }
        })

        // Assert: Session state should be updated to SLEEP_DETECTED
        const updatedSession = await sessionState.get(sessionId)
        expect(updatedSession?.phase).toBe('ASLEEP')
    })

    it('should boost theme score when sleep is detected', async () => {
        const userId = '123e4567-e89b-12d3-a456-426614174010'
        const sessionId = 'session_boost'
        const ctx = { userId, sessionId }

        // 1. Seed memory to ensure agent knows about 'dragons'
        await memory.trackOutcome('dragons', 'POSITIVE', ctx)

        // 2. Set state so agent thinks it suggested dragons
        await sessionState.set(sessionId, {
            sessionId,
            userId,
            phase: 'STORYTELLING',
            activeIntent: 'IDLE',
            emotionalTone: 0.5,
            context: {},
            updatedAt: new Date(),
            lastSuggestedTheme: 'dragons',
            sessionStartTime: new Date()
        })

        // 3. Sleep Event fires
        const event: SleepCueDetectedEvent = {
            id: 'evt-1',
            requestId: 'req-1',
            type: 'SLEEP_CUE_DETECTED',
            timestamp: new Date(),
            payload: {
                confidence: 0.9,
                cue: 'breathing',
                source: 'test',
                userId,
                sessionId,
                context: { userId, sessionId }
            }
        }

        await agent.handleSleepCueDetected(event)

        const stats = await memory.getThemeStats(ctx)
        // Initial +1 (Seed) + 2 (Boost from sleep) = 3
        const dragonStat = stats.find(s => s.theme === 'dragons')
        expect(dragonStat?.score).toBeGreaterThanOrEqual(3)
    })
})
