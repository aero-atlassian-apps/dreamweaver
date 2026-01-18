/**
 * StoryRepositoryPort - Interface for story persistence
 * 
 * This port defines the contract for storing and retrieving stories.
 * Implementations can be Supabase, Firebase, local storage, etc.
 */

import { Story, StoryId } from '../../domain/entities/Story'

export interface StoryRepositoryPort {
    /**
     * Find a story by its unique ID
     */
    findById(id: StoryId): Promise<Story | null>

    /**
     * Save a story (create or update)
     */
    save(story: Story): Promise<void>

    /**
     * Find all stories for a user
     */
    findByUserId(userId: string): Promise<Story[]>

    /**
     * Get recent stories (for dashboard)
     */
    findRecent(userId: string, limit?: number): Promise<Story[]>
}
