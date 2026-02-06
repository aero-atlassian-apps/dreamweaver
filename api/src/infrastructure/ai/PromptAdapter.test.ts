import { describe, it, expect } from 'vitest'
import { PromptAdapter } from './PromptAdapter'

describe('PromptAdapter (Regression Harness)', () => {
    const adapter = new PromptAdapter()

    describe('System Prompts', () => {
        it('should render the Bedtime Conductor system prompt correctly', () => {
            const prompt = adapter.getConductorSystemPrompt()
            expect(prompt).toMatchSnapshot()
        })

        it('should render the Safety Fallback prompt correctly', () => {
            const prompt = adapter.getSafetyFallback()
            expect(prompt).toMatchSnapshot()
        })

        it('should render the Start Story Trigger correctly', () => {
            const prompt = adapter.getStartStoryTrigger('Dragons and Knights')
            expect(prompt).toMatchSnapshot()
        })
    })

    describe('Agent Observation Formatting', () => {
        it('should format full observation context correctly', () => {
            const prompt = adapter.formatAgentObservation({
                userMessage: 'I want a scary story',
                childName: 'Billy',
                childAge: 6,
                currentMood: 'energetic',
                activeGoal: 'RELAXATION',
                envContext: 'Night, Raining',
                memoryContext: 'Likes dinosaurs',
                history: 'User said hello previously'
            })
            expect(prompt).toMatchSnapshot()
        })

        it('should handle minimal/missing context gracefully', () => {
            const prompt = adapter.formatAgentObservation({
                userMessage: 'Hello'
            })
            expect(prompt).toMatchSnapshot()
        })
    })

    describe('Story Generation', () => {
        it('should render a Standard Story Prompt', () => {
            const prompt = adapter.getStoryPrompt({
                theme: 'Space Adventure',
                childName: 'Sarah',
                childAge: 8,
                style: 'magical',
                duration: 'long',
                memoryContext: 'Sarah wants to be an astronaut.'
            })
            expect(prompt).toMatchSnapshot()
        })

        it('should render a Story Rewrite Prompt', () => {
            const prompt = adapter.getStoryPrompt({
                theme: 'Underwater',
                reinstantiateContext: {
                    originalTitle: 'The Space adventure',
                    structure: 'Intro -> Climax -> End'
                },
                childName: 'Sarah',
                childAge: 8
            })
            expect(prompt).toMatchSnapshot()
        })

        it('should inject Companion Context if unlocked', () => {
            const prompt = adapter.getStoryPrompt({
                theme: 'Forest',
                childName: 'Tom',
                unlockedCompanions: ['Sparky the Dragon', 'Luna the Owl']
            })
            expect(prompt).toContain('Sparky the Dragon')
            expect(prompt).toContain('Luna the Owl')
            expect(prompt).toMatchSnapshot()
        })
    })
})
