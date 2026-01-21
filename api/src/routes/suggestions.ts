/**
 * Suggestions API Route
 * 
 * Exposes the GetSuggestionsUseCase.
 */
import { Hono } from 'hono'
import { authMiddleware, Variables as AuthVariables } from '../middleware/auth'
import { ServiceContainer } from '../di/container'

type Variables = AuthVariables & {
    services: ServiceContainer
}

export const suggestionsRoute = new Hono<{ Variables: Variables }>()

// GET /api/v1/suggestions
suggestionsRoute.get('/', authMiddleware, async (c) => {
    const services = c.get('services')
    try {
        const user = c.get('user')
        const useCase = services.getSuggestionsUseCase

        const result = await useCase.execute({
            userId: user.id,
            sessionId: 'current_session' // In real app, sessionId from header/query
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
