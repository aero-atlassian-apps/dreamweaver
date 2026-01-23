/**
 * BedtimeConductor Logic Test (R8)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { PersistedAgentMemory } from '../../infrastructure/memory/PersistedAgentMemory'
import fs from 'fs/promises'

const TEST_DIR_AGENT = './test-data-agent'

describe('BedtimeConductorAgent (R8 Logic)', () => {
    let memory: PersistedAgentMemory
    let agent: BedtimeConductorAgent

    beforeEach(async () => {
        try { await fs.rm(TEST_DIR_AGENT, { recursive: true, force: true }) } catch { }
        memory = new PersistedAgentMemory(TEST_DIR_AGENT)
        agent = new BedtimeConductorAgent(memory)
    })

    afterEach(async () => {
        try { await fs.rm(TEST_DIR_AGENT, { recursive: true, force: true }) } catch { }
    })

    it('should suggest content on Hello', async () => {
        // Pre-seed a good thought
        await memory.trackOutcome('dragons', 'POSITIVE')

        const { reply } = await agent.processTurn('Hello', { sessionId: 's1', userId: 'u1' })

        expect(reply).toContain('recommend')
        expect(reply).toContain('dragons')
    })

    it('should reflect and offer alternative on No', async () => {
        // Seed dragon preference
        await memory.trackOutcome('dragons', 'POSITIVE')

        // 1. Initial suggestion (Dragons)
        await agent.processTurn('Hello', { sessionId: 's1', userId: 'u1' })

        // 2. Rejection
        const { reply, trace } = await agent.processTurn('No, I hate dragons', { sessionId: 's1', userId: 'u1' })

        expect(trace.find(t => t.step === 'THOUGHT' && t.content.includes('TRIGGERING REFLECTION'))).toBeDefined()
        expect(reply).toContain('try something else')
    })
})
