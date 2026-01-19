/**
 * SleepSentinelAgent Test Suite
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SleepSentinelAgent } from './SleepSentinelAgent'
import { AudioSensorPort } from '../../application/ports/AudioSensorPort'
import { EventBusPort } from '../../application/ports/EventBusPort'

describe('SleepSentinelAgent', () => {
    // Mocks
    const mockSensor: AudioSensorPort = {
        getAmbientVolume: vi.fn(),
        detectBreathingPattern: vi.fn()
    }
    const mockEventBus: EventBusPort = {
        publish: vi.fn(),
        subscribe: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should generate a reasoning trace and publish event when sleep cues are detected', async () => {
        // Setup Logic
        vi.mocked(mockSensor.getAmbientVolume).mockResolvedValue(0.05) // Quiet
        vi.mocked(mockSensor.detectBreathingPattern).mockResolvedValue('rhythmic') // Asleep

        const sentinel = new SleepSentinelAgent(mockSensor, mockEventBus)

        // Execute
        const trace = await sentinel.evaluateEnvironment()

        // Verify Trace
        expect(trace.length).toBeGreaterThan(0)
        expect(trace.some(t => t.step === 'OBSERVATION')).toBeTruthy()
        expect(trace.some(t => t.step === 'CONCLUSION' && t.content.includes('High sleep probability'))).toBeTruthy()

        // Verify Action
        expect(mockEventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
            type: 'SLEEP_CUE_DETECTED',
            payload: expect.objectContaining({
                cue: 'breathing',
                confidence: 0.9 // 0.3 + 0.6
            })
        }))
    })

    it('should stay idle when environment is noisy', async () => {
        // Setup Logic
        vi.mocked(mockSensor.getAmbientVolume).mockResolvedValue(0.8) // Loud
        vi.mocked(mockSensor.detectBreathingPattern).mockResolvedValue('chaotic') // Awake

        const sentinel = new SleepSentinelAgent(mockSensor, mockEventBus)

        // Execute
        const trace = await sentinel.evaluateEnvironment()

        // Verify Trace
        expect(trace.some(t => t.step === 'CONCLUSION' && t.content.includes('Subject awake'))).toBeTruthy()

        // Verify No Action
        expect(mockEventBus.publish).not.toHaveBeenCalled()
    })
})
