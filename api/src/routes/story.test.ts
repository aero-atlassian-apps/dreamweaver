/**
 * Hono API Tests - Story Routes
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { storyRoute } from './story'
import { Story } from '../domain/entities/Story'
import { StoryContent } from '../domain/value-objects/StoryContent'

// Mock dependencies
const mockExecute = vi.fn()
const mockGenerateStoryUseCase = {
    execute: mockExecute
}

// Mock auth middleware module
vi.mock('../middleware/auth', () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set('user', { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com' })
        await next()
    }
}))

// Mock DI middleware for the test app
const mockDiMiddleware = async (c: any, next: any) => {
    c.set('services', {
        generateStoryUseCase: mockGenerateStoryUseCase
    })
    await next()
}

describe('Story API (Hono)', () => {
    let app: Hono

    beforeEach(() => {
        vi.clearAllMocks()
        app = new Hono()

        // Setup mock middlewares
        app.use('*', mockDiMiddleware)
        app.route('/', storyRoute)
    })

    describe('POST /generate', () => {
        it('should return 200 and generated story on valid input', async () => {
            // Setup Use Case success
            const mockStory = Story.create({
                id: '123e4567-e89b-12d3-a456-426614174001',
                ownerId: '123e4567-e89b-12d3-a456-426614174000',
                title: 'Test Story',
                content: StoryContent.fromRawText('Once upon a time...'),
                theme: 'space',
                status: 'completed',
                createdAt: new Date(),
            })
            // Manually set private properties or use a partial mock if needed
            // For testing the route, we just need the structure expected by the route handler

            mockExecute.mockResolvedValue({
                story: mockStory,
                estimatedReadingTime: 5,
                audioUrl: 'http://audio.url'
            })

            const res = await app.request('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    theme: 'space',
                    duration: 'short'
                })
            })

            expect(res.status).toBe(200)
            const json = await res.json()
            expect(json.success).toBe(true)
            expect(json.data.id).toBe('123e4567-e89b-12d3-a456-426614174001')
            expect(json.data.audioUrl).toBe('http://audio.url')
        })

        it('should return 400 when theme is missing (Zod Validation)', async () => {
            const res = await app.request('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duration: 'short' // Missing theme
                })
            })

            expect(res.status).toBe(400)
            const json = await res.json()
            expect(json.success).toBe(false) // Hono Zod validator default depends on config, but our route implementation might trap it? 
            // Actually, @hono/zod-validator by default returns 400 with details if validation fails.
            // Let's verify the status mostly.
        })
    })

    describe('POST /generate/stream', () => {
        it('should stream a safe, use-case generated story as text', async () => {
            const mockStory = Story.create({
                id: '123e4567-e89b-12d3-a456-426614174001',
                ownerId: '123e4567-e89b-12d3-a456-426614174000',
                title: 'Stream Story',
                content: StoryContent.fromRawText('Para one.\n\nPara two.'),
                theme: 'space',
                status: 'completed',
                createdAt: new Date(),
            })

            mockExecute.mockResolvedValue({
                story: mockStory,
                estimatedReadingTime: 5,
                audioUrl: undefined
            })

            const res = await app.request('/generate/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    theme: 'space',
                    duration: 'short'
                })
            })

            expect(res.status).toBe(200)
            const text = await res.text()
            expect(text).toContain('Stream Story')
            expect(text).toContain('Para one.')
            expect(text).toContain('Para two.')
            expect(mockExecute).toHaveBeenCalledTimes(1)
        })
    })
})
