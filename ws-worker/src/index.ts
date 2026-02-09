/**
 * DreamWeaver WebSocket Worker - Gemini Live Relay
 * 
 * SECURITY NOTICE:
 * This worker does not authenticate to Supabase directly.
 * It consumes one-time tickets by calling the DreamWeaver API using a dedicated internal token.
 */

type Env = {
    DW_API_BASE_URL: string
    WS_WORKER_INTERNAL_TOKEN: string
    GEMINI_API_KEY: string
    GEMINI_LIVE_MODEL?: string
    GEMINI_ENABLE_THINKING_LEVEL?: string
    GEMINI_LIVE_THINKING_LEVEL?: string
    ALLOWED_ORIGINS?: string
}

function parseAllowedOrigins(raw: string | undefined): string[] {
    const parsed = (raw || '').split(',').map((s) => s.trim()).filter(Boolean)
    if (parsed.length > 0) return parsed
    return []
}

function parseTicketFromProtocols(protocolHeader: string | null): string | null {
    if (!protocolHeader) return null
    const parts = protocolHeader.split(',').map((p) => p.trim())
    const ticketPart = parts.find((p) => p.startsWith('ticket.'))
    if (!ticketPart) return null
    const ticket = ticketPart.slice('ticket.'.length)
    return ticket.length > 0 ? ticket : null
}

async function consumeWsTicket(env: Env, ticket: string): Promise<string | null> {
    const base = env.DW_API_BASE_URL.replace(/\/+$/, '')
    const url = base.endsWith('/api/v1')
        ? `${base}/live/tickets/consume`
        : `${base}/api/v1/live/tickets/consume`
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-worker-token': env.WS_WORKER_INTERNAL_TOKEN,
        },
        body: JSON.stringify({ ticket }),
    })

    if (!res.ok) {
        return null
    }

    const data = await res.json() as unknown
    const userId = (data && typeof data === 'object') ? (data as any).userId : undefined
    return typeof userId === 'string' && userId.length > 0 ? userId : null
}

