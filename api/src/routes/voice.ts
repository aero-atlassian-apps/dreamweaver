/**
 * Voice API Routes
 */

import { Hono } from 'hono'
import { UploadVoiceUseCase } from '../application/use-cases/UploadVoiceUseCase'
import { SupabaseVoiceRepository } from '../infrastructure/SupabaseVoiceRepository'
import { SupabaseFileStorageAdapter } from '../infrastructure/SupabaseFileStorageAdapter'

export const voiceRoute = new Hono()

const voiceRepository = new SupabaseVoiceRepository()
const fileStorage = new SupabaseFileStorageAdapter()
const uploadVoice = new UploadVoiceUseCase(voiceRepository, fileStorage)

// POST /upload
voiceRoute.post('/upload', async (c) => {
    try {
        const body = await c.req.parseBody()
        const file = body['file']
        const userId = 'user_mvp_placeholder' // TODO: from Auth
        const name = body['name'] as string || 'My Voice'

        if (!file || !(file instanceof File)) {
            return c.json({ success: false, error: 'File is required' }, 400)
        }

        const arrayBuffer = await file.arrayBuffer()

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
