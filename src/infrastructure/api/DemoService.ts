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
}

