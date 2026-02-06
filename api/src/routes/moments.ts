import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.js'
import { container } from '../di/container.js'
import type { ApiEnv } from '../http/ApiEnv.js'

export const momentsRoute = new Hono<ApiEnv>()

momentsRoute.use('*', authMiddleware)

const listQuerySchema = z.object({
    limit: z.string().optional(),
    storyId: z.string().optional(),
})

momentsRoute.get('/', async (c) => {
    const user = c.get('user')!
    let query;
    try {
        const raw = {
            limit: c.req.query('limit'),
            storyId: c.req.query('storyId')
        }
        query = listQuerySchema.parse(raw)
    } catch (e) {
        return c.json({ success: false, error: 'Validation Error' }, 400);
    }

    const limit = query.limit ? Number.parseInt(query.limit, 10) : 50
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, limit)) : 50

    const all = query.storyId
        ? await container.momentRepository.findByStoryId(query.storyId)
        : await container.momentRepository.findByUserId(user.id)

    const moments = all
        .filter(m => m.userId === user.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, safeLimit)
        .map(m => ({
            id: m.id,
            storyId: m.storyId,
            description: m.description,
            mediaUrl: m.mediaUrl,
            createdAt: m.createdAt.toISOString(),
        }))

    return c.json({ success: true, data: { moments } })
})

const idParamSchema = z.object({ id: z.string().min(1) })

momentsRoute.get('/:id', async (c) => {
    const user = c.get('user')!
    let id;
    try {
        id = idParamSchema.parse({ id: c.req.param('id') }).id
    } catch (e) {
        return c.json({ success: false, error: 'Invalid ID' }, 400);
    }

    const moment = await container.momentRepository.findById(id)
    if (!moment) return c.json({ success: false, error: 'Not found' }, 404)
    if (moment.userId !== user.id) return c.json({ success: false, error: 'Forbidden' }, 403)

    return c.json({
        success: true,
        data: {
            id: moment.id,
            storyId: moment.storyId,
            description: moment.description,
            mediaUrl: moment.mediaUrl,
            createdAt: moment.createdAt.toISOString(),
        }
    })
})

