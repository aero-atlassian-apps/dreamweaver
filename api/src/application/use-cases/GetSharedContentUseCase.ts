import { ShareRepositoryPort } from '../ports/ShareRepositoryPort'
import { StoryRepositoryPort } from '../ports/StoryRepositoryPort'
import { LoggerPort } from '../ports/LoggerPort'

export interface SharedContentResult {
    type: 'STORY' | 'MOMENT'
    content: any // Story | GoldenMoment
    isExpired: boolean
}

export class GetSharedContentUseCase {
    constructor(
        private shareRepository: ShareRepositoryPort,
        private storyRepository: StoryRepositoryPort,
        // private momentRepository: MomentRepositoryPort, // To be implemented for Moments
        private logger: LoggerPort
    ) { }

    async execute(token: string): Promise<SharedContentResult | null> {
        const link = await this.shareRepository.findByToken(token)

        if (!link) {
            this.logger.warn(`Shared link not found: ${token}`)
            return null
        }

        if (!link.isValid()) {
            this.logger.info(`Shared link expired: ${token}`)
            return { type: link.type, content: null, isExpired: true }
        }

        // Increment access count
        await this.shareRepository.incrementViews(token)

        let content = null

        if (link.type === 'STORY') {
            // We use findById directly. 
            // IMPORTANT: This repo method must NOT assume current user context 
            // since this is a public access. 
            // The implementation of SupabaseStoryRepository uses `supabase.from('stories').select().eq('id', id)`
            // If RLS is enabled on 'stories', this might fail if the anon user doesn't have access.
            // For Release 9, we assume we might need a "Service Role" repo or RLS policy "allow public read if id in shared_links".
            // For this MVP, we will rely on key-based access or existing setup.
            content = await this.storyRepository.findById(link.resourceId)
        }

        // TODO: Handle MOMENT type when repository exists

        if (!content) return null

        return {
            type: link.type,
            content,
            isExpired: false
        }
    }
}
