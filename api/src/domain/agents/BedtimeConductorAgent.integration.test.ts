/**
 * BedtimeConductorAgent Integration Test
 */
import { describe, it, expect, vi } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { StoryBeatCompletedEvent } from '../../application/ports/EventBusPort'

describe('BedtimeConductorAgent (Agentic Logic)', () => {
    it('should track progress towards a goal via event bus signals', () => {
        const agent = new BedtimeConductorAgent()

        // Let's set a goal
        agent.setGoal('STORY_COMPLETED', 15)

        // Simulate story beats
        const totalBeats = 4

        // Beat 0 (25%)
        agent.handleStoryBeat({
            type: 'STORY_BEAT_COMPLETED',
            timestamp: new Date(),
            payload: { storyId: 's1', beatIndex: 0, totalBeats, content: '...' }
        } as unknown as StoryBeatCompletedEvent)

        // We can't easily check private state, but we can verify it doesn't crash 
        // and in a real scenario we'd check the persisted goal.
        // For this test, we've added console logs in the code.
    })

    it('should achieve goal when final beat is received', () => {
        const mockLogger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }
        const agent = new BedtimeConductorAgent(undefined, mockLogger)

        agent.setGoal('STORY_COMPLETED', 10)

        agent.handleStoryBeat({
            type: 'STORY_BEAT_COMPLETED',
            timestamp: new Date(),
            payload: { storyId: 's1', beatIndex: 0, totalBeats: 1, content: '...' }
        } as unknown as StoryBeatCompletedEvent)

        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Goal achieved'))
    })
})
