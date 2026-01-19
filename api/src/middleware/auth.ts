import { createMiddleware } from 'hono/factory'
import { createClient } from '@supabase/supabase-js'

// Environment variables type definition
type Bindings = {
    SUPABASE_URL: string
    SUPABASE_SERVICE_ROLE_KEY: string
}

export type Variables = {
    user: {
        id: string
        email?: string
        role?: string
    }
}

export const authMiddleware = createMiddleware<{ Bindings: Bindings, Variables: Variables }>(async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401)
    }

    const token = authHeader.split(' ')[1]

    // Initialize Supabase client
    // Note: In a real edge environment, these env vars come from c.env
    // prioritizing process.env for local Node.js compatibility
    const supabaseUrl = process.env.SUPABASE_URL || c.env?.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || c.env?.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase credentials missing in environment')
        return c.json({ error: 'Server configuration error' }, 500)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            return c.json({ error: 'Unauthorized: Invalid token' }, 401)
        }

        // Attach user to context for downstream handlers
        c.set('user', {
            id: user.id,
            email: user.email,
            role: user.role
        })

        await next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return c.json({ error: 'Internal server error during authentication' }, 500)
    }
})
