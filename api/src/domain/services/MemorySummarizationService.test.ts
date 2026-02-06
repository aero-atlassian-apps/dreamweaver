import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemorySummarizationService } from './MemorySummarizationService.js'
import { AgentMemoryPort, AgentContext } from '../../application/ports/AgentMemoryPort.js'
import { AIServicePort } from '../../application/ports/AIServicePort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

describe('MemorySummarizationService (Ralph Loop)', () => {
    let service: MemorySummarizationService
    let mockMemory: AgentMemoryPort
    let mockAI: AIServicePort
    let mockLogger: LoggerPort
    const mockPromptService = {
        getMemorySummarizerSystemPrompt: () => 'Memory Summarizer System Prompt'
    } as any

    beforeEach(() => {
        mockMemory = {
            retrieve: vi.fn(),
            store: vi.fn(),
            trackOutcome: vi.fn(),
            getThemeStats: vi.fn(),
            trackPreferencePair: vi.fn()
        } as unknown as AgentMemoryPort

        mockAI = {
            generateAgentThought: vi.fn(),
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

        service = new MemorySummarizationService(mockMemory, mockAI, mockPromptService, mockLogger)
    })

    it('should retrieve episodic memories and store semantic facts with anchors', async () => {
        // Arrange
        const sessionId = 'session-123'
        const userId = 'user-456'

        vi.mocked(mockMemory.retrieve).mockResolvedValue([
            { id: '1', type: 'EPISODIC', content: 'Child said they love dinosaurs', confidence: 1, timestamp: new Date() },
            { id: '2', type: 'EPISODIC', content: 'Child asked for a story about T-Rex', confidence: 1, timestamp: new Date() }
        ])

        vi.mocked(mockAI.generateStructured).mockResolvedValue([
            {
                fact: "Child loves dinosaurs",
                confidence: 0.9,
                lineReference: 0
            },
            {
                fact: "Child likes T-Rex",
                confidence: 0.95,
                lineReference: 1
            }
        ])

        // Act
        await service.summarizeSession(sessionId, userId)

        // Assert
        expect(mockMemory.retrieve).toHaveBeenCalledWith('*', { userId, sessionId }, 'EPISODIC', 50)
        expect(mockAI.generateStructured).toHaveBeenCalled()

        // Verify storage
        expect(mockMemory.store).toHaveBeenCalledTimes(2)
        expect(mockMemory.store).toHaveBeenCalledWith(
            'Child loves dinosaurs',
            'SEMANTIC',
            { userId, sessionId },
            expect.objectContaining({
                anchor: { sessionId, transcriptOffset: 0 }
            })
        )
    })

    it('should handle empty memories gracefully', async () => {
        vi.mocked(mockMemory.retrieve).mockResolvedValue([])

        await service.summarizeSession('session-empty', 'user-1')

        expect(mockAI.generateStructured).not.toHaveBeenCalled()
        expect(mockMemory.store).not.toHaveBeenCalled()
    })
})
