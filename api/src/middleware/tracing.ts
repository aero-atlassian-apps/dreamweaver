/**
 * Tracing Middleware - Distributed tracing with request correlation IDs
 * 
 * Generates or propagates x-request-id for all requests, enabling
 * end-to-end observability across services.
 */

import { createMiddleware } from 'hono/factory'
import { container } from '../di/container.js'
import type { ApiEnv } from '../http/ApiEnv.js'
import { randomUUID } from 'node:crypto'

export type TracingVariables = {
    requestId: string
    traceId: string
    spanId: string
}

function generateRequestId(): string {
    return `req_${randomUUID()}`
}

function generateSpanId(): string {
    const hex = randomUUID().replace(/-/g, '')
    return hex.slice(0, 16)
}

function parseTraceParent(value: string | null | undefined): { traceId: string; parentSpanId: string } | null {
    if (!value) return null
    const trimmed = value.trim()
    const parts = trimmed.split('-')
    if (parts.length !== 4) return null
    const traceId = parts[1]
    const parentSpanId = parts[2]
    if (!/^[0-9a-f]{32}$/i.test(traceId)) return null
    if (!/^[0-9a-f]{16}$/i.test(parentSpanId)) return null
    if (/^0{32}$/.test(traceId)) return null
    if (/^0{16}$/.test(parentSpanId)) return null
    return { traceId: traceId.toLowerCase(), parentSpanId: parentSpanId.toLowerCase() }
}

function formatTraceParent(traceId: string, spanId: string): string {
    return `00-${traceId}-${spanId}-01`
}

/**
 * Tracing middleware that:
 * 1. Extracts or generates x-request-id
 * 2. Attaches to context for downstream use
 * 3. Sets response header
 * 4. Logs request with correlation
 */
export const tracingMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
    const requestId = c.req.header('x-request-id') || generateRequestId()
    const parsed = parseTraceParent(c.req.header('traceparent'))
    const traceId = parsed?.traceId || randomUUID().replace(/-/g, '')
    const spanId = generateSpanId()

    c.set('requestId', requestId)
    c.set('traceId', traceId)
    c.set('spanId', spanId)

    c.res.headers.set('x-request-id', requestId)
    c.res.headers.set('traceparent', formatTraceParent(traceId, spanId))

    const startTime = Date.now()
    const method = c.req.method
    const path = c.req.path

    container.logger.info('Request started', {
        requestId,
        traceId,
        spanId,
        method,
        path,
        userAgent: c.req.header('user-agent'),
    })

    await next()

    const duration = Date.now() - startTime
    const status = c.res.status

    container.logger.info('Request completed', {
        requestId,
        traceId,
        spanId,
        method,
        path,
        status,
        durationMs: duration,
    })

    if (duration > 2000) {
        container.logger.warn('Slow request detected', {
            requestId,
            traceId,
            path,
            durationMs: duration,
        })
    }
})

/**
 * Helper to get requestId from context in handlers
 */
export function getRequestId(c: { get: (key: 'requestId') => string }): string {
    return c.get('requestId') || 'unknown'
}

export function getTraceId(c: { get: (key: 'traceId') => string }): string {
    return c.get('traceId') || 'unknown'
}
