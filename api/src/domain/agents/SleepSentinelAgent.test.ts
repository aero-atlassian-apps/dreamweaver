/**
 * SleepSentinelAgent Test Suite
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SleepSentinelAgent } from './SleepSentinelAgent'
import type { LiveSessionPort } from '../../application/ports/AIServicePort'
import { EventBusPort } from '../../application/ports/EventBusPort'

describe('SleepSentinelAgent', () => {
    const mockEventBus: EventBusPort = {
        publish: vi.fn(),
        subscribe: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should publish sleep cue when prolonged quiet audio is detected', async () => {
        let onAudio: ((chunk: ArrayBuffer) => void) | null = null
        let onInterruption: (() => void) | null = null

        const session: LiveSessionPort = {
            sendAudio: () => { },
            sendText: () => { },
            onAudio: (h) => { onAudio = h },
            onText: () => { },
            onToolCall: () => { },
            onInterruption: (h) => { onInterruption = h },
            onClose: () => { },
            sendToolResponse: () => { },
            disconnect: () => { }
        }

        const sentinel = new SleepSentinelAgent(mockEventBus)
        sentinel.monitorLiveSession(session, 'test_session', 'test_user', 'trace_1')

        expect(onAudio).not.toBeNull()
        expect(onInterruption).not.toBeNull()

        const silent = new Int16Array(320).fill(0).buffer

        for (let i = 0; i < 200; i++) {
            onAudio!(silent)
        }

        expect(mockEventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
            type: 'SLEEP_CUE_DETECTED',
            payload: expect.objectContaining({
                userId: 'test_user',
                sessionId: 'test_session',
            })
        }))
    })

    it('should decrease confidence on interruption', async () => {
        let onAudio: ((chunk: ArrayBuffer) => void) | null = null
        let onInterruption: (() => void) | null = null

        const session: LiveSessionPort = {
            sendAudio: () => { },
            sendText: () => { },
            onAudio: (h) => { onAudio = h },
            onText: () => { },
            onToolCall: () => { },
            onInterruption: (h) => { onInterruption = h },
            onClose: () => { },
            sendToolResponse: () => { },
            disconnect: () => { }
        }

        const sentinel = new SleepSentinelAgent(mockEventBus)
        sentinel.monitorLiveSession(session, 'test_session', 'test_user', 'trace_1')

        const silent = new Int16Array(320).fill(0).buffer
        for (let i = 0; i < 80; i++) {
            onAudio!(silent)
        }
        const before = sentinel.getStatus().currentConfidence
        onInterruption!()
        const after = sentinel.getStatus().currentConfidence
        expect(after).toBeLessThan(before)

    })

    it('should emit a breathing cue when a steady cadence is detected', async () => {
        let onAudio: ((chunk: ArrayBuffer) => void) | null = null

        const session: LiveSessionPort = {
            sendAudio: () => { },
            sendText: () => { },
            onAudio: (h) => { onAudio = h },
            onText: () => { },
            onToolCall: () => { },
            onInterruption: () => { },
            onClose: () => { },
            sendToolResponse: () => { },
            disconnect: () => { }
        }

        const sentinel = new SleepSentinelAgent(mockEventBus)
        sentinel.monitorLiveSession(session, 'test_session', 'test_user', 'trace_1')

        expect(onAudio).not.toBeNull()

        const sampleRateHz = 16_000
        const chunkSamples = 320
        const dtSeconds = chunkSamples / sampleRateHz
        const breathingHz = 0.3

        for (let i = 0; i < 900; i++) {
            const t = i * dtSeconds
            const envelope = 0.02 + 0.015 * Math.sin(2 * Math.PI * breathingHz * t)
            const sample = Math.max(0, Math.min(0.049, envelope))
            const v = Math.floor(sample * 32768)
            const chunk = new Int16Array(chunkSamples).fill(v).buffer
            onAudio!(chunk)
        }

        expect(mockEventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
            type: 'SLEEP_CUE_DETECTED',
            payload: expect.objectContaining({
                cue: 'breathing'
            })
        }))
    })
})
