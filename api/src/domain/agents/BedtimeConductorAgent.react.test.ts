/**
 * BedtimeConductorAgent ReAct Logic Tests
 */
import { describe, it, expect } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'
import { InMemoryAgentMemory } from '../../infrastructure/memory/InMemoryAgentMemory'

describe('BedtimeConductorAgent (ReAct)', () => {
    it('should generate a reasoning trace', async () => {
        const memory = new InMemoryAgentMemory()
        const agent = new BedtimeConductorAgent(memory)

        const result = await agent.conductStorySession({ theme: 'space' }, {
            childAge: 4,
            currentMood: 'energetic'
        })

        expect(result.reasoningTrace).toBeDefined()
        expect(result.reasoningTrace.length).toBeGreaterThan(0)

        // precise checks
        const thoughts = result.reasoningTrace.filter(t => t.step === 'THOUGHT')
        const actions = result.reasoningTrace.filter(t => t.step === 'ACTION')

        expect(thoughts.length).toBeGreaterThan(0)
        expect(actions.length).toBeGreaterThan(0) // Should check memory
    })

    it('should apply procedural memory rules (Anticipation)', async () => {
        const memory = new InMemoryAgentMemory() // Has "age < 5 -> short" rule
        const agent = new BedtimeConductorAgent(memory)

        // Case: Young child (4) -> Should trigger rule
        const result = await agent.conductStorySession({ theme: 'space' }, {
            childAge: 4,
            currentMood: 'calm' // Mood doesn't force duration, so rule should win
        })

        expect(result.refinedRequest.duration).toBe('short')

        // Verify trace mentions findings
        const observation = result.reasoningTrace.find(t => t.step === 'OBSERVATION')
        expect(observation?.content).toContain('Found')
    })
})
