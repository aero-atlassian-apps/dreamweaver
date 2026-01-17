import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { healthRoute } from './routes/health'
import { userRoute } from './routes/user'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}))

// Routes
app.route('/api/health', healthRoute)
app.route('/api/user', userRoute)

// Root
app.get('/', (c) => {
    return c.json({
        name: 'DreamWeaver API',
        version: '1.0.0',
        status: 'running'
    })
})

// Start server (for local dev)
const port = parseInt(process.env.PORT || '3001')
console.log(`🚀 DreamWeaver API running on http://localhost:${port}`)

export default {
    port,
    fetch: app.fetch,
}
