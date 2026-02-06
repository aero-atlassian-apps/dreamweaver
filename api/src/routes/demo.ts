import { Hono } from 'hono'
import { z } from 'zod'
import type { ApiEnv } from '../http/ApiEnv.js'
import { extractClientIp } from '../middleware/rateLimit.js'

export const demoRoute = new Hono<ApiEnv>()

const demoStorySchema = z.object({
    theme: z.enum(['space', 'ocean', 'forest', 'dinosaurs', 'magic', 'friendship', 'trains', 'animals']).default('space'),
    childName: z.string().min(1).max(32).optional(),
    childAge: z.number().int().min(2).max(12).optional(),
}).strict()

demoRoute.post('/story', async (c) => {
    // Demo is ENABLED by default. Set PUBLIC_DEMO_ENABLED="false" to disable.
    if (process.env['PUBLIC_DEMO_ENABLED'] === 'false') {
        return c.json({ success: false, error: 'Not Found', requestId: c.get('requestId'), traceId: c.get('traceId') }, 404)
    }

    const services = c.get('services')
    const clientIp = extractClientIp({ get: (name: string) => c.req.header(name) })

    const rateKey = `demo:story:${clientIp}`
    const count = await services.cache.increment(rateKey, 60 * 60)
    if (count > 10) {
        return c.json({
            success: false,
            error: 'Demo rate limit exceeded. Please try again later.',
            retryAfter: 3600,
            requestId: c.get('requestId'),
            traceId: c.get('traceId'),
        }, 429)
    }

    let body: z.infer<typeof demoStorySchema>
    try {
        body = demoStorySchema.parse(await c.req.json())
    } catch {
        return c.json({ success: false, error: 'Validation Error', requestId: c.get('requestId'), traceId: c.get('traceId') }, 400)
    }

    const prompt = services.promptService.getStoryPrompt({
        theme: body.theme,
        childName: body.childName,
        childAge: body.childAge,
        style: 'bedtime',
        duration: 'short',
        forStreaming: false,
    })

    const generated = await services.aiService.generateStory({
        theme: body.theme,
        childName: body.childName,
        childAge: body.childAge,
        style: 'bedtime',
        duration: 'short',
        customPrompt: prompt,
        traceId: c.get('traceId'),
    })

    return c.json({
        success: true,
        data: {
            title: generated.title,
            content: generated.content,
        },
        requestId: c.get('requestId'),
        traceId: c.get('traceId'),
    })
})
