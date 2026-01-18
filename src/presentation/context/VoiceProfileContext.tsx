/**
 * VoiceProfileContext - Provides voice profile state across the app
 * 
 * Stores the user's voice profile and provides access to TTS functionality.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { VoiceProfile } from '../../domain/entities/VoiceProfile'
import { ApiVoiceRepository } from '../../infrastructure/persistence/ApiVoiceRepository'
import { useAuth } from './AuthContext'

interface VoiceProfileContextType {
    voiceProfile: VoiceProfile | null
    isLoading: boolean
    error: string | null
    hasVoice: boolean
    refreshProfile: () => Promise<void>
    uploadVoice: (name: string, file: File) => Promise<VoiceProfile | null>
}

const VoiceProfileContext = createContext<VoiceProfileContextType | undefined>(undefined)

const voiceRepository = new ApiVoiceRepository()

export function VoiceProfileProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const hasVoice = voiceProfile !== null && voiceProfile.status === 'ready'

    const refreshProfile = useCallback(async () => {
        if (!user?.id) return

        setIsLoading(true)
        setError(null)
        try {
            const profiles = await voiceRepository.findByUserId(user.id)
            // Get the first ready profile or most recent
            const activeProfile = profiles.find(p => p.status === 'ready') || profiles[0] || null
            setVoiceProfile(activeProfile)
        } catch (err) {
            console.error('Failed to fetch voice profile:', err)
            setError(err instanceof Error ? err.message : 'Failed to load voice profile')
        } finally {
            setIsLoading(false)
        }
    }, [user?.id])

    const uploadVoice = useCallback(async (name: string, file: File): Promise<VoiceProfile | null> => {
        if (!user?.id) {
            setError('User not authenticated')
            return null
        }

        setIsLoading(true)
        setError(null)
        try {
            const profile = await voiceRepository.uploadVoice(user.id, name, file)
            setVoiceProfile(profile)
            return profile
        } catch (err) {
            console.error('Failed to upload voice:', err)
            setError(err instanceof Error ? err.message : 'Failed to upload voice')
            return null
        } finally {
            setIsLoading(false)
        }
    }, [user?.id])

    // Load profile on mount if user is authenticated
    useEffect(() => {
        if (user?.id) {
            refreshProfile()
        } else {
            setVoiceProfile(null)
        }
    }, [user?.id, refreshProfile])

    return (
        <VoiceProfileContext.Provider value={{
            voiceProfile,
            isLoading,
            error,
            hasVoice,
            refreshProfile,
            uploadVoice,
        }}>
            {children}
        </VoiceProfileContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVoiceProfile() {
    const context = useContext(VoiceProfileContext)
    if (context === undefined) {
        throw new Error('useVoiceProfile must be used within a VoiceProfileProvider')
    }
    return context
}
