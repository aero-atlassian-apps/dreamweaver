import { SupabaseClient } from '@supabase/supabase-js'
import { FeedbackRepositoryPort } from '../../application/ports/FeedbackRepositoryPort.js'
import { CreateFeedbackInput, Feedback } from '../../domain/entities/Feedback.js'
import { supabase } from '../supabase.js'
import { supabaseAdmin } from '../supabaseAdmin.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

export class SupabaseFeedbackRepository implements FeedbackRepositoryPort {
    constructor(private logger: LoggerPort) { }

    private get client() {
        return supabaseAdmin || supabase
    }

    async create(data: CreateFeedbackInput): Promise<Feedback> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized')

        const { data: result, error } = await client
            .from('feedback')
            .insert({
                user_id: data.userId,
                content_id: data.contentId,
                content_type: data.contentType,
                feedback_type: data.type,
                reason: data.reason,
                details: data.details,
                status: 'pending' // default status
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create feedback: ${error.message}`)
        }

        return {
            id: result.id,
            userId: result.user_id,
            contentId: result.content_id,
            contentType: result.content_type,
            type: result.feedback_type,
            reason: result.reason,
            details: result.details,
            status: result.status,
            resolution: result.resolution,
            adminNotes: result.admin_notes,
            resolvedAt: result.resolved_at ? new Date(result.resolved_at) : undefined,
            createdAt: new Date(result.created_at)
        }
    }

    async update(feedback: Feedback): Promise<void> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized')

        const { error } = await client
            .from('feedback')
            .update({
                status: feedback.status,
                resolution: feedback.resolution,
                admin_notes: feedback.adminNotes,
                resolved_at: feedback.resolvedAt?.toISOString()
            })
            .eq('id', feedback.id)

        if (error) throw new Error(`Failed to update feedback: ${error.message}`)
    }

    async findPending(): Promise<Feedback[]> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized')

        const { data, error } = await client
            .from('feedback')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) throw new Error(`Failed to fetch pending feedback: ${error.message}`)

        return (data as any[]).map(this.mapRowToEntity)
    }

    async findById(id: string): Promise<Feedback | null> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized')

        const { data, error } = await client
            .from('feedback')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return null
        return this.mapRowToEntity(data)
    }

    private mapRowToEntity(row: any): Feedback {
        return {
            id: row.id,
            userId: row.user_id,
            contentId: row.content_id,
            contentType: row.content_type,
            type: row.feedback_type,
            reason: row.reason,
            details: row.details,
            status: row.status,
            resolution: row.resolution,
            adminNotes: row.admin_notes,
            resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
            createdAt: new Date(row.created_at)
        }
    }
}
