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
    }
}
