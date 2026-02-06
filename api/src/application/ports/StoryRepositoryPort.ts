/**
 * StoryRepositoryPort - Interface for story persistence
 * 
 * This port defines the contract for storing and retrieving stories.
 * Implementations can be Supabase, Firebase, local storage, etc.
 */

import { Story, StoryId } from '../../domain/entities/Story.js'

export interface StoryRepositoryPort {
    /**
     * Find a story by its unique ID.
     * @param id The UUID of the story.
     * @returns The Story entity if found, null otherwise.
     */
    findById(id: StoryId): Promise<Story | null>

    /**
     * Save a story (create or update).
     * @param story The Story entity to persist.
     */
    save(story: Story): Promise<void>

    /**
     * Find all stories for a specific user.
     * @param userId The ID of the user.
     * @returns Array of Story entities owned by the user.
     */
    findByUserId(userId: string): Promise<Story[]>

    /**
     * Get recent stories for a user, sorted by creation date descending.
     * @param userId The ID of the user.
     * @param limit Maximum number of stories to return (default implementation specific).
     * @returns Array of most recent Story entities.
     */
    findRecent(userId: string, limit?: number): Promise<Story[]>
}
