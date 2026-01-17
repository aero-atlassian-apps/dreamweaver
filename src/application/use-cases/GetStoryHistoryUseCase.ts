/**
 * GetStoryHistoryUseCase - Retrieve user's story history
 * 
 * Orchestrates story retrieval from repository with filtering.
 */

import type { StoryRepositoryPort } from '../ports/StoryRepositoryPort'
import type { Story } from '../../domain/entities/Story'

export interface GetStoryHistoryInput {
    userId: string
    limit?: number
    filter?: 'all' | 'starred' | 'recent'
}

export interface GetStoryHistoryOutput {
    stories: Story[]
    total: number
}

export class GetStoryHistoryUseCase {
    private readonly storyRepository: StoryRepositoryPort

    constructor(storyRepository: StoryRepositoryPort) {
        this.storyRepository = storyRepository
    }

    async execute(input: GetStoryHistoryInput): Promise<GetStoryHistoryOutput> {
        // Validate input
        if (!input.userId) {
            throw new Error('User ID is required')
        }

        let stories: Story[]

        switch (input.filter) {
            case 'recent':
                stories = await this.storyRepository.findRecent(input.userId, input.limit ?? 10)
                break
            case 'starred':
                // For now, return all and filter client-side
                // Future: add findStarred to repository
                stories = await this.storyRepository.findByUserId(input.userId)
                break
            case 'all':
            default:
                stories = await this.storyRepository.findByUserId(input.userId)
                break
        }

        // Apply limit if specified
        if (input.limit && stories.length > input.limit) {
            stories = stories.slice(0, input.limit)
        }

        return {
            stories,
            total: stories.length,
        }
    }
}
