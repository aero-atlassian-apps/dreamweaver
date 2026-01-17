import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'

export const userRoute = new Hono()

// Supabase client (server-side)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase env vars not set. Auth will not work.')
}

const supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

// GET /api/user/me - Get current user from JWT
userRoute.get('/me', async (c) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!supabase) {
        return c.json({ error: 'Auth not configured' }, 500)
    }

    const token = authHeader.split(' ')[1]

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            return c.json({ error: 'Invalid token' }, 401)
        }

        return c.json({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || null,
            createdAt: user.created_at,
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
        return c.json({ error: 'Auth failed' }, 500)
    }
})
