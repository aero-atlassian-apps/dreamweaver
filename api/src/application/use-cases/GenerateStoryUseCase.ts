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
import type { EventBusPort, StoryBeatCompletedEvent } from '../ports/EventBusPort'

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
    private readonly eventBus: EventBusPort | undefined

    constructor(
        aiService: AIServicePort,
        storyRepository?: StoryRepositoryPort,
        eventBus?: EventBusPort,
    ) {
        this.aiService = aiService
        this.storyRepository = storyRepository
        this.eventBus = eventBus
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
            ownerId: request.userId || 'system', // Fallback for safety although validated in route
            status: 'completed',
            createdAt: new Date(),
            generatedAt: new Date(),
        })

        // 4. Persist if repository is available and userId provided
        if (this.storyRepository && request.userId) {
            await this.storyRepository.save(story)
        }

        // 4.1 Emit completion events (Beats)
        if (this.eventBus) {
            const paragraphs = story.content.paragraphs
            const totalBeats = paragraphs.length

            for (let i = 0; i < totalBeats; i++) {
                const event: StoryBeatCompletedEvent = {
                    type: 'STORY_BEAT_COMPLETED',
                    payload: {
                        storyId: story.id,
                        beatIndex: i,
                        totalBeats: totalBeats,
                    },
                    timestamp: new Date()
                }
                // In a real scenario, this might be emitted *during* generation if streaming.
                // For this MVP convergence step, we emit them as "completed beats" after content is ready.
                await this.eventBus.publish(event)
            }
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
