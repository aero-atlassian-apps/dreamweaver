import { AIServicePort } from '../ports/AIServicePort.js';
import { AgentMemoryPort } from '../ports/AgentMemoryPort.js';
import { LoggerPort } from '../ports/LoggerPort.js';
import { MomentRepositoryPort } from '../ports/MomentRepositoryPort.js';
import { StoryRepositoryPort } from '../ports/StoryRepositoryPort.js'
import { PromptServicePort } from '../ports/PromptServicePort.js'
import { Moment } from '../../domain/entities/Moment.js';
import { v4 as uuidv4 } from 'uuid';
import { VerificationPipeline } from '../../domain/services/VerificationPipeline.js'
import { z } from 'zod'

export class AnalyzeSessionForMomentsUseCase {
    constructor(
        private readonly memory: AgentMemoryPort,
        private readonly momentRepository: MomentRepositoryPort,
        private readonly storyRepository: StoryRepositoryPort,
        private readonly aiService: AIServicePort,
        private readonly promptService: PromptServicePort,
        private readonly logger: LoggerPort,
        private readonly verificationPipeline: VerificationPipeline
    ) { }

    async execute(sessionId: string, userId: string): Promise<void> {
        this.logger.info(`[MemoryCurator] Analyzing session ${sessionId} for moments...`);

        try {
            // 1. Retrieve Session Context
            // We fetch the last N turns to analyze the "Story Session"
            const memories = await this.memory.retrieve('session_end', { userId, sessionId }, 'EPISODIC', 20);

            if (memories.length === 0) {
                const recentStories = await this.storyRepository.findRecent(userId, 1)
                const story = recentStories[0]
                if (!story) {
                    this.logger.info('[MemoryCurator] No memories found for analysis.')
                    return
                }
                const transcript = `Story Title: ${story.title}\n\n${story.content.paragraphs.join('\n')}`
                await this.analyzeTranscript(transcript, userId, sessionId)
                return
            }

            const transcript = memories.map(m => m.content).join('\n');
            await this.analyzeTranscript(transcript, userId, sessionId)

        } catch (error) {
            this.logger.error('[MemoryCurator] Failed to analyze session', error);
        }
    }

    private async analyzeTranscript(transcript: string, userId: string, sessionId: string): Promise<void> {
        const modelSchema = {
            type: 'object',
            properties: {
                found: { type: 'boolean' },
                description: { type: 'string' },
                confidence: { type: 'number' },
            },
            required: ['found', 'description', 'confidence'],
            additionalProperties: false,
        }

        const analysis = await this.aiService.generateStructured({
            systemPrompt: this.promptService.getMemoryCuratorSystemPrompt(),
            userMessage: transcript,
            schema: modelSchema,
        } as any)

        const parsed = z.object({
            found: z.boolean(),
            description: z.string(),
            confidence: z.number().min(0).max(1),
        }).strict().parse(analysis)

        if (!(parsed.found && parsed.description.trim().length > 0 && parsed.confidence >= 0.6)) {
            this.logger.info('[MemoryCurator] No significant moments detected.')
            return
        }

        this.logger.info('[MemoryCurator] Golden Moment Detected!', { description: parsed.description, confidence: parsed.confidence })

        const recentStories = await this.storyRepository.findRecent(userId, 1)
        const story = recentStories[0]
        const audioUrl = story?.audioUrl
        if (!story || !audioUrl) {
            this.logger.warn('[MemoryCurator] Moment detected but no story audio is available to anchor mediaUrl')
            return
        }

        const moment = Moment.create({
            id: uuidv4(),
            userId,
            storyId: story.id,
            mediaUrl: audioUrl,
            description: parsed.description,
            createdAt: new Date()
        })

        const verification = await this.verificationPipeline.verify({
            type: 'GOLDEN_MOMENT',
            content: { description: moment.description },
            metadata: { userId, sessionId, resourceId: moment.id }
        })

        if (!verification.approved) {
            this.logger.warn(`[MemoryCurator] Moment rejected by GKD: ${verification.reason}`, { id: moment.id })
            return
        }

        await this.momentRepository.save(moment)
        this.logger.info(`[MemoryCurator] Moment saved: ${moment.id}`)
    }
}
