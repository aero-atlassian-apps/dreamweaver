import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProcessConversationTurnUseCase } from './ProcessConversationTurnUseCase.js'
import { BedtimeConductorAgent } from '../../domain/agents/BedtimeConductorAgent.js'
import { LoggerPort } from '../ports/LoggerPort.js'
import { AgentMemoryPort } from '../ports/AgentMemoryPort.js'

describe('ProcessConversationTurnUseCase', () => {
    let useCase: ProcessConversationTurnUseCase
    let mockAgent: any
    let mockLogger: any
    let mockMemory: any

    beforeEach(() => {
        mockAgent = {
            processTurn: vi.fn().mockResolvedValue({
                reply: 'Hello!',
                trace: [{ type: 'trace_object' }]
            })
        }
        mockLogger = {
            info: vi.fn(),
            debug: vi.fn(),
        }
        mockMemory = {
            store: vi.fn(),
        }

        useCase = new ProcessConversationTurnUseCase(
            mockAgent as unknown as BedtimeConductorAgent,
            mockLogger as unknown as LoggerPort,
            mockMemory as unknown as AgentMemoryPort
        )
    })

    it('should store user message and agent reply with traceId', async () => {
        const request = {
            userId: 'u1',
            sessionId: 's1',
            message: 'Hi there'
        }

        await useCase.execute(request)

        // 1. Verify User Message Stored with Trace Anchor
        expect(mockMemory.store).toHaveBeenCalledWith(
            'Hi there',
            'EPISODIC',
            { userId: 'u1', sessionId: 's1' },
            expect.objectContaining({
                traceId: expect.stringMatching(/^trace_/),
                role: 'user'
            })
        )

        // 2. Verify Agent Reply Stored with Trace Anchor
        expect(mockMemory.store).toHaveBeenCalledWith(
            'Hello!',
            'EPISODIC',
            { userId: 'u1', sessionId: 's1' },
            expect.objectContaining({
                traceId: expect.stringMatching(/^trace_/),
                role: 'agent'
            })
        )

        // Ensure called twice
        expect(mockMemory.store).toHaveBeenCalledTimes(2)
    })
})
