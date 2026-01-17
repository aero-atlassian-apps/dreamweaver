/**
 * Unit tests for GenerateStoryUseCase
 * 
 * Tests the story generation use case with mocked AI service port
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GenerateStoryUseCase } from './GenerateStoryUseCase'
import type { AIServicePort, GeneratedStory } from '../ports/AIServicePort'

// Mock AI Service
class MockAIService implements AIServicePort {
    async generateStory(): Promise<GeneratedStory> {
        return {
            title: 'Test Story',
            content: 'Once upon a time.\n\nThe end.',
            sleepScore: 8,
        }
    }
}

describe('GenerateStoryUseCase', () => {
    let useCase: GenerateStoryUseCase
    let mockAIService: MockAIService

    beforeEach(() => {
        mockAIService = new MockAIService()
        useCase = new GenerateStoryUseCase(mockAIService)
    })

    it('generates a story with valid theme', async () => {
        const result = await useCase.execute({ theme: 'space' })

        expect(result.story).toBeDefined()
        expect(result.story.title).toBe('Test Story')
        expect(result.story.theme).toBe('space')
        expect(result.story.status).toBe('completed')
    })

    it('returns estimated reading time', async () => {
        const result = await useCase.execute({ theme: 'animals' })

        expect(result.estimatedReadingTime).toBeGreaterThan(0)
    })

    it('throws error when theme is empty', async () => {
        await expect(useCase.execute({ theme: '' }))
            .rejects
            .toThrow('Theme is required')
    })

    it('throws error when child age is out of range', async () => {
        await expect(useCase.execute({ theme: 'fantasy', childAge: 15 }))
            .rejects
            .toThrow('Child age must be between 2 and 12')
    })

    it('creates story with generated ID', async () => {
        const result = await useCase.execute({ theme: 'ocean' })

        expect(result.story.id).toMatch(/^story_/)
    })

    it('calls AI service with correct parameters', async () => {
        const spy = vi.spyOn(mockAIService, 'generateStory')

        await useCase.execute({
            theme: 'robots',
            childName: 'Emma',
            childAge: 5,
        })

        expect(spy).toHaveBeenCalledWith({
            theme: 'robots',
            childName: 'Emma',
            childAge: 5,
            duration: undefined,
            style: 'bedtime',
        })
    })
})
