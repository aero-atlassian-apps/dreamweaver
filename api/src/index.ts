import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { healthRoute } from './routes/health'
import { userRoute } from './routes/user'
import { storyRoute } from './routes/story'

const app = new Hono()

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

// API v1 Routes (versioned for BFF compatibility)
app.route('/api/v1/health', healthRoute)
app.route('/api/v1/user', userRoute)
app.route('/api/v1/stories', storyRoute)

// Legacy routes (deprecated, redirect in future)
app.route('/api/health', healthRoute)
app.route('/api/user', userRoute)

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

