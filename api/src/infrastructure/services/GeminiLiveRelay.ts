import { WebSocket } from 'ws'
import { LoggerPort } from '../../application/ports/LoggerPort.js'
import { container } from '../../di/container.js'
import { ResilienceEngine } from './ResilienceEngine.js'
import { IntentClassifier } from '../../domain/services/IntentClassifier.js'

import { LiveSessionPort } from '../../application/ports/AIServicePort.js'

/**
 * GeminiLiveRelay - Securely proxies Gemini Live WebSocket connections.
 * 
 * Prevents API Key exposure on the frontend (GATE-SEC-01).
 * Enforces backend session validation.
 * Uses GeminiLiveSession adapter to handle Bidi Protocol.
 * Attaches SleepSentinel for monitoring.
 * 
 * [CODE-01] Uses container.aiService for AI operations (no direct API key handling).
 */
export class GeminiLiveRelay {

    constructor(
        private readonly logger: LoggerPort
    ) { }

    /**
     * Handles an incoming client connection and bridges it to Gemini.
     */
    async handleConnection(clientWs: WebSocket, userId?: string) {
        this.logger.info('[LiveRelay] New client connected. Waiting for setup...', { userId });
        const resilienceEngine = new ResilienceEngine(this.logger)
        let liveSession: LiveSessionPort | null = null
        let isSessionActive = false
        let sessionId = `live_${Date.now()}_${userId || 'anon'}`

        // Buffer early audio if client sends it before setup (unlikely but safe)
        const audioBufferQueue: ArrayBuffer[] = []

        const startSession = async (config: any, traceId?: string) => {
            try {
                this.logger.info('[LiveRelay] Received Setup Config. Starting Gemini Session...', {
                    model: config.model,
                    sessionId,
                    traceId
                })

                // 1. Start Gemini Live Session via Adapter with User Config
                liveSession = await container.aiService.startLiveSession({
                    systemInstruction: config.systemInstruction?.parts?.[0]?.text || container.promptService.getConductorSystemPrompt(),
                    model: typeof config.model === 'string' ? config.model : undefined,
                    tools: config.tools,
                    generationConfig: config.generationConfig || config.generation_config
                })

                // [DEBUG] Catch JSON error messages from Google
                liveSession.onError((error: any) => {
                    this.logger.error('[LiveRelay] Upstream Gemini JSON Error', { error })
                    if (clientWs.readyState === WebSocket.OPEN) {
                        clientWs.send(JSON.stringify({
                            system: { error: true, message: 'Google API Error', details: error }
                        }))
                    }
                })

                // 2. Attach Sleep Sentinel (Agentic Monitoring)
                container.sleepSentinelAgent.monitorLiveSession(liveSession, sessionId, userId, traceId)
                this.logger.info('[LiveRelay] Sleep Sentinel attached.')

                // 3. Bridge Events: Gemini -> Client
                liveSession.onAudio((chunk: ArrayBuffer) => {
                    if (clientWs.readyState === WebSocket.OPEN) {
                        // [BINARY PROTOCOL] Send raw audio
                        clientWs.send(Buffer.from(chunk), { binary: true })
                    }
                })

                liveSession.onText((text: string) => {
                    if (clientWs.readyState === WebSocket.OPEN) {
                        const msg = {
                            serverContent: {
                                modelTurn: {
                                    parts: [{ text }]
                                }
                            }
                        }
                        clientWs.send(JSON.stringify(msg))
                    }
                })

                liveSession.onInterruption(async () => {
                    this.logger.info('[LiveRelay] Gemini signalled interruption (Barge-In).')
                    await resilienceEngine.assessFailure({
                        type: 'UNKNOWN',
                        context: { event: 'BARGE_IN', description: 'User interrupted the model' },
                        attempt: 1,
                        costSoFar: 0
                    })
                    if (clientWs.readyState === WebSocket.OPEN) {
                        clientWs.send(JSON.stringify({ serverContent: { interrupted: true } }))
                    }
                })

                // [DOC-03] Real Sleep Event Bridge
                // Subscribe to the global EventBus for sleep cues.
                const sleepHandler = (event: any) => {
                    // [SEC-05] Session Scoping: Only broadcast if this event belongs to OUR session/user
                    // FIXED: Use || to require BOTH to match (reject if either doesn't match)
                    const targetSessionId = (event?.payload as any)?.sessionId
                    const targetUserId = (event?.payload as any)?.userId

                    if (targetSessionId !== sessionId || targetUserId !== userId) {
                        return // Not for us - requires both session AND user to match
                    }

                    if (clientWs.readyState === WebSocket.OPEN) {
                        this.logger.info('[LiveRelay] Broadcasting Scoped Sleep Cue to Client', { sessionId })
                        const confidence = typeof (event?.payload as any)?.confidence === 'number' ? (event.payload as any).confidence : 1.0
                        const cue = typeof (event?.payload as any)?.cue === 'string' ? (event.payload as any).cue : undefined
                        clientWs.send(JSON.stringify({
                            serverContent: {
                                sleepDetection: { isAsleep: true, confidence, cue }
                            }
                        }))

                        // [PRD-GAP-03] Pacing Control: System Injection
                        if (liveSession && typeof liveSession.sendText === 'function') {
                            this.logger.info('[LiveRelay] Injecting System Pacing Control...')
                            liveSession.sendText(container.promptService.getSleepPacingOverrideInstruction())
                        }

                        // [MEMORY CURATOR] Trigger Moment Analysis
                        if (userId) {
                            this.logger.info('[LiveRelay] Triggering Memory Curator (Moment Analysis)...', { sessionId })
                            container.analyzeSessionForMomentsUseCase.execute(sessionId, userId)
                                .catch((err: unknown) => this.logger.error('[LiveRelay] Moment Analysis Failed', err))
                        }
                    }
                }

                // Subscribe and capture unsubscribe function
                // [ARCH-02] Proper Cleanup
                const unsubscribeSleep = container.eventBus.subscribe('SLEEP_CUE_DETECTED', sleepHandler)

                liveSession.onClose((code, reason) => {
                    this.logger.info(`[LiveRelay] Gemini Session closed. Code: ${code}, Reason: ${reason}`)

                    // [DEBUG] If upstream closed with error, tell client why
                    if (code && code !== 1000 && code !== 1005) {
                        const upstreamError = `Upstream Closed (${code}): ${reason || 'No Reason'}`
                        this.logger.error('[LiveRelay] Upstream Gemini Error', { code, reason })
                        if (clientWs.readyState === WebSocket.OPEN) {
                            clientWs.send(JSON.stringify({
                                system: { error: true, message: upstreamError, code }
                            }))
                        }
                    }

                    // [ARCH-02] Unsubscribe to prevent leaks
                    if (unsubscribeSleep) {
                        unsubscribeSleep()
                        this.logger.debug('[LiveRelay] Unsubscribed from Sleep Events')
                    }
                    clientWs.close(1000, 'Session ended')
                })

                isSessionActive = true

                // Flush buffered audio
                while (audioBufferQueue.length > 0) {
                    const chunk = audioBufferQueue.shift()!
                    liveSession.sendAudio(chunk as ArrayBuffer)
                }

            } catch (error: any) {
                const errorMessage = error.message || 'Unknown error'
                this.logger.error('[LiveRelay] Failed to start session', {
                    message: errorMessage,
                    stack: error.stack,
                    name: error.name
                })

                // [DEBUG] Send error to client before closing (Close frame limit is 125 bytes)
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({
                        system: { error: true, message: errorMessage, stack: error.stack }
                    }))
                }

                // Truncate reason to be safe
                const closeReason = `Failed to start: ${errorMessage}`.substring(0, 100)
                clientWs.close(1011, closeReason)
            }
        }

        // 4. Bridge Events: Client -> Gemini
        clientWs.on('message', async (data, isBinary) => {
            try {
                // [BINARY PROTOCOL] Audio Input
                if (isBinary) {
                    const buffer = data as Buffer
                    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer

                    if (isSessionActive && liveSession) {
                        liveSession.sendAudio(arrayBuffer)
                    } else {
                        // Buffer or drop? Dropping is safer to avoid playing "catch up" blindly
                        audioBufferQueue.push(arrayBuffer)
                        if (audioBufferQueue.length > 50) audioBufferQueue.shift() // Cap buffer
                    }
                    return
                }

                // [TEXT PROTOCOL] Control / Setup
                const str = data.toString()
                const msg = JSON.parse(str)

                // A. Setup Handshake (LIVE-01)
                if (msg.setup && !isSessionActive) {
                    if (typeof msg.sessionId === 'string' && msg.sessionId.length > 0) {
                        sessionId = msg.sessionId
                    }
                    const traceId = typeof msg.traceId === 'string' ? msg.traceId : undefined
                    await startSession(msg.setup, traceId)
                    return
                }

                if (!isSessionActive) {
                    this.logger.warn('[LiveRelay] Ignoring message before setup', { type: Object.keys(msg) })
                    return
                }

                // B. Text Input
                if (msg.client_content?.turns?.[0]?.parts?.[0]?.text && liveSession) {
                    const clientText = msg.client_content.turns[0].parts[0].text

                    // [PRD-GAP-05] Intent Classification
                    const classifier = new IntentClassifier()
                    const intent = classifier.classify(clientText)
                    this.logger.info(`[IntentClassifier] Detected Intent: ${intent} from text: "${clientText.substring(0, 20)}..."`)

                    liveSession.sendText(clientText)
                }

                // C. Tool Responses
                if (msg.toolResponse && liveSession) {
                    liveSession.sendToolResponse(msg.toolResponse)
                }

            } catch (e) {
                this.logger.warn('[LiveRelay] Invalid message from client', { context: String(e) })
            }
        })

        clientWs.on('close', () => {
            this.logger.info('[LiveRelay] Client disconnected. Closing session.')
            if (liveSession) liveSession.disconnect()
        })

        clientWs.on('error', (err) => {
            this.logger.error('[LiveRelay] Client WS Error', err)
            if (liveSession) liveSession.disconnect()
        })
    }
}
