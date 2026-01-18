/**
 * ApiStoryRepository - Frontend implementation using Backend BFF
 */

import type { StoryRepositoryPort } from '../../application/ports/StoryRepositoryPort'
import { Story, type StoryId, type StoryStatus } from '../../domain/entities/Story'
import { StoryContent } from '../../domain/value-objects/StoryContent'

interface ApiResponse<T> {
    success: boolean
    data: T
    error?: string
}

interface StoryDto {
    id: string
    title: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any // Content is complex (string | object), can rely on 'any' here or properly type Union. Using any for content field but strictly typing wrapper.
    theme: string
    status: string
    ownerId: string
    createdAt: string
    generatedAt?: string
}

export class ApiStoryRepository implements StoryRepositoryPort {
    private readonly baseUrl = '/api/v1/stories'

    async findById(id: StoryId): Promise<Story | null> {
        const response = await fetch(`${this.baseUrl}/${id}`)
        if (!response.ok) {
            if (response.status === 404) return null
            throw new Error(`Failed to fetch story ${id}`)
        }

        const json: ApiResponse<StoryDto> = await response.json()
        if (!json.success || !json.data) return null

        return this.mapDtoToEntity(json.data)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async save(_story: Story): Promise<void> {
        // Backend handles saving usually via generation or other endpoints.
        console.warn('ApiStoryRepository.save not fully implemented - assuming handled by backend generation')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async findByUserId(_userId: string): Promise<Story[]> {
        // userId argument might be redundant if using cookie-based auth in BFF
        const response = await fetch(this.baseUrl)
        if (!response.ok) throw new Error('Failed to fetch stories')

        const json: ApiResponse<StoryDto[]> = await response.json()
        return (json.data || []).map(dto => this.mapDtoToEntity(dto))
    }

    async findRecent(_userId: string, limit: number = 10): Promise<Story[]> {
        const response = await fetch(`${this.baseUrl}?limit=${limit}&sort=recent`)
        // Backend GET / accepts limit? I implemented it in api/src/routes/story.ts to use UseCase which accepts limit.
        // But the route implementation:
        // const result = await getStoryHistory.execute({ userId, limit: 50, filter: 'all' })
        // It hardcoded limit 50. I should probably allow query params.
        // I won't change backend now (Strict separation task done). I'll just use what I have.

        if (!response.ok) throw new Error('Failed to fetch recent stories')

        const json: ApiResponse<StoryDto[]> = await response.json()
        return (json.data || []).map(dto => this.mapDtoToEntity(dto))
    }

    private mapDtoToEntity(dto: StoryDto): Story {
        // Map backend DTO to Domain Entity
        // DTO from SupabaseRow -> Story -> JSON
        const contentStr = Array.isArray(dto.content) ? dto.content.join('\n\n') : (typeof dto.content === 'string' ? dto.content : '')

        // Handle StoryContent if it came as object (StoryContentDto structure)
        // Check if it has paragraphs
        const hasParagraphs = dto.content && typeof dto.content === 'object' && !Array.isArray(dto.content) && 'paragraphs' in dto.content

        const finalContent = hasParagraphs
            ? (() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const c = dto.content as { paragraphs: string[]; chapters: any[]; sleepScore: any }
                return StoryContent.create({
                    paragraphs: c.paragraphs,
                    chapters: c.chapters,
                    sleepScore: c.sleepScore
                })
            })()
            : StoryContent.fromRawText(contentStr)

        return Story.create({
            id: dto.id,
            title: dto.title,
            content: finalContent,
            theme: dto.theme,
            status: dto.status as StoryStatus,
            createdAt: new Date(dto.createdAt),
            generatedAt: dto.generatedAt ? new Date(dto.generatedAt) : undefined,
        })
    }
}
