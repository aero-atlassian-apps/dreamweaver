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

function arrayBufferToBase64(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf)
    let binary = ''
    const chunkSize = 0x8000
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes.buffer
}

function toGeminiSetupMessage(env: Env, setup: any): any {
    const model = typeof setup?.model === 'string'
        ? setup.model
        : (env.GEMINI_LIVE_MODEL || 'models/gemini-3-flash-preview')
    const systemInstruction = setup?.systemInstruction
    const tools = setup?.tools

    const generationConfig: any = {
        response_modalities: ['AUDIO'],
    }
    if (env.GEMINI_ENABLE_THINKING_LEVEL === 'true' && env.GEMINI_LIVE_THINKING_LEVEL) {
        generationConfig.thinking_level = env.GEMINI_LIVE_THINKING_LEVEL
    }

    return {
        setup: {
            model,
            generation_config: generationConfig,
            system_instruction: systemInstruction,
            tools,
        },
    }
}

function sanitizeGeminiServerMessage(msg: any): any {
    if (!msg || typeof msg !== 'object') return msg
    const out = { ...msg }
    if (out.serverContent?.modelTurn?.parts && Array.isArray(out.serverContent.modelTurn.parts)) {
        const parts = out.serverContent.modelTurn.parts
            .map((p: any) => {
                if (p && typeof p === 'object' && typeof p.text === 'string') return { text: p.text }
                return null
            })
            .filter(Boolean)
        out.serverContent = {
            ...out.serverContent,
            modelTurn: {
                ...out.serverContent.modelTurn,
                parts,
            },
        }
    }
    return out
}

async function handleLiveWebSocket(request: Request, env: Env): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    const origin = request.headers.get('Origin')
    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS)
    if (allowedOrigins.length === 0) {
        return new Response('Server misconfigured: ALLOWED_ORIGINS required', { status: 500 })
    }
    if (!origin || !allowedOrigins.includes(origin)) {
        return new Response('Forbidden', { status: 403 })
    }

    const ticket = parseTicketFromProtocols(request.headers.get('Sec-WebSocket-Protocol'))
    if (!ticket) {
        return new Response('Unauthorized', { status: 401 })
    }

    const userId = await consumeWsTicket(env, ticket)
    if (!userId) {
        return new Response('Forbidden', { status: 403 })
    }

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    server.accept()

    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`

    let geminiWs: WebSocket | null = null
    let geminiOpen = false
    let isSessionActive = false
    let traceId: string | null = null
    const audioBufferQueue: ArrayBuffer[] = []
    let textWindowStart = Date.now()
    let textCount = 0
    let parseFailures = 0
    const MAX_TEXT_BYTES = 64 * 1024
    const MAX_AUDIO_BYTES = 64 * 1024
    const TEXT_WINDOW_MS = 60 * 1000
    const MAX_TEXT_MESSAGES_PER_WINDOW = 120

    const ensureGemini = (setup: unknown) => {
        if (geminiWs) return
        geminiWs = new WebSocket(geminiUrl)
        geminiWs.binaryType = 'arraybuffer'

        geminiWs.addEventListener('open', () => {
            geminiOpen = true
            const setupMsg = toGeminiSetupMessage(env, setup as any)
            geminiWs?.send(JSON.stringify(setupMsg))
            isSessionActive = true
            while (audioBufferQueue.length > 0) {
                const chunk = audioBufferQueue.shift()!
                const base64Audio = arrayBufferToBase64(chunk)
                geminiWs?.send(JSON.stringify({
                    realtime_input: {
                        media_chunks: [{
                            mime_type: 'audio/pcm;rate=16000',
                            data: base64Audio,
                        }],
                    },
                }))
            }
        })

        geminiWs.addEventListener('message', (event: MessageEvent) => {
            try {
                const raw = typeof event.data === 'string' ? event.data : null
                if (!raw) return
                const msg = JSON.parse(raw)

                const parts = msg?.serverContent?.modelTurn?.parts
                if (Array.isArray(parts)) {
                    for (const part of parts) {
                        const inline = part?.inlineData
                        const mimeType = inline?.mimeType
                        const data = inline?.data
                        if (typeof mimeType === 'string' && mimeType.startsWith('audio') && typeof data === 'string') {
                            const audio = base64ToArrayBuffer(data)
                            server.send(audio)
                        }
                    }
                }

                const sanitized = sanitizeGeminiServerMessage(msg)
                if (traceId && sanitized && typeof sanitized === 'object' && !(sanitized as any).traceId) {
                    ; (sanitized as any).traceId = traceId
                }
                server.send(JSON.stringify(sanitized))
            } catch {
            }
        })

        geminiWs.addEventListener('close', () => {
            geminiOpen = false
            try { server.close(1011, 'Upstream closed') } catch { }
        })

        geminiWs.addEventListener('error', () => {
            geminiOpen = false
            try { server.close(1011, 'Upstream error') } catch { }
        })
    }

    server.addEventListener('message', (event: MessageEvent) => {
        try {
            if (event.data instanceof ArrayBuffer) {
                if (event.data.byteLength > MAX_AUDIO_BYTES) {
                    try { server.close(1009, 'Message too big') } catch { }
                    return
                }
                if (geminiOpen && geminiWs) {
                    const base64Audio = arrayBufferToBase64(event.data)
                    geminiWs.send(JSON.stringify({
                        realtime_input: {
                            media_chunks: [{
                                mime_type: 'audio/pcm;rate=16000',
                                data: base64Audio,
                            }],
                        },
                    }))
                } else {
                    audioBufferQueue.push(event.data)
                    if (audioBufferQueue.length > 50) audioBufferQueue.shift()
                }
                return
            }

            const str = String(event.data)
            if (str.length > MAX_TEXT_BYTES) {
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

            const msg = JSON.parse(str)
            parseFailures = 0

            if (msg?.setup && !isSessionActive) {
                if (typeof msg?.traceId === 'string' && msg.traceId.length > 0) {
                    traceId = msg.traceId
                }
                ensureGemini(msg.setup)
                return
            }

            if (!geminiWs || !geminiOpen) return

            if (msg?.toolResponse) {
                geminiWs.send(JSON.stringify({ tool_response: msg.toolResponse }))
                return
            }

            if (msg?.client_content || msg?.realtime_input) {
                geminiWs.send(JSON.stringify(msg))
                return
            }
        } catch {
            parseFailures++
            if (parseFailures >= 3) {
                try { server.close(1007, 'Invalid data') } catch { }
            }
        }
    })

    server.addEventListener('close', () => {
        try { geminiWs?.close() } catch { }
    })

    server.addEventListener('error', () => {
        try { geminiWs?.close() } catch { }
    })

    return new Response(null, {
        status: 101,
        webSocket: client,
        headers: {
            'Sec-WebSocket-Protocol': 'dw.live.v1',
        },
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
