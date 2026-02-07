/**
 * Core Features Verification Suite
 * 
 * Verifies the critical paths of the Real App:
 * 1. Story Generation with AI
 * 2. Voice Cloning Integration (Profile Fetching -> TTS)
 * 3. Event Bus & Persistence
 * 4. Safety Guardian Wiring
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GenerateStoryUseCase } from '../application/use-cases/GenerateStoryUseCase'
import { AIServicePort } from '../application/ports/AIServicePort'
import { StoryRepositoryPort } from '../application/ports/StoryRepositoryPort'
import { EventBusPort } from '../application/ports/EventBusPort'
import { TextToSpeechPort } from '../application/ports/TextToSpeechPort'
import { VoiceRepositoryPort } from '../application/ports/VoiceRepositoryPort'
import { PromptAdapter } from '../infrastructure/ai/PromptAdapter'
import { BedtimeConductorAgent } from '../domain/agents/BedtimeConductorAgent'
import { InMemorySessionState } from '../infrastructure/adapters/InMemorySessionState'
import { InMemoryAgentMemory } from '../infrastructure/memory/InMemoryAgentMemory'
import { CheckUnlockUseCase } from '../application/use-cases/CheckUnlockUseCase'
import { SafetyGuardian } from '../domain/services/SafetyGuardian'
import { VoiceProfile } from '../domain/entities/VoiceProfile'

describe('Core Features Verification', () => {
    let useCase: GenerateStoryUseCase
    let aiService: AIServicePort
    let storyRepo: StoryRepositoryPort
    let voiceRepo: VoiceRepositoryPort
    let eventBus: EventBusPort
    let ttsService: TextToSpeechPort
    let safetyGuardian: SafetyGuardian

    beforeEach(() => {
        // 1. Mock AI Service (Success Case)
        aiService = {
            generateStory: vi.fn().mockResolvedValue({
                title: 'The Brave Little Verified Tool',
                content: 'Once upon a time there was a tool that verified everything...',
                metadata: {}
            }),
            generateStoryStream: vi.fn(),
            generateAgentThought: vi.fn().mockResolvedValue({
                action: 'START_STORY',
                thought: 'User wants a story',
                confidence: 1.0,
                parameters: {},
                goals_considered: []
            }),
            startLiveSession: vi.fn(),
            checkSafety: vi.fn().mockResolvedValue({ isSafe: true })
        } as unknown as AIServicePort

        // 2. Mock Repositories
        storyRepo = {
            save: vi.fn().mockResolvedValue(undefined),
            findById: vi.fn(),
            findByUserId: vi.fn().mockResolvedValue([]), // Return empty array
            findRecent: vi.fn()
        }

        voiceRepo = {
            findById: vi.fn(),
            uploadVoice: vi.fn(),
            findByUserId: vi.fn(),
            save: vi.fn()
        }

        // 3. Mock Infrastructure
        eventBus = { publish: vi.fn().mockResolvedValue(undefined) } as unknown as EventBusPort
        ttsService = { synthesize: vi.fn().mockResolvedValue({ audioUrl: 'http://tts.com/audio.mp3', durationSeconds: 60 }) } as unknown as TextToSpeechPort

        // 4. Setup Domain Services
        const promptAdapter = new PromptAdapter()
        const agent = new BedtimeConductorAgent(
            aiService,
            promptAdapter,
            new InMemorySessionState(),
            { assessFailure: async () => ({ action: 'FALLBACK' }) } as any,
            new InMemoryAgentMemory()
        )
        const loggerMock = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
        const checkUnlock = new CheckUnlockUseCase(
            storyRepo,
            loggerMock,
            { listBlockedCharacterIds: async () => [] } as any,
            { listUnlockedByUserId: async () => [], upsertUnlock: async () => { } } as any
        )

        // Mock SafetyGuardian explicitly to verify it's called
        safetyGuardian = new SafetyGuardian(aiService, promptAdapter, loggerMock)
        vi.spyOn(safetyGuardian, 'checkContent').mockResolvedValue({ isSafe: true, sanitizedContent: undefined })

        // 5. Instantiate Use Case
        useCase = new GenerateStoryUseCase(
            aiService,
            agent,
            checkUnlock,
            promptAdapter,
            storyRepo,
            eventBus,
            ttsService,
            { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }, // Logger
            undefined, // AmbientContext
            safetyGuardian, // Injected SafetyGuardian
            voiceRepo // Injected VoiceRepo
        )
    })

    it('VERIFY: Voice Cloning Integration (Profile -> TTS)', async () => {
        // Arrange: Mock a ready Voice Profile with a URL (simulating a clone)
        const mockUserId = '123e4567-e89b-12d3-a456-426614174002'
        const mockVoiceId = '987fcdeb-51a2-43c1-9876-543210987654'
        const mockCloneUrl = 'http://huggingface.co/my-clone/sample.wav'

        const mockProfile = VoiceProfile.create({
            id: mockVoiceId,
            userId: mockUserId,
            name: 'My Clone',
            status: 'ready'
        }, mockVoiceId)

        vi.spyOn(voiceRepo, 'findById').mockResolvedValue(mockProfile)

        // Hack to set internal state if public setter not available
        Object.defineProperty(mockProfile, '_voiceModelId', { value: mockCloneUrl })
        Object.defineProperty(mockProfile, '_status', { value: 'ready' })

        // Act
        await useCase.execute({
            theme: 'test',
            childName: 'Tester',
            childAge: 5,
            userId: mockUserId,
            voiceProfileId: mockVoiceId
        })

        // Assert 1: Repository was called to fetch profile
        expect(voiceRepo.findById).toHaveBeenCalledWith(mockVoiceId)

        // Assert 2: TTS Service received the CLONE URL (from voiceModelId), not the Profile ID
        expect(ttsService.synthesize).toHaveBeenCalledWith(expect.objectContaining({
            voiceProfile: { voiceModelId: mockCloneUrl }
        }))
    })

    it('VERIFY: Safety Guardian & Event Bus', async () => {
        // Act
        const mockUserId = '123e4567-e89b-12d3-a456-426614174002'
        const result = await useCase.execute({
            theme: 'safety check',
            childName: 'SafeTimmy',
            childAge: 5,
            userId: mockUserId
        })

        // Assert 1: Safety Check ran
        expect(safetyGuardian.checkContent).toHaveBeenCalled()

        // Assert 2: Story Saved
        expect(storyRepo.save).toHaveBeenCalled()

        // Assert 3: Events Published (Beats + Completion)
        expect(eventBus.publish).toHaveBeenCalled()
        expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
            type: 'STORY_GENERATION_COMPLETED'
        }))
    })
})
