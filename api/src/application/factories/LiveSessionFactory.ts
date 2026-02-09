/**
 * LiveSessionFactory
 * 
 * Constructs the configuration for a Gemini Live session.
 * Responsibilities:
 * 1. Generates the System Instruction (Persona + Context).
 * 2. Defines the Tools available to the model (in user-relay mode).
 */

import { BedtimeConductorAgent, AgentContext } from '../../domain/agents/BedtimeConductorAgent.js';
import { PromptServicePort } from '../ports/PromptServicePort.js';

export interface LiveSessionConfig {
    model: string;
    systemInstruction?: {
        parts: { text: string }[];
    };
    generationConfig?: {
        responseModalities?: string[];
        speechConfig?: {
            voiceConfig?: {
                prebuiltVoiceConfig?: {
                    voiceName?: string;
                };
            };
        };
    };
    tools?: {
        functionDeclarations: ToolDeclaration[];
    }[];
}

export interface ToolDeclaration {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, unknown>;
        required?: string[];
    };
}

export class LiveSessionFactory {
    constructor(
        private readonly agent: BedtimeConductorAgent,
        private readonly promptService: PromptServicePort
    ) { }

    async createSessionConfig(context: AgentContext): Promise<LiveSessionConfig> {
        // 1. Construct System Prompt
        console.log('[LiveSessionFactory] Creating config', { userId: context.userId, traceId: context.traceId })
        const systemPrompt = this.promptService.getLiveSystemPrompt({
            childName: context.childName,
            childAge: context.childAge,
        })

        // 2. Define Tools
        const tools: ToolDeclaration[] = [
            {
                name: 'save_memory',
                description: 'Save a user preference or fact to their long-term memory.',
                parameters: {
                    type: 'object',
                    properties: {
                        content: { type: 'string', description: 'The fact to remember' },
                        memoryType: { type: 'string', enum: ['PREFERENCE', 'EPISODIC'], description: 'Type of memory' }
                    },
                    required: ['content', 'memoryType']
                }
            },
            {
                name: 'check_sleep_status',
                description: 'Check if the child is asleep based on audio sensor data.',
                parameters: {
                    type: 'object',
                    properties: {
                        _unused: { type: 'string', description: 'Ignored parameter' }
                    },
                    required: ['_unused']
                }
            },
            {
                name: 'suggest_theme',
                description: 'Get a story theme suggestion based on past favorites.',
                parameters: {
                    type: 'object',
                    properties: {
                        _unused: { type: 'string', description: 'Ignored parameter' }
                    },
                    required: ['_unused']
                }
            }
        ];

        const model = process.env['GEMINI_LIVE_MODEL'] || 'models/gemini-2.5-flash-native-audio-latest';
        console.log(`[LiveSessionFactory] Using model: ${model}`);

        return {
            model,
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                // Google recommendation: lowercase 'audio' for some SDKs
                responseModalities: ['audio'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: 'Puck'
                        }
                    }
                }
            },
            tools: [{ functionDeclarations: tools }]
        };
    }
}
