/**
 * SupabaseShareRepository
 */

import { ShareRepositoryPort } from '../application/ports/ShareRepositoryPort'
import { SharedLink, SharedLinkProps, SharedLinkType } from '../domain/entities/SharedLink'
import { supabase } from './supabase'

interface SharedLinkRow {
    id: string
    resource_id: string
    type: string
    token: string
    max_views: number
    current_views: number
    expires_at: string
    created_at: string
}

export class SupabaseShareRepository implements ShareRepositoryPort {

    async save(link: SharedLink): Promise<void> {
        if (!supabase) throw new Error('Supabase client missing')

        const row: SharedLinkRow = {
            id: link.id,
            resource_id: link.resourceId,
            type: link.type,
            token: link.token,
            max_views: link.maxViews,
            current_views: link.currentViews,
            expires_at: link.expiresAt.toISOString(),
            created_at: link.createdAt.toISOString()
        }

        const { error } = await supabase
            .from('shared_links')
            .insert(row)

        if (error) throw new Error(`Failed to save shared link: ${error.message}`)
    }

    async findByToken(token: string): Promise<SharedLink | null> {
        if (!supabase) throw new Error('Supabase client missing')

        const { data, error } = await supabase
            .from('shared_links')
            .select('*')
            .eq('token', token)
            .single()

        if (error || !data) return null

        return this.mapRowToEntity(data as SharedLinkRow)
    }

    async incrementViews(token: string): Promise<void> {
        if (!supabase) throw new Error('Supabase client missing')

        // Atomic increment via RPC or just read-update-write if low concurrency
        // Ideally: await supabase.rpc('increment_share_views', { link_token: token })
        // Fallback for MVP: 
        const { error } = await supabase.rpc('increment_shared_link_views', { token_arg: token })

        if (error) {
            console.warn('RPC increment failed, trying manual update', error)
            // simplified manual fallback
            const link = await this.findByToken(token)
            if (link) {
                await supabase
                    .from('shared_links')
                    .update({ current_views: link.currentViews + 1 })
                    .eq('token', token)
            }
        }
    }

    private mapRowToEntity(row: SharedLinkRow): SharedLink {
        return SharedLink.create({
            id: row.id,
            resourceId: row.resource_id,
            type: row.type as SharedLinkType,
            token: row.token,
            maxViews: row.max_views,
            currentViews: row.current_views,
            expiresAt: new Date(row.expires_at),
            createdAt: new Date(row.created_at)
        })
    }
}
