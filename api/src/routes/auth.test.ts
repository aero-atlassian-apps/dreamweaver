import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authMiddleware } from '../middleware/auth'
import { Hono } from 'hono'
import { supabaseConfig } from '../infrastructure/supabaseConfig'

// Mock config to be valid
vi.mock('../infrastructure/supabaseConfig', () => ({
    supabaseConfig: { SUPABASE_URL: 'https://mock.supabase.co', SUPABASE_ANON_KEY: 'mock_key' },
    isConfigValid: true
}))

vi.mock('@supabase/supabase-js', () => {
    const mockGetUser = vi.fn()
    const mockAuth = { getUser: mockGetUser }
    const mockClient = { auth: mockAuth }
    return {
        createClient: () => mockClient,
        // Helper to access the mock for assertions
        _mockGetUser: mockGetUser
    }
})

import { createClient } from '@supabase/supabase-js'
const mockSupabase = createClient('', '') as any
const mockGetUser = (createClient as any)().auth.getUser

describe('Auth Middleware', () => {
    let app: Hono<any>

    beforeEach(() => {
        vi.clearAllMocks()
        app = new Hono()
        app.use('*', authMiddleware)
        app.get('/', (c) => c.json({ user: c.get('user') }))
    })

    it('should return 401 if authorization header is missing', async () => {
        const res = await app.request('http://localhost/')
        expect(res.status).toBe(401)
        const json = await res.json()
        expect(json).toEqual({ error: 'Unauthorized: Missing or invalid Authorization header' })
    })

    it('should return 401 if token is invalid', async () => {
        const { _mockGetUser } = await import('@supabase/supabase-js') as any
        _mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Bad jwt' } })

        const res = await app.request('http://localhost/', {
            headers: { Authorization: 'Bearer invalid_token' }
        })
        expect(res.status).toBe(401)
        expect(_mockGetUser).toHaveBeenCalledWith('invalid_token')
    })

    it('should pass and set user if token is valid', async () => {
        const mockUser = { id: 'user_123', email: 'test@example.com', role: 'authenticated' }
        const { _mockGetUser } = await import('@supabase/supabase-js') as any
        _mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })

        const res = await app.request('http://localhost/', {
            headers: { Authorization: 'Bearer valid_token' }
        })
        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.user).toEqual(expect.objectContaining({ id: 'user_123' }))
    })
})
