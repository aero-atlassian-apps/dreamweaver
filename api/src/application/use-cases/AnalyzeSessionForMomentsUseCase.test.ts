import { describe, it, expect, vi } from 'vitest'
import { AnalyzeSessionForMomentsUseCase } from './AnalyzeSessionForMomentsUseCase'

describe('AnalyzeSessionForMomentsUseCase', () => {
    it('falls back to recent story when no session memories exist', async () => {
        const memory = {
            retrieve: vi.fn().mockResolvedValue([])
        } as any

        const momentRepo = { save: vi.fn() } as any
        const storyRepo = {
            findRecent: vi.fn().mockResolvedValue([{
                id: 'story_1',
                title: 'T1',
                audioUrl: 'https://example.com/a.mp3',
                content: { paragraphs: ['p1', 'p2'] }
            }])
        } as any

        const ai = {
            generateStructured: vi.fn().mockResolvedValue({ found: true, description: 'A moment', confidence: 0.9 })
        } as any

        const promptService = { getMemoryCuratorSystemPrompt: vi.fn().mockReturnValue('sys') } as any
        const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any
        const verification = { verify: vi.fn().mockResolvedValue({ approved: true }) } as any

        const useCase = new AnalyzeSessionForMomentsUseCase(
            memory,
            momentRepo,
            storyRepo,
            ai,
            promptService,
            logger,
            verification
        )

        await useCase.execute('session_1', 'user_1')

        expect(ai.generateStructured).toHaveBeenCalled()
        expect(momentRepo.save).toHaveBeenCalled()
    })
})

