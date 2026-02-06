import { Hono } from 'hono'
import { ApiEnv } from '../http/ApiEnv.js'
import { authMiddleware } from '../middleware/auth.js'

export const authRoute = new Hono<ApiEnv>()

// POST /api/v1/auth/ticket
authRoute.post('/ticket', authMiddleware, async (c) => {
    try {
        const user = c.get('user')
        if (!user) {
            console.error('[Auth] User context missing in authMiddleware protected route')
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const { services } = c.var
        const ticketId = await services.ticketStore.issue(user.id)

        return c.json({ ticket: ticketId })
    } catch (error) {
        console.error('[Auth] Failed to issue ticket:', error)
        return c.json({ error: 'Internal Server Error' }, 500)
    }
})
