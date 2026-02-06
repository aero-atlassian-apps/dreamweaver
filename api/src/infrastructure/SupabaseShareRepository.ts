/**
 * SupabaseShareRepository
 */

import { ShareRepositoryPort } from '../application/ports/ShareRepositoryPort.js'
import { SharedLink, SharedLinkType } from '../domain/entities/SharedLink.js'
import { supabaseAdmin } from './supabaseAdmin.js'

interface SharedLinkRow {
    id: string
    resource_id: string
    owner_id: string
    type: string
    token: string
    max_views: number
    current_views: number
    expires_at: string
    created_at: string
    updated_at?: string
}

export class SupabaseShareRepository implements ShareRepositoryPort {
    private get client() {
        if (!supabaseAdmin) {
            throw new Error('Supabase service role is required for SupabaseShareRepository')
        }
        return supabaseAdmin
    }

    async save(link: SharedLink): Promise<void> {
        const client = this.client
        if (!client) throw new Error('Supabase client missing')

        const row: SharedLinkRow = {
            id: link.id,
            resource_id: link.resourceId,
            owner_id: link.ownerId,
            type: link.type,
            token: link.token,
            max_views: link.maxViews,
            current_views: link.currentViews,
            expires_at: link.expiresAt.toISOString(),
            created_at: link.createdAt.toISOString()
        }

        const { error } = await client
            .from('shared_links')
            .insert(row)

        if (error) throw new Error(`Failed to save shared link: ${error.message}`)
    }

    async findByToken(token: string): Promise<SharedLink | null> {
        const client = this.client
        if (!client) throw new Error('Supabase client missing')

        const { data, error } = await client
            .rpc('get_shared_link_by_token', { p_token: token })

        if (error || !data) return null

        const row = Array.isArray(data) ? data[0] : data
        if (!row) return null
        return this.mapRowToEntity(row as SharedLinkRow)
    }

    async incrementViews(token: string): Promise<void> {
        const client = this.client
        if (!client) throw new Error('Supabase client missing')

        const { error } = await client.rpc('increment_shared_link_views', { p_token: token })

        if (error) throw new Error(`Failed to increment shared link views: ${error.message}`)
    }

    private mapRowToEntity(row: SharedLinkRow): SharedLink {
        return SharedLink.create({
            id: row.id,
            resourceId: row.resource_id,
            ownerId: row.owner_id,
            type: row.type as SharedLinkType,
            token: row.token,
            maxViews: row.max_views,
            currentViews: row.current_views,
            expiresAt: new Date(row.expires_at),
            createdAt: new Date(row.created_at)
        })
    }
}
