/**
 * ProcessConversationTurnUseCase Integration Test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProcessConversationTurnUseCase } from './ProcessConversationTurnUseCase'
import { ServiceContainer } from '../../di/container'
import { InMemoryAgentMemory } from '../../infrastructure/memory/InMemoryAgentMemory'

describe('ProcessConversationTurnUseCase (Integration)', () => {
    let useCase: ProcessConversationTurnUseCase
    let container: ServiceContainer

    beforeEach(() => {
        // We use the real container but might need to reset memory
        container = ServiceContainer.getInstance()
        // Reset memory for isolation (casting to access private property or just use a new instance if possible)
        // Since container is singleton, best is to mock what we can or rely on statelessness

        useCase = container.processConversationTurnUseCase
    })

    it('should orchestrate a full conversation turn', async () => {
        const request = {
            userId: 'user_int_1',
            sessionId: 'session_int_1',
            message: 'Hello Agent'
        }

        const response = await useCase.execute(request)

        expect(response.reply).toBeDefined()
        expect(response.reply).toContain("Hello")
        expect(response.trace).toBeDefined()
        expect(response.trace.length).toBeGreaterThan(0)

        // Check transparency log
        const thought = response.trace.find(t => t.step === 'THOUGHT')
        expect(thought).toBeDefined()
        expect(thought?.content).toContain(request.message)
    })
})
