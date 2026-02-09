/**
 * LiveSessionFactory Tests
 */
import { describe, it, expect } from 'vitest';
import { LiveSessionFactory } from './LiveSessionFactory';
import { BedtimeConductorAgent } from '../../domain/agents/BedtimeConductorAgent';
// import { PromptFactory } from '../../infrastructure/ai/PromptFactory'; // Infrastructure import in test is okay-ish but better to mock

// Mock dependencies
const mockAgent = {} as unknown as BedtimeConductorAgent;
const mockPromptService = {
    getConductorSystemPrompt: () => 'System Prompt',
    getLiveSystemPrompt: () => 'System Prompt\n\nCRITICAL INSTRUCTIONS FOR LIVE MODE:',
    formatAgentObservation: () => '',
    getStartStoryTrigger: () => '',
    getStoryPrompt: () => '',
    getSafetyFallback: () => 'fallback',
    getSafetyValidatorSystemPrompt: () => '',
    getMemorySummarizerSystemPrompt: () => '',
    getVerificationValidatorSystemPrompt: () => '',
    getMemoryCuratorSystemPrompt: () => '',
    getSleepPacingOverrideInstruction: () => '',
};

describe('LiveSessionFactory', () => {
    it('should generate a valid session config with tools', async () => {
        const factory = new LiveSessionFactory(mockAgent, mockPromptService as any);

        const config = await factory.createSessionConfig({
            childName: 'Alice',
            childAge: 5
        });

        expect(config.model).toContain('gemini-2.5-flash-native-audio-latest');

        // 1. Verify System Prompt Injection
        const systemPrompt = config.system_instruction?.parts[0].text;
        expect(systemPrompt).toContain('System Prompt');
        expect(systemPrompt).toContain('CRITICAL INSTRUCTIONS FOR LIVE MODE');

        // 2. Verify Tools
        if (!config.tools || config.tools.length === 0) {
            throw new Error('Tools definitions missing');
        }
        const tools = config.tools[0].function_declarations;

        const saveMemory = tools.find((t: any) => t.name === 'save_memory');
        expect(saveMemory).toBeDefined();
        expect(saveMemory?.parameters.required).toContain('content');

        const sleepCheck = tools.find((t: any) => t.name === 'check_sleep_status');
        expect(sleepCheck).toBeDefined();
    });
});
