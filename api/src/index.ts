import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { healthRoute } from './routes/health'
import { storyRoute } from './routes/story'
// import { uploadRoute } from './routes/upload' // Commented out until verified
import { conversationRoute } from './routes/conversation'
import { suggestionsRoute } from './routes/suggestions'
import { shareRoute } from './routes/share'
import { diMiddleware } from './middleware/di'
import { performanceMiddleware } from './middleware/performance'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { ServiceContainer } from './di/container'

type Env = {
    Variables: {
        services: ServiceContainer
    }
}

const app = new Hono<Env>()

// Dynamic CORS origins from environment (BFF-ready)
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
]

// Middleware
app.use('*', logger())
app.use('*', cors({
    origin: allowedOrigins,
    credentials: true,
}))
app.use('*', diMiddleware)
app.use('*', performanceMiddleware)
app.use('/api/*', rateLimitMiddleware)

// API v1 Routes (versioned for BFF compatibility)
app.route('/api/v1/health', healthRoute)
app.route('/api/v1/stories', storyRoute)
// app.route('/api/v1/upload', uploadRoute)
app.route('/api/v1/conversations', conversationRoute)
app.route('/api/v1/suggestions', suggestionsRoute)
app.route('/api/v1/share', shareRoute)

// Legacy routes (deprecated, redirect in future)
app.route('/api/health', healthRoute)
// app.route('/api/user', userRoute)

// Root
app.get('/', (c) => {
    return c.json({
        name: 'DreamWeaver API',
        version: '0.2.0',
        status: 'running',
        endpoints: {
            v1: '/api/v1',
            health: '/api/v1/health',
            stories: '/api/v1/stories',
        }
    })
})

// Start server (for local dev)
const port = parseInt(process.env.PORT || '3001')
console.log(`🚀 DreamWeaver API running on http://localhost:${port}`)

export default {
    port,
    fetch: app.fetch,
}

