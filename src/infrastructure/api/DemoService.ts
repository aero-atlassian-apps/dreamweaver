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
    voiceId?: string
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

    /**
     * Generate a FULL-STACK demo session with real Supabase persistence
     * This validates 95%+ of the stack (auth bypass with demo user)
     */
    static async generateDemoSessionFull(params: DemoSessionParams): Promise<{
        storyId?: string
        title: string
        paragraphs: string[]
        sleepScore: number
        theme: string
        audioUrl?: string
        audioDuration?: number
        persistence: {
            storySaved: boolean
            memoryCreated: boolean
            userId: string
        }
        summary: {
            totalDurationMs: number
            validationCoverage: string
            testedComponents: string[]
        }
        requestId?: string
        traceId?: string
    }> {
        const res = await apiFetch('/api/v1/demo/session-full', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-demo-mode': 'true',
            },
            body: JSON.stringify({ ...params, demoMode: true }),
        })

        const json = await res.json().catch(() => null) as any
        if (!res.ok) {
            const msg = json?.error || res.statusText || 'Request failed'
            throw new Error(msg)
        }
        if (!json?.success || !json?.story) {
            throw new Error('Invalid full-stack session response')
        }

        return {
            storyId: json.story.id,
            title: json.story.title,
            paragraphs: json.story.paragraphs,
            sleepScore: json.story.sleepScore,
            theme: json.story.theme,
            audioUrl: json.story.audioUrl,
            audioDuration: json.story.audioDuration,
            persistence: json.persistence,
            summary: json.summary,
            requestId: json.requestId,
            traceId: json.traceId,
        }
    }

    /**
     * Get demo history (stories generated in full-stack mode)
     */
    static async getDemoHistory(): Promise<{
        id: string
        title: string
        theme: string
        createdAt: string
        audioUrl?: string
    }[]> {
        const res = await apiFetch('/api/v1/demo/history', {
            method: 'GET',
        })
        const json = await res.json().catch(() => null) as any
        if (!res.ok) return []
        return json.history || []
    }

    /**
     * Upload a voice sample for cloning (Demo Mode)
     */
    static async uploadVoice(blob: Blob, name: string): Promise<{ id: string; name: string; previewUrl?: string }> {
        const formData = new FormData()
        formData.append('file', blob)
        formData.append('name', name)

        // Note: Do NOT set Content-Type header manually for FormData, fetch will set it with boundary
        const res = await apiFetch('/api/v1/demo/voice/upload', {
            method: 'POST',
            body: formData,
        })

        const json = await res.json().catch(() => null) as any
        if (!res.ok) {
            const msg = json?.error || res.statusText || 'Upload failed'
            throw new Error(msg)
        }
        if (!json?.success || !json?.voice) {
            throw new Error('Invalid upload response')
        }

        return json.voice
    }
}

