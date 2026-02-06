import { serve } from '@hono/node-server'
import { container } from './di/container.js'
import { WebSocketServer } from 'ws'
import { GeminiLiveRelay } from './infrastructure/services/GeminiLiveRelay.js'
import { extractClientIp, verifyRateLimit } from './middleware/rateLimit.js'
import { createApp, getAllowedOrigins } from './app.js'

const app = createApp()
const allowedOrigins = getAllowedOrigins()

const port = parseInt(process.env['PORT'] || '3001')
console.log(`🚀 DreamWeaver API running on http://localhost:${port}`)

// Support both Node (serve) and Bun/CF (export default)
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const liveRelay = new GeminiLiveRelay(container.logger)
    const liveWss = new WebSocketServer({
        noServer: true,
        handleProtocols(protocols) {
            // [SEC-05] Strict protocol selection - reject unknown protocols
            if (protocols.has('dw.live.v1')) return 'dw.live.v1'
            return false
        },
    })
    liveWss.on('connection', (ws, req) => {
        const userId = (req as any).userId
        liveRelay.handleConnection(ws, userId)
    })

    const eventsWss = new WebSocketServer({
        noServer: true,
        handleProtocols(protocols) {
            // [SEC-05] Strict protocol selection - reject unknown protocols
            if (protocols.has('dw.events.v1')) return 'dw.events.v1'
            return false
        },
    })
    eventsWss.on('connection', (ws, req) => {
        const userId = (req as any).userId as string | undefined
        const send = (event: any) => {
            const payloadUserId = (event?.payload && typeof event.payload === 'object') ? (event.payload as any).userId : undefined
            if (!userId || payloadUserId !== userId) return
            ws.send(JSON.stringify({ event }))
        }

        const unsubSleep = container.eventBus.subscribe('SLEEP_CUE_DETECTED', send as any)
        const unsubBeat = container.eventBus.subscribe('STORY_BEAT_COMPLETED', send as any)
        const unsubChunk = container.eventBus.subscribe('STORY_CHUNK_GENERATED', send as any)

        ws.on('close', () => {
            unsubSleep()
            unsubBeat()
            unsubChunk()
        })
    })

    const server = serve({
        fetch: app.fetch,
        port
    })

    server.on('upgrade', async (req, socket, head) => {
        // [SEC-01] Global Try/Catch for Upgrade Handler
        try {
            const requestUrl = req.url || ''
            const url = new URL(requestUrl, `http://localhost:${port}`)
            const pathname = url.pathname
            const isLive = pathname === '/api/v1/live/ws'
            const isEvents = pathname === '/api/v1/events/ws'

            if (!isLive && !isEvents) {
                socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
                socket.destroy()
                return
            }

            // [SEC-02] Strict Origin Check
            const origin = req.headers.origin
            const clientIp = extractClientIp({
                get: (name: string) => {
                    const value = req.headers[name.toLowerCase() as keyof typeof req.headers]
                    if (Array.isArray(value)) return value[0]
                    return value
                }
            }) || req.socket.remoteAddress || 'unknown'

            // [SEC-03] Rate Limiting for WS Upgrade
            const limit = await verifyRateLimit(clientIp)
            if (!limit.success) {
                container.logger.warn('WS Upgrade Rejected: Rate Limit Exceeded', { clientIp })
                socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n')
                socket.destroy()
                return
            }

            // FAIL-CLOSED: Origin must be present and valid
            if (!origin || !allowedOrigins.includes(origin)) {
                container.logger.warn('WS Upgrade Rejected: Invalid or Missing Origin', {
                    origin,
                    ip: req.socket.remoteAddress
                })
                socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
                socket.destroy()
                return
            }

            // [SEC-03] Ticket-Based Authentication (In-Header)
            // Extract ticket from Sec-WebSocket-Protocol to avoid query string logging
            // Sub-protocol format: ticket.<uuid>
            const protocols = req.headers['sec-websocket-protocol']
            let ticket: string | null = process.env['NODE_ENV'] === 'production'
                ? null
                : url.searchParams.get('ticket')

            if (protocols) {
                const parts = protocols.split(',').map((p: string) => p.trim())
                const ticketProtocol = parts.find((p: string) => p.startsWith('ticket.'))
                if (ticketProtocol) {
                    ticket = ticketProtocol.split('.')[1]
                }
            }

            if (!ticket) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
                socket.destroy()
                return
            }

            void (async () => {
                try {
                    // Validate One-Time Ticket
                    const userId = await container.ticketStore.validate(ticket)

                    if (!userId) {
                        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
                        socket.destroy()
                        return
                    }

                    // Attach userId to request for Relay access
                    (req as any).userId = userId

                    const wss = isLive ? liveWss : eventsWss
                    wss.handleUpgrade(req, socket, head, (ws) => {
                        wss.emit('connection', ws, req)
                    })
                } catch (err) {
                    container.logger.error('WS Auth Task Failed', { err })
                    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n')
                    socket.destroy()
                }
            })()
        } catch (err) {
            container.logger.error('WS Upgrade Handler Panic', { err })
            socket.destroy()
        }
    })
}

export default {
    port,
    fetch: app.fetch,
}
