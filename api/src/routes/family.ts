import { Hono } from 'hono'
import { container } from '../di/container.js'
import { authMiddleware } from '../middleware/auth.js'
import type { ApiEnv } from '../http/ApiEnv.js'

export const familyRoute = new Hono<ApiEnv>()

familyRoute.use('*', authMiddleware)

familyRoute.post('/', async (c) => {
    const user = c.get('user') as any // Type assertion for MVP, strictly should use ContextVariableMap
    const body = await c.req.json()

    if (!body.name) return c.json({ error: 'Name is required' }, 400)

    try {
        const family = await container.familyService.createFamily(body.name, user.id)
        return c.json({ family })
    } catch (e) {
        return c.json({ error: 'Failed to create family' }, 500)
    }
})

familyRoute.get('/me', async (c) => {
    const user = c.get('user') as any
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
        const family = await container.familyService.getFamilyByUserId(user.id)
        if (!family) return c.json({ family: null })
        return c.json({ family })
    } catch (e) {
        return c.json({ error: 'Failed to fetch family' }, 500)
    }
})

familyRoute.post('/invite', async (c) => {
    const user = c.get('user') as any
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const body = await c.req.json()

    // Simplistic invite: just add by userId if provided (in real world uses email + token)
    if (!body.targetUserId) return c.json({ error: 'Target User ID required for MVP invite' }, 400)

    try {
        const family = await container.familyService.getFamilyByUserId(user.id)
        if (!family) return c.json({ error: 'You are not in a family' }, 404)

        await container.familyService.addMemberToFamily(family.id, body.targetUserId)
        return c.json({ success: true })
    } catch (e) {
        return c.json({ error: 'Failed to invite member' }, 500)
    }
})
