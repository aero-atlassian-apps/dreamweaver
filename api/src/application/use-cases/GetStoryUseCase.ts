import type { Story } from '../../domain/entities/Story.js'
import type { StoryRepositoryPort } from '../ports/StoryRepositoryPort.js'
import type { LoggerPort } from '../ports/LoggerPort.js'

export interface GetStoryRequest {
    userId: string
    storyId: string
}

export interface GetStoryResponse {
    story: Story
}

export class GetStoryUseCase {
    constructor(
        private readonly storyRepository: StoryRepositoryPort,
        private readonly logger: LoggerPort
    ) { }

    async execute(request: GetStoryRequest): Promise<GetStoryResponse> {
        this.logger.info(`Getting story ${request.storyId} for user ${request.userId}`)

        const story = await this.storyRepository.findById(request.storyId)

        if (!story) {
            this.logger.warn(`Story ${request.storyId} not found`)
            throw new Error('Story not found')
        }

        // Security Check: Ensure user owns the story
        if (story.ownerId !== request.userId) {
            this.logger.warn(`Unauthorized access attempt: User ${request.userId} tried to access story ${request.storyId} owned by ${story.ownerId}`)
            throw new Error('Unauthorized: You do not have permission to view this story')
        }

        return { story }
    }
}
