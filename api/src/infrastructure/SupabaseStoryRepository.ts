/**
 * SupabaseStoryRepository (Backend)
 * 
 * Implements StoryRepositoryPort for the backend API.
 * Uses the backend Supabase client.
 */

import type { StoryRepositoryPort } from '../application/ports/StoryRepositoryPort'
import { Story, type StoryId, type StoryProps, type StoryStatus } from '../domain/entities/Story'
import { StoryContent } from '../domain/value-objects/StoryContent'
import { supabase } from './supabase'

interface StoryRow {
    id: string
    user_id: string
    title: string
    content: string
    theme: string
    status: string
    audio_url: string | null
    created_at: string
    generated_at: string | null
}

export class SupabaseStoryRepository implements StoryRepositoryPort {
    async findById(id: StoryId): Promise<Story | null> {
        if (!supabase) throw new Error('Supabase client not initialized - Critical Infrastructure Missing')

        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return null
        return this.mapRowToStory(data as StoryRow)
    }

    async save(story: Story): Promise<void> {
        if (!supabase) throw new Error('Supabase client not initialized')

        const row = this.mapStoryToRow(story)

        // Ensure user_id is set (assuming provided by Auth context in API)
        // For now, we might rely on RLS or ensure story object has it?
        // Story entity doesn't have userId field strictly? 
        // Wait, StoryProps doesn't have userId. 
        // The frontend repo mapped it from context or RLS?
        // Let's check the frontend repo implementation again. mapStoryToRow had userId?

        const { error } = await supabase
            .from('stories')
            .upsert(row, { onConflict: 'id' })

        if (error) throw new Error(`Failed to save story: ${error.message}`)
    }

    async findByUserId(userId: string): Promise<Story[]> {
        if (!supabase) throw new Error('Supabase client not initialized - Critical Infrastructure Missing')

        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw new Error(`Failed to fetch stories: ${error.message}`)

        return (data as StoryRow[]).map(row => this.mapRowToStory(row))
    }

    async findRecent(userId: string, limit: number = 10): Promise<Story[]> {
        if (!supabase) throw new Error('Supabase client not initialized - Critical Infrastructure Missing')

        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw new Error(`Failed to fetch recent stories: ${error.message}`)

        return (data as StoryRow[]).map(row => this.mapRowToStory(row))
    }

    // Helper to extract User ID if needed (Story entity might need update if we want to track owner strictly in domain)
    // For now, we assume the DB handles RLS or we pass it.

    private mapRowToStory(row: StoryRow): Story {
        const content = StoryContent.fromRawText(row.content)

        const props: StoryProps = {
            id: row.id,
            title: row.title,
            content,
            theme: row.theme,
            ownerId: row.user_id,
            status: row.status as StoryStatus,
            createdAt: new Date(row.created_at),
            generatedAt: row.generated_at ? new Date(row.generated_at) : undefined,
        }

        return Story.create(props)
    }

    private mapStoryToRow(story: Story): StoryRow {
        return {
            id: story.id,
            user_id: story.ownerId,
            title: story.title,
            content: story.content.getFullText(),
            theme: story.theme,
            status: story.status,
            audio_url: null,
            created_at: story.createdAt.toISOString(),
            generated_at: story.generatedAt?.toISOString() ?? null,
        }
    }
}
