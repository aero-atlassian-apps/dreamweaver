/**
 * Suggestions API Route
 * 
 * Exposes the GetSuggestionsUseCase.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.js'
import type { ApiEnv } from '../http/ApiEnv.js'

export const suggestionsRoute = new Hono<ApiEnv>()

const getSuggestionsQuerySchema = z.object({
    sessionId: z.string().optional()
})

const feedbackBodySchema = z.object({
    theme: z.string().min(1),
    type: z.enum(['story_completed', 'story_skipped'])
})

// GET /api/v1/suggestions
suggestionsRoute.get('/', authMiddleware, async (c) => {
    let query;
    try {
        // Hono req.query() returns string | Record. Zod parse handles coercion if structured, but query params are flat.
        // We manually construct object
        const rawQuery = { sessionId: c.req.query('sessionId') }
        query = getSuggestionsQuerySchema.parse(rawQuery)
    } catch (e) {
        return c.json({ success: false, error: 'Validation Error' }, 400);
    }

    const services = c.get('services')
    try {
        const user = c.get('user')!
        const useCase = services.getSuggestionsUseCase

        const result = await useCase.execute({
            userId: user.id,
            sessionId: query.sessionId || 'current_session',
            traceId: c.get('traceId')
        })

        return c.json({
            success: true,
            data: result
        })
    } catch (error) {
        services.logger.error('Failed to get suggestions', { error })
        return c.json({
            success: false,
            error: 'Failed to retrieve suggestions'
        }, 500)
    }
})

// POST /api/v1/suggestions/feedback
suggestionsRoute.post('/feedback', authMiddleware, async (c) => {
    let body;
    try {
        const json = await c.req.json();
        body = feedbackBodySchema.parse(json);
    } catch (e) {
        return c.json({ success: false, error: 'Validation Error' }, 400);
    }

    const services = c.get('services')
    try {
        const user = c.get('user')!

        await services.logInteractionUseCase.execute({
            userId: user.id,
            theme: body.theme,
            interactionType: body.type
        })

        return c.json({ success: true })
    } catch (error) {
        services.logger.error('Failed to log feedback', { error })
        return c.json({ success: false }, 500)
    }
})
