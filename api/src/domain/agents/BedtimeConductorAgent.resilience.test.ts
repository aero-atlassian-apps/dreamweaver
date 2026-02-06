import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent.js'
import { QualityGate, QualityGateError } from '../services/QualityGate.js'
import { AIServicePort } from '../../application/ports/AIServicePort.js'
import { PromptServicePort } from '../../application/ports/PromptServicePort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

import { SessionStatePort } from '../../application/ports/SessionStatePort.js'

describe('BedtimeConductorAgent Resilience', () => {
    let agent: BedtimeConductorAgent
    let mockAI: AIServicePort
    let mockGate: QualityGate
    let mockLogger: LoggerPort
    let mockSessionState: SessionStatePort

    beforeEach(() => {
        mockAI = {
            generateAgentThought: vi.fn(),
            generateStructured: vi.fn(),
            generateText: vi.fn()
        } as unknown as AIServicePort

        mockGate = {
            checkMetric: vi.fn()
        } as unknown as QualityGate

        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
        } as unknown as LoggerPort

        mockSessionState = {
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue(true)
        } as unknown as SessionStatePort

        agent = new BedtimeConductorAgent(
            mockAI,
            { formatAgentObservation: () => 'obs', getConductorSystemPrompt: () => 'sys', getStartStoryTrigger: () => 'start' } as unknown as PromptServicePort,
            mockSessionState,
            { assessFailure: async () => ({ action: 'DEGRADE_SERVICE', model: 'edge', estimatedCost: 0 }) } as any,
            undefined,
            mockLogger,
            undefined,
            mockGate
        )
    })

    it('should engage SAFE_MODE when QualityGate throws Critical Error', async () => {
        // Arrange: Gate throws QualityGateError on checkMetric
        // Arrange: AI Service throws QualityGateError (simulating a breach detected during thought generation or pre-check)
        vi.mocked(mockAI.generateAgentThought).mockImplementation(() => {
            throw new QualityGateError({
                metric: 'LATENCY_MS',
                currentValue: 5000,
                threshold: 2000,
                severity: 'CRITICAL',
                timestamp: new Date()
            })
        })

        // Act
        const result = await agent.conductStorySession({ theme: 'dragons' })

        // Assert
        expect(result.reasoningTrace[0].action).toBe('SAFE_MODE')
        expect(result.reasoningTrace[0].thought).toContain('Quality Gate Breached')
        expect(result.contextualNotes).toBe('Safe Mode active.')
    })
})
