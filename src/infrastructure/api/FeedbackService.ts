import { apiFetch } from './apiClient'

export interface CreateFeedbackInput {
    contentId: string
    contentType: 'story' | 'moment' | 'character' | 'conversation'
    type: 'flag' | 'rating' | 'correction'
    reason?: string
    details?: string
}

export const FeedbackService = {
    async submitFeedback(input: CreateFeedbackInput, token: string) {
        const response = await apiFetch('/api/v1/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(input)
        })

        if (!response.ok) {
            throw new Error(`Feedback submission failed: ${response.statusText}`)
        }

        return await response.json()
        return await response.json()
    },

    async submitJuryVerdict(input: { verdict: 'approved' | 'needs_work'; message?: string; context?: Record<string, unknown> }) {
        const response = await apiFetch('/api/v1/feedback/jury', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input)
        })

        if (!response.ok) {
            throw new Error(`Verdict submission failed: ${response.statusText}`)
        }

        return await response.json()
    }
}
