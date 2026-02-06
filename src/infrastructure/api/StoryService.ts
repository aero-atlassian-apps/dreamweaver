/**
 * StoryService - Client-side adapter for Story Generation API
 * 
 * [OPS-01] Uses apiFetch to ensure all calls respect VITE_API_BASE_URL.
 */

import { Story } from '../../domain/entities/Story'
import { apiFetch } from './apiClient'

export interface GenerateStoryParams {
    theme: string
    childName?: string
    childAge?: number
    duration?: 'short' | 'medium' | 'long'
    accessToken?: string
    previousStoryId?: string
    requestId?: string
}

export interface GenerateStoryResponse {
    story: Story
    estimatedReadingTime: number
    newlyUnlockedCompanions?: unknown[]
}

export class StoryService {
    static async generateStory(params: GenerateStoryParams): Promise<GenerateStoryResponse> {
        const response = await apiFetch('/api/v1/stories/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {})
            },
            body: JSON.stringify({
                theme: params.theme,
                childName: params.childName,
                childAge: params.childAge,
                duration: params.duration,
                previousStoryId: params.previousStoryId,
                requestId: params.requestId,
            })
        })

        if (!response.ok) {
            throw new Error(`Story generation failed: ${response.statusText}`)
        }

        const data = await response.json()

        const payload = data?.data as {
            id: string
            title: string
            theme: string
            content: { paragraphs: string[]; sleepScore?: number }
            estimatedReadingTime: number
            createdAt: string
            audioUrl?: string
            newlyUnlockedCompanions?: unknown[]
        }

        const story = Story.create({
            id: payload.id,
            title: payload.title,
            theme: payload.theme,
            content: {
                paragraphs: payload.content.paragraphs,
                sleepScore: payload.content.sleepScore ?? 0,
            },
            status: 'completed',
            ownerId: 'unknown',
            createdAt: new Date(payload.createdAt),
            generatedAt: new Date(payload.createdAt),
            audioUrl: payload.audioUrl,
        })

        return {
            story,
            estimatedReadingTime: payload.estimatedReadingTime,
            newlyUnlockedCompanions: payload.newlyUnlockedCompanions,
        }
    }

    static async *generateStoryStream(params: GenerateStoryParams): AsyncGenerator<string, void, unknown> {
        const response = await apiFetch('/api/v1/stories/generate/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {})
            },
            body: JSON.stringify({
                theme: params.theme,
                childName: params.childName,
                childAge: params.childAge,
                duration: params.duration,
                previousStoryId: params.previousStoryId,
                requestId: params.requestId,
            })
        })

        if (!response.ok) {
            throw new Error(`Streaming failed: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            yield decoder.decode(value, { stream: true })
        }
    }
}
