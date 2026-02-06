/**
 * SuggestionsService - Client-side adapter for fetching suggestions
 */

export interface Suggestion {
    id: string
    title: string
    theme: string
    reasoning: string
    confidence: number
    suggestedDuration: number
}

import { apiFetch } from './apiClient'

export class SuggestionsService {
    static async getSuggestions(
        childName: string,
        age: number,
        preferences: string[],
        accessToken?: string,
        sessionId?: string
    ): Promise<Suggestion[]> {
        void childName
        void age
        void preferences
        // Backend currently ignores childName/age in the GET request but we keep them in signature for future.
        // We construct the query params.
        const params = new URLSearchParams()
        if (sessionId) params.append('sessionId', sessionId)

        // Note: Backend endpoint is GET /api/v1/suggestions
        const response = await apiFetch(`/api/v1/suggestions?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch suggestions: ${response.statusText}`)
        }

        const data = await response.json()
        return data.data.suggestions || []
    }
}
