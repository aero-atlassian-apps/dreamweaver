import { createMiddleware } from 'hono/factory'
import { createClient } from '@supabase/supabase-js'
import { container } from '../di/container.js'
import type { ApiEnv, ApiUser } from '../http/ApiEnv.js'
import { supabaseConfig, isConfigValid } from '../infrastructure/supabaseConfig.js'

export type Variables = {
    user: ApiUser
}

export const authMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        container.logger.warn('Auth missing or invalid header')
        return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401)
    }

    const token = authHeader.split(' ')[1]
    const xDemoMode = c.req.header('x-demo-mode')

    // [DEMO-01] Bypassing auth for Demo Mode
    // Allows the "Generic Demo User" to access real app features during walkthroughs
    if (xDemoMode === 'true') {
        c.set('user', {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'demo@dreamweaver.ai',
            role: 'authenticated'
        })
        container.logger.info('User authenticated via x-demo-mode (Generic Demo User)')
        await next()
        return
    }

    // [SEC-03] Mock Auth for Load Testing
    // STRICT: Requires non-production AND explicit feature flag
    if (token === 'mock_load_test_token' &&
        process.env['NODE_ENV'] !== 'production' &&
        process.env['ENABLE_LOAD_TEST_AUTH'] === 'true'
    ) {
        c.set('user', {
            id: 'load_test_user_123',
            email: 'tester@example.com',
            role: 'authenticated'
        })
        container.logger.info('User authenticated via Mock Token (Load Test Mode)')
        await next()
        return
    }

    // Initialize Supabase client
    const supabaseUrl = process.env['SUPABASE_URL'] || c.env?.['SUPABASE_URL']
    const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] || c.env?.['SUPABASE_ANON_KEY']

    // Fallback to static config if not in context (e.g. Node env)
    if (!supabaseUrl && !supabaseAnonKey && isConfigValid) {
        // This path shouldn't be main path for Hono usually as it prefers context env
        // but useful for monolithic deployments
    }

    // We prioritize Context Env (Cloudflare/Hono) but fall back to validated Process env
    const finalUrl = supabaseUrl || supabaseConfig.SUPABASE_URL
    const finalKey = supabaseAnonKey || supabaseConfig.SUPABASE_ANON_KEY

    if (!finalUrl || !finalKey) {
        console.error('Supabase credentials missing in environment')
        return c.json({ error: 'Server configuration error' }, 500)
    }

    // Initialize with anon key, then call getUser with the bearer token
    const supabase = createClient(finalUrl, finalKey)

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            container.logger.warn('Auth failed: Invalid token', { error: error?.message })
            return c.json({ error: 'Unauthorized: Invalid token' }, 401)
        }

        container.logger.info('User authenticated', { userId: user.id })

        // Attach user to context for downstream handlers
        c.set('user', {
            id: user.id,
            email: user.email,
            role: user.role
        })

        // Set access token for routes to use (unified handling)
        c.set('accessToken', token)

        await next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return c.json({ error: 'Internal server error during authentication' }, 500)
    }
})
