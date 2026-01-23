import { SharedLink, SharedLinkType } from '../../domain/entities/SharedLink'
import { ShareRepositoryPort } from '../ports/ShareRepositoryPort'
import { LoggerPort } from '../ports/LoggerPort'

export interface CreateShareLinkRequest {
    resourceId: string
    type: SharedLinkType
    maxViews?: number
    expiresInDays?: number
}

export class CreateShareLinkUseCase {
    constructor(
        private shareRepository: ShareRepositoryPort,
        private logger: LoggerPort
    ) { }

    async execute(request: CreateShareLinkRequest): Promise<{ url: string, expiresAt: Date }> {
        const link = SharedLink.generate(
            request.resourceId,
            request.type,
            request.maxViews || 5,
            request.expiresInDays || 7
        )

        await this.shareRepository.save(link)

        this.logger.info(`Generated shared link for ${request.type} ${request.resourceId}: ${link.token}`)

        // Construct public URL
        const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173'
        const url = `${baseUrl}/share/${link.token}`

        return { url, expiresAt: link.expiresAt }
    }
}
