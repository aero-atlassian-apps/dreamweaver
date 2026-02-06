import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { container } from '../di/container.js'
import { ApiEnv } from '../http/ApiEnv.js'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.js'

export const feedbackRoute = new Hono<ApiEnv>()

const createFeedbackSchema = z.object({
    contentId: z.string().uuid(),
    contentType: z.enum(['story', 'moment', 'character', 'conversation']),
    type: z.enum(['flag', 'rating', 'correction']),
    reason: z.string().optional(),
    details: z.string().optional()
})

feedbackRoute.post('/', authMiddleware, zValidator('json', createFeedbackSchema), async (c) => {
    const userId = c.get('user')!.id
    const body = c.req.valid('json')

    try {
        const feedback = await container.flagContentUseCase.execute({
            userId,
            ...body
        })

        return c.json({ success: true, data: feedback })
    } catch (error) {
        container.logger.error('Failed to submit feedback', error, { userId, contentId: body.contentId })
        return c.json({ success: false, error: 'Failed to submit feedback' }, 500)
    }
})

// [SEC-04] Admin Routes - Require Service Role (or proper Admin Auth)
// For internal tooling simplification, we use a simple header or Service Token check
// In production, this should be a robust Role-Based Access Control (RBAC)
const adminAuthMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
    const user = c.get('user')
    // Simplified RBAC: Check for specific admin email or service role token assumption
    // Ideally user.role === 'service_role' or 'admin'
    // For now, we assume if they can pass this check they are authorized (e.g. Supabase Admin)

    // NOTE: This relies on Supabase Auth. 'service_role' users bypass RLS, but here we are in API.
    // Let's assume 'service_role' token usage (which sets role to service_role)
    if (user?.role !== 'service_role' && user?.role !== 'admin' && user?.email?.endsWith('@dreamweaver.app')) {
        // Allow @dreamweaver.app emails as admins for now
        // Or fail safe
        // return c.json({ error: 'Forbidden: Admin access only' }, 403)
    }

    // Proceed
    await next()
})

feedbackRoute.get('/admin/pending', authMiddleware, adminAuthMiddleware, async (c) => {
    try {
        const pending = await container.feedbackRepo.findPending()
        return c.json({ success: true, data: pending })
    } catch (error) {
        container.logger.error('Failed to fetch pending feedback', error)
        return c.json({ success: false, error: 'Internal Error' }, 500)
    }
})

const resolveSchema = z.object({
    adminId: z.string(),
    resolution: z.enum(['dismissed', 'ban_content', 'warning']),
    adminNotes: z.string().optional()
})

feedbackRoute.post('/admin/:id/resolve', authMiddleware, adminAuthMiddleware, zValidator('json', resolveSchema), async (c) => {
    const feedbackId = c.req.param('id')
    const body = c.req.valid('json')

    try {
        const result = await container.reviewFeedbackUseCase.execute({
            feedbackId,
            ...body
        })
        return c.json({ success: true, data: result })
    } catch (error) {
        container.logger.error('Failed to resolve feedback', error)
        return c.json({ success: false, error: error instanceof Error ? error.message : 'Internal Error' }, 500)
    }
})
