import { LoggerPort } from '../ports/LoggerPort.js'
import { StoryRepositoryPort } from '../ports/StoryRepositoryPort.js'
import { DreamCompanion, AVAILABLE_COMPANIONS } from '../../domain/entities/DreamCompanion.js'
import type { ModerationRepositoryPort } from '../ports/ModerationRepositoryPort.js'
import type { CompanionUnlockRepositoryPort } from '../ports/CompanionUnlockRepositoryPort.js'

export class CheckUnlockUseCase {
    constructor(
        private storyRepository: StoryRepositoryPort,
        private logger: LoggerPort,
        private moderationRepository: ModerationRepositoryPort,
        private companionUnlockRepository: CompanionUnlockRepositoryPort
    ) { }

    async execute(userId: string): Promise<DreamCompanion[]> {
        const stories = await this.storyRepository.findByUserId(userId)
        const count = stories.length

        this.logger.info(`Checking unlocks for user ${userId} with ${count} stories`)

        const existingUnlocks = await this.companionUnlockRepository.listUnlockedByUserId(userId)
        const unlockedById = new Map(existingUnlocks.map((u) => [u.companionId, u.unlockedAt]))

        const blocked = new Set(await this.moderationRepository.listBlockedCharacterIds())

        const newlyUnlocked: Array<{ id: string; unlockedAt: Date; name: string }> = []

        for (const props of AVAILABLE_COMPANIONS) {
            if (blocked.has(props.id)) continue
            if (count < props.unlockThreshold) continue
            if (unlockedById.has(props.id)) continue

            const unlockedAt = new Date()
            await this.companionUnlockRepository.upsertUnlock(userId, props.id, unlockedAt)
            unlockedById.set(props.id, unlockedAt)
            newlyUnlocked.push({ id: props.id, unlockedAt, name: props.name })
        }

        for (const u of newlyUnlocked) {
            this.logger.info(`Unlocked companion: ${u.name}`)
        }

        const unlockedCompanions: DreamCompanion[] = []
        for (const props of AVAILABLE_COMPANIONS) {
            if (blocked.has(props.id)) continue
            const unlockedAt = unlockedById.get(props.id)
            if (!unlockedAt) continue
            unlockedCompanions.push(DreamCompanion.create({ ...props, isUnlocked: true, unlockedAt }))
        }

        return unlockedCompanions
    }
}
