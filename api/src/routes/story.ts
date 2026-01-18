/**
 * Story API Route - BFF endpoint for story generation
 * 
 * This route enables mobile apps and other clients to generate stories
 * server-side without needing direct access to AI providers.
 * 
 * Note: Uses inline mock implementation for MVP.
 * Will be replaced with proper AI gateway when backend Clean Architecture is set up.
 */

import { Hono } from 'hono'

export const storyRoute = new Hono()

interface GenerateStoryBody {
    theme: string
    childName?: string
    childAge?: number
    duration?: 'short' | 'medium' | 'long'
}

interface StoryResponse {
    id: string
    title: string
    theme: string
    content: {
        paragraphs: string[]
        sleepScore: number
    }
    estimatedReadingTime: number
    createdAt: string
}

// Mock stories for MVP (mirrors frontend GeminiAIGateway)
const MOCK_STORIES: Record<string, { title: string; content: string; sleepScore: number }> = {
    'space': {
        title: 'The Star Shepherd',
        content: `Once upon a time, in a galaxy far beyond our own, there lived a young star shepherd named Nova. Every night, Nova would float among the twinkling stars, making sure each one shone brightly for the children on Earth below.

One evening, Nova noticed a small star that was flickering sadly. "What's wrong, little star?" Nova asked gently.

"I feel too small to make a difference," the tiny star whispered. "The other stars are so much bigger and brighter than me."

Nova smiled warmly and wrapped the little star in a cosmic hug. "Every star matters," Nova said. "Even the smallest light can guide someone home."

That night, the little star shone with all its might. And far below on Earth, a lost kitten followed its gentle glow all the way back to its cozy home.

The end.`,
        sleepScore: 9,
    },
    'animals': {
        title: 'The Sleepy Forest Friends',
        content: `In a cozy corner of the Whispering Woods, the forest animals were preparing for bedtime. Owl hooted softly from her tree, "Time to sleep, everyone!"

Little Rabbit yawned widely, his fuzzy ears drooping with tiredness. Deer curled up beneath the old oak tree. And Bear found the softest patch of moss for his bed.

"Wait!" squeaked a tiny voice. It was Mouse, too excited to sleep. "I want just one more adventure!"

The wise old Owl flew down gently. "Even adventurers need rest," she said. "The best adventures come to those who dream deeply."

Mouse thought about this. "But what if I miss something wonderful?"

Owl smiled. "Close your eyes, and I'll tell you a secret. The most wonderful things happen in your dreams."

Goodnight, little one.`,
        sleepScore: 10,
    },
    'default': {
        title: 'The Bedtime Garden',
        content: `In a hidden corner behind the moonflowers, there was a very special garden. This garden only bloomed at bedtime.

Every night, as children around the world closed their eyes, the Bedtime Garden came alive with magic.

Sleepy lavender flowers yawned open, releasing peaceful scents. Lullaby lilies swayed gently, singing soft songs only dreamers could hear.

The Garden Keeper, a gentle old toad named Theodore, tended to each plant with care. "Another beautiful night," he croaked contentedly.

Sweet dreams.`,
        sleepScore: 9,
    }
}

function generateStoryId(): string {
    return `story_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function getWordCount(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length
}

function getEstimatedReadingTime(wordCount: number): number {
    const wordsPerMinute = 150
    return Math.ceil(wordCount / wordsPerMinute)
}

// POST /api/v1/stories/generate - Generate a new story
storyRoute.post('/generate', async (c) => {
    try {
        const body = await c.req.json<GenerateStoryBody>()

        // Validate required fields
        if (!body.theme || body.theme.trim().length === 0) {
            return c.json({ success: false, error: 'Theme is required' }, 400)
        }

        // Validate child age if provided
        if (body.childAge !== undefined && (body.childAge < 2 || body.childAge > 12)) {
            return c.json({ success: false, error: 'Child age must be between 2 and 12' }, 400)
        }

        // Get mock story (TODO: Replace with real AI call when GEMINI_API_KEY is set)
        const normalizedTheme = body.theme.toLowerCase()
        const mockStory = MOCK_STORIES[normalizedTheme] ?? MOCK_STORIES['default']

        const paragraphs = mockStory.content
            .split(/\n\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0)

        const wordCount = getWordCount(mockStory.content)
        const storyId = generateStoryId()

        const response: StoryResponse = {
            id: storyId,
            title: mockStory.title,
            theme: body.theme,
            content: {
                paragraphs,
                sleepScore: mockStory.sleepScore,
            },
            estimatedReadingTime: getEstimatedReadingTime(wordCount),
            createdAt: new Date().toISOString(),
        }

        return c.json({ success: true, data: response })
    } catch (error) {
        console.error('Story generation failed:', error)
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Story generation failed'
        }, 500)
    }
})

// GET /api/v1/stories - List user's stories
storyRoute.get('/', async (c) => {
    try {
        // Import needed classes
        const { SupabaseStoryRepository } = await import('../infrastructure/SupabaseStoryRepository')
        const { GetStoryHistoryUseCase } = await import('../application/use-cases/GetStoryHistoryUseCase')

        // TODO: Get userId from Auth middleware
        const userId = 'user_mvp_placeholder'
        const limit = parseInt(c.req.query('limit') || '20', 10)

        const storyRepository = new SupabaseStoryRepository()
        const getHistoryUseCase = new GetStoryHistoryUseCase(storyRepository)

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

// GET /api/v1/stories/:id - Get story by ID (placeholder for future)
storyRoute.get('/:id', async (c) => {
    const id = c.req.param('id')

    // TODO: Implement when StoryRepository is added
    return c.json({
        success: false,
        error: 'Not implemented',
        message: `Story ${id} retrieval requires persistence layer`
    }, 501)
})
