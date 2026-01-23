/**
 * BedtimeConductor Real DPO Test (R8)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { PersistedAgentMemory } from '../../infrastructure/memory/PersistedAgentMemory'
import fs from 'fs/promises'

const TEST_DIR_DPO = './test-data-dpo'

describe('BedtimeConductorAgent (Real DPO)', () => {
    let memory: PersistedAgentMemory
    let agent: BedtimeConductorAgent

    beforeEach(async () => {
        try { await fs.rm(TEST_DIR_DPO, { recursive: true, force: true }) } catch { }
        memory = new PersistedAgentMemory(TEST_DIR_DPO)
        agent = new BedtimeConductorAgent(memory)
    })

    afterEach(async () => {
        try { await fs.rm(TEST_DIR_DPO, { recursive: true, force: true }) } catch { }
    })

    it('should actually penalize the tracked theme on rejection', async () => {
        // 1. Seed 'Dragons' as positive so it gets suggested
        await memory.trackOutcome('dragons', 'POSITIVE') // Score: 1

        // 2. Trigger suggestion (Agent sets lastSuggestedTheme = 'dragons')
        await agent.processTurn('Hello', { sessionId: 's1', userId: 'u1' })

        // 3. User rejects
        await agent.processTurn('No', { sessionId: 's1', userId: 'u1' })

        // 4. Check memory - Score should decrease
        const stats = await memory.getThemeStats(10)
        const dragonStat = stats.find(s => s.theme === 'dragons')

        // Started at 1.0. Rejection = -0.5. Result should be 0.5.
        expect(dragonStat?.score).toBe(0.5)
    })

    it('should actually reinforce the tracked theme on acceptance', async () => {
        await memory.trackOutcome('space', 'POSITIVE') // Score: 1

        await agent.processTurn('Hello', { sessionId: 's1', userId: 'u1' }) // Suggests space

        await agent.processTurn('Yes please', { sessionId: 's1', userId: 'u1' })

        const stats = await memory.getThemeStats(10)
        const spaceStat = stats.find(s => s.theme === 'space')

        // 1.0 + 1.0 = 2.0
        expect(spaceStat?.score).toBe(2.0)
    })
})
