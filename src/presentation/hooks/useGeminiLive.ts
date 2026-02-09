/**
 * useGeminiLive Hook
 * 
 * The client-side "Blind Relay" engine.
 * 
 * API:
 * - connect(): Fetches config from backend -> opens WebSocket to Gemini.
 * - disconnect(): Closes socket.
 * - isConnected: boolean.
 * - isSpeaking: boolean (Agent is talking).
 * - userVolume: number (for visualization).
 * - agentVolume: number (for visualization).
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'
import { audioStreamer } from '../../infrastructure/audio/AudioStreamer'
import { apiFetch, getApiBase, stripApiVersionFromBase } from '../../infrastructure/api/apiClient'

const WS_BASE = import.meta.env['VITE_WS_BASE_URL'] || stripApiVersionFromBase(getApiBase())

export interface UseGeminiLiveReturn {
    connect: (childName: string, childAge: number) => Promise<void>;
    disconnect: () => void;
    isConnected: boolean;
    isSpeaking: boolean;
    error: string | null;
}

export function useGeminiLive(): UseGeminiLiveReturn {
    const { session } = useAuth()
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sessionIdRef = useRef<string>('current-session')
    const traceIdRef = useRef<string | null>(null)

    // 1. Initialize Session (Fetch Config + Connect WS)
    const connect = async (childName: string, childAge: number) => {
        try {
            setError(null);
            if (!session?.access_token) throw new Error('Not authenticated')

            sessionIdRef.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `session_${Date.now()}`

            // A. Fetch "Blind" Config from our Backend
            const response = await apiFetch(`/api/v1/live/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ sessionId: sessionIdRef.current, childName, childAge })
            });

            const raw = await response.text()
            const parsed = (() => {
                try {
                    return JSON.parse(raw)
                } catch {
                    return null
                }
            })()

            if (!response.ok) {
                const message = parsed?.error || `Failed to init session (${response.status})`
                throw new Error(message)
            }

            const { config, ticket, traceId } = (parsed || {}) as { config: unknown; ticket: unknown; traceId?: unknown }
            if (typeof ticket !== 'string' || ticket.length === 0) throw new Error('Missing live ticket')
            traceIdRef.current = typeof traceId === 'string' && traceId.length > 0 ? traceId : null

            const wsHttpBase = (WS_BASE || window.location.origin).replace(/\/+$/, '')
            const wsApiBase = wsHttpBase
                .replace(/^https:/, 'wss:')
                .replace(/^http:/, 'ws:')
            const ws = new WebSocket(`${wsApiBase}/api/v1/live/ws`, ['dw.live.v1', `ticket.${ticket}`]);
            ws.binaryType = 'arraybuffer'; // [RT-01] Explicit Binary Type
            wsRef.current = ws;

            ws.onopen = async () => {
                setIsConnected(true);
                // Send Initial Setup Message with the Server-Provided Config
                ws.send(JSON.stringify({ setup: config, sessionId: sessionIdRef.current, traceId: traceIdRef.current }));

                // Start Audio Streaming
                await audioStreamer.initialize()
                await startAudioInput();
            };

            ws.onmessage = async (event) => {
                await handleServerMessage(event);
            };

            ws.onerror = (e) => {
                console.error('WS Error', e);
                setError('Connection error');
                disconnect();
            };

            ws.onclose = () => {
                setIsConnected(false);
                stopAudioInput();
            };

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to connect'
            setError(message);
            setIsConnected(false);
        }
    };

    // 2. Handle Messages (Audio Output + Tool Calls)
    const handleServerMessage = async (event: MessageEvent) => {
        // [BINARY PROTOCOL] Audio Frames (RT-01)
        if (event.data instanceof ArrayBuffer) {
            setIsSpeaking(true);
            audioStreamer.enqueue(event.data);
            audioStreamer.resume();
            return;
        }

        // Callback for Blob just in case, though binaryType should prevent it
        if (event.data instanceof Blob) {
            const buffer = await event.data.arrayBuffer();
            setIsSpeaking(true);
            audioStreamer.enqueue(buffer);
            audioStreamer.resume();
            return;
        }

        // [TEXT PROTOCOL] JSON Events (Interruption, ToolCall, Config)
        let data;
        try {
            data = JSON.parse(event.data);
        } catch { return; }

        // Handle Server Interruption Signal
        if (data.serverContent?.interrupted) {
            console.log('[GeminiLive] Interrupted by Server')
            audioStreamer.stop()
            setIsSpeaking(false)
        }

        // B. Turn Complete (Stop Speaking indicator)
        if (data.serverContent?.turnComplete) {
            setIsSpeaking(false);
        }

        // D. Sleep Detection (DOC-03)
        if (data.serverContent?.sleepDetection?.isAsleep) {
            console.log('[GeminiLive] Sleep Detected by Sentinel');
            // Dispatch event for UI Dimming (StoryViewPage)
            window.dispatchEvent(new CustomEvent('dreamweaver:sleep_cue'));
        }

        // C. Tool Call (The "Blind Relay")
        if (data.toolCall) {
            const toolCall = data.toolCall.functionCalls[0];
            await handleToolCall(toolCall);
        }
    };

    // 3. Blind Relay: Execute Tool on Backend
    const handleToolCall = async (toolCall: unknown) => {
        try {
            if (!session?.access_token) throw new Error('Not authenticated')

            const call = toolCall as { name?: unknown; args?: unknown; id?: unknown }
            if (typeof call.name !== 'string') return

            console.log('[Client] Relaying Tool Call:', call.name);

            const response = await apiFetch(`/api/v1/live/tool`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    toolName: call.name,
                    arguments: call.args,
                    sessionId: sessionIdRef.current,
                    traceId: traceIdRef.current,
                    toolCallId: typeof call.id === 'string' ? call.id : undefined,
                })
            });

            const { result, error } = await response.json();

            // Send Result back to Gemini
            const toolResponse = {
                toolResponse: {
                    functionResponses: [{
                        name: call.name,
                        id: call.id,
                        response: { result: error ? { error } : result }
                    }]
                }
            };

            wsRef.current?.send(JSON.stringify(toolResponse));

        } catch (e: unknown) {
            console.error('Tool Relay Failed', e);
        }
    };

    // 4. Audio Input (Microphone -> PCM -> WS)
    const micWorkletRef = useRef<AudioWorkletNode | null>(null);

    const startAudioInput = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            streamRef.current = stream;

            const AudioContextCtor =
                window.AudioContext ||
                (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextCtor) throw new Error('AudioContext not supported');

            const audioCtx = new AudioContextCtor({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;

            await audioCtx.audioWorklet.addModule('/mic-processor.js');

            // [RACE-CONDITION FIX] Ensure context wasn't closed during the async addModule call
            if (audioCtx.state === 'closed') {
                console.warn('[Audio] Context closed during init, aborting startAudioInput');
                return;
            }

            const source = audioCtx.createMediaStreamSource(stream);
            const micNode = new AudioWorkletNode(audioCtx, 'mic-processor');
            micWorkletRef.current = micNode;

            micNode.port.onmessage = (e) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                const pcm16 = e.data as Int16Array;

                // [CPU-OPTIMIZATION] Offload Base64 encoding to Client
                // Cloudflare Worker has 10ms CPU limit. We must send JSON directly.
                const base64 = arrayBufferToBase64(pcm16.buffer);

                wsRef.current.send(JSON.stringify({
                    realtime_input: {
                        media_chunks: [{
                            mime_type: 'audio/pcm;rate=16000',
                            data: base64,
                        }],
                    },
                }));
            };

            // Helper for client-side Base64
            function arrayBufferToBase64(buffer: any) {
                let binary = '';
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return btoa(binary);
            }

            source.connect(micNode);
            // micNode.connect(audioCtx.destination); // We don't want to hear ourselves

        } catch (e: unknown) {
            console.error('Mic Access Failed', e);
            setError('Microphone access denied');
        }
    };

    const stopAudioInput = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (micWorkletRef.current) {
            micWorkletRef.current.disconnect();
            micWorkletRef.current = null;
        }

        const ctx = audioContextRef.current;
        audioContextRef.current = null; // Prevent double-close

        if (ctx && ctx.state !== 'closed') {
            ctx.close().catch(e => {
                // Ignore benign errors if context is already closed/closing
                if (e.name === 'InvalidStateError') return;
                console.error('Error closing AudioContext:', e);
            });
        }
    };

    const disconnect = useCallback(() => {
        if (wsRef.current) wsRef.current.close();
        stopAudioInput();
        setIsConnected(false);
    }, []);

    useEffect(() => {
        return () => disconnect();
    }, [disconnect]);

    return { connect, disconnect, isConnected, isSpeaking, error };
}
