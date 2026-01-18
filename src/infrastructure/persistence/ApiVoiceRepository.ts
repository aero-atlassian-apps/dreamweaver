/**
 * ApiVoiceRepository - Frontend implementation using Backend BFF
 */

import type { VoiceRepositoryPort } from '../../application/ports/VoiceRepositoryPort'
import { VoiceProfile, type VoiceProfileId, type VoiceProfileStatus } from '../../domain/entities/VoiceProfile'

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async findById(_id: VoiceProfileId): Promise<VoiceProfile | null> {
        // Implement read if needed, similar to Story
        return null // Placeholder
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async findByUserId(_userId: string): Promise<VoiceProfile[]> {
        // Implement list if needed
        return [] // Placeholder
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async save(_profile: VoiceProfile): Promise<void> {
        // This repo method is for saving ENTITY structure.
        // But uploading voice involves binary data.
        throw new Error('Use uploadVoice instead of save for initial creation')
    }

    // Specialized method for uploading
    async uploadVoice(userId: string, name: string, file: File): Promise<VoiceProfile> {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', userId)
        formData.append('name', name)

        const response = await fetch(`${this.baseUrl}/upload`, {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header manually, let browser set boundary
        })

        if (!response.ok) {
            const json = await response.json().catch(() => ({}))
            throw new Error(json.error || 'Failed to upload voice')
        }

        const json: ApiResponse<VoiceDto> = await response.json()
        return this.mapDtoToEntity(json.data)
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
