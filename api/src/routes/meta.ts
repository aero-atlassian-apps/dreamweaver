import { Hono } from 'hono'
import type { ApiEnv } from '../http/ApiEnv.js'

export const metaRoute = new Hono<ApiEnv>()

metaRoute.get('/gemini-models', async (c) => {
    const base = process.env['GEMINI_MODEL'] || 'gemini-3-flash-preview'
    const flashModel = process.env['GEMINI_MODEL_FLASH'] || base
    const proModel = process.env['GEMINI_MODEL_PRO'] || base
    const liveModel = process.env['GEMINI_LIVE_MODEL'] || 'models/gemini-live-2.5-flash-native-audio'

    return c.json({
        success: true,
        data: {
            flashModel,
            proModel,
            liveModel,
        },
        requestId: c.get('requestId'),
        traceId: c.get('traceId'),
    })
})

