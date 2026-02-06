/**
 * LogInteraction Test
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LogInteractionUseCase } from '../../application/use-cases/LogInteractionUseCase'
import { PersistedAgentMemory } from '../../infrastructure/memory/PersistedAgentMemory'
import fs from 'fs/promises'

const TEST_DIR_LOG = './test-data-log'

describe('LogInteractionUseCase', () => {
    let memory: PersistedAgentMemory
    let useCase: LogInteractionUseCase
    const mockLogger = { info: () => undefined, warn: () => undefined, error: () => undefined, debug: () => undefined }

    beforeEach(async () => {
        try { await fs.rm(TEST_DIR_LOG, { recursive: true, force: true }) } catch (e) { void e }
        memory = new PersistedAgentMemory(TEST_DIR_LOG)
        useCase = new LogInteractionUseCase(memory, mockLogger)
    })

    afterEach(async () => {
        try { await fs.rm(TEST_DIR_LOG, { recursive: true, force: true }) } catch (e) { void e }
    })

    it('should log positive outcome on story completion', async () => {
        await useCase.execute({
            userId: 'u1',
            theme: 'dragons',
            interactionType: 'story_completed'
        })

        const stats = await memory.getThemeStats()
        const theme = stats.find(s => s.theme === 'dragons')
        expect(theme?.score).toBe(1)
    })

    it('should log negative outcome on skip', async () => {
        await useCase.execute({
            userId: 'u1',
            theme: 'dragons',
            interactionType: 'story_skipped'
        })

        const stats = await memory.getThemeStats()
        const theme = stats.find(s => s.theme === 'dragons')
        expect(theme?.score).toBe(-0.5)
    })
})
