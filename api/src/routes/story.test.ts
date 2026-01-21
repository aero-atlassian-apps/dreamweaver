/**
 * Hono API Tests - Story Routes
 */
import { describe, it, expect } from 'vitest'
import { storyRoute } from './story'
import { diMiddleware } from '../middleware/di'
import { Hono } from 'hono'

describe('Story API (Hono)', () => {
    it('should implement GET / (list)', async () => {
        // Create a test app that includes the DI middleware
        const app = new Hono()
        app.use('*', diMiddleware)
        app.route('/', storyRoute)

        const res = await app.request('/', {
            method: 'GET',
        })

        // Should return 401 now that we added authMiddleware
        expect(res.status).toBe(401)
    })
})
