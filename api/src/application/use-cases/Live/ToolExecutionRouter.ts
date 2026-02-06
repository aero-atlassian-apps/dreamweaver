/**
 * ToolExecutionRouter
 * 
 * Securely routes tool calls from the client-relayed Live Session to actual backend services.
 * Implements the "Hands" of the Agent.
 */

import { BedtimeConductorAgent } from '../../../domain/agents/BedtimeConductorAgent.js';
import { SleepSentinelAgent } from '../../../domain/agents/SleepSentinelAgent.js';
import { AgentMemoryPort } from '../../ports/AgentMemoryPort.js';
import { LoggerPort } from '../../ports/LoggerPort.js';
import { StoryRepositoryPort } from '../../ports/StoryRepositoryPort.js';
import { Story } from '../../../domain/entities/Story.js';
import { StoryContent } from '../../../domain/value-objects/StoryContent.js';
import { z } from 'zod'
import { ToolAuditLogPort } from '../../ports/ToolAuditLogPort.js'

export type LiveToolName =
    | 'save_memory'
    | 'check_sleep_status'
    | 'suggest_theme'
    | 'save_generated_story'

type SaveMemoryArgs = {
    content: string
    memoryType: 'PREFERENCE' | 'EPISODIC'
}

type CheckSleepStatusArgs = Record<string, never>

type SuggestThemeArgs = Record<string, never>

type SaveGeneratedStoryArgs = {
    title: string
    content: string
    theme?: string
}

type ToolCallRequestBase = {
    sessionId: string
    userId: string
    requestId?: string
    traceId?: string
    toolCallId?: string
}

export type ToolCallRequest =
    | (ToolCallRequestBase & { toolName: 'save_memory'; arguments: SaveMemoryArgs })
    | (ToolCallRequestBase & { toolName: 'check_sleep_status'; arguments: CheckSleepStatusArgs })
    | (ToolCallRequestBase & { toolName: 'suggest_theme'; arguments: SuggestThemeArgs })
    | (ToolCallRequestBase & { toolName: 'save_generated_story'; arguments: SaveGeneratedStoryArgs })

export interface ToolCallResponse {
    result: unknown;
    error?: string;
}

const saveMemoryArgsSchema = z.object({
    content: z.string().min(1).max(4000),
    memoryType: z.enum(['PREFERENCE', 'EPISODIC']),
})

const emptyArgsSchema = z.object({}).strict()

const saveGeneratedStoryArgsSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(20000),
    theme: z.string().min(1).max(100).optional(),
})

export class ToolExecutionRouter {
    constructor(
        private readonly bedTimeAgent: BedtimeConductorAgent, // For suggestions
        private readonly memory: AgentMemoryPort,
        private readonly sleepSentinel: SleepSentinelAgent,
        private readonly logger: LoggerPort,
        private readonly storyRepository?: StoryRepositoryPort,
        private readonly auditLog?: ToolAuditLogPort
    ) { }

