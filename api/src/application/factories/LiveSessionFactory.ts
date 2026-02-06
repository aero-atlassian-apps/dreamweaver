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
    systemInstruction: {
        parts: { text: string }[];
    };
    tools: {
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
        // The prompt should be more "conversational" for Live mode
        console.log('[LiveSessionFactory] Creating config', { userId: context.userId, traceId: context.traceId })
        const systemPrompt = this.promptService.getLiveSystemPrompt({
            childName: context.childName,
            childAge: context.childAge,
        })

        // 2. Define Tools (The "Hands")
        // These tools are relayed by the client back to our backend
        const tools: ToolDeclaration[] = [
            {
                name: 'save_memory',
                description: 'Save a user preference or fact to their long-term memory.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        content: { type: 'STRING', description: 'The fact to remember (e.g. "Loves blue dragons")' },
                        memoryType: { type: 'STRING', enum: ['PREFERENCE', 'EPISODIC'], description: 'Type of memory' }
                    },
                    required: ['content', 'memoryType']
                }
            },
            {
                name: 'check_sleep_status',
                description: 'Check if the child is asleep based on audio sensor data.',
                parameters: {
                    type: 'OBJECT',
                    properties: {}, // No params needed, it checks the sensor
                }
            },
            {
                name: 'suggest_theme',
                description: 'Get a story theme suggestion based on past favorites.',
                parameters: {
                    type: 'OBJECT',
                    properties: {},
                }
            }
        ];

        return {
            model: process.env['GEMINI_LIVE_MODEL'] || 'models/gemini-3-flash-preview',
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            tools: [{ functionDeclarations: tools }]
        };
    }
}
