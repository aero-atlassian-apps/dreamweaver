/**
 * Story API Route - BFF endpoint for story generation
 * 
 * This route enables mobile apps and other clients to generate stories
 * server-side without needing direct access to AI providers.
 * 
 * Uses the application-layer GenerateStoryUseCase via request-scoped DI.
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { streamText } from 'hono/streaming'
import type { ApiEnv } from '../http/ApiEnv.js'

export const storyRoute = new Hono<ApiEnv>()

const generateStorySchema = z.object({
    theme: z.string().min(1, "Theme is required").max(100),
    childName: z.string().optional(),
    childAge: z.number().min(0).max(18).optional(),
    duration: z.enum(['short', 'medium', 'long']).optional().default('medium'),
    previousStoryId: z.string().min(1).optional(),
    requestId: z.string().min(1).optional(),
})

// POST /api/v1/stories/generate - Generate a new story
storyRoute.post('/generate', authMiddleware, async (c) => {
    let body;
    try {
        const json = await c.req.json();
        body = generateStorySchema.parse(json);
    } catch (e) {
        return c.json({ success: false, error: e instanceof Error ? e.message : 'Validation Error' }, 400);
    }

    try {
        // Get user from context (safe due to middleware)
        const user = c.get('user')!
        const services = c.get('services')
        const useCase = services.generateStoryUseCase

        // Use unified token from middleware context
        const token = c.get('accessToken')

        // Execute Use Case
        const result = await useCase.execute({
            theme: body.theme,
            childName: body.childName,
            childAge: body.childAge,
            duration: body.duration,
            previousStoryId: body.previousStoryId,
            requestId: body.requestId,
            traceId: c.get('traceId'),
            userId: user.id,
            accessToken: token, // [SEC-02] Pass token to Use Case -> Agent -> Memory
        })

        return c.json({
            success: true,
            data: {
                id: result.story.id,
                title: result.story.title,
                theme: result.story.theme,
                content: result.story.content, // includes paragraphs
                estimatedReadingTime: result.estimatedReadingTime,
                createdAt: result.story.createdAt.toISOString(),
                audioUrl: result.audioUrl, // Include generated audio
                newlyUnlockedCompanions: result.newlyUnlockedCompanions,
            }
        })

    } catch (error) {
        console.error('Story generation failed:', error)
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Story generation failed'
        }, 500)
    }
})

// POST /api/v1/stories/generate/stream - Stream a new story
storyRoute.post('/generate/stream', authMiddleware, async (c) => {
    let body;
    try {
        const json = await c.req.json();
        body = generateStorySchema.parse(json);
    } catch (e) {
        return c.json({ success: false, error: 'Validation Error' }, 400);
    }

    return streamText(c, async (stream) => {
        const user = c.get('user')!
        const services = c.get('services')
        const useCase = services.generateStoryUseCase
        const token = c.get('accessToken')

        const result = await useCase.execute({
            theme: body.theme,
            childName: body.childName,
            childAge: body.childAge,
            duration: body.duration,
            previousStoryId: body.previousStoryId,
            requestId: body.requestId,
            traceId: c.get('traceId'),
            userId: user.id,
            accessToken: token,
        })

        await stream.write(`${result.story.title}\n\n`)
        for (const paragraph of result.story.content.paragraphs) {
            await stream.write(`${paragraph}\n\n`)
        }
    })
})

// GET /api/v1/stories - List user's stories
storyRoute.get('/', authMiddleware, async (c) => {
    try {
        const user = c.get('user')!
        const userId = user.id
        const limit = parseInt(c.req.query('limit') || '20', 10)

        // Retrieve dependencies from DI container
        const getHistoryUseCase = c.get('services').getStoryHistoryUseCase

        const { stories, total } = await getHistoryUseCase.execute({ userId, limit })

        const formattedStories = stories.map(story => ({
            id: story.id,
            title: story.title,
            theme: story.theme,
            status: story.status,
            estimatedReadingTime: story.getEstimatedReadingTime(),
            createdAt: story.createdAt.toISOString(),
            generatedAt: story.generatedAt?.toISOString() ?? null,
        }))

        return c.json({
            success: true,
            data: {
                stories: formattedStories,
                total,
                limit
            }
        })
    } catch (error) {
        console.error('Fetch stories failed:', error)
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch stories'
        }, 500)
    }
})

// GET /api/v1/stories/:id - Get story by ID
storyRoute.get('/:id', authMiddleware, async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')!

    try {
        const getStoryUseCase = c.get('services').getStoryUseCase
        const { story } = await getStoryUseCase.execute({
            userId: user.id,
            storyId: id
        })

        return c.json({
            success: true,
            data: {
                id: story.id,
                title: story.title,
                theme: story.theme,
                content: story.content, // Returns objects (paragraphs)
                status: story.status,
                estimatedReadingTime: story.getEstimatedReadingTime(),
                createdAt: story.createdAt.toISOString(),
                generatedAt: story.generatedAt?.toISOString() ?? null,
                audioUrl: story.audioUrl,
            }
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message === 'Story not found') {
            return c.json({ success: false, error: 'Story not found' }, 404)
        }
        if (message.startsWith('Unauthorized')) {
            return c.json({ success: false, error: 'Unauthorized' }, 403)
        }

        console.error('Get story details failed:', error)
        return c.json({
            success: false,
            error: 'Failed to retrieve story'
        }, 500)
    }
})
