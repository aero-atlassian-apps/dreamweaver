import { describe, it, expect, vi } from 'vitest'
import { SelectVoiceUseCase } from './SelectVoiceUseCase'
import type { VoiceRepositoryPort } from '../ports/VoiceRepositoryPort'
import { VoiceProfile } from '../../domain/entities/VoiceProfile'

describe('SelectVoiceUseCase', () => {
    it('should create a ready profile without sample URL', async () => {
        const save = vi.fn().mockResolvedValue(undefined)
        const repo = { save } as unknown as VoiceRepositoryPort
        const useCase = new SelectVoiceUseCase(repo)

        const result = await useCase.execute({
            userId: 'user_1',
            name: 'Storyteller Luna',
            voiceModelId: 'en-US-Journey-F',
        })

        expect(result.profile.status).toBe('ready')
        expect(result.profile.sampleUrl).toBeUndefined()
        expect(result.profile.voiceModelId).toBe('en-US-Journey-F')
        expect(result.profile.isReady()).toBe(true)

        expect(save).toHaveBeenCalledTimes(1)
        const saved = save.mock.calls[0][0] as VoiceProfile
        expect(saved.voiceModelId).toBe('en-US-Journey-F')
    })
})

