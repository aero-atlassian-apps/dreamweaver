/**
 * BedtimeConductorAgent Integration Test
 */
import { describe, it, expect, vi } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { StoryBeatCompletedEvent } from '../../application/ports/EventBusPort'
import { MockAIService } from '../../infrastructure/adapters/MockAIService'
import { PromptAdapter } from '../../infrastructure/ai/PromptAdapter'
import { InMemorySessionState } from '../../infrastructure/adapters/InMemorySessionState'

describe('BedtimeConductorAgent (Agentic Logic)', () => {
    it('should track progress towards a goal via event bus signals', async () => {
        const brain = new MockAIService()
        const sessionState = new InMemorySessionState()
        const resilienceEngine = { assessFailure: async () => ({ action: 'FALLBACK', model: 'edge', estimatedCost: 0 }) }
        const agent = new BedtimeConductorAgent(brain, new PromptAdapter(), sessionState, resilienceEngine as any)

        // Let's set a goal
        await agent.setGoal('STORY_COMPLETED', 15)

        // Simulate story beats
        const totalBeats = 4

        // Beat 0 (25%)
        await agent.handleStoryBeat({
            id: 'evt-1',
            requestId: 'req-1',
            type: 'STORY_BEAT_COMPLETED',
            timestamp: new Date(),
            payload: { storyId: 's1', beatIndex: 0, totalBeats }
        } as unknown as StoryBeatCompletedEvent)
    })

    it('should achieve goal when final beat is received', async () => {
        const mockLogger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }
        const brain = new MockAIService()
        const sessionState = new InMemorySessionState()
        const resilienceEngine = { assessFailure: async () => ({ action: 'FALLBACK', model: 'edge', estimatedCost: 0 }) }
        const agent = new BedtimeConductorAgent(brain, new PromptAdapter(), sessionState, resilienceEngine as any, undefined, mockLogger as any)

        await agent.setGoal('STORY_COMPLETED', 10)

        await agent.handleStoryBeat({
            id: 'evt-2',
            requestId: 'req-2',
            type: 'STORY_BEAT_COMPLETED',
            timestamp: new Date(),
            payload: { storyId: 's1', beatIndex: 0, totalBeats: 1 }
        } as unknown as StoryBeatCompletedEvent)

        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Goal achieved'))
    })
})
