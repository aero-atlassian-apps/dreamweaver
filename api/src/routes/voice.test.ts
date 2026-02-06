import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { voiceRoute } from './voice'
import { VoiceProfile } from '../domain/entities/VoiceProfile'

vi.mock('../middleware/auth', () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set('user', { id: 'test-user-id', email: 'test@example.com' })
        await next()
    }
}))

describe('Voice API (Hono)', () => {
    let app: Hono

    const mockFindByUserId = vi.fn()
    const mockFindById = vi.fn()
    const mockSave = vi.fn()
    const mockUploadExecute = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        app = new Hono()
        app.use('*', async (c: any, next: any) => {
            c.set('services', {
                voiceRepository: {
                    findByUserId: mockFindByUserId,
                    findById: mockFindById,
                    save: mockSave,
                },
                uploadVoiceUseCase: {
                    execute: mockUploadExecute,
                }
            })
            await next()
        })
        app.route('/', voiceRoute)
    })

    it('GET / should list voice profiles', async () => {
        const profile = VoiceProfile.create({
            id: 'voice_1',
            userId: 'test-user-id',
            name: 'My Voice',
            sampleUrl: 'https://example.com/sample.mp3',
            voiceModelId: 'clone_sample',
            status: 'ready',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        })
        mockFindByUserId.mockResolvedValue([profile])

        const res = await app.request('/', { method: 'GET' })
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data).toHaveLength(1)
        expect(json.data[0].id).toBe('voice_1')
    })

    it('POST /upload should reject missing file', async () => {
        const res = await app.request('/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'My Voice' })
        })
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.success).toBe(false)
    })

    it('POST /upload should reject unsupported mime type', async () => {
        const res = await app.request('/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'My Voice',
                mimeType: 'text/plain',
                dataBase64: Buffer.from('abc').toString('base64'),
            })
        })
        expect(res.status).toBe(415)
        const json = await res.json()
        expect(json.success).toBe(false)
    })

    it('POST /upload should accept a valid audio file', async () => {
        const profile = VoiceProfile.create({
            id: 'voice_2',
            userId: 'test-user-id',
            name: 'My Voice',
            sampleUrl: 'https://example.com/sample.wav',
            voiceModelId: undefined,
            status: 'processing',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        })
        mockUploadExecute.mockResolvedValue({ profile })

        const res = await app.request('/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'My Voice',
                mimeType: 'audio/wav',
                dataBase64: Buffer.from('abc').toString('base64'),
            })
        })
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.success).toBe(true)
        expect(json.data.id).toBe('voice_2')
    })
})
