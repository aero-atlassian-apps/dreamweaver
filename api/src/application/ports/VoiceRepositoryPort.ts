/**
 * VoiceRepositoryPort - Interface for voice profile persistence
 */

import { VoiceProfile, VoiceProfileId } from '../../domain/entities/VoiceProfile.js'

export interface VoiceRepositoryPort {
    /**
     * Find a voice profile by its ID.
     * @param id The unique identifier of the voice profile.
     * @returns The VoiceProfile if found.
     */
    findById(id: VoiceProfileId): Promise<VoiceProfile | null>

    /**
     * List all voice profiles for a user.
     * @param userId The ID of the owner.
     * @returns Array of voice profiles.
     */
    findByUserId(userId: string): Promise<VoiceProfile[]>

    /**
     * Save or update a voice profile.
     * @param profile The profile entity to persist.
     */
    save(profile: VoiceProfile): Promise<void>
}
