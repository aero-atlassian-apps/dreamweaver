/**
 * BedtimeConductor Sleep Logic Test (R8)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { PersistedAgentMemory } from '../../infrastructure/memory/PersistedAgentMemory'
import { SleepCueDetectedEvent } from '../../application/ports/EventBusPort'
import fs from 'fs/promises'

const TEST_DIR_SLEEP = './test-data-sleep'

describe('BedtimeConductorAgent (Sleep Logic)', () => {
    let memory: PersistedAgentMemory
    let agent: BedtimeConductorAgent

    beforeEach(async () => {
        try { await fs.rm(TEST_DIR_SLEEP, { recursive: true, force: true }) } catch { }
        memory = new PersistedAgentMemory(TEST_DIR_SLEEP)
        agent = new BedtimeConductorAgent(memory)
    })

    afterEach(async () => {
        try { await fs.rm(TEST_DIR_SLEEP, { recursive: true, force: true }) } catch { }
    })

    it('should boost theme score when sleep is detected', async () => {
        // 1. Agent suggests dragons (and tracks it)
        await agent.processTurn('Hello', { sessionId: 's1', userId: 'u1' }) // Auto-suggests 'dragons' in default

        // 2. Sleep Event fires
        const event: SleepCueDetectedEvent = {
            type: 'SLEEP_CUE_DETECTED',
            timestamp: new Date(),
            payload: { confidence: 0.9, cue: 'breathing', source: 'test' }
        }

        // Simulate event handling (in real app, EventBus calls this)
        // Note: processTurn internal logic for defaults sets 'dragons' as one of the defaults if memory empty
        // However, specifically `lastSuggestedTheme` is set inside the "Hello" block if generateSuggestions returns something.
        // Wait, generateSuggestions returns [] if memory empty.
        // So we need to seed memory to ensure generateSuggestions returns something to set lastSuggestedTheme.

        await memory.trackOutcome('dragons', 'POSITIVE') // Seed it
        await agent.processTurn('Hello', { sessionId: 's1', userId: 'u1' }) // Now it suggests dragons -> sets lastSuggestedTheme

        await agent.handleSleepCueDetected(event)

        const stats = await memory.getThemeStats()
        // Initial +1 (Seed) + 2 (Boost) = 3
        expect(stats[0].score).toBeGreaterThanOrEqual(3)
    })
})