    async execute(request: ToolCallRequest): Promise<ToolCallResponse> {
        const occurredAt = new Date()
        this.logger.info(`[ToolRouter] Executing ${request.toolName}`, { userId: request.userId, traceId: request.traceId, sessionId: request.sessionId });

        const validated = (() => {
            try {
                switch (request.toolName) {
                    case 'save_memory':
                        return { ok: true as const, args: saveMemoryArgsSchema.parse(request.arguments) }
                    case 'check_sleep_status':
                        return { ok: true as const, args: emptyArgsSchema.parse(request.arguments) }
                    case 'suggest_theme':
                        return { ok: true as const, args: emptyArgsSchema.parse(request.arguments) }
                    case 'save_generated_story':
                        return { ok: true as const, args: saveGeneratedStoryArgsSchema.parse(request.arguments) }
                    default:
                        return { ok: false as const, error: 'Unknown tool' }
                }
            } catch (err) {
                return { ok: false as const, error: err instanceof Error ? err.message : 'Validation error' }
            }
        })()

        if (!validated.ok) {
            await this.auditLog?.write({
                userId: request.userId,
                sessionId: request.sessionId,
                requestId: request.requestId,
                traceId: request.traceId,
                toolName: request.toolName,
                toolCallId: request.toolCallId,
                allowed: false,
                args: request.arguments,
                result: null,
                error: validated.error,
                occurredAt,
            })
            return { result: null, error: validated.error }
        }

        const typedRequest = { ...request, arguments: validated.args } as ToolCallRequest

        try {
            let response: ToolCallResponse
            switch (request.toolName) {
                case 'save_memory':
                    response = await this.handleSaveMemory(typedRequest as Extract<ToolCallRequest, { toolName: 'save_memory' }>);
                    break

                case 'check_sleep_status':
                    response = await this.handleCheckSleep(typedRequest as Extract<ToolCallRequest, { toolName: 'check_sleep_status' }>);
                    break

                case 'suggest_theme':
                    response = await this.handleSuggestTheme(typedRequest as Extract<ToolCallRequest, { toolName: 'suggest_theme' }>);
                    break

                case 'save_generated_story':
                    response = await this.handleSaveGeneratedStory(typedRequest as Extract<ToolCallRequest, { toolName: 'save_generated_story' }>);
                    break

                default:
                    throw new Error(`Unknown tool: ${(request as any).toolName}`);
            }

            await this.auditLog?.write({
                userId: request.userId,
                sessionId: request.sessionId,
                requestId: request.requestId,
                traceId: request.traceId,
                toolName: request.toolName,
                toolCallId: request.toolCallId,
                allowed: true,
                args: request.arguments,
                result: response.result,
                error: response.error,
                occurredAt,
            })

            return response
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            this.logger.error(`[ToolRouter] Error executing ${request.toolName}`, { error });
            await this.auditLog?.write({
                userId: request.userId,
                sessionId: request.sessionId,
                requestId: request.requestId,
                traceId: request.traceId,
                toolName: request.toolName,
                toolCallId: request.toolCallId,
                allowed: true,
                args: request.arguments,
                result: null,
                error: message,
                occurredAt,
            })
            return { result: null, error: message };
        }
    }

    private async handleSaveMemory(request: Extract<ToolCallRequest, { toolName: 'save_memory' }>): Promise<ToolCallResponse> {
        const { content, memoryType } = request.arguments

        await this.memory.store(
            content,
            memoryType,
            { userId: request.userId, sessionId: request.sessionId }
        );

        return { result: { success: true, message: 'Memory saved.' } };
    }

    private async handleCheckSleep(request: Extract<ToolCallRequest, { toolName: 'check_sleep_status' }>): Promise<ToolCallResponse> {
        void request
        // In this architecture, the sentinel might be running autonomously or polling
        // For the tool call, we return the *current status*
        const status = this.sleepSentinel.getStatus();

        // If high confidence, we might trigger a 'sleep_detected' event here too

        return {
            result: {
                isMonitoring: status.isMonitoring,
                confidence: status.currentConfidence,
                status: status.currentConfidence > 0.8 ? 'ASLEEP' : 'AWAKE'
            }
        };
    }

    private async handleSuggestTheme(request: Extract<ToolCallRequest, { toolName: 'suggest_theme' }>): Promise<ToolCallResponse> {
        // Reuse logic from BedtimeConductor
        const suggestions = await this.bedTimeAgent.generateSuggestions({ userId: request.userId });

        return {
            result: {
                suggestions: suggestions.map(s => ({ theme: s.theme, reasoning: s.reasoning }))
            }
        };
    }

    private async handleSaveGeneratedStory(request: Extract<ToolCallRequest, { toolName: 'save_generated_story' }>): Promise<ToolCallResponse> {
        if (!this.storyRepository) {
            return { result: null, error: 'Persistence not enabled.' };
        }

        const { title, content, theme } = request.arguments;

        // Use proper UUID to match database schema (stories.id is UUID type)
        const story = Story.create({
            id: crypto.randomUUID(),
            title,
            content: StoryContent.fromRawText(content),
            theme: theme || 'Live Session',
            ownerId: request.userId,
            status: 'completed',
            createdAt: new Date(),
            generatedAt: new Date()
        });

        await this.storyRepository.save(story);
        this.logger.info('Saved Live generated story', { storyId: story.id });

        return {
            result: { success: true, storyId: story.id }
        };
    }
}
