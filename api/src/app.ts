import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { ApiEnv } from './http/ApiEnv.js'
import { healthRoute } from './routes/health.js'
import { storyRoute } from './routes/story.js'
import { conversationRoute } from './routes/conversation.js'
import { suggestionsRoute } from './routes/suggestions.js'
import { shareRoute } from './routes/share.js'
import { cronRoute } from './routes/cron.js'
import { diMiddleware } from './middleware/di.js'
import { performanceMiddleware } from './middleware/performance.js'
import { rateLimitMiddleware } from './middleware/rateLimit.js'
import { tracingMiddleware } from './middleware/tracing.js'
import { liveRoute } from './routes/live.js'
import { familyRoute } from './routes/family.js'
import { momentsRoute } from './routes/moments.js'
import { docsRoute } from './routes/docs.js'
import { authRoute } from './routes/auth.js'
import { userRoute } from './routes/user.js'
import { voiceRoute } from './routes/voice.js'
import { feedbackRoute } from './routes/feedback.js'
import { metaRoute } from './routes/meta.js'
import { demoRoute } from './routes/demo.js'
import { companionsRoute } from './routes/companions.js'
import { setupTracing } from './infrastructure/observability/tracing.js'

export function getAllowedOrigins(): string[] {
    const raw = process.env['ALLOWED_ORIGINS']
    if (raw) {
        const parsed = raw.split(',').map((o) => o.trim()).filter(Boolean)
        if (parsed.length > 0) return parsed
    }
    return [
        'http://localhost:5173',
        'http://localhost:3000',
    ]
}

export function assertRequiredEnvForProd(): void {
    if (process.env['NODE_ENV'] !== 'production') return

    const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL']
    const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] || process.env['VITE_SUPABASE_ANON_KEY']
    const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY']
    const wsWorkerInternalToken = process.env['WS_WORKER_INTERNAL_TOKEN']

    const missing: string[] = []
    if (!supabaseUrl) missing.push('SUPABASE_URL')
    if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY')
    if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    if (!wsWorkerInternalToken) missing.push('WS_WORKER_INTERNAL_TOKEN')

    const useMockAi = process.env['USE_MOCK_AI'] === 'true'
    if (!useMockAi && !process.env['GEMINI_API_KEY']) missing.push('GEMINI_API_KEY')

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
}

export function createApp(): Hono<ApiEnv> {
    assertRequiredEnvForProd()
    setupTracing()

    const app = new Hono<ApiEnv>()
    const allowedOrigins = getAllowedOrigins()

    app.use('*', tracingMiddleware)
    app.use('*', logger())
    app.use('*', cors({
        origin: allowedOrigins,
        credentials: true,
    }))
    app.use('*', diMiddleware)
    app.use('*', performanceMiddleware)
    app.use('/api/*', rateLimitMiddleware)

    app.onError((err, c) => {
        const requestId = c.get('requestId')
        const traceId = c.get('traceId')
        const loggerInstance = c.get('services')?.logger
        if (loggerInstance) {
            loggerInstance.error('Unhandled error', err instanceof Error ? err : undefined)
        } else {
            console.error('Unhandled error', err)
        }
        return c.json({ success: false, error: 'Internal Server Error', requestId, traceId }, 500)
    })

    app.notFound((c) => {
        const requestId = c.get('requestId')
        const traceId = c.get('traceId')
        return c.json({ success: false, error: 'Not Found', requestId, traceId }, 404)
    })

    app.get('/api/v1/live/ws', (c) => c.json({ success: false, error: 'WebSocket endpoint. Use ws(s)://', requestId: c.get('requestId'), traceId: c.get('traceId') }, 426))
    app.get('/api/v1/events/ws', (c) => c.json({ success: false, error: 'WebSocket endpoint. Use ws(s)://', requestId: c.get('requestId'), traceId: c.get('traceId') }, 426))

    app.route('/api/v1/health', healthRoute)
    app.route('/api/v1/stories', storyRoute)
    app.route('/api/v1/conversations', conversationRoute)
    app.route('/api/v1/suggestions', suggestionsRoute)
    app.route('/api/v1/share', shareRoute)
    app.route('/api/v1/live', liveRoute)
    app.route('/api/v1/family', familyRoute)
    app.route('/api/v1/moments', momentsRoute)
    app.route('/api/v1/auth', authRoute)
    app.route('/api/v1/user', userRoute)
    app.route('/api/v1/voice', voiceRoute)
    app.route('/api/v1/feedback', feedbackRoute)
    app.route('/api/v1/meta', metaRoute)
    app.route('/api/v1/demo', demoRoute)
    app.route('/api/v1/companions', companionsRoute)

    const webV1 = new Hono<ApiEnv>()
    webV1.route('/health', healthRoute)
    webV1.route('/stories', storyRoute)
    webV1.route('/conversations', conversationRoute)
    webV1.route('/suggestions', suggestionsRoute)
    webV1.route('/share', shareRoute)
    webV1.route('/live', liveRoute)
    webV1.route('/family', familyRoute)
    webV1.route('/moments', momentsRoute)
    webV1.route('/voice', voiceRoute)
    webV1.route('/companions', companionsRoute)
    app.route('/api/web/v1', webV1)

    const mobileV1 = new Hono<ApiEnv>()
    mobileV1.route('/health', healthRoute)
    mobileV1.route('/stories', storyRoute)
    mobileV1.route('/conversations', conversationRoute)
    mobileV1.route('/suggestions', suggestionsRoute)
    mobileV1.route('/share', shareRoute)
    mobileV1.route('/family', familyRoute)
    mobileV1.route('/moments', momentsRoute)
    mobileV1.route('/voice', voiceRoute)
    mobileV1.route('/companions', companionsRoute)
    app.route('/api/mobile/v1', mobileV1)

    app.route('/api/cron', cronRoute)
    app.route('/api/docs', docsRoute)
    app.route('/api/health', healthRoute)

    app.get('/', (c) => c.json({
        name: 'DreamWeaver API',
        version: '0.2.0',
        status: 'running',
        endpoints: {
            v1: '/api/v1',
            health: '/api/v1/health',
            stories: '/api/v1/stories',
        },
    }))

    return app
}
