/**
 * PersistedAgentMemory Test
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PersistedAgentMemory } from './PersistedAgentMemory'
import fs from 'fs/promises'
import path from 'path'

const TEST_DIR = './test-data'

describe('PersistedAgentMemory', () => {
    let memory: PersistedAgentMemory

    beforeEach(async () => {
        // Clean up before test
        try { await fs.rm(TEST_DIR, { recursive: true, force: true }) } catch { }
        memory = new PersistedAgentMemory(TEST_DIR)
    })

    afterEach(async () => {
        // Clean up after test
        try { await fs.rm(TEST_DIR, { recursive: true, force: true }) } catch { }
    })

    it('should store and retrieve episodic memory', async () => {
        const context = { sessionId: 'sess_1', userId: 'user_1' }
        await memory.store('I love dragons', 'EPISODIC', context, { sessionId: 'sess_1' })

        const results = await memory.retrieve('love', context, 'EPISODIC')
        expect(results).toHaveLength(1)
        expect(results[0].content).toBe('I love dragons')
    })

    it('should persist data across instances', async () => {
        const context = { sessionId: 'sess_1', userId: 'user_1' }

        // Instance 1 writes
        const mem1 = new PersistedAgentMemory(TEST_DIR)
        await mem1.store('Persistent Thought', 'EPISODIC', context, { sessionId: 'sess_1' })

        // Instance 2 reads (simulating restart)
        const mem2 = new PersistedAgentMemory(TEST_DIR)
        const results = await mem2.retrieve('Thought', context, 'EPISODIC')

        expect(results).toHaveLength(1)
        expect(results[0].content).toBe('Persistent Thought')
    })
})
