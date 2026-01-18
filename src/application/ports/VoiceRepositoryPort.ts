import { VoiceProfile, VoiceProfileId } from '../../domain/entities/VoiceProfile'

export interface VoiceRepositoryPort {
    findById(id: VoiceProfileId): Promise<VoiceProfile | null>
    findByUserId(userId: string): Promise<VoiceProfile[]>
    save(voiceProfile: VoiceProfile): Promise<void>
    // Optional: Extended method for upload, or we can keep it out of the port if strictly following DDD.
    // However, for Frontend, the Repository often acts as the Data Source/Gateway.
    // Let's add it for clarity if the Use Case uses it, or keep it specific to the implementation.
    // Since we don't have a UseCase on frontend calling this yet (hook calls Repo),
    // and Repo implements Port, we just need the Port to exist.
    // If we want to use the Port in the hook, we should include uploadVoice, or cast.
    uploadVoice?(userId: string, name: string, file: File): Promise<VoiceProfile>
}
