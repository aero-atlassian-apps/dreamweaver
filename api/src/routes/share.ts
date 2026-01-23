import { Hono } from 'hono'
import { container } from '../di/container'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Protected: Create a share link
app.post('/', authMiddleware, async (c) => {
    const body = await c.req.json()
    const { resourceId, type, expiresInDays } = body

    if (!resourceId || !type) {
        return c.json({ success: false, error: 'Missing resourceId or type' }, 400)
    }

    try {
        const result = await container.createShareLinkUseCase.execute({
            resourceId,
            type, // 'STORY' | 'MOMENT'
            expiresInDays
        })

        return c.json({
            success: true,
            data: result
        })
    } catch (error: any) {
        return c.json({ success: false, error: error.message }, 500)
    }
})

// Public: View shared content
app.get('/:token', async (c) => {
    const token = c.req.param('token')

    try {
        const result = await container.getSharedContentUseCase.execute(token)

        if (!result) {
            return c.json({ success: false, error: 'Link not found' }, 404)
        }

        if (result.isExpired) {
            return c.json({ success: false, error: 'Link has expired' }, 410) // 410 Gone
        }

        return c.json({
            success: true,
            data: result
        })
    } catch (error: any) {
        console.error('Share access error:', error)
        return c.json({ success: false, error: 'Failed to load content' }, 500)
    }
})

export { app as shareRoute }
