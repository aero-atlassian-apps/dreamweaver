import { createMiddleware } from 'hono/factory'
import { ServiceContainer } from '../di/container'

/**
 * performanceMiddleware - Tracks request latency and logs slow responses.
 * 
 * In an agentic PWA, perceived performance is critical.
 * We track latency and log warnings if visual-path APIs exceed 100ms.
 */
export const performanceMiddleware = createMiddleware<{ Variables: { services: ServiceContainer; user?: { id: string } } }>(async (c, next) => {
    const start = Date.now()
    const url = c.req.url
    const method = c.req.method

    await next()

    const duration = Date.now() - start
    const logger = c.get('services').logger
    // @ts-ignore - Intersection types in c.get can be tricky
    const user = c.get('user')

    const metadata = {
        method,
        url,
        durationMs: duration,
        userId: user?.id,
        status: c.res.status
    }

    if (duration > 1000) {
        logger.warn(`🐌 High Latency Request (${duration}ms)`, metadata)
    } else if (duration > 100) {
        // Log as info for visibility, could be optimized
        logger.info(`Request processed`, metadata)
    } else {
        logger.debug(`Fast Request`, metadata)
    }

    // Add X-Response-Time header for client-side observability
    c.res.headers.set('X-Response-Time', `${duration}ms`)
})
