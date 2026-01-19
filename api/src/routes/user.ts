import { Hono } from 'hono'
import { authMiddleware, Variables } from '../middleware/auth'

export const userRoute = new Hono<{ Variables: Variables }>()

// Apply auth middleware to all user routes
userRoute.use('*', authMiddleware)

// GET /api/v1/user/me - Get current user from JWT (verified by middleware)
userRoute.get('/me', (c) => {
    // User is guaranteed to exist by middleware
    const user = c.get('user')

    return c.json({
        id: user.id,
        email: user.email,
        name: user.email?.split('@')[0] || 'User', // Fallback name
        createdAt: new Date().toISOString(), // Todo: Fetch real profile if needed
    })
})
