/**
 * UploadVoiceUseCase Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UploadVoiceUseCase, UploadVoiceInput } from './UploadVoiceUseCase'
import type { VoiceRepositoryPort } from '../ports/VoiceRepositoryPort'
import type { FileStoragePort } from '../ports/FileStoragePort'
import { VoiceProfile } from '../../domain/entities/VoiceProfile'

describe('UploadVoiceUseCase', () => {
    let useCase: UploadVoiceUseCase
    let repository: VoiceRepositoryPort
    let fileStorage: FileStoragePort
    let saveMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        saveMock = vi.fn().mockResolvedValue(undefined)
        repository = {
            save: saveMock,
            findById: vi.fn(),
            findByUserId: vi.fn(),
        } as unknown as VoiceRepositoryPort

        fileStorage = {
            upload: vi.fn().mockResolvedValue('https://storage.example.com/voice.mp3')
        }

        useCase = new UploadVoiceUseCase(repository, fileStorage)
    })

    it('should successfully upload voice and create pending profile', async () => {
        const input: UploadVoiceInput = {
            userId: 'user_123',
            name: 'Dad Voice',
            audioData: new ArrayBuffer(10),
            mimeType: 'audio/mpeg'
        }

        const result = await useCase.execute(input)

        expect(result.profile).toBeDefined()
        expect(result.profile.name).toBe('Dad Voice')
        expect(result.profile.status).toBe('ready')
        expect(result.profile.sampleUrl).toBe('https://storage.example.com/voice.mp3')

        expect(fileStorage.upload).toHaveBeenCalledWith(
            input.audioData,
            expect.stringContaining('users/user_123/'),
            'audio/mpeg'
        )

        expect(repository.save).toHaveBeenCalled() // Once pending, once with URL? 
        // Logic says saved once at end.
    })

    it('should handle upload failure', async () => {
        fileStorage.upload = vi.fn().mockRejectedValue(new Error('Upload failed'))

        const input: UploadVoiceInput = {
            userId: 'user_123',
            name: 'Dad Voice',
            audioData: new ArrayBuffer(10),
            mimeType: 'audio/wav'
        }

        await expect(useCase.execute(input))
            .rejects
            .toThrow('Upload failed')

        // Should try to save failed state
        expect(repository.save).toHaveBeenCalled()
        const savedProfile = saveMock.mock.calls[0][0] as VoiceProfile
        expect(savedProfile.status).toBe('failed')
    })
})
