/**
 * UploadVoiceUseCase - Upload a voice sample and create a profile
 */

import type { VoiceRepositoryPort } from '../ports/VoiceRepositoryPort'
import type { FileStoragePort } from '../ports/FileStoragePort'
import { VoiceProfile } from '../../domain/entities/VoiceProfile'

export interface UploadVoiceInput {
    userId: string
    name: string
    audioData: ArrayBuffer
    mimeType: string
}

export interface UploadVoiceOutput {
    profile: VoiceProfile
}

export class UploadVoiceUseCase {
    constructor(
        private readonly voiceRepository: VoiceRepositoryPort,
        private readonly fileStorage: FileStoragePort
    ) { }

    async execute(input: UploadVoiceInput): Promise<UploadVoiceOutput> {
        // 1. Create pending profile entity
        const profile = VoiceProfile.createPending({
            userId: input.userId,
            name: input.name,
        })

        // 2. Determine storage path
        // users/{userId}/{profileId}.{ext}
        const ext = this.getExtension(input.mimeType)
        const path = `users/${input.userId}/${profile.id}.${ext}`

        // 3. Upload file
        try {
            const publicUrl = await this.fileStorage.upload(input.audioData, path, input.mimeType)

            // 4. Update profile with URL
            profile.setSampleUrl(publicUrl)

            // 5. Build/Train logic would happen here or be triggered by saving

            // 6. Save to repository
            await this.voiceRepository.save(profile)

            return { profile }

        } catch (error) {
            profile.markFailed()
            // Try to save failed state
            await this.voiceRepository.save(profile).catch(console.error)
            throw error
        }
    }

    private getExtension(mimeType: string): string {
        switch (mimeType) {
            case 'audio/wav': return 'wav'
            case 'audio/mpeg': return 'mp3'
            case 'audio/webm': return 'webm'
            case 'audio/x-m4a': return 'm4a'
            default: return 'bin'
        }
    }
}
