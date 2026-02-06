import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import type { ApiEnv } from '../http/ApiEnv.js'
import { AVAILABLE_COMPANIONS } from '../domain/entities/DreamCompanion.js'

export const companionsRoute = new Hono<ApiEnv>()

companionsRoute.use('*', authMiddleware)

companionsRoute.get('/progress', async (c) => {
    const user = c.get('user')!
    const services = c.get('services')

    const stories = await services.storyRepository.findByUserId(user.id)
    const storyCount = stories.length

    const unlocked = await services.checkUnlockUseCase.execute(user.id)
    const blocked = new Set(await services.moderationRepository.listBlockedCharacterIds())

    const available = AVAILABLE_COMPANIONS.filter((c) => !blocked.has(c.id))
    const unlockedIds = new Set(unlocked.map((u) => u.id))
    const next = available
        .filter((c) => !unlockedIds.has(c.id))
        .sort((a, b) => a.unlockThreshold - b.unlockThreshold)[0]

    return c.json({
        success: true,
        data: {
            storyCount,
            unlockedCompanions: unlocked.map((u) => ({
                id: u.id,
                name: u.name,
                species: u.species,
                description: u.description,
                unlockThreshold: u.unlockThreshold,
                unlockedAt: u.unlockedAt?.toISOString() ?? null,
            })),
            nextUnlock: next
                ? {
                    id: next.id,
                    unlockThreshold: next.unlockThreshold,
                    remainingStories: Math.max(0, next.unlockThreshold - storyCount),
                }
                : null
        }
    })
})

