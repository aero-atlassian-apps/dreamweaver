import { apiFetch } from './apiClient'

export type DemoTheme = 'space' | 'ocean' | 'forest' | 'dinosaurs' | 'magic' | 'friendship' | 'trains' | 'animals'

export interface GenerateDemoStoryParams {
    theme: DemoTheme
    childName?: string
    childAge?: number
}

export interface GenerateDemoStoryResponse {
    title: string
    content: string
}

// E2E Demo Session Types
export interface DemoSessionParams {
    childName: string
    childAge: number
    theme: DemoTheme
}

export interface DemoStage {
    stage: string
    timestamp: number
    data: Record<string, unknown>
}

export interface DemoSessionResponse {
    session: {
        childName: string
        childAge: number
        theme: string
        stages: DemoStage[]
        summary: {
            totalDurationMs: number
            storyDurationSeconds?: number
            finalSleepScore: number
            goldenMomentCaptured: boolean
        }
    }
    requestId?: string
    traceId?: string
}

export class DemoService {
    static async generateDemoStory(params: GenerateDemoStoryParams): Promise<GenerateDemoStoryResponse> {
        const res = await apiFetch('/api/v1/demo/story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        })

        const json = await res.json().catch(() => null) as any
        if (!res.ok) {
            const msg = json?.error || res.statusText || 'Request failed'
            throw new Error(msg)
        }
        if (!json?.success || !json?.data) {
            throw new Error('Invalid response')
        }

        return {
            title: String(json.data.title || ''),
            content: String(json.data.content || ''),
        }
    }

    /**
     * Generate a full E2E demo session with story, TTS, and simulated sleep flow
     */
    static async generateDemoSession(params: DemoSessionParams): Promise<DemoSessionResponse> {
        const res = await apiFetch('/api/v1/demo/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        })

        const json = await res.json().catch(() => null) as any
        if (!res.ok) {
            const msg = json?.error || res.statusText || 'Request failed'
            throw new Error(msg)
        }
        if (!json?.success || !json?.session) {
            throw new Error('Invalid session response')
        }

        return {
            session: json.session,
            requestId: json.requestId,
            traceId: json.traceId,
        }
    }
}
