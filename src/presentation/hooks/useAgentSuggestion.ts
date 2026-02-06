/**
 * useAgentSuggestion - Hook to get story suggestions from BedtimeConductorAgent
 * 
 * Connects the Dashboard to the backend SuggestionsService.
 */

import { useAuth } from '../context/AuthContext'

import { useState, useCallback, useEffect } from 'react'
import { SuggestionsService, type Suggestion } from '../../infrastructure/api/SuggestionsService'

const DEFAULT_FAVORITE_THEMES = ['space', 'animals', 'fantasy']

interface UseAgentSuggestionOptions {
    childName?: string
    childAge?: number
    favoriteThemes?: string[]
}

interface UseAgentSuggestionResult {
    suggestion: Suggestion | null
    isLoading: boolean
    error: string | null
    refresh: () => void
}

export function useAgentSuggestion(options: UseAgentSuggestionOptions = {}): UseAgentSuggestionResult {
    const { session } = useAuth()
    const childName = options.childName || 'Little One'
    const childAge = options.childAge || 5
    const favoriteThemes = options.favoriteThemes || DEFAULT_FAVORITE_THEMES

    // State
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchSuggestion = useCallback(async () => {
        // If no session, we can't really fetch from backend in a protected route way.
        // But for public pages or if auth is optional... generally we need auth.
        // We'll pass the token if it exists.

        setIsLoading(true)
        setError(null)

        try {
            const accessToken = session?.access_token
            const suggestions = await SuggestionsService.getSuggestions(
                childName,
                childAge,
                favoriteThemes,
                accessToken,
                undefined // sessionId not managed here yet
            )

            if (suggestions && suggestions.length > 0) {
                setSuggestion(suggestions[0])
            } else {
                setSuggestion(null)
            }
        } catch (err) {
            console.error('Failed to fetch suggestion:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
            // Fallback commented out to ensure we see real errors, 
            // or we can keep it if offline mode is desired.
            // For now, let's keep it but simpler.
        } finally {
            setIsLoading(false)
        }
    }, [childName, childAge, favoriteThemes, session?.access_token])

    // Initial fetch
    useEffect(() => {
        fetchSuggestion()
    }, [fetchSuggestion])

    return {
        suggestion,
        isLoading,
        error,
        refresh: fetchSuggestion,
    }
}
