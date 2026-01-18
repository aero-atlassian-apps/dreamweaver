/**
 * SupabaseVoiceRepository - Backend implementation
 */

import type { VoiceRepositoryPort } from '../application/ports/VoiceRepositoryPort'
import { VoiceProfile, type VoiceProfileId, type VoiceProfileStatus, type VoiceProfileProps } from '../domain/entities/VoiceProfile'
import { supabase } from './supabase'

interface VoiceProfileRow {
    id: string
    user_id: string
    name: string
    sample_url: string | null
    voice_model_id: string | null
    status: string
    created_at: string
    updated_at: string | null
}

export class SupabaseVoiceRepository implements VoiceRepositoryPort {
    async findById(id: VoiceProfileId): Promise<VoiceProfile | null> {
        if (!supabase) throw new Error('Supabase client not initialized')

        const { data, error } = await supabase
            .from('voice_profiles')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return null
        return this.mapRowToEntity(data as VoiceProfileRow)
    }

    async findByUserId(userId: string): Promise<VoiceProfile[]> {
        if (!supabase) throw new Error('Supabase client not initialized')

        const { data, error } = await supabase
            .from('voice_profiles')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw new Error(`Failed to fetch voice profiles: ${error.message}`)

        return (data as VoiceProfileRow[]).map(row => this.mapRowToEntity(row))
    }

    async save(profile: VoiceProfile): Promise<void> {
        if (!supabase) throw new Error('Supabase client not initialized')

        const row = this.mapEntityToRow(profile)

        const { error } = await supabase
            .from('voice_profiles')
            .upsert(row, { onConflict: 'id' })

        if (error) throw new Error(`Failed to save voice profile: ${error.message}`)
    }

    private mapRowToEntity(row: VoiceProfileRow): VoiceProfile {
        const props: VoiceProfileProps = {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            sampleUrl: row.sample_url || undefined,
            voiceModelId: row.voice_model_id || undefined,
            status: row.status as VoiceProfileStatus,
            createdAt: new Date(row.created_at),
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        }
        return VoiceProfile.create(props)
    }

    private mapEntityToRow(profile: VoiceProfile): VoiceProfileRow {
        const json = profile.toJSON()
        return {
            id: json.id,
            user_id: json.userId,
            name: json.name,
            sample_url: json.sampleUrl || null,
            voice_model_id: json.voiceModelId || null,
            status: json.status,
            created_at: json.createdAt.toISOString(),
            updated_at: json.updatedAt?.toISOString() || null,
        }
    }
}
