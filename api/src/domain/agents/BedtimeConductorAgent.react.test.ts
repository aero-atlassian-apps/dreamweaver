import { describe, it, expect } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { InMemoryAgentMemory } from '../../infrastructure/memory/InMemoryAgentMemory'
import { MockAIService } from '../../infrastructure/adapters/MockAIService'
import { PromptAdapter } from '../../infrastructure/ai/PromptAdapter'
import { InMemorySessionState } from '../../infrastructure/adapters/InMemorySessionState'

class MockBrain extends MockAIService {
    async generateAgentThought(input: any): Promise<any> {
        // Logic for "Young child" test case
        if (input.userMessage.includes('Age: 4')) {
            return {
                goals_considered: ['TAILORING', 'RELAXATION'],
                thought: 'Child is young (4). Should be short.',
                reasoning: 'Deprecated',
                action: 'START_STORY',
                confidence: 0.9,
                parameters: { duration: 'short' }
            }
        }
        return {
            goals_considered: ['RELAXATION'],
            thought: 'Standard processing',
            action: 'START_STORY',
            confidence: 0.8,
            parameters: {}
        }
    }
}

describe('BedtimeConductorAgent (ReAct)', () => {
    it('should generate a reasoning trace', async () => {
        const memory = new InMemoryAgentMemory()
        const brain = new MockBrain()
        const sessionState = new InMemorySessionState()
        const resilienceEngine = { assessFailure: async () => ({ action: 'FALLBACK', model: 'edge', estimatedCost: 0 }) }
        const agent = new BedtimeConductorAgent(brain, new PromptAdapter(), sessionState, resilienceEngine as any, memory)

        const result = await agent.conductStorySession({ theme: 'space' }, {
            childAge: 4,
            currentMood: 'energetic'
        })

        expect(result.reasoningTrace).toBeDefined()
        expect(result.reasoningTrace.length).toBe(1)

        // precise checks
        const trace = result.reasoningTrace[0]
        expect(trace.goals_considered).toBeDefined()
        expect(trace.thought).toBeDefined()
        expect(trace.action).toBeDefined()
        expect(trace.confidence).toBeDefined()
    })

    it('should apply procedural memory rules (Anticipation)', async () => {
        const memory = new InMemoryAgentMemory() // Has "age < 5 -> short" rule
        const brain = new MockBrain()
        const sessionState = new InMemorySessionState()
        const resilienceEngine = { assessFailure: async () => ({ action: 'FALLBACK', model: 'edge', estimatedCost: 0 }) }
        const agent = new BedtimeConductorAgent(brain, new PromptAdapter(), sessionState, resilienceEngine as any, memory)

        // Case: Young child (4) -> Should trigger rule
        const result = await agent.conductStorySession({ theme: 'space' }, {
            childAge: 4,
            currentMood: 'calm',
            userId: '123e4567-e89b-12d3-a456-426614174009'
        })

        expect(result.refinedRequest.duration).toBe('short')

        // Verify trace mentions findings
        const trace = result.reasoningTrace[0]
        expect(trace.thought).toContain('Child is young')
    })
})
