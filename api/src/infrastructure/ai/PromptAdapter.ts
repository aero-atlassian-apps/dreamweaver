/**
 * PromptAdapter - Infrastructure implementation of PromptServicePort
 */

import { PromptServicePort, AgentPromptVariables, StoryPromptVariables, LivePromptVariables } from '../../application/ports/PromptServicePort.js'
import { PROMPTS } from './prompts/bedtime-prompts.js'
import { PromptRegistry } from './prompts/PromptRegistry.js'

export class PromptAdapter implements PromptServicePort {
    private registry: PromptRegistry

    constructor() {
        // Initialize registry with bedtime prompts
        // In the future, this could load from a database or remote config
        this.registry = new PromptRegistry(PROMPTS)
    }

    getConductorSystemPrompt(): string {
        return this.registry.get('CONDUCTOR_SYSTEM').text
    }

    formatAgentObservation(vars: AgentPromptVariables): string {
        return this.registry.interpolate('AGENT_OBSERVATION', {
            userMessage: vars.userMessage || 'None',
            childName: vars.childName || 'Unknown',
            childAge: vars.childAge ?? '?',
            currentMood: vars.currentMood || 'Unknown',
            activeGoal: vars.activeGoal || 'None',
            envContext: vars.envContext || 'Unknown',
            memoryContext: vars.memoryContext || 'None',
            history: vars.history || 'None'
        })
    }

    getStoryPrompt(vars: StoryPromptVariables): string {
        if (vars.reinstantiateContext) {
            return this.registry.interpolate('STORY_REWRITE', {
                originalTitle: vars.reinstantiateContext.originalTitle,
                structure: vars.reinstantiateContext.structure,
                theme: vars.theme,
                childName: vars.childName || 'the child',
                childAge: vars.childAge || 'unknown',
                style: vars.style || 'calm'
            })
        }

        const companionContext = vars.unlockedCompanions?.length
            ? `Include the following Dream Companions as friendly sidekicks: ${vars.unlockedCompanions.join(', ')}.`
            : ''

        const base = this.registry.interpolate('STORY_GENERATION', {
            theme: vars.theme,
            childName: vars.childName || 'the child',
            childAge: vars.childAge || 'unknown',
            style: vars.style || 'calm and magical',
            duration: vars.duration || 'medium',
            memoryContext: vars.memoryContext || '',
            companionContext
        })
        if (vars.forStreaming) {
            return base + this.registry.get('STORY_STREAM_SUFFIX').text
        }
        return base
    }

    getStartStoryTrigger(theme: string): string {
        return this.registry.interpolate('START_STORY_TRIGGER', { theme })
    }

    getSafetyFallback(): string {
        return this.registry.get('SAFETY_FALLBACK').text
    }

    getLiveSystemPrompt(vars: LivePromptVariables): string {
        return this.getConductorSystemPrompt() + '\n\n' + this.registry.interpolate('LIVE_MODE_APPENDIX', {
            childName: vars.childName || 'Unknown',
            childAge: vars.childAge ?? 'Unknown',
        })
    }

    getSafetyValidatorSystemPrompt(vars: { childAge: number }): string {
        return this.registry.interpolate('SAFETY_VALIDATOR_SYSTEM', { childAge: vars.childAge })
    }

    getMemorySummarizerSystemPrompt(): string {
        return this.registry.get('MEMORY_SUMMARIZER_SYSTEM').text
    }

    getVerificationValidatorSystemPrompt(vars: { type: string }): string {
        return this.registry.interpolate('VERIFICATION_VALIDATOR_SYSTEM', { type: vars.type })
    }

    getMemoryCuratorSystemPrompt(): string {
        return this.registry.get('MEMORY_CURATOR_SYSTEM').text
    }

    getSleepPacingOverrideInstruction(): string {
        return this.registry.get('SLEEP_PACING_OVERRIDE').text
    }
}
