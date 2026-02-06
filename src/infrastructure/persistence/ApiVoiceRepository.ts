/**
 * ApiVoiceRepository - Frontend implementation using Backend BFF
 */

import type { VoiceRepositoryPort } from '../../application/ports/VoiceRepositoryPort'
import { VoiceProfile, type VoiceProfileId, type VoiceProfileStatus } from '../../domain/entities/VoiceProfile'
import { supabase } from '../supabase/client'
import { apiFetch } from '../api/apiClient'

interface ApiResponse<T> {
    success: boolean
    data: T
    error?: string
}

interface VoiceDto {
    id: string
    userId: string
    name: string
    sampleUrl: string
    voiceModelId: string
    status: string
    createdAt: string
    updatedAt?: string
}

export class ApiVoiceRepository implements VoiceRepositoryPort {
    private readonly baseUrl = '/api/v1/voice'

    // We mainly need save (upload) for now. findById/findByUserId are standard.

    async findById(id: VoiceProfileId): Promise<VoiceProfile | null> {
        const token = await this.getAccessToken()
        if (!token) throw new Error('Not authenticated')

        const response = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === 404) return null
        if (!response.ok) {
            const json = await response.json().catch(() => ({}))
            throw new Error(json.error || 'Failed to load voice profile')
        }

        const json: ApiResponse<VoiceDto> = await response.json()
        return this.mapDtoToEntity(json.data)
    }

    async findByUserId(_userId: string): Promise<VoiceProfile[]> {
        const token = await this.getAccessToken()
        if (!token) throw new Error('Not authenticated')

        const response = await apiFetch(`${this.baseUrl}`, {
            headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) {
            const json = await response.json().catch(() => ({}))
            throw new Error(json.error || 'Failed to load voice profiles')
        }

        const json: ApiResponse<VoiceDto[]> = await response.json()
        return (json.data || []).map((dto) => this.mapDtoToEntity(dto))
    }

    async save(_profile: VoiceProfile): Promise<void> {
        // This repo method is for saving ENTITY structure.
        // But uploading voice involves binary data.
        throw new Error('Use uploadVoice instead of save for initial creation')
    }

    // Specialized method for uploading
    async uploadVoice(_userId: string, name: string, file: File): Promise<VoiceProfile> {
        const token = await this.getAccessToken()
        if (!token) throw new Error('Not authenticated')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', name)

        const response = await apiFetch(`${this.baseUrl}/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                Authorization: `Bearer ${token}`
            },
            // Don't set Content-Type header manually, let browser set boundary
        })

        if (!response.ok) {
            const json = await response.json().catch(() => ({}))
            throw new Error(json.error || 'Failed to upload voice')
        }

        const json: ApiResponse<VoiceDto> = await response.json()
        return this.mapDtoToEntity(json.data)
    }

    async selectVoice(_userId: string, name: string, voiceModelId: string): Promise<VoiceProfile> {
        const token = await this.getAccessToken()
        if (!token) throw new Error('Not authenticated')

        const response = await apiFetch(`${this.baseUrl}/select`, {
            method: 'POST',
            body: JSON.stringify({ name, voiceModelId }),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })

        if (!response.ok) {
            const json = await response.json().catch(() => ({}))
            throw new Error(json.error || 'Failed to select voice')
        }

        const json: ApiResponse<VoiceDto> = await response.json()
        return this.mapDtoToEntity(json.data)
    }

    private async getAccessToken(): Promise<string | null> {
        if (!supabase) return null
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token ?? null
    }

    private mapDtoToEntity(dto: VoiceDto): VoiceProfile {
        return VoiceProfile.create({
            id: dto.id,
            userId: dto.userId,
            name: dto.name,
            sampleUrl: dto.sampleUrl,
            voiceModelId: dto.voiceModelId,
            status: dto.status as VoiceProfileStatus,
            createdAt: new Date(dto.createdAt),
            updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
        })
    }
}
