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
        console.log('[Demo] Step 1: Parsing body...')

        // Add 3s timeout to body parsing - Vercel sometimes doesn't send body stream correctly
        const bodyPromise = c.req.json()
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Body parsing timeout')), 3000)
        )

        let rawBody: unknown
        try {
            rawBody = await Promise.race([bodyPromise, timeoutPromise])
            console.log('[Demo] Step 1.1: Raw body received')
        } catch (parseErr: any) {
            console.warn('[Demo] Body parsing failed:', parseErr.message, '- using defaults')
            rawBody = { theme: 'space' } // Default theme
        }

        body = demoStorySchema.parse(rawBody)
        console.log('[Demo] Step 2: Body parsed:', body.theme)
    } catch (err: any) {
        console.error('[Demo] Validation error:', err.message)
        return c.json({ success: false, error: 'Validation Error', requestId: c.get('requestId'), traceId: c.get('traceId') }, 400)
    }

    // Direct Gemini call bypassing cache/circuit breaker for demo reliability
    console.log('[Demo] Step 3: Checking API key...')
    const apiKey = process.env['GEMINI_API_KEY']
    if (!apiKey) {
        console.error('[Demo] FATAL: No GEMINI_API_KEY')
        return c.json({ success: false, error: 'AI service not configured', requestId: c.get('requestId'), traceId: c.get('traceId') }, 500)
    }
    console.log('[Demo] Step 4: API key present, length:', apiKey.length)

    console.log('[Demo] Step 5: Creating Gemini client...')
    const client = new GoogleGenerativeAI(apiKey)

    console.log('[Demo] Step 6: Getting model...')
    const modelName = process.env['GEMINI_MODEL_FLASH'] || 'gemini-2.0-flash'
    console.log('[Demo] Step 7: Model name:', modelName)

    const model = client.getGenerativeModel({
        model: modelName,
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
    console.log('[Demo] Step 8: Model created')

    const shortPrompt = `Write a very short bedtime story (80 words max).
Theme: ${body.theme}
Child name: ${body.childName || 'a child'}
Style: calm, soothing
Return JSON with title and content.`

    try {
        console.log('[Demo] Step 9: Starting Gemini call...')

        // Simple timeout using Promise.race
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                console.log('[Demo] TIMEOUT: 8s exceeded!')
                reject(new Error('Demo generation timeout (8s)'))
            }, 8000)
        })

        const result = await Promise.race([
            model.generateContent(shortPrompt),
            timeoutPromise
        ])

        console.log('[Demo] Step 10: Gemini call completed')
        const text = result.response.text()
        console.log('[Demo] Step 11: Response text length:', text.length)
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
        console.error('[Demo] ERROR:', error.message)
        return c.json({
            success: false,
            error: error.message || 'Story generation failed',
            requestId: c.get('requestId'),
            traceId: c.get('traceId'),
        }, 500)
    }
})
