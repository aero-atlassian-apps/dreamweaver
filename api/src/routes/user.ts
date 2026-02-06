import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.js'
import type { ApiEnv } from '../http/ApiEnv.js'
import { supabaseAdmin } from '../infrastructure/supabaseAdmin.js'

export const userRoute = new Hono<ApiEnv>()

// Apply auth middleware to all user routes
userRoute.use('*', authMiddleware)

// GET /api/v1/user/me - Get current user from JWT (verified by middleware)
userRoute.get('/me', (c) => {
    // User is guaranteed to exist by middleware
    const user = c.get('user')!

    return c.json({
        id: user.id,
        email: user.email,
        name: user.email?.split('@')[0] || 'User', // Fallback name
        createdAt: new Date().toISOString(), // Todo: Fetch real profile if needed
    })
})

userRoute.get('/preferences', async (c) => {
    const user = c.get('user')!
    if (!supabaseAdmin) return c.json({ success: false, error: 'Supabase service role is required' }, 500)

    const { data, error } = await supabaseAdmin
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) return c.json({ success: false, error: error.message }, 500)

    return c.json({
        success: true,
        data: data || {
            user_id: user.id,
            mic_enabled: true,
            reminders_enabled: false,
            weekly_digest_enabled: true
        }
    })
})

const preferencesSchema = z.object({
    mic_enabled: z.boolean().optional(),
    reminders_enabled: z.boolean().optional(),
    weekly_digest_enabled: z.boolean().optional(),
})

userRoute.put('/preferences', async (c) => {
    const user = c.get('user')!
    let body;
    try {
        const json = await c.req.json();
        body = preferencesSchema.parse(json);
    } catch (e) {
        return c.json({ success: false, error: 'Validation Error' }, 400);
    }

    if (!supabaseAdmin) return c.json({ success: false, error: 'Supabase service role is required' }, 500)

    const row = {
        user_id: user.id,
        mic_enabled: body.mic_enabled ?? true,
        reminders_enabled: body.reminders_enabled ?? false,
        weekly_digest_enabled: body.weekly_digest_enabled ?? true,
        updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
        .from('user_preferences')
        .upsert(row, { onConflict: 'user_id' })
        .select('*')
        .single()

    if (error) return c.json({ success: false, error: error.message }, 500)

    return c.json({ success: true, data })
})
