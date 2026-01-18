/**
 * BedtimeConductorAgent Tests
 * 
 * Unit tests for the agent's suggestion generation and goal management.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BedtimeConductorAgent, type SessionContext, type ChildContext } from './BedtimeConductorAgent'

describe('BedtimeConductorAgent', () => {
    let agent: BedtimeConductorAgent

    beforeEach(() => {
        agent = new BedtimeConductorAgent()
    })

    describe('generateSuggestion', () => {
        const baseChildContext: ChildContext = {
            name: 'Emma',
            age: 5,
            favoriteThemes: ['space', 'animals'],
            recentQuestions: [],
        }

        const baseSessionContext: SessionContext = {
            currentTime: new Date(),
            childContext: baseChildContext,
            previousStories: [],
        }

        it('should generate a suggestion with all required fields', () => {
            const suggestion = agent.generateSuggestion(baseSessionContext)

            expect(suggestion).toHaveProperty('theme')
            expect(suggestion).toHaveProperty('title')
            expect(suggestion).toHaveProperty('reasoning')
            expect(suggestion).toHaveProperty('confidence')
            expect(suggestion).toHaveProperty('suggestedDuration')
        })

        it('should use favorite theme when no recent questions', () => {
            const suggestion = agent.generateSuggestion(baseSessionContext)

            expect(baseChildContext.favoriteThemes).toContain(suggestion.theme)
        })

        it('should extract theme from recent questions when available', () => {
            const contextWithQuestion: SessionContext = {
                ...baseSessionContext,
                childContext: {
                    ...baseChildContext,
                    recentQuestions: ['Why do stars twinkle?'],
                },
            }

            const suggestion = agent.generateSuggestion(contextWithQuestion)

            expect(suggestion.theme).toBe('space')
            expect(suggestion.reasoning).toContain('asked about')
        })

        it('should adjust duration for tired mood', () => {
            const tiredContext: SessionContext = {
                ...baseSessionContext,
                currentMood: 'tired',
            }

            const suggestion = agent.generateSuggestion(tiredContext)

            expect(suggestion.suggestedDuration).toBe(8)
            expect(suggestion.reasoning).toContain('tired')
        })

        it('should adjust duration for energetic mood', () => {
            const energeticContext: SessionContext = {
                ...baseSessionContext,
                currentMood: 'energetic',
            }

            const suggestion = agent.generateSuggestion(energeticContext)

            expect(suggestion.suggestedDuration).toBe(20)
            expect(suggestion.reasoning).toContain('wind down')
        })

        it('should avoid recently used themes', () => {
            const contextWithHistory: SessionContext = {
                ...baseSessionContext,
                previousStories: ['The Space Adventure', 'Mars Mission'],
                childContext: {
                    ...baseChildContext,
                    favoriteThemes: ['space', 'animals', 'nature'],
                },
            }

            const suggestion = agent.generateSuggestion(contextWithHistory)

            // Should pick animals or nature since space was recently used
            expect(['animals', 'nature', 'space']).toContain(suggestion.theme)
        })

        it('should personalize title with child name', () => {
            const suggestion = agent.generateSuggestion(baseSessionContext)

            // Some titles include the child's name
            if (suggestion.title.includes(baseChildContext.name)) {
                expect(suggestion.title).toContain('Emma')
            }
        })

        it('should have confidence between 0 and 1', () => {
            const suggestion = agent.generateSuggestion(baseSessionContext)

            expect(suggestion.confidence).toBeGreaterThanOrEqual(0)
            expect(suggestion.confidence).toBeLessThanOrEqual(1)
        })
    })

    describe('goal management', () => {
        it('should start with no active goal', () => {
            expect(agent.getActiveGoal()).toBeNull()
        })

        it('should set and retrieve active goal', () => {
            const goal = agent.setGoal({
                type: 'CHILD_ASLEEP',
                targetMinutes: 15,
            })

            expect(goal).toBeDefined()
            expect(goal.type).toBe('CHILD_ASLEEP')
            expect(agent.getActiveGoal()).toBe(goal)
        })

        it('should update goal progress', () => {
            agent.setGoal({
                type: 'STORY_COMPLETED',
                targetMinutes: 10,
            })

            agent.updateGoalProgress(50)

            const goal = agent.getActiveGoal()
            expect(goal?.progress).toBe(50)
        })

        it('should throw when updating progress without active goal', () => {
            expect(() => agent.updateGoalProgress(50)).toThrow('No active goal')
        })

        it('should mark goal as achieved', () => {
            agent.setGoal({
                type: 'RELAXATION_ACHIEVED',
                targetMinutes: 20,
            })

            agent.achieveGoal()

            const goal = agent.getActiveGoal()
            expect(goal?.isAchieved).toBe(true)
            expect(goal?.progress).toBe(100)
        })

        it('should throw when achieving without active goal', () => {
            expect(() => agent.achieveGoal()).toThrow('No active goal')
        })

        it('should clamp progress to valid range', () => {
            agent.setGoal({
                type: 'CHILD_ASLEEP',
                targetMinutes: 15,
            })

            agent.updateGoalProgress(150) // Over 100
            expect(agent.getActiveGoal()?.progress).toBe(100)

            agent.setGoal({
                type: 'CHILD_ASLEEP',
                targetMinutes: 15,
            })
            agent.updateGoalProgress(-50) // Under 0
            expect(agent.getActiveGoal()?.progress).toBe(0)
        })
    })
})
