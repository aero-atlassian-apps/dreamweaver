import { useState } from 'react'
import { ApiVoiceRepository } from '../../infrastructure/persistence/ApiVoiceRepository'
import { VoiceProfile } from '../../domain/entities/VoiceProfile'

const repository = new ApiVoiceRepository()

export function useVoiceUpload() {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [profile, setProfile] = useState<VoiceProfile | null>(null)

    const upload = async (userId: string, name: string, file: File) => {
        setUploading(true)
        setError(null)
        try {
            const result = await repository.uploadVoice(userId, name, file)
            setProfile(result)
            return result
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed'
            setError(msg)
            throw err
        } finally {
            setUploading(false)
        }
    }

    const select = async (userId: string, name: string, voiceModelId: string) => {
        setUploading(true)
        setError(null)
        try {
            const result = await repository.selectVoice(userId, name, voiceModelId)
            setProfile(result)
            return result
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Selection failed'
            setError(msg)
            throw err
        } finally {
            setUploading(false)
        }
    }

    return { upload, select, uploading, error, profile }
}
