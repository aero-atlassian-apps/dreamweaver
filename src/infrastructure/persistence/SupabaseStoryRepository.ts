/**
 * SupabaseStoryRepository - Persists stories to Supabase
 * 
 * Implements StoryRepositoryPort for Supabase backend.
 */

import type { StoryRepositoryPort } from '../../application/ports/StoryRepositoryPort'
import { Story, type StoryId, type StoryProps, type StoryStatus } from '../../domain/entities/Story'
import { StoryContent } from '../../domain/value-objects/StoryContent'
import { supabase } from '../supabase/client'

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
        if (!supabase) {
            throw new Error('Supabase client not initialized')
        }

        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) {
            return null
        }

        return this.mapRowToStory(data as StoryRow)
    }

    async save(story: Story): Promise<void> {
        if (!supabase) {
            throw new Error('Supabase client not initialized')
        }

        const row = this.mapStoryToRow(story)

        const { error } = await supabase
            .from('stories')
            .upsert(row, { onConflict: 'id' })

        if (error) {
            throw new Error(`Failed to save story: ${error.message}`)
        }
    }

    async findByUserId(userId: string): Promise<Story[]> {
        if (!supabase) {
            throw new Error('Supabase client not initialized')
        }

        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch stories: ${error.message}`)
        }

        return (data as StoryRow[]).map(row => this.mapRowToStory(row))
    }

    async findRecent(userId: string, limit: number = 10): Promise<Story[]> {
        if (!supabase) {
            throw new Error('Supabase client not initialized')
        }

        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            throw new Error(`Failed to fetch recent stories: ${error.message}`)
        }

        return (data as StoryRow[]).map(row => this.mapRowToStory(row))
    }

    private mapRowToStory(row: StoryRow): Story {
        const content = StoryContent.fromRawText(row.content)

        const props: StoryProps = {
            id: row.id,
            title: row.title,
            content,
            theme: row.theme,
            status: row.status as StoryStatus,
            ownerId: row.user_id,
            createdAt: new Date(row.created_at),
            generatedAt: row.generated_at ? new Date(row.generated_at) : undefined,
            audioUrl: row.audio_url || undefined,
        }

        return Story.create(props)
    }

    private mapStoryToRow(story: Story): Omit<StoryRow, 'user_id'> & { user_id?: string } {
        const fullText = story.content.getFullText ? story.content.getFullText() : story.content.paragraphs.join('\n')

        return {
            id: story.id,
            user_id: story.ownerId,
            title: story.title,
            content: fullText,
            theme: story.theme,
            status: story.status,
            audio_url: story.audioUrl || null,
            created_at: story.createdAt.toISOString(),
            generated_at: story.generatedAt?.toISOString() ?? null,
        }
    }
}
