import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { healthRoute } from './health'

describe('Health API (Hono)', () => {
    it('GET / returns healthy', async () => {
        const app = new Hono()
        app.route('/', healthRoute)
        const res = await app.request('/')
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.status).toBe('healthy')
    })

    it('GET /ready returns 503 in production when required env vars are missing', async () => {
        const prev = { ...process.env }
        process.env['NODE_ENV'] = 'production'
        delete process.env['SUPABASE_URL']
        delete process.env['SUPABASE_ANON_KEY']
        delete process.env['SUPABASE_SERVICE_ROLE_KEY']
        delete process.env['SUPABASE_SERVICE_KEY']
        delete process.env['GEMINI_API_KEY']
        delete process.env['REDIS_URL']
        delete process.env['UPSTASH_REDIS_REST_URL']
        delete process.env['UPSTASH_REDIS_REST_TOKEN']
        delete process.env['WS_WORKER_INTERNAL_TOKEN']
        delete process.env['GOOGLE_TTS_API_KEY']
        delete process.env['HUGGINGFACE_API_KEY']
        process.env['VOICE_CLONING_ENABLED'] = 'true'

        const app = new Hono()
        app.route('/', healthRoute)
        const res = await app.request('/ready')
        expect(res.status).toBe(503)
        const json = await res.json()
        expect(json.status).toBe('not_ready')

        process.env = prev
    })
})

