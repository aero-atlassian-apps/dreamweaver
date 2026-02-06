import { Hono } from 'hono'

export const healthRoute = new Hono()

healthRoute.get('/', (c) => {
    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
})

healthRoute.get('/ready', (c) => {
    const isProd = process.env['NODE_ENV'] === 'production'
    const voiceCloningEnabled = process.env['VOICE_CLONING_ENABLED'] === 'true'

    const checks = [
        { name: 'SUPABASE_URL', ok: !!process.env['SUPABASE_URL'], required: isProd },
        { name: 'SUPABASE_ANON_KEY', ok: !!process.env['SUPABASE_ANON_KEY'], required: isProd },
        { name: 'SUPABASE_SERVICE_ROLE_KEY', ok: !!(process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY']), required: isProd },
        { name: 'GEMINI_API_KEY', ok: !!process.env['GEMINI_API_KEY'], required: isProd },
        { name: 'REDIS_URL', ok: !!process.env['REDIS_URL'], required: isProd },
        { name: 'UPSTASH_REDIS_REST_URL', ok: !!process.env['UPSTASH_REDIS_REST_URL'], required: isProd },
        { name: 'UPSTASH_REDIS_REST_TOKEN', ok: !!process.env['UPSTASH_REDIS_REST_TOKEN'], required: isProd },
        { name: 'WS_WORKER_INTERNAL_TOKEN', ok: !!process.env['WS_WORKER_INTERNAL_TOKEN'], required: isProd },
        { name: 'GOOGLE_TTS_API_KEY', ok: !!process.env['GOOGLE_TTS_API_KEY'], required: isProd },
        { name: 'HUGGINGFACE_API_KEY', ok: !voiceCloningEnabled || !!process.env['HUGGINGFACE_API_KEY'], required: isProd && voiceCloningEnabled },
    ]

    const missingRequired = checks.filter((c) => c.required && !c.ok)
    const ready = missingRequired.length === 0

    return c.json({
        status: ready ? 'ready' : 'not_ready',
        nodeEnv: process.env['NODE_ENV'] || 'development',
        voiceCloningEnabled,
        timestamp: new Date().toISOString(),
        checks,
    }, ready ? 200 : 503)
})
