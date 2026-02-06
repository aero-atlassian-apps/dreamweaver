import { createMiddleware } from 'hono/factory'
import { ServiceContainer } from '../di/container.js'

/**
 * RateLimitMiddleware - IP-based rate limiting with pluggable storage.
 * 
 * Prevents automated token scraping and protects AI costs.
 * 
 * Supports:
 * - In-memory (development/single instance)
 * - Upstash Redis (production/horizontal scaling)
 */

// Configuration
const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 30 // 30 requests per minute

/**
 * RateLimitStore interface for pluggable backends
 */
interface RateLimitStore {
    increment(key: string, windowMs: number): Promise<{ count: number; ttl: number }>
}

/**
 * In-memory rate limit store (development only)
 */
class InMemoryRateLimitStore implements RateLimitStore {
    private requests = new Map<string, { count: number; windowStart: number }>()

    async increment(key: string, windowMs: number): Promise<{ count: number; ttl: number }> {
        const now = Date.now()
        const record = this.requests.get(key) || { count: 0, windowStart: now }

        if (now - record.windowStart > windowMs) {
            record.count = 0
            record.windowStart = now
        }

        record.count++
        this.requests.set(key, record)

        if (this.requests.size > 10_000) {
            for (const [k, v] of this.requests.entries()) {
                if (now - v.windowStart > windowMs * 2) {
                    this.requests.delete(k)
                }
            }
        }

        const ttl = Math.ceil((record.windowStart + windowMs - now) / 1000)
        return { count: record.count, ttl }
    }
}

/**
 * Upstash Redis rate limit store (production)
 * Uses sliding window with atomic increment + expire
 */
class UpstashRateLimitStore implements RateLimitStore {
    private restUrl: string
    private token: string

    constructor(restUrl: string, token: string) {
        this.restUrl = restUrl
        this.token = token
    }

    async increment(key: string, windowMs: number): Promise<{ count: number; ttl: number }> {
        const windowSec = Math.ceil(windowMs / 1000)
        const redisKey = `ratelimit:${key}`

        try {
            const response = await fetch(`${this.restUrl}/pipeline`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([
                    ['INCR', redisKey],
                    ['EXPIRE', redisKey, windowSec.toString(), 'NX']
                ])
            })

            if (!response.ok) {
                const text = await response.text().catch(() => '')
                console.error('[RateLimit] Upstash error:', text)
                const isProd = process.env['NODE_ENV'] === 'production'
                return { count: isProd ? MAX_REQUESTS + 1 : 1, ttl: windowSec }
            }

            const results = await response.json() as { result: number }[]
            const count = results[0]?.result ?? 1

            return { count, ttl: windowSec }
        } catch (err) {
            console.error('[RateLimit] Upstash request failed:', err)
            const isProd = process.env['NODE_ENV'] === 'production'
            return { count: isProd ? MAX_REQUESTS + 1 : 1, ttl: windowSec }
        }
    }
}

// Create store based on environment
let rateLimitStore: RateLimitStore
let storeInitialized = false

/**
 * Fail-fast validation for production rate limiting.
 * In production, Upstash Redis is REQUIRED for horizontal scalability.
 */
function validateRateLimitConfig(): void {
    if (process.env['NODE_ENV'] !== 'production') return

    const upstashUrl = process.env['UPSTASH_REDIS_REST_URL']
    const upstashToken = process.env['UPSTASH_REDIS_REST_TOKEN']
    const bypassCheck = process.env['ALLOW_INMEMORY_RATELIMIT'] === 'true'

    if (!upstashUrl || !upstashToken) {
        if (bypassCheck) {
            console.warn('[RateLimit] ⚠️ PRODUCTION WARNING: In-memory rate limiting enabled via ALLOW_INMEMORY_RATELIMIT. NOT horizontally scalable!')
        } else {
            throw new Error(
                '[RateLimit] FATAL: Production requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for rate limiting. ' +
                'Set ALLOW_INMEMORY_RATELIMIT=true to override (NOT RECOMMENDED for production).'
            )
        }
    }
}

function getStore(): RateLimitStore {
    if (storeInitialized) return rateLimitStore

    // Validate config before initializing
    validateRateLimitConfig()

    const upstashUrl = process.env['UPSTASH_REDIS_REST_URL']
    const upstashToken = process.env['UPSTASH_REDIS_REST_TOKEN']

    if (upstashUrl && upstashToken) {
        console.log('[RateLimit] ✅ Using Upstash Redis for rate limiting (horizontally scalable)')
        rateLimitStore = new UpstashRateLimitStore(upstashUrl, upstashToken)
    } else {
        console.log('[RateLimit] Using in-memory rate limiting (development mode)')
        rateLimitStore = new InMemoryRateLimitStore()
    }

    storeInitialized = true
    return rateLimitStore
}

/**
 * Extract client IP with preference for trusted platform headers.
 * [SEC-03] Hardened: Prefers platform-specific headers over spoofable x-forwarded-for.
 */
export function extractClientIp(headers: {
    get: (name: string) => string | undefined
}): string {
    // 1. Vercel's trusted header (set by platform, not spoofable)
    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp;

    // 2. Cloudflare's trusted header (set by CF, not spoofable behind CF)
    const cfIp = headers.get('cf-connecting-ip');
    if (cfIp) return cfIp;

    // 3. Fallback to x-forwarded-for (take first hop only, can be spoofed)
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        const firstIp = forwarded.split(',')[0]?.trim();
        if (firstIp) return firstIp;
    }

    return 'unknown';
}

/**
 * verifyRateLimit - Standalone rate limiter for non-Hono contexts (e.g. WS Upgrade)
 */
export async function verifyRateLimit(clientIp: string): Promise<{ success: boolean; retryAfter?: number }> {
    const store = getStore()
    const { count, ttl } = await store.increment(clientIp, WINDOW_MS)

    if (count > MAX_REQUESTS) {
        return { success: false, retryAfter: ttl }
    }

    return { success: true }
}

export const rateLimitMiddleware = createMiddleware<{ Variables: { services: ServiceContainer } }>(async (c, next) => {
    const clientIp = extractClientIp({
        get: (name: string) => c.req.header(name)
    })

    const limit = await verifyRateLimit(clientIp)

    if (!limit.success) {
        c.get('services').logger.warn('Rate limit exceeded', { ip: clientIp })
        return c.json({
            success: false,
            error: 'Too many requests. Please try again later.',
            retryAfter: limit.retryAfter
        }, 429)
    }

    await next()
})
