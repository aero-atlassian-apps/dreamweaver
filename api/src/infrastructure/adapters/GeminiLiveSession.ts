/**
 * GeminiLiveSession - Implementation of LiveSessionPort using WebSocket
 * 
 * Handles the BidiGenerateContent protocol for real-time multimodal interaction.
 */

import WebSocket from 'ws'
import { LiveSessionPort, LiveSessionOptions } from '../../application/ports/AIServicePort.js'

export class GeminiLiveSession implements LiveSessionPort {
    private ws: WebSocket
    private isOpen = false

    // Event Handlers
    private audioHandlers: ((chunk: ArrayBuffer) => void)[] = []
    private textHandlers: ((text: string) => void)[] = []
    private toolCallHandlers: ((toolCall: unknown) => void)[] = []
    private interruptionHandlers: (() => void)[] = []
    private closeHandlers: ((code?: number, reason?: string) => void)[] = []
    private errorHandlers: ((error: any) => void)[] = []

    private toSnakeCase(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(v => this.toSnakeCase(v))
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).reduce((result, key) => {
                const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()
                result[snakeKey] = this.toSnakeCase(obj[key])
                return result
            }, {} as any)
        }
        return obj
    }

    constructor(apiKey: string, options?: LiveSessionOptions) {
        // Construct WebSocket URL
        const host = 'generativelanguage.googleapis.com'
        const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent'
        const url = `wss://${host}${path}?key=${apiKey}`

        this.ws = new WebSocket(url)

        this.ws.on('open', () => {
            this.isOpen = true
            console.log('[GeminiLive] Connected to BidiGenerateContent')

            // Send Setup Message
            // [CRITICAL] Map camelCase to snake_case for Google Bidi Protocol
            const setupMsg = {
                setup: {
                    model: options?.model || process.env['GEMINI_LIVE_MODEL'] || 'models/gemini-2.0-flash-exp',
                    generation_config: this.toSnakeCase(options?.generationConfig || {
                        response_modalities: options?.responseModalities || ['AUDIO']
                    }),
                    system_instruction: options?.systemInstruction ? {
                        parts: [{ text: options.systemInstruction }]
                    } : undefined,
                    tools: options?.tools ? this.toSnakeCase(options.tools) : undefined
                }
            }
            this.sendJson(setupMsg)
        })

        this.ws.on('message', (data: Buffer) => {
            this.handleMessage(data)
        })

        this.ws.on('close', (code, reason) => {
            this.isOpen = false
            console.log(`[GeminiLive] Disconnected. Code: ${code}, Reason: ${reason.toString()}`)
            this.closeHandlers.forEach(h => h(code, reason.toString()))
        })

        this.ws.on('error', (err) => {
            console.error('[GeminiLive] WebSocket Error:', err)
        })
    }

    sendAudio(chunk: ArrayBuffer): void {
        if (!this.isOpen) return

        // Convert ArrayBuffer to Base64
        const base64Audio = Buffer.from(chunk).toString('base64')

        const msg = {
            realtime_input: {
                media_chunks: [{
                    mime_type: 'audio/pcm;rate=16000', // Standard PCM 16k
                    data: base64Audio
                }]
            }
        }
        this.sendJson(msg)
    }

    sendText(text: string): void {
        if (!this.isOpen) return

        const msg = {
            client_content: {
                turns: [{
                    role: 'user',
                    parts: [{ text: text }]
                }],
                turn_complete: true
            }
        }
        this.sendJson(msg)
    }

    disconnect(): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.close()
        }
    }

    sendToolResponse(response: unknown): void {
        if (!this.isOpen) return

        const msg = {
            tool_response: response
        }
        this.sendJson(msg)
    }

    // --- Subscription Methods ---

    onAudio(handler: (chunk: ArrayBuffer) => void): void {
        this.audioHandlers.push(handler)
    }

    onText(handler: (text: string) => void): void {
        this.textHandlers.push(handler)
    }

    onToolCall(handler: (toolCall: unknown) => void): void {
        this.toolCallHandlers.push(handler)
    }

    onInterruption(handler: () => void): void {
        this.interruptionHandlers.push(handler)
    }

    onClose(handler: (code?: number, reason?: string) => void): void {
        this.closeHandlers.push(handler)
    }

    onError(handler: (error: any) => void): void {
        this.errorHandlers.push(handler)
    }

    // --- Internal Logic ---

    private sendJson(data: unknown): void {
        this.ws.send(JSON.stringify(data))
    }

    private handleMessage(data: Buffer): void {
        try {
            const msg = JSON.parse(data.toString())

            // 0. Global Error (JSON from Google)
            if (msg.error) {
                console.error('[GeminiLive] Upstream JSON Error:', msg.error)
                this.errorHandlers.forEach(h => h(msg.error))
                return
            }

            // 1. Server Content (Audio/Text)
            if (msg.serverContent) {
                const parts = msg.serverContent.modelTurn?.parts || []
                for (const part of parts) {
                    if (part.text) {
                        this.textHandlers.forEach(h => h(part.text))
                    }
                    if (part.inlineData && part.inlineData.mimeType.startsWith('audio')) {
                        // Decode Base64 to ArrayBuffer
                        const audioBuffer = Buffer.from(part.inlineData.data, 'base64')
                        // Convert Node Buffer to ArrayBuffer for portability
                        const arrayBuffer = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength)
                        this.audioHandlers.forEach(h => h(arrayBuffer))
                    }
                }

                if (msg.serverContent.interrupted) {
                    this.interruptionHandlers.forEach(h => h())
                }
            }

            // 2. Tool Calls
            if (msg.toolCall) {
                this.toolCallHandlers.forEach(h => h(msg.toolCall))
            }

        } catch (e) {
            console.error('[GeminiLive] Failed to parse message', e)
        }
    }
}
