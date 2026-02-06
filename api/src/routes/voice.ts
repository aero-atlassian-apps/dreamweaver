/**
 * Voice API Routes
 */

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'

import type { ApiEnv } from '../http/ApiEnv.js'

export const voiceRoute = new Hono<ApiEnv>()

voiceRoute.use('*', authMiddleware)

const allowedMimeTypes = new Set([
    'audio/wav',
    'audio/mpeg',
    'audio/webm',
    'audio/x-m4a',
])

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const isFileLike = (value: unknown): value is { size: number; type: string; arrayBuffer: () => Promise<ArrayBuffer> } => {
    if (!value || typeof value !== 'object') return false
    const v = value as { size?: unknown; type?: unknown; arrayBuffer?: unknown }
    return typeof v.size === 'number' && typeof v.type === 'string' && typeof v.arrayBuffer === 'function'
}

voiceRoute.get('/', async (c) => {
    try {
        const user = c.get('user')!
        const profiles = await c.get('services').voiceRepository.findByUserId(user.id)
        return c.json({ success: true, data: profiles.map((p) => p.toJSON()) })
    } catch (error) {
        console.error('Voice profile list failed:', error)
        return c.json({ success: false, error: 'Failed to load voice profiles' }, 500)
    }
})

voiceRoute.get('/:id', async (c) => {
    try {
        const user = c.get('user')!
        const id = c.req.param('id')
        const profile = await c.get('services').voiceRepository.findById(id)
        if (!profile) return c.json({ success: false, error: 'Not Found' }, 404)
        if (profile.userId !== user.id) return c.json({ success: false, error: 'Forbidden' }, 403)
        return c.json({ success: true, data: profile.toJSON() })
    } catch (error) {
        console.error('Voice profile get failed:', error)
        return c.json({ success: false, error: 'Failed to load voice profile' }, 500)
    }
})

// POST /upload
voiceRoute.post('/upload', async (c) => {
    try {
        let name = 'My Voice'
        let mimeType = ''
        let audioData: ArrayBuffer | null = null
        let sizeBytes = 0

        const requestContentType = c.req.header('content-type') || ''

        if (requestContentType.includes('application/json')) {
            const body = await c.req.json().catch(() => null) as null | { name?: unknown; mimeType?: unknown; dataBase64?: unknown }
            name = (typeof body?.name === 'string' ? body.name : 'My Voice').trim() || 'My Voice'
            mimeType = typeof body?.mimeType === 'string' ? body.mimeType : ''
            const dataBase64 = typeof body?.dataBase64 === 'string' ? body.dataBase64 : ''
            if (!mimeType || !dataBase64) {
                return c.json({ success: false, error: 'Invalid upload body' }, 400)
            }
            const buf = Buffer.from(dataBase64, 'base64')
            sizeBytes = buf.byteLength
            audioData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
        } else {
            let file: unknown = null

            try {
                const body = await c.req.formData()
                file = body.get('file')
                name = (body.get('name')?.toString() || 'My Voice').trim() || 'My Voice'
            } catch {
                const body = await c.req.parseBody()
                file = (body as any)['file']
                name = (String((body as any)['name'] || 'My Voice')).trim() || 'My Voice'
            }

            if (!isFileLike(file)) {
                return c.json({ success: false, error: 'File is required' }, 400)
            }

            mimeType = file.type
            sizeBytes = file.size
            audioData = await file.arrayBuffer()
        }

        // Safe access due to middleware
        const user = c.get('user')!
        const userId = user.id

        if (sizeBytes > MAX_UPLOAD_BYTES) {
            return c.json({ success: false, error: 'File too large' }, 413)
        }

        if (!allowedMimeTypes.has(mimeType)) {
            return c.json({ success: false, error: 'Unsupported file type' }, 415)
        }

        if (!audioData) {
            return c.json({ success: false, error: 'File is required' }, 400)
        }

        const uploadVoice = c.get('services').uploadVoiceUseCase

        const { profile } = await uploadVoice.execute({
            userId,
            name,
            audioData,
            mimeType
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

// POST /select (Standard Persona)
voiceRoute.post('/select', async (c) => {
    try {
        const body = await c.req.json()
        const user = c.get('user')!

        if (!body.voiceModelId || !body.name) {
            return c.json({ success: false, error: 'Missing voiceModelId or name' }, 400)
        }

        const selectVoice = c.get('services').selectVoiceUseCase
        const { profile } = await selectVoice.execute({
            userId: user.id,
            name: body.name,
            voiceModelId: body.voiceModelId
        })

        return c.json({ success: true, data: profile.toJSON() })
    } catch (error) {
        console.error('Voice select failed:', error)
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Selection failed'
        }, 500)
    }
})
