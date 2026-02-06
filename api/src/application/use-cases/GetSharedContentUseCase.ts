import { ShareRepositoryPort } from '../ports/ShareRepositoryPort.js'
import { StoryRepositoryPort } from '../ports/StoryRepositoryPort.js'
import { MomentRepositoryPort } from '../ports/MomentRepositoryPort.js'
import { LoggerPort } from '../ports/LoggerPort.js'
import { Story } from '../../domain/entities/Story.js'
import { Moment } from '../../domain/entities/Moment.js'

export interface SharedContentResult {
    type: 'STORY' | 'MOMENT'
    content: unknown | null // PublicStoryProps | GoldenMomentProps
    isExpired: boolean
}

export class GetSharedContentUseCase {
    constructor(
        private shareRepository: ShareRepositoryPort,
        private storyRepository: StoryRepositoryPort,
        private momentRepository: MomentRepositoryPort,
        private logger: LoggerPort
    ) { }

    async execute(token: string): Promise<SharedContentResult | null> {
        const link = await this.shareRepository.findByToken(token)

        if (!link) {
            this.logger.warn(`Shared link not found`)
            return null
        }

        if (!link.isValid()) {
            this.logger.info(`Shared link expired: ...${token.slice(-4)}`)
            return { type: link.type, content: null, isExpired: true }
        }

        // Increment access count
        await this.shareRepository.incrementViews(token)

        let content: unknown = null

        if (link.type === 'STORY') {
            const story = await this.storyRepository.findById(link.resourceId)
            // [SEC-02] Use toPublicJSON to exclude ownerId from public response
            content = story ? (story as Story).toPublicJSON() : null
        } else if (link.type === 'MOMENT') {
            const moment = await this.momentRepository.findById(link.resourceId)
            // [SEC-02] Use toPublicJSON to exclude userId from public response
            content = moment ? (moment as Moment).toPublicJSON() : null
        }

        if (!content) return null

        return {
            type: link.type,
            content,
            isExpired: false
        }
    }
}
