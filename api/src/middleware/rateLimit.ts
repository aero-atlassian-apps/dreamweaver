import { createMiddleware } from 'hono/factory'
import { ServiceContainer } from '../di/container'

/**
 * RateLimitMiddleware - Simple IP-based rate limiting.
 * 
 * Prevents automated token scraping and protects AI costs.
 * 
 * Future: Move state to Redis for distributed serverless environments.
 */
const IP_REQUESTS = new Map<string, { count: number; windowStart: number }>()
const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 30 // 30 requests per minute

export const rateLimitMiddleware = createMiddleware<{ Variables: { services: ServiceContainer } }>(async (c, next) => {
    // In Vercel/proxied environments, we need to check headers for real IP
    const clientIp = c.req.header('x-forwarded-for') || 'unknown'
    const now = Date.now()

    const record = IP_REQUESTS.get(clientIp) || { count: 0, windowStart: now }

    // Reset window if expired
    if (now - record.windowStart > WINDOW_MS) {
        record.count = 0
        record.windowStart = now
    }

    record.count++
    IP_REQUESTS.set(clientIp, record)

    if (record.count > MAX_REQUESTS) {
        c.get('services').logger.warn('Rate limit exceeded', { ip: clientIp, count: record.count })
        return c.json({
            success: false,
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((record.windowStart + WINDOW_MS - now) / 1000)
        }, 429)
    }

    await next()
})
