/**
 * Conversation API Route
 * 
 * Exposes the ProcessConversationTurnUseCase to the frontend.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.js'
import type { ApiEnv } from '../http/ApiEnv.js'

export const conversationRoute = new Hono<ApiEnv>()

const conversationTurnSchema = z.object({
    sessionId: z.string().min(1, "sessionId is required"),
    message: z.string().min(1, "message cannot be empty").max(1000)
})

// POST /api/v1/conversations/turn
conversationRoute.post('/turn', authMiddleware, async (c) => {
    let body;
    try {
        const json = await c.req.json();
        body = conversationTurnSchema.parse(json);
    } catch (e) {
        return c.json({ success: false, error: 'Validation Error' }, 400);
    }

    const services = c.get('services')
    try {
        const user = c.get('user')!
        const useCase = services.processConversationTurnUseCase

        const result = await useCase.execute({
            userId: user.id,
            sessionId: body.sessionId,
            message: body.message,
            traceId: c.get('traceId')
        })

        return c.json({
            success: true,
            data: result
        })
    } catch (error) {
        services.logger.error('Conversation turn failed', { error })
        return c.json({
            success: false,
            error: 'Failed to process conversation turn'
        }, 500)
    }
})
