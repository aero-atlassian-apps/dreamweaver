import { apiFetch } from './apiClient'

export interface CompanionProgressResponse {
    storyCount: number
    unlockedCompanions: Array<{
        id: string
        name: string
        species: string
        description: string
        unlockThreshold: number
        unlockedAt: string | null
    }>
    nextUnlock: { id: string; unlockThreshold: number; remainingStories: number } | null
}

export class CompanionService {
    static async getProgress(accessToken: string): Promise<CompanionProgressResponse> {
        const response = await apiFetch('/api/v1/companions/progress', {
            method: 'GET',
            headers: {
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to load companion progress: ${response.statusText}`)
        }

        const json = await response.json()
        return json.data as CompanionProgressResponse
    }
}

