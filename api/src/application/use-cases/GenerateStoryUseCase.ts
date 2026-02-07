
/**
 * GenerateStoryUseCase - Application use case for story generation
 * 
 * This use case orchestrates the story generation process:
 * 1. Validates input
 * 2. Calls AI service to generate content
 * 3. Creates Story domain entity
 * 4. Optionally saves to repository
 */

import { Story, StoryId } from '../../domain/entities/Story.js'
import { StoryContent } from '../../domain/value-objects/StoryContent.js'
import { AIServicePort, GenerateStoryInput } from '../ports/AIServicePort.js'
import { StoryRepositoryPort } from '../ports/StoryRepositoryPort.js'
import { EventBusPort, StoryBeatCompletedEvent } from '../ports/EventBusPort.js'
import { BedtimeConductorAgent } from '../../domain/agents/BedtimeConductorAgent.js'
import { LoggerPort } from '../ports/LoggerPort.js'
import { TextToSpeechPort } from '../ports/TextToSpeechPort.js'
import { SafetyGuardian } from '../../domain/services/SafetyGuardian.js'
import { PromptServicePort } from '../ports/PromptServicePort.js'
import { CheckUnlockUseCase } from './CheckUnlockUseCase.js'
import { AmbientContextPort } from '../ports/AmbientContextPort.js'
import { VoiceRepositoryPort } from '../ports/VoiceRepositoryPort.js'

export interface GenerateStoryRequest {
    theme: string
    childName?: string
    childAge?: number
    duration?: 'short' | 'medium' | 'long'
    userId?: string // For persistence
    accessToken?: string // [SEC-02] For RLS
    voiceProfileId?: string // Optional voice to use

    // Agentic Context (Metadata passed from frontend)
    mood?: 'energetic' | 'calm' | 'tired'

    // Story Instantiation
    previousStoryId?: string // For "Again!" logic
    requestId?: string
    traceId?: string
}

export interface GenerateStoryResponse {
    story: Story
    estimatedReadingTime: number
    audioUrl?: string
    newlyUnlockedCompanions?: Array<{ id: string; name: string; species: string; description: string }>
}

export class GenerateStoryUseCase {
    private readonly aiService: AIServicePort
    private readonly storyRepository: StoryRepositoryPort | undefined
    private readonly eventBus: EventBusPort | undefined
    private readonly ttsService: TextToSpeechPort | undefined
    private readonly conductorAgent: BedtimeConductorAgent // The Agent
    private readonly checkUnlockUseCase: CheckUnlockUseCase
    private readonly promptService: PromptServicePort
    private readonly logger: LoggerPort
    private readonly ambientContext: AmbientContextPort | undefined
    private readonly safetyGuardian: SafetyGuardian
    private readonly voiceRepository: VoiceRepositoryPort | undefined

    constructor(
        aiService: AIServicePort,
        conductorAgent: BedtimeConductorAgent,
        checkUnlockUseCase: CheckUnlockUseCase, // New
        promptService: PromptServicePort,
        storyRepository?: StoryRepositoryPort,
        eventBus?: EventBusPort,
        ttsService?: TextToSpeechPort,
        logger?: LoggerPort,
        ambientContext?: AmbientContextPort,
        safetyGuardian?: SafetyGuardian,
        voiceRepository?: VoiceRepositoryPort
    ) {
        this.aiService = aiService
        this.conductorAgent = conductorAgent
        this.checkUnlockUseCase = checkUnlockUseCase
        this.promptService = promptService
        this.storyRepository = storyRepository
        this.eventBus = eventBus
        this.ttsService = ttsService
        this.logger = logger || { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }
        this.ambientContext = ambientContext
        this.safetyGuardian = safetyGuardian || new SafetyGuardian(this.aiService, this.promptService, this.logger)
        this.voiceRepository = voiceRepository
    }

