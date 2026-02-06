import { Hono } from 'hono'
import { z } from 'zod'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
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

    // Rate limit with timeout to avoid hanging
    try {
        const rateKey = `demo:story:${clientIp}`
        const countPromise = services.cache.increment(rateKey, 60 * 60)
        const count = await Promise.race([
            countPromise,
            new Promise<number>((_, reject) => setTimeout(() => reject(new Error('Rate limit timeout')), 3000))
        ])
        if (count > 10) {
            return c.json({
                success: false,
                error: 'Demo rate limit exceeded. Please try again later.',
                retryAfter: 3600,
                requestId: c.get('requestId'),
                traceId: c.get('traceId'),
            }, 429)
        }
    } catch (rateLimitError) {
        // If rate limit check times out, allow the request (fail open for demo)
        console.warn('[Demo] Rate limit check failed, allowing request:', rateLimitError)
    }

    let body: z.infer<typeof demoStorySchema>
    try {
        body = demoStorySchema.parse(await c.req.json())
    } catch {
        return c.json({ success: false, error: 'Validation Error', requestId: c.get('requestId'), traceId: c.get('traceId') }, 400)
    }

    // Direct Gemini call bypassing cache/circuit breaker for demo reliability
    const apiKey = process.env['GEMINI_API_KEY']
    if (!apiKey) {
        return c.json({ success: false, error: 'AI service not configured', requestId: c.get('requestId'), traceId: c.get('traceId') }, 500)
    }

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({
        model: process.env['GEMINI_MODEL_FLASH'] || 'gemini-2.0-flash',
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    content: { type: SchemaType.STRING },
                },
                required: ['title', 'content']
            }
        }
    })

    const shortPrompt = `Write a very short bedtime story (80 words max).
Theme: ${body.theme}
Child name: ${body.childName || 'a child'}
Style: calm, soothing
Return JSON with title and content.`

    try {
        // 8 second timeout for demo
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        const result = await Promise.race([
            model.generateContent(shortPrompt),
            new Promise<never>((_, reject) => {
                controller.signal.addEventListener('abort', () => reject(new Error('Demo timeout')))
            })
        ])
        clearTimeout(timeoutId)

        const text = result.response.text()
        const data = JSON.parse(text)

        return c.json({
            success: true,
            data: {
                title: data.title,
                content: data.content,
            },
            requestId: c.get('requestId'),
            traceId: c.get('traceId'),
        })
    } catch (error: any) {
        console.error('[Demo] Story generation failed:', error.message)
        return c.json({
            success: false,
            error: error.message || 'Story generation failed',
            requestId: c.get('requestId'),
            traceId: c.get('traceId'),
        }, 500)
    }
})

