/**
 * Conversation API Route
 * 
 * Exposes the ProcessConversationTurnUseCase to the frontend.
 */
import { Hono } from 'hono'
import { authMiddleware, Variables as AuthVariables } from '../middleware/auth'
import { ServiceContainer } from '../di/container'

type Variables = AuthVariables & {
    services: ServiceContainer
}

export const conversationRoute = new Hono<{ Variables: Variables }>()

interface ConversationTurnBody {
    sessionId: string
    message: string
}

// POST /api/v1/conversations/turn
conversationRoute.post('/turn', authMiddleware, async (c) => {
    const services = c.get('services')
    try {
        const body = await c.req.json<ConversationTurnBody>()
        const user = c.get('user')
        const useCase = services.processConversationTurnUseCase

        const result = await useCase.execute({
            userId: user.id,
            sessionId: body.sessionId,
            message: body.message
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