    async execute(request: GenerateStoryRequest): Promise<GenerateStoryResponse> {
        const startTime = Date.now()
        this.logger.info('Starting story generation', { userId: request.userId, theme: request.theme })

        // 1. Validate input
        this.validateRequest(request)

        // 1.2 Fetch Unlocked Companions for context
        let companions: import('../../domain/entities/DreamCompanion.js').DreamCompanion[] = []
        if (request.userId) {
            companions = await this.checkUnlockUseCase.execute(request.userId)
        }

        // 1.5 AGENTIC STEP: Conduct Reasoning Session
        let envContext = undefined
        if (this.ambientContext) {
            try {
                envContext = await this.ambientContext.getAmbientContext()
            } catch (error) {
                this.logger.warn('Failed to fetch ambient context', { error })
            }
        }

        const sessionResult = await this.conductorAgent.conductStorySession({
            theme: request.theme,
            duration: request.duration,
            childName: request.childName,
            childAge: request.childAge
        }, {
            childName: request.childName,
            childAge: request.childAge,
            currentMood: request.mood === 'energetic' ? 'energetic' : request.mood === 'tired' ? 'tired' : 'calm',
            userId: request.userId,
            accessToken: request.accessToken, // [SEC-02] Pass token to Agent
            sessionId: request.requestId, // Using requestId as sessionId for context
            envContext // [PRD-GAP-01] Ambient Intelligence
        })

        const refinedRequest = sessionResult.refinedRequest
        const trace = sessionResult.reasoningTrace

        // Log the Transparency Trace
        this.logger.info('🧠 Agent Reasoning Trace', { trace })

        // 1.8 Reinstantiation Context
        let reinstantiateContext = undefined
        if (request.previousStoryId && this.storyRepository) {
            const previousStory = await this.storyRepository.findById(request.previousStoryId)
            if (previousStory) {
                reinstantiateContext = {
                    originalTitle: previousStory.title,
                    originalTheme: previousStory.theme,
                    structure: previousStory.content.paragraphs.join('\n\n') // Simplification
                }
                this.logger.info('Performing Story Reinstantiation ("Again!" mode)', { originalTitle: previousStory.title })
            }
        }

        // 2. Generate story content via AI (Streamed)
        const storyPrompt = this.promptService.getStoryPrompt({
            theme: refinedRequest.theme,
            childName: refinedRequest.childName,
            childAge: refinedRequest.childAge,
            duration: refinedRequest.duration,
            style: 'bedtime',
            memoryContext: sessionResult.contextualNotes,
            reinstantiateContext,
            unlockedCompanions: companions.map(c => c.name),
            forStreaming: false
        })

        const storyStreamPrompt = this.promptService.getStoryPrompt({
            theme: refinedRequest.theme,
            childName: refinedRequest.childName,
            childAge: refinedRequest.childAge,
            duration: refinedRequest.duration,
            style: 'bedtime',
            memoryContext: sessionResult.contextualNotes,
            reinstantiateContext,
            unlockedCompanions: companions.map(c => c.name),
            forStreaming: true
        })

        // Prepare ID ahead of time for streaming events
        const newStoryId = this.generateId()
        let fullTitle = "Untitled Story"
        let generatedContentText = ""

        // STREAMING GENERATION
        try {
            const stream = this.aiService.generateStoryStream({
                theme: refinedRequest.theme,
                childName: refinedRequest.childName,
                childAge: refinedRequest.childAge,
                duration: refinedRequest.duration,
                style: 'bedtime',
                customPrompt: storyStreamPrompt
            })

            let accumulatedText = ""
            for await (const chunk of stream) {
                accumulatedText += chunk

                // Try to extract title from first line if not set
                if (fullTitle === "Untitled Story") {
                    const lines = accumulatedText.split('\n')
                    if (lines.length > 1) {
                        fullTitle = lines[0].replace('Title: ', '').trim()
                        // Optionally strip title from accumulated text? For now, we keep it as raw.
                    }
                }

                // Emit chunk event
                if (this.eventBus) {
                    await this.eventBus.publish({
                        id: crypto.randomUUID(),
                        requestId: request.requestId || 'unknown',
                        traceId: request.traceId,
                        type: 'STORY_CHUNK_GENERATED',
                        payload: {
                            userId: request.userId || 'unknown',
                            sessionId: request.requestId || 'unknown',
                            storyId: newStoryId,
                            text: chunk,
                            isFullBeat: false // Realtime
                        },
                        timestamp: new Date()
                    })
                }
            }

            // Final accumulation
            // We assume the AI returns the full text which we parse into StoryContent
            generatedContentText = accumulatedText
        } catch (error: unknown) {
            // Fallback to non-streaming if method not implemented or fails
            this.logger.warn('Streaming failed, falling back to standard generation', { error })
            const generated = await this.aiService.generateStory({
                theme: refinedRequest.theme,
                childName: refinedRequest.childName,
                childAge: refinedRequest.childAge,
                duration: refinedRequest.duration,
                style: 'bedtime',
                customPrompt: storyPrompt
            })
            generatedContentText = generated.content
            fullTitle = generated.title
        }

        // 3. Create Story domain entity
        // Perform 4-Layer Safety Check
        const safety = await this.safetyGuardian.checkContent(generatedContentText, refinedRequest.childAge, this.promptService.getSafetyFallback())
        const finalContent = safety.isSafe ? (safety.sanitizedContent || generatedContentText) : safety.fallbackContent!

        if (!safety.isSafe) {
            this.logger.warn('Safety Guardian triggered! Using fallback content.', { reason: safety.reason })
        }

        // Normalize text (remove Markdown title if present)
        const cleanContent = finalContent.replace(/^#? ?Title:? .+\n+/, '').trim()

        const storyContent = StoryContent.fromRawText(cleanContent)

        // 3.1 Synthesize audio if TTS is available
        let audioUrl: string | undefined
        if (this.ttsService) {
            try {
                // Synthesize the full story text
                // In a real app we might do this per-paragraph or stream it
                const fullText = storyContent.paragraphs.join(' ')

                // [VOICE-FIX] Fetch full VoiceProfile to get voiceModelId (URL for clones)
                let voiceProfile: { voiceModelId: string } | undefined = undefined
                if (request.voiceProfileId && this.voiceRepository) {
                    const profile = await this.voiceRepository.findById(request.voiceProfileId)
                    if (profile && profile.isReady()) {
                        voiceProfile = { voiceModelId: profile.voiceModelId! }
                        this.logger.info('Using cloned voice for TTS', { voiceModelId: profile.voiceModelId })
                    }
                }

                const synthesis = await this.ttsService.synthesize({
                    text: fullText,
                    voiceProfile
                })
                audioUrl = synthesis.audioUrl
                // Note: We would typically upload this audio to storage and save the URL
            } catch (error) {
                // Graceful degradation: Story is created even if audio fails
                // But we log it as an error for observability
                this.logger.error('TTS synthesis failed for story generation:', { error })
                // We could also set a flag on the story like `meta: { audioFailed: true }`
            }
        }

        const story = Story.create({
            id: newStoryId,
            title: fullTitle,
            content: storyContent,
            theme: request.theme,
            ownerId: request.userId || 'system', // Fallback for safety although validated in route
            status: 'completed',
            createdAt: new Date(),
            generatedAt: new Date(),
            audioUrl: audioUrl, // Save audio URL if generated
        })

        // 4. Persist if repository is available and userId provided
        if (this.storyRepository && request.userId) {
            await this.storyRepository.save(story)
        }

        let newlyUnlockedCompanions: Array<{ id: string; name: string; species: string; description: string }> | undefined
        if (request.userId) {
            const postCompanions = await this.checkUnlockUseCase.execute(request.userId)
            const preUnlocked = new Set(companions.map(c => c.id))
            const diff = postCompanions.filter(c => !preUnlocked.has(c.id))
            if (diff.length > 0) {
                newlyUnlockedCompanions = diff.map(c => ({
                    id: c.id,
                    name: c.name,
                    species: c.species,
                    description: c.description
                }))
            }
        }

        // 4.1 Emit completion events (Beats) - Still useful for "Read Along" tracking
        if (this.eventBus) {
            const paragraphs = story.content.paragraphs
            const totalBeats = paragraphs.length

            for (let i = 0; i < totalBeats; i++) {
                const event: StoryBeatCompletedEvent = {
                    id: `${story.id}_beat_${i}`, // Stable ID for beat
                    requestId: request.requestId || 'unknown',
                    traceId: request.traceId,
                    type: 'STORY_BEAT_COMPLETED',
                    payload: {
                        userId: request.userId || 'unknown',
                        storyId: story.id,
                        beatIndex: i,
                        totalBeats: totalBeats,
                    },
                    timestamp: new Date()
                }
                // In a real scenario, this might be emitted *during* generation if streaming.
                // For this MVP convergence step, we emit them as "completed beats" after content is ready.
                await this.eventBus.publish(event)
            }

            if (request.userId) {
                await this.eventBus.publish({
                    id: crypto.randomUUID(),
                    requestId: request.requestId || story.id,
                    traceId: request.traceId,
                    type: 'STORY_GENERATION_COMPLETED',
                    payload: {
                        userId: request.userId,
                        sessionId: request.requestId || story.id,
                        storyId: story.id,
                    },
                    timestamp: new Date()
                })
            }
        }

        // 5. Return response
        const latencyMs = Date.now() - startTime
        this.logger.info('Story generation completed', {
            storyId: story.id,
            userId: request.userId,
            latencyMs,
            paragraphs: story.content.paragraphs.length
        })

        return {
            story,
            estimatedReadingTime: story.getEstimatedReadingTime(),
            audioUrl,
            newlyUnlockedCompanions,
        }
    }

    private validateRequest(request: GenerateStoryRequest): void {
        if (!request.theme || request.theme.trim().length === 0) {
            throw new Error('Theme is required')
        }

        if (request.childAge !== undefined && (request.childAge < 2 || request.childAge > 12)) {
            throw new Error('Child age must be between 2 and 12')
        }
    }

    private generateId(): StoryId {
        return crypto.randomUUID()
    }
}
