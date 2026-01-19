/**
 * Voice API Routes
 */

import { Hono } from 'hono'
import { authMiddleware, Variables as AuthVariables } from '../middleware/auth'
import { ServiceContainer } from '../di/container'

type Variables = AuthVariables & {
    services: ServiceContainer
}

export const voiceRoute = new Hono<{ Variables: Variables }>()

voiceRoute.use('*', authMiddleware)

// POST /upload
voiceRoute.post('/upload', async (c) => {
    try {
        const body = await c.req.parseBody()
        const file = body['file']

        // Safe access due to middleware
        const user = c.get('user')
        const userId = user.id

        const name = body['name'] as string || 'My Voice'

        if (!file || !(file instanceof File)) {
            return c.json({ success: false, error: 'File is required' }, 400)
        }

        const arrayBuffer = await file.arrayBuffer()

        const uploadVoice = c.get('services').uploadVoiceUseCase

        const { profile } = await uploadVoice.execute({
            userId,
            name,
            audioData: arrayBuffer,
            mimeType: file.type
        })

        return c.json({ success: true, data: profile })

    } catch (error) {
        console.error('Voice upload failed:', error)
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        }, 500)
    }
})
