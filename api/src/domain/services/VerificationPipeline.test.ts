import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VerificationPipeline } from './VerificationPipeline.js'
import { AIServicePort } from '../../application/ports/AIServicePort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

describe('VerificationPipeline (GKD)', () => {
    let pipeline: VerificationPipeline
    let mockAI: AIServicePort
    let mockLogger: LoggerPort
    const mockPromptService = {
        getVerificationValidatorSystemPrompt: () => 'Verification System Prompt'
    } as any
    const mockHumanReviewQueue = {
        enqueue: vi.fn()
    } as any

    beforeEach(() => {
        mockAI = {
            generateText: vi.fn(),
            generateStream: vi.fn(),
            generateStructured: vi.fn()
        } as unknown as AIServicePort

        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
        }

        pipeline = new VerificationPipeline(mockAI, mockPromptService, mockHumanReviewQueue, mockLogger)
    })

    it('should reject INVALID content via Rule Check', async () => {
        const item = {
            type: 'GOLDEN_MOMENT' as const,
            content: { description: 'Too short' }, // < 10 chars
            metadata: {}
        }

        const result = await pipeline.verify(item)

        expect(result.approved).toBe(false)
        expect(result.stage).toBe('RULE')
        expect(mockAI.generateStructured).not.toHaveBeenCalled()
    })

    it('should approve valid content via Model Check', async () => {
        const item = {
            type: 'GOLDEN_MOMENT' as const,
            content: { description: 'This is a sufficiently long description of a golden moment.' },
            metadata: {}
        }

        vi.mocked(mockAI.generateStructured as any).mockResolvedValue({
            approved: true,
            reason: 'Looks good',
            confidence: 0.95
        })

        const result = await pipeline.verify(item)

        expect(result.approved).toBe(true)
        expect(result.stage).toBe('MODEL')
        expect(result.confidence).toBe(0.95)
    })

    it('should flag for HUMAN review if confidence is low', async () => {
        const item = {
            type: 'GOLDEN_MOMENT' as const,
            content: { description: 'Ambiguous moment description.' },
            metadata: {}
        }

        vi.mocked(mockAI.generateStructured as any).mockResolvedValue({
            approved: true,
            reason: 'Maybe okay',
            confidence: 0.6
        })

        const result = await pipeline.verify(item)

        expect(result.approved).toBe(false)
        expect(result.stage).toBe('HUMAN')
    })
})