async function handleLiveWebSocket(request: Request, env: Env): Promise<Response> {
    console.log('[WS-Worker] handleLiveWebSocket called')
    const upgradeHeader = request.headers.get('Upgrade')

    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    const origin = request.headers.get('Origin')
    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS)

    if (allowedOrigins.length > 0 && (!origin || !allowedOrigins.includes(origin))) {
        console.log('[WS-Worker] ❌ Origin not allowed:', origin)
        return new Response('Forbidden', { status: 403 })
    }

    const ticket = parseTicketFromProtocols(request.headers.get('Sec-WebSocket-Protocol'))
    if (!ticket) {
        return new Response('Unauthorized', { status: 401 })
    }

    const userId = await consumeWsTicket(env, ticket)
    if (!userId) {
        console.log('[WS-Worker] ❌ Ticket invalid')
        return new Response('Forbidden', { status: 403 })
    }

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    server.accept()

    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`

    let geminiWs: WebSocket | null = null
    let geminiOpen = false
    let isClosing = false
    const audioBufferQueue: any[] = []

    let textWindowStart = Date.now()
    let textCount = 0
    const MAX_TEXT_BYTES = 64 * 1024
    const MAX_AUDIO_BYTES = 64 * 1024
    const TEXT_WINDOW_MS = 60 * 1000
    const MAX_TEXT_MESSAGES_PER_WINDOW = 120

    function safeClose(source: 'client' | 'gemini', code?: number, reason?: string) {
        if (isClosing) return
        isClosing = true
        console.log(`[WS-Worker] Closing session initiated by ${source}`)
        if (source === 'gemini') {
            try { server.close(code || 1000, reason || 'Gemini closed') } catch { }
        } else {
            try { geminiWs?.close(code || 1000, reason || 'Client closed') } catch { }
        }
    }

    try {
        geminiWs = new WebSocket(geminiUrl)
        geminiWs.binaryType = 'arraybuffer'

        geminiWs.addEventListener('open', () => {
            console.log('[WS-Worker] ✅ Gemini WebSocket OPEN')
            geminiOpen = true
            while (audioBufferQueue.length > 0) {
                const queued = audioBufferQueue.shift()
                geminiWs?.send(queued)
            }
        })

        geminiWs.addEventListener('message', (event) => {
            if (isClosing) return
            try {
                const len = event.data instanceof ArrayBuffer ? event.data.byteLength : event.data.length;
                console.log(`[WS-Worker] 📥 Received from Gemini: ${len} bytes`);
                if (typeof event.data === 'string') {
                    console.log(`[WS-Worker] 📥 Gemini Content: ${event.data.slice(0, 1000)}`);
                    try {
                        const msg = JSON.parse(event.data)
                        if (msg?.error) {
                            console.log('[WS-Worker] ❌ Gemini JSON Error:', JSON.stringify(msg.error).slice(0, 2000))
                        }
                        if (msg?.setupComplete || msg?.setup_complete) {
                            console.log('[WS-Worker] ✅ Setup Complete ack from Gemini')
                        }
                    } catch { }
                }
                server.send(event.data)
            } catch {
                safeClose('gemini', 1011, 'Relay failed')
            }
        })

        geminiWs.addEventListener('close', (event) => {
            console.log(`[WS-Worker] Gemini Closed: ${event.code}`)
            safeClose('gemini', event.code, event.reason)
        })

        geminiWs.addEventListener('error', (e) => {
            console.log('[WS-Worker] Gemini Error:', e)
            safeClose('gemini', 1011, 'Gemini error')
        })

    } catch (e) {
        console.log('[WS-Worker] Failed to connect to Gemini:', e)
        server.close(1011, 'Upstream connection failed')
        return new Response(null, { status: 101, webSocket: client })
    }

    server.addEventListener('message', (event) => {
        if (isClosing) return

        let data = event.data
        const len = data instanceof ArrayBuffer ? data.byteLength : data.length;
        console.log(`[WS-Worker] 📤 Received from Client: ${len} bytes`);

        // [CRITICAL FIX] Cloudflare might deliver Text frames as ArrayBuffer.
        // Gemini requires Text frames for JSON. We must decode if necessary.
        if (data instanceof ArrayBuffer) {
            try {
                const decoded = new TextDecoder().decode(data);
                // Simple heuristic: if it starts with '{', it's likely our JSON payload
                if (decoded.trim().startsWith('{')) {
                    console.log('[WS-Worker] 🔄 Converted Binary -> Text');
                    data = decoded; // Treat as string
                }
            } catch (e) {
                // Not text, keep as binary
            }
        }

        if (typeof data === 'string') {
            // Log the beginning of ANY string message (setup or audio)
            console.log(`[WS-Worker] 📤 Client Message Preview: ${data.slice(0, 500)}`);

            const isSetup = data.includes('"setup"')
            if (isSetup) {
                console.log('[WS-Worker] 🔍 Setup Message Payload:', data.slice(0, 2000))

                // [COMPATIBILITY FIX] Old Client sends sessionId/traceId which breaks Gemini
                if (data.includes('"sessionId"') || data.includes('"traceId"')) {
                    console.log('[WS-Worker] 🧹 Sanitizing setup message (removing extra fields)')
                    try {
                        const parsed = JSON.parse(data)
                        // Only forward the 'setup' property
                        data = JSON.stringify({ setup: parsed.setup })
                    } catch (e) {
                        console.error('[WS-Worker] Sanitization failed', e)
                    }
                }
                // [ENUM NORMALIZATION] Ensure response_modalities are upper-case per Gemini spec
                try {
                    const parsed = JSON.parse(data)
                    const setup = parsed?.setup
                    const gen = setup?.generation_config
                    const mods = Array.isArray(gen?.response_modalities) ? gen.response_modalities : null
                    if (mods && mods.some((m: any) => typeof m === 'string')) {
                        gen.response_modalities = mods.map((m: string) => m.toUpperCase())
                        data = JSON.stringify({ setup })
                        console.log('[WS-Worker] ✅ Normalized response_modalities:', gen.response_modalities.join(','))
                    }
                } catch { }
            }

            if (data.length > MAX_TEXT_BYTES) {
                try { server.close(1009, 'Message too big') } catch { }
                return
            }
            const now = Date.now()
            if (now - textWindowStart > TEXT_WINDOW_MS) {
                textWindowStart = now
                textCount = 0
            }
            textCount++
            if (textCount > MAX_TEXT_MESSAGES_PER_WINDOW) {
                try { server.close(1008, 'Rate limit') } catch { }
                return
            }
        } else if (data instanceof ArrayBuffer) {
            if (data.byteLength > MAX_AUDIO_BYTES) {
                try { server.close(1009, 'Message too big') } catch { }
                return
            }
        }

        if (geminiOpen && geminiWs) {
            try {
                geminiWs.send(data)
            } catch {
                safeClose('gemini', 1011, 'Send failed')
            }
        } else {
            audioBufferQueue.push(data)
            if (audioBufferQueue.length > 50) audioBufferQueue.shift()
        }
    })

    server.addEventListener('close', () => safeClose('client'))
    server.addEventListener('error', () => safeClose('client', 1011, 'Client error'))

    return new Response(null, {
        status: 101,
        webSocket: client,
        headers: {
            'Sec-WebSocket-Protocol': 'dw.live.v1',
            'Access-Control-Allow-Origin': origin || '*'
        }
    })
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url)
        if (url.pathname === '/api/v1/live/ws') {
            return handleLiveWebSocket(request, env)
        }
        return new Response('Not Found', { status: 404 })
    },
}
