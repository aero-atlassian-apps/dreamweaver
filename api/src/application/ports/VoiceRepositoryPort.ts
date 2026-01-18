/**
 * VoiceRepositoryPort - Interface for voice profile persistence
 */

import { VoiceProfile, VoiceProfileId } from '../../domain/entities/VoiceProfile'

export interface VoiceRepositoryPort {
    findById(id: VoiceProfileId): Promise<VoiceProfile | null>
    findByUserId(userId: string): Promise<VoiceProfile[]>
    save(profile: VoiceProfile): Promise<void>
}
