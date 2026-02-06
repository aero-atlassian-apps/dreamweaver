import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CheckUnlockUseCase } from './CheckUnlockUseCase'
import type { StoryRepositoryPort } from '../ports/StoryRepositoryPort'
import type { ModerationRepositoryPort } from '../ports/ModerationRepositoryPort'
import type { CompanionUnlockRepositoryPort, CompanionUnlockRecord } from '../ports/CompanionUnlockRepositoryPort'
import type { LoggerPort } from '../ports/LoggerPort'

describe('CheckUnlockUseCase', () => {
    let storyRepo: StoryRepositoryPort
    let moderationRepo: ModerationRepositoryPort
    let unlockRepo: CompanionUnlockRepositoryPort
    let logger: LoggerPort

    beforeEach(() => {
        logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
        moderationRepo = { listBlockedCharacterIds: vi.fn().mockResolvedValue([]) } as any

        const state: CompanionUnlockRecord[] = []
        unlockRepo = {
            listUnlockedByUserId: vi.fn().mockImplementation(async () => state.slice()),
            upsertUnlock: vi.fn().mockImplementation(async (_userId: string, companionId: string, unlockedAt: Date) => {
                if (state.some((s) => s.companionId === companionId)) return
                state.push({ companionId, unlockedAt })
            })
        }

        storyRepo = {
            findById: vi.fn(),
            save: vi.fn(),
            findRecent: vi.fn(),
            findByUserId: vi.fn().mockResolvedValue([])
        }
    })

    it('persists new unlocks when thresholds are reached', async () => {
        ;(storyRepo.findByUserId as any).mockResolvedValue(new Array(3).fill({}))
        const useCase = new CheckUnlockUseCase(storyRepo, logger, moderationRepo, unlockRepo)
        const unlocked = await useCase.execute('user_1')

        expect(unlocked.some((c) => c.id === 'c_luna')).toBe(true)
        expect(unlockRepo.upsertUnlock).toHaveBeenCalledWith('user_1', 'c_luna', expect.any(Date))
    })

    it('does not re-unlock already unlocked companions', async () => {
        ;(storyRepo.findByUserId as any).mockResolvedValue(new Array(10).fill({}))

        const useCase = new CheckUnlockUseCase(storyRepo, logger, moderationRepo, unlockRepo)
        await useCase.execute('user_1')
        await useCase.execute('user_1')

        const calls = (unlockRepo.upsertUnlock as any).mock.calls.filter((c: any[]) => c[1] === 'c_barnaby')
        expect(calls.length).toBe(1)
    })
})

