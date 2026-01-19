
import { describe, it, expect } from 'vitest'
import { BedtimeConductorAgent } from './BedtimeConductorAgent'

describe('BedtimeConductorAgent (Backend)', () => {
    const agent = new BedtimeConductorAgent()

    it('should shorten duration when child is tired', () => {
        const refined = agent.refineStoryRequest(
            { theme: 'space' },
            { currentMood: 'tired' }
        )
        expect(refined.duration).toBe('short')
    })

    it('should set medium duration when energetic', () => {
        const refined = agent.refineStoryRequest(
            { theme: 'space' },
            { currentMood: 'energetic' }
        )
        expect(refined.duration).toBe('medium')
    })

    it('should respect explicit overrides if logic dictates (currently additive)', () => {
        const refined = agent.refineStoryRequest(
            { theme: 'space', duration: 'long' },
            { currentMood: 'tired' }
        )
        // Agent overrules "long" with "short" if tired
        expect(refined.duration).toBe('short')
    })
})
