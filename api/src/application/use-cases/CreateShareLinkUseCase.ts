import { SharedLink, SharedLinkType } from '../../domain/entities/SharedLink.js'
import { ShareRepositoryPort } from '../ports/ShareRepositoryPort.js'
import { LoggerPort } from '../ports/LoggerPort.js'
import { StoryRepositoryPort } from '../ports/StoryRepositoryPort.js'
import { MomentRepositoryPort } from '../ports/MomentRepositoryPort.js'

export interface CreateShareLinkRequest {
    ownerId: string
    resourceId: string
    type: SharedLinkType
    maxViews?: number
    expiresInDays?: number
}

export class CreateShareLinkUseCase {
    constructor(
        private shareRepository: ShareRepositoryPort,
        private storyRepository: StoryRepositoryPort,
        private momentRepository: MomentRepositoryPort,
        private logger: LoggerPort
    ) { }

    async execute(request: CreateShareLinkRequest): Promise<{ url: string, expiresAt: Date }> {
        if (request.type === 'STORY') {
            const story = await this.storyRepository.findById(request.resourceId)
            if (!story || story.ownerId !== request.ownerId) {
                throw new Error('Not authorized to share this story')
            }
        }
        if (request.type === 'MOMENT') {
            const moment = await this.momentRepository.findById(request.resourceId)
            if (!moment || moment.userId !== request.ownerId) {
                throw new Error('Not authorized to share this moment')
            }
        }

        const link = SharedLink.generate(
            request.ownerId,
            request.resourceId,
            request.type,
            request.maxViews || 3,
            request.expiresInDays || 2
        )

        await this.shareRepository.save(link)

        this.logger.info(`Generated shared link for ${request.type} ${request.resourceId}: ${link.token.substring(0, 4)}...`)

        // Construct public URL
        const baseUrl = process.env['PUBLIC_APP_URL'] || 'http://localhost:5173'
        const url = `${baseUrl}/share/${link.token}`

        return { url, expiresAt: link.expiresAt }
    }
}
