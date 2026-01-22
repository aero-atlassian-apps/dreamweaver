/**
 * PersistedAgentMemory Stats Test
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PersistedAgentMemory } from './PersistedAgentMemory'
import fs from 'fs/promises'

const TEST_DIR_STATS = './test-data-stats'

describe('PersistedAgentMemory (Stats)', () => {
    let memory: PersistedAgentMemory

    beforeEach(async () => {
        try { await fs.rm(TEST_DIR_STATS, { recursive: true, force: true }) } catch { }
        memory = new PersistedAgentMemory(TEST_DIR_STATS)
    })

    afterEach(async () => {
        try { await fs.rm(TEST_DIR_STATS, { recursive: true, force: true }) } catch { }
    })

    it('should track and retrieve theme stats', async () => {
        await memory.trackOutcome('dragons', 'POSITIVE') // +1
        await memory.trackOutcome('dragons', 'POSITIVE') // +2
        await memory.trackOutcome('space', 'POSITIVE') // +1
        await memory.trackOutcome('ocean', 'NEGATIVE') // -0.5

        const stats = await memory.getThemeStats(10)

        expect(stats).toHaveLength(3)
        expect(stats[0].theme).toBe('dragons')
        expect(stats[0].score).toBe(2)

        expect(stats[stats.length - 1].theme).toBe('ocean')
        expect(stats[stats.length - 1].score).toBe(-0.5)
    })
})
