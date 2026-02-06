
/**
 * GenerateStoryUseCase Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GenerateStoryUseCase } from './GenerateStoryUseCase'
import type { AIServicePort } from '../ports/AIServicePort'
import type { StoryRepositoryPort } from '../ports/StoryRepositoryPort'
import type { EventBusPort } from '../ports/EventBusPort'
import type { TextToSpeechPort } from '../ports/TextToSpeechPort'
import { BedtimeConductorAgent } from '../../domain/agents/BedtimeConductorAgent'
import { InMemoryAgentMemory } from '../../infrastructure/memory/InMemoryAgentMemory'
import { InMemorySessionState } from '../../infrastructure/adapters/InMemorySessionState'
import { MockAIService } from '../../infrastructure/adapters/MockAIService'
import { CheckUnlockUseCase } from './CheckUnlockUseCase'
import { PromptAdapter } from '../../infrastructure/ai/PromptAdapter' // Added import
import { StoryContent } from '../../domain/value-objects/StoryContent' // Added import

describe('GenerateStoryUseCase', () => {
    let useCase: GenerateStoryUseCase
    let aiService: AIServicePort
    let repository: StoryRepositoryPort
    let eventBus: EventBusPort
    let ttsService: TextToSpeechPort
    let agent: BedtimeConductorAgent
    let checkUnlock: CheckUnlockUseCase
    let promptAdapter: PromptAdapter // Added declaration

    beforeEach(() => {
        // Explicitly mock AIServicePort as an object to ensure spies are reliable
        aiService = {
            generateStory: vi.fn().mockResolvedValue({
                title: 'Mock Title',
                content: 'Once upon a time...',
                metadata: { theme: 'dragons' }
            }),
            generateAgentThought: vi.fn().mockImplementation(async (input: any) => {
                // The observation combines user input and memory context.
                // This mock simulates the agent's thought process based on input.
                if (input.userMessage && input.userMessage.includes('dragons')) {
                    return {
                        goals_considered: ['RECOGNITION'],
                        thought: 'Thinking about dragons from memory.',
                        action: 'START_STORY',
                        confidence: 1.0,
                        parameters: {}
                    }
                }
                // Default behavior for other inputs
                return {
                    goals_considered: ['RELAXATION'],
                    thought: 'Thinking...',
                    action: 'START_STORY',
                    confidence: 1.0,
                    parameters: {}
                }
            }),

            generateStoryStream: vi.fn(),
            startLiveSession: vi.fn(), // Added missing method
        } as unknown as AIServicePort

        repository = {
            save: vi.fn().mockResolvedValue(undefined),
            findById: vi.fn(),
            findByUserId: vi.fn().mockResolvedValue([]),
            findRecent: vi.fn()
        }

        eventBus = {
            publish: vi.fn().mockResolvedValue(undefined),
            subscribe: vi.fn()
        }

        ttsService = {
            synthesize: vi.fn().mockResolvedValue({
                audioUrl: 'http://audio.mp3',
                durationSeconds: 10,
                format: 'mp3',
                audioBase64: 'base64'
            }),
            cloneVoice: vi.fn(),
            listVoices: vi.fn(),
            supportsCloning: vi.fn()
        }

        promptAdapter = new PromptAdapter() // Instantiated PromptAdapter
        const sessionState = new InMemorySessionState()
        const resilienceEngine = { assessFailure: async () => ({ action: 'FALLBACK', model: 'edge', estimatedCost: 0 }) }
        agent = new BedtimeConductorAgent(aiService, promptAdapter, sessionState, resilienceEngine as any, new InMemoryAgentMemory())
        checkUnlock = new CheckUnlockUseCase(
            repository,
            { info: () => { } } as any,
            { listBlockedCharacterIds: async () => [] } as any,
            { listUnlockedByUserId: async () => [], upsertUnlock: async () => { } } as any
        )

        useCase = new GenerateStoryUseCase(
            aiService,
            agent,
            checkUnlock,
            promptAdapter, // Injected PromptAdapter
            repository,
            eventBus,
            ttsService
        )
    })

    it('should orchestrate story generation flow', async () => {
        const request = {
            theme: 'dragons',
            childName: 'Timmy',
            childAge: 5,
            userId: '123e4567-e89b-12d3-a456-426614174002',
            mood: 'energetic' as const
        }

        const result = await useCase.execute(request)

        expect(result.story).toBeDefined()
        expect(result.story.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        expect(result.story.title).toBe('Mock Title')
        expect(result.audioUrl).toBe('http://audio.mp3')

        // Verify Agent was consulted
        // We know agent.conductStorySession logic runs. 
        // We can spy on it but using real (in-memory) agent is fine for "sociable" unit test

        // Verify AI call
        expect(aiService.generateStory).toHaveBeenCalled()

        // Verify Persistence
        expect(repository.save).toHaveBeenCalled()

        // Verify Event Bus
        expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
            type: 'STORY_BEAT_COMPLETED'
        }))
    })

    it('should validate request', async () => {
        const invalidRequest = {
            theme: '',
            userId: '123e4567-e89b-12d3-a456-426614174002'
        }

        await expect(useCase.execute(invalidRequest))
            .rejects
            .toThrow('Theme is required')
    })
})
