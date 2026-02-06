/**
 * ManageSleepCycleUseCase Integration Test
 */
import { describe, it, expect } from 'vitest'
import { ServiceContainer } from '../../di/container'
import type { LiveSessionPort } from '../ports/AIServicePort'

describe('ManageSleepCycleUseCase (Integration)', () => {
    it('should orchestrate the full sleep detection loop', async () => {
        // 1. Setup DI Container (Singleton)
        const container = ServiceContainer.getInstance()

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

        container.sleepSentinelAgent.monitorLiveSession(session, 'session-123', '123e4567-e89b-12d3-a456-426614174003')
        const silent = new Int16Array(320).fill(0).buffer
        for (let i = 0; i < 200; i++) {
            onAudio!(silent)
        }

        // 3. Execute multiple times (Temporal Accumulation)
        const validUserId = '123e4567-e89b-12d3-a456-426614174003'
        const result = await container.manageSleepCycleUseCase.execute({
            userId: validUserId,
            sessionId: 'session-123'
        })

        // 4. Assertions
        expect(result.status).toBe('action_taken')
        expect(result.confidence).toBeGreaterThanOrEqual(0.9)
        expect(result.reasoningTrace.length).toBe(1)
        expect(result.reasoningTrace[0].goals_considered).toContain('RELAXATION')

        // Verify Transparency Log (Console)
        // (In a real test we'd spy on the logger)
    })
})
