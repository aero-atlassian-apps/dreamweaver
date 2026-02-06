/**
 * SelectVoiceUseCase - Select a standard voice persona
 */
import { VoiceRepositoryPort } from '../ports/VoiceRepositoryPort.js'
import { VoiceProfile } from '../../domain/entities/VoiceProfile.js'

export interface SelectVoiceInput {
    userId: string
    name: string // e.g., "Storyteller Luna"
    voiceModelId: string // e.g., "en-US-Journey-F"
}

export interface SelectVoiceOutput {
    profile: VoiceProfile
}

export class SelectVoiceUseCase {
    constructor(
        private readonly voiceRepository: VoiceRepositoryPort
    ) { }

    async execute(input: SelectVoiceInput): Promise<SelectVoiceOutput> {
        // 1. Create a "Ready" profile immediately
        // For standard voices, no audio sample is needed, and it's instantly ready.
        const profile = VoiceProfile.createPending({
            userId: input.userId,
            name: input.name
        })

        profile.setStandardVoice(input.voiceModelId)

        // 3. Save
        await this.voiceRepository.save(profile)

        return { profile }
    }
}
