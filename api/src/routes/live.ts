/**
 * Live API Routes
 * 
 * Endpoints for the "Server-Orchestrated Client-Streaming" Gemini Live architecture.
 */

import { Hono } from 'hono'
import { container } from '../di/container.js';
import { LiveSessionFactory } from '../application/factories/LiveSessionFactory.js';
import { ToolExecutionRouter, ToolCallRequest } from '../application/use-cases/Live/ToolExecutionRouter.js';
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { randomUUID } from 'node:crypto'

import { authMiddleware } from '../middleware/auth.js'
import type { ApiEnv } from '../http/ApiEnv.js'

const app = new Hono<ApiEnv>()

// Lazy instantiation of services (or inject via container if fully bound)
// For MVP we can instantiate or get from container
const sessionFactory = new LiveSessionFactory(
    container.bedtimeConductorAgent,
    container.promptService
);

const toolRouter = new ToolExecutionRouter(
    container.bedtimeConductorAgent,
    container.agentMemory,
    container.sleepSentinelAgent,
    container.logger,
    container.storyRepository,
    container.toolAuditLog
);

const consumeTicketSchema = z.object({
    ticket: z.string().min(1),
})

app.post('/tickets/consume', async (c) => {
    const expected = process.env['WS_WORKER_INTERNAL_TOKEN']
    const provided = c.req.header('x-worker-token')
    if (!expected || !provided || provided !== expected) {
        return c.json({ error: 'Forbidden' }, 403)
    }

    let body: { ticket: string }
    try {
        body = consumeTicketSchema.parse(await c.req.json())
    } catch {
        return c.json({ error: 'Validation Error' }, 400)
    }

    const userId = await container.ticketStore.validate(body.ticket)
    if (!userId) {
        return c.json({ error: 'Forbidden' }, 403)
    }

    return c.json({ userId })
})

/**
 * POST /api/v1/live/init
 * 
 * Generates the "Blind" session configuration for the client.
 * Returns: { config: LiveSessionConfig, token: EphemeralToken }
 */
const initSchema = z.object({
    childName: z.string().optional(),
    childAge: z.number().int().min(0).max(18).optional(),
    sessionId: z.string().min(1).optional(),
})

app.post('/init', authMiddleware, async (c) => {
    let body;
    try {
        const json = await c.req.json();
        body = initSchema.parse(json);
    } catch (e) {
        return c.json({ error: 'Validation Error' }, 400);
    }

    try {
        const user = c.get('user')!;
        const userId = user.id;
        const sessionId = body.sessionId || randomUUID()
        const traceId = c.get('traceId')

        // 1. Generate Session Config (System Prompts + Tools)
        const config = await sessionFactory.createSessionConfig({
            userId,
            childName: body.childName,
            childAge: body.childAge
        });

        await container.sessionState.set(sessionId, {
            sessionId,
            userId,
            phase: 'IDLE',
            activeIntent: 'IDLE',
            emotionalTone: 0.5,
            context: { traceId },
            updatedAt: new Date()
        })

        // 2. Issue a one-time ticket for connecting to our Live WebSocket relay.
        // This is the practical equivalent of an "ephemeral token" for the client,
        // without exposing JWTs or any vendor API keys.
        const ticket = await container.ticketStore.issue(userId)

        return c.json({
            config,
            ticket,
            sessionId,
            traceId,
        });

    } catch (error: unknown) {
        container.logger.error('Failed to init live session', error instanceof Error ? error : undefined);
        return c.json({ error: 'Failed to initialize session' }, 500);
    }
});

/**
 * POST /api/v1/live/tool
 * 
 * The "Blind Relay" endpoint. Client receives a tool call from Gemini,
 * forwards it here, and gets the result to send back.
 */
const toolCallSchema = z.object({
    sessionId: z.string().min(1),
    toolName: z.enum(['save_memory', 'check_sleep_status', 'suggest_theme', 'save_generated_story']),
    arguments: z.unknown(),
    toolCallId: z.string().min(1).optional(),
    traceId: z.string().min(1).optional(),
})

app.post('/tool', authMiddleware, async (c) => {
    const contentLength = c.req.header('content-length')
    if (contentLength) {
        const parsedLength = Number(contentLength)
        if (Number.isFinite(parsedLength) && parsedLength > 64 * 1024) {
            return c.json({ error: 'Payload Too Large' }, 413)
        }
    }

    let payload;
    try {
        const json = await c.req.json();
        payload = toolCallSchema.parse(json);
    } catch (e) {
        return c.json({ error: 'Validation Error' }, 400);
    }

    try {
        const user = c.get('user')!;
        const state = await container.sessionState.get(payload.sessionId)
        if (!state || state.userId !== user.id) {
            return c.json({ result: null, error: 'Forbidden' }, 403)
        }

        const ctx = state.context || {}
        const processed = Array.isArray((ctx as any).processedToolCallIds) ? (ctx as any).processedToolCallIds as unknown[] : []
        const toolCallId = payload.toolCallId
        if (toolCallId) {
            if (processed.some((x) => typeof x === 'string' && x === toolCallId)) {
                return c.json({ result: null, error: 'Duplicate tool call' }, 409)
            }
            const nextProcessed = [...processed.filter((x) => typeof x === 'string'), toolCallId].slice(-200)
            await container.sessionState.patch(payload.sessionId, { context: { ...ctx, processedToolCallIds: nextProcessed } })
        }

        const request = {
            userId: user.id,
            sessionId: payload.sessionId,
            toolName: payload.toolName,
            arguments: payload.arguments,
            toolCallId: payload.toolCallId,
            traceId: (typeof (ctx as any).traceId === 'string' ? (ctx as any).traceId : payload.traceId) || c.get('traceId'),
            requestId: c.get('requestId'),
        } as ToolCallRequest;

        const response = await toolRouter.execute(request);

        return c.json(response);

    } catch (error: unknown) {
        container.logger.error('Tool execution failed', error instanceof Error ? error : undefined);
        return c.json({ error: 'Tool execution failed' }, 500);
    }
});

export const liveRoute = app;
