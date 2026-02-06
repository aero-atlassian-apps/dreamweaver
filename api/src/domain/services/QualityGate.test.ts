import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QualityGate } from './QualityGate.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

describe('QualityGate', () => {
    let gate: QualityGate
    let mockLogger: LoggerPort

    beforeEach(() => {
        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
        }
        gate = new QualityGate(mockLogger)
    })

    it('should NOT alert if metric is within limits', () => {
        gate.checkMetric('LATENCY_MS', 500) // Limit is 1500 warn
        expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it('should trigger WARNING alert if metric exceeds warn threshold', () => {
        gate.checkMetric('LATENCY_MS', 2000) // Limit 1500
        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('WARNING'))
    })

    it('should trigger CRITICAL alert if metric exceeds critical threshold', () => {
        expect(() => gate.checkMetric('LATENCY_MS', 4000)).toThrow('Quality Gate Breach')
        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('CRITICAL'))
    })

    it('should handle direction: below metrics (UCR)', () => {
        gate.checkMetric('UCR', 0.95) // Good
        expect(mockLogger.warn).not.toHaveBeenCalled()

        expect(() => gate.checkMetric('UCR', 0.60)).toThrow('Quality Gate Breach')
        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('CRITICAL'))
    })
})
