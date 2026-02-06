import type { MomentRepositoryPort } from '../application/ports/MomentRepositoryPort.js'
import { Moment } from '../domain/entities/Moment.js'
import { supabaseAdmin } from './supabaseAdmin.js'
import { supabase } from './supabase.js'
import type { LoggerPort } from '../application/ports/LoggerPort.js'

export class SupabaseMomentRepository implements MomentRepositoryPort {
    constructor(private readonly logger: LoggerPort) { }

    private get client() {
        return supabaseAdmin || supabase
    }

    async findById(id: string): Promise<Moment | null> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized')

        const { data, error } = await client
            .from('golden_moments')
            .select('*')
            .eq('id', id)
            .eq('status', 'active')
            .single()

        if (error || !data) return null

        return this.mapRowToMoment(data)
    }

    async save(moment: Moment): Promise<void> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized')

        const row = {
            id: moment.id,
            user_id: moment.userId,
            story_id: moment.storyId,
            media_url: moment.mediaUrl,
            description: moment.description,
            created_at: moment.createdAt.toISOString()
        }

        const { error } = await client.from('golden_moments').upsert(row)

        if (error) {
            this.logger.error('Failed to save moment', error)
            throw new Error(`Failed to save moment: ${error.message}`)
        }
    }

    async findByUserId(userId: string): Promise<Moment[]> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized')

        const { data, error } = await client
            .from('golden_moments')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')

        if (error) throw error

        return (data || []).map(this.mapRowToMoment)
    }

    async findByStoryId(storyId: string): Promise<Moment[]> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized')

        const { data, error } = await client
            .from('golden_moments')
            .select('*')
            .eq('story_id', storyId)
            .eq('status', 'active')

        if (error) throw error

        return (data || []).map(this.mapRowToMoment)
    }

    async block(id: string): Promise<boolean> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized')

        const { data, error } = await client
            .from('golden_moments')
            .update({ status: 'blocked' })
            .eq('id', id)
            .select('id')

        if (error) {
            this.logger.error('Failed to block moment', error)
            throw new Error(`Failed to block moment: ${error.message}`)
        }

        return Array.isArray(data) && data.length > 0
    }

    private mapRowToMoment(row: any): Moment {
        return Moment.create({
            id: row.id,
            userId: row.user_id,
            storyId: row.story_id,
            mediaUrl: row.media_url,
            description: row.description,
            createdAt: new Date(row.created_at)
        })
    }
}
