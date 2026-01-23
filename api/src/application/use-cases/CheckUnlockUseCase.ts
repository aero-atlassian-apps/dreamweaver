import { LoggerPort } from '../ports/LoggerPort'
import { StoryRepositoryPort } from '../ports/StoryRepositoryPort'
import { DreamCompanion, AVAILABLE_COMPANIONS } from '../../domain/entities/DreamCompanion'

export class CheckUnlockUseCase {
    constructor(
        private storyRepository: StoryRepositoryPort,
        private logger: LoggerPort
    ) { }

    async execute(userId: string): Promise<DreamCompanion[]> {
        // 1. Get User's Story Count
        const stories = await this.storyRepository.findByUserId(userId)
        const count = stories.length

        this.logger.info(`Checking unlocks for user ${userId} with ${count} stories`)

        // 2. Check Unlocks
        const unlockedCompanions: DreamCompanion[] = []

        // In a real app, we would fetch the user's *already* unlocked companions from DB 
        // to avoid re-notifying. For MVP, we will simpler check if they *just* hit the threshold?
        // Actually, better logic: Return ALL unlocked companions, frontend filters 'new' ones?
        // Or better: Just check if any companion threshold == count.

        AVAILABLE_COMPANIONS.forEach(props => {
            if (props.unlockThreshold === count) {
                const companion = DreamCompanion.create({ ...props, isUnlocked: true, unlockedAt: new Date() })
                unlockedCompanions.push(companion)
                this.logger.info(`Unlocked companion: ${companion.name}`)
            }
        })

        return unlockedCompanions
    }
}
