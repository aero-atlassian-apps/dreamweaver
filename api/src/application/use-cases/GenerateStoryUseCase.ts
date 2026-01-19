/**
 * GenerateStoryUseCase - Application use case for story generation
 * 
 * This use case orchestrates the story generation process:
 * 1. Validates input
 * 2. Calls AI service to generate content
 * 3. Creates Story domain entity
 * 4. Optionally saves to repository
 */

import { Story, StoryId } from '../../domain/entities/Story'
import { StoryContent } from '../../domain/value-objects/StoryContent'
import type { AIServicePort } from '../ports/AIServicePort'
import type { TextToSpeechPort } from '../ports/TextToSpeechPort'
import type { StoryRepositoryPort } from '../ports/StoryRepositoryPort'
import type { EventBusPort, StoryBeatCompletedEvent } from '../ports/EventBusPort'
import { BedtimeConductorAgent } from '../../domain/agents/BedtimeConductorAgent'
import type { LoggerPort } from '../ports/LoggerPort'

export interface GenerateStoryRequest {
    theme: string
    childName?: string
    childAge?: number
    duration?: 'short' | 'medium' | 'long'
    userId?: string // For persistence
    voiceProfileId?: string // Optional voice to use

    // Agentic Context (Metadata passed from frontend)
    mood?: 'energetic' | 'calm' | 'tired'
}

export interface GenerateStoryResponse {
    story: Story
    estimatedReadingTime: number
    audioUrl?: string
}

export class GenerateStoryUseCase {
    private readonly aiService: AIServicePort
    private readonly storyRepository: StoryRepositoryPort | undefined
    private readonly eventBus: EventBusPort | undefined
    private readonly ttsService: TextToSpeechPort | undefined
    private readonly conductorAgent: BedtimeConductorAgent // The Agent
    private readonly logger: LoggerPort

    constructor(
        aiService: AIServicePort,
        conductorAgent: BedtimeConductorAgent, // Inject the Agent
        storyRepository?: StoryRepositoryPort,
        eventBus?: EventBusPort,
        ttsService?: TextToSpeechPort,
        logger?: LoggerPort
    ) {
        this.aiService = aiService
        this.conductorAgent = conductorAgent
        this.storyRepository = storyRepository
        this.eventBus = eventBus
        this.ttsService = ttsService
        this.logger = logger || { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }
    }

    async execute(request: GenerateStoryRequest): Promise<GenerateStoryResponse> {
        const startTime = Date.now()
        this.logger.info('Starting story generation', { userId: request.userId, theme: request.theme })

        // 1. Validate input
        this.validateRequest(request)

        // 1.5 AGENTIC STEP: Conduct Reasoning Session
        // The agent enters a ReAct loop to determine the best parameters.
        const sessionResult = await this.conductorAgent.conductStorySession(request, {
            childName: request.childName,
            childAge: request.childAge,
            currentMood: request.mood === 'energetic' ? 'energetic' : request.mood === 'tired' ? 'tired' : 'calm'
        })

        const refinedRequest = sessionResult.refinedRequest
        const trace = sessionResult.reasoningTrace

        // Log the Transparency Trace
        this.logger.info('🧠 Agent Reasoning Trace', { trace })

        // 2. Generate story content via AI (using REFINED parameters)
        const generated = await this.aiService.generateStory({
            theme: refinedRequest.theme,
            childName: refinedRequest.childName,
            childAge: refinedRequest.childAge,
            duration: refinedRequest.duration,
            style: 'bedtime',
        })

        // 3. Create Story domain entity
        const storyContent = StoryContent.fromRawText(generated.content)

        // 3.1 Synthesize audio if TTS is available
        let audioUrl: string | undefined
        if (this.ttsService) {
            try {
                // Synthesize the full story text
                // In a real app we might do this per-paragraph or stream it
                const fullText = storyContent.paragraphs.join(' ')
                const synthesis = await this.ttsService.synthesize({
                    text: fullText,
                    voiceProfile: request.voiceProfileId ? { voiceModelId: request.voiceProfileId } : undefined
                })
                audioUrl = synthesis.audioUrl
                // Note: We would typically upload this audio to storage and save the URL
                // For MVP we just return the data URI or potential mock URL
            } catch (error) {
                // Graceful degradation: Story is created even if audio fails
                // But we log it as an error for observability
                console.error('TTS synthesis failed for story generation:', error)
                // We could also set a flag on the story like `meta: { audioFailed: true }`
            }
        }

        const story = Story.create({
            id: this.generateId(),
            title: generated.title,
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

        // 4.1 Emit completion events (Beats)
        if (this.eventBus) {
            const paragraphs = story.content.paragraphs
            const totalBeats = paragraphs.length

            for (let i = 0; i < totalBeats; i++) {
                const event: StoryBeatCompletedEvent = {
                    type: 'STORY_BEAT_COMPLETED',
                    payload: {
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
        return `story_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    }
}
