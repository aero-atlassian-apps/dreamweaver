/**
 * useDemoGeminiLive Hook
 * 
 * Client-side "Blind Relay" engine for DEMO MODE.
 * Bypasses standard AuthContext and uses /api/v1/demo endpoints.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { audioStreamer } from '../../infrastructure/audio/AudioStreamer'
import { apiFetch, getApiBase, stripApiVersionFromBase } from '../../infrastructure/api/apiClient'

const WS_BASE = import.meta.env['VITE_WS_BASE_URL'] || stripApiVersionFromBase(getApiBase())

export interface UseDemoGeminiLiveReturn {
    connect: (childName: string, childAge: number) => Promise<void>;
    disconnect: () => void;
    isConnected: boolean;
    isSpeaking: boolean;
    error: string | null;
}

export function useDemoGeminiLive(): UseDemoGeminiLiveReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sessionIdRef = useRef<string>('demo-session')
    const traceIdRef = useRef<string | null>(null)

    // 1. Initialize Session (Fetch Config + Connect WS)
    const connect = async (childName: string, childAge: number) => {
        try {
            setError(null);

            // A. Fetch "Blind" Config from ALL-NEW DEMO endpoint
            // No Authorization header needed (public demo)
            const response = await apiFetch(`/api/v1/demo/live/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ childName, childAge })
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
                const message = parsed?.error || `Failed to init demo session (${response.status})`
                throw new Error(message)
            }

            const { config, ticket, traceId, sessionId } = (parsed || {}) as { config: unknown; ticket: unknown; traceId?: unknown; sessionId?: unknown }

            if (typeof ticket !== 'string' || ticket.length === 0) throw new Error('Missing live ticket')

            if (typeof sessionId === 'string') sessionIdRef.current = sessionId
            traceIdRef.current = typeof traceId === 'string' && traceId.length > 0 ? traceId : null

            const wsHttpBase = (WS_BASE || window.location.origin).replace(/\/+$/, '')
            const wsApiBase = wsHttpBase
                .replace(/^https:/, 'wss:')
                .replace(/^http:/, 'ws:')

            // Connect to STANDARD Live WebSocket (ticket handles auth)
            const ws = new WebSocket(`${wsApiBase}/api/v1/live/ws`, ['dw.live.v1', `ticket.${ticket}`]);
            ws.binaryType = 'arraybuffer';
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

            ws.onclose = (event) => {
                console.log('[GeminiLive] WS Closed:', event.code, event.reason);
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
        // [BINARY PROTOCOL] Audio Frames
        if (event.data instanceof ArrayBuffer) {
            setIsSpeaking(true);
            audioStreamer.enqueue(event.data);
            audioStreamer.resume();
            return;
        }

        if (event.data instanceof Blob) {
            const buffer = await event.data.arrayBuffer();
            setIsSpeaking(true);
            audioStreamer.enqueue(buffer);
            audioStreamer.resume();
            return;
        }

        // [TEXT PROTOCOL] JSON Events
        let data;
        try {
            data = JSON.parse(event.data);
        } catch { return; }

        if (data.serverContent?.interrupted) {
            console.log('[GeminiLive] Interrupted by Server')
            audioStreamer.stop()
            setIsSpeaking(false)
        }

        if (data.serverContent?.turnComplete) {
            setIsSpeaking(false);
        }

        if (data.serverContent?.sleepDetection?.isAsleep) {
            console.log('[GeminiLive] Sleep Detected by Sentinel');
            window.dispatchEvent(new CustomEvent('dreamweaver:sleep_cue'));
        }

        // C. Tool Call (The "Blind Relay")
        if (data.toolCall) {
            const toolCall = data.toolCall.functionCalls[0];
            await handleToolCall(toolCall);
        }
    };

    // 3. Blind Relay: Execute Tool on Backend (DEMO ENDPOINT)
    const handleToolCall = async (toolCall: unknown) => {
        try {
            const call = toolCall as { name?: unknown; args?: unknown; id?: unknown }
            if (typeof call.name !== 'string') return

            console.log('[Client] Relaying Tool Call (Demo):', call.name);

            // Call DEMO tool endpoint
            const response = await apiFetch(`/api/v1/demo/live/tool`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // No Authorization - Demo User implied (or validated by session ownership on backend for robustness if we had token)
                    // Currently relying on backend check of session ownership (which is tied to Demo User)
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
                wsRef.current.send(pcm16.buffer);
            };

            source.connect(micNode);

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
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
        audioContextRef.current = null;
    };

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        stopAudioInput();
        setIsConnected(false);
    }, []);

    useEffect(() => {
        return () => disconnect();
    }, [disconnect]);

    return { connect, disconnect, isConnected, isSpeaking, error };
}
