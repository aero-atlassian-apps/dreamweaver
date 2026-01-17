/**
 * GenerateStoryUseCase - Application use case for story generation
 * 
 * This use case orchestrates the story generation process:
 * 1. Validates input
 * 2. Calls AI service to generate content
 * 3. Creates Story domain entity
 * 4. Optionally saves to repository
 */

import { Story, StoryId } from '../../domain/entities/Story'
import { StoryContent } from '../../domain/value-objects/StoryContent'
import type { AIServicePort } from '../ports/AIServicePort'
import type { StoryRepositoryPort } from '../ports/StoryRepositoryPort'

export interface GenerateStoryRequest {
    theme: string
    childName?: string
    childAge?: number
    duration?: 'short' | 'medium' | 'long'
    userId?: string // For persistence
}

export interface GenerateStoryResponse {
    story: Story
    estimatedReadingTime: number
}

export class GenerateStoryUseCase {
    private readonly aiService: AIServicePort
    private readonly storyRepository: StoryRepositoryPort | undefined

    constructor(
        aiService: AIServicePort,
        storyRepository?: StoryRepositoryPort,
    ) {
        this.aiService = aiService
        this.storyRepository = storyRepository
    }

    async execute(request: GenerateStoryRequest): Promise<GenerateStoryResponse> {
        // 1. Validate input
        this.validateRequest(request)

        // 2. Generate story content via AI
        const generated = await this.aiService.generateStory({
            theme: request.theme,
            childName: request.childName,
            childAge: request.childAge,
            duration: request.duration,
            style: 'bedtime',
        })

        // 3. Create Story domain entity
        const storyContent = StoryContent.fromRawText(generated.content)

        const story = Story.create({
            id: this.generateId(),
            title: generated.title,
            content: storyContent,
            theme: request.theme,
            status: 'completed',
            createdAt: new Date(),
            generatedAt: new Date(),
        })

        // 4. Persist if repository is available and userId provided
        if (this.storyRepository && request.userId) {
            await this.storyRepository.save(story)
        }

        // 5. Return response
        return {
            story,
            estimatedReadingTime: story.getEstimatedReadingTime(),
        }
    }

    private validateRequest(request: GenerateStoryRequest): void {
        if (!request.theme || request.theme.trim().length === 0) {
            throw new Error('Theme is required')
        }

        if (request.childAge !== undefined && (request.childAge < 2 || request.childAge > 12)) {
            throw new Error('Child age must be between 2 and 12')
        }
    }

    private generateId(): StoryId {
        return `story_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    }
}
