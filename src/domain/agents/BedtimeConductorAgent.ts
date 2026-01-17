/**
 * BedtimeConductorAgent - AI agent that orchestrates bedtime sessions
 * 
 * Generates story suggestions with reasoning based on context.
 * Tracks active goals and publishes events.
 */

import type { ActiveGoal, CreateGoalInput } from '../entities/ActiveGoal'
import { ActiveGoal as ActiveGoalEntity } from '../entities/ActiveGoal'

export interface ChildContext {
    name: string
    age: number
    favoriteThemes: string[]
    recentQuestions: string[]
    sleepPatterns?: {
        averageBedtime: string
        averageSleepDuration: number
    }
}

export interface SessionContext {
    currentTime: Date
    childContext: ChildContext
    previousStories: string[]
    currentMood?: 'energetic' | 'calm' | 'tired' | 'fussy'
}

export interface StorySuggestion {
    theme: string
    title: string
    reasoning: string
    confidence: number // 0-1
    suggestedDuration: number // minutes
}

export class BedtimeConductorAgent {
    private activeGoal: ActiveGoal | null = null

    /**
     * Generate a story suggestion based on context
     */
    generateSuggestion(context: SessionContext): StorySuggestion {
        const { childContext, currentMood, previousStories } = context

        // Determine theme based on recent questions or interests
        let theme: string
        let reasoning: string

        if (childContext.recentQuestions.length > 0) {
            const lastQuestion = childContext.recentQuestions[0]
            theme = this.extractThemeFromQuestion(lastQuestion)
            reasoning = `${childContext.name} asked about "${lastQuestion}" recently. This story builds on that curiosity!`
        } else if (childContext.favoriteThemes.length > 0) {
            // Filter out recently used themes
            const availableThemes = childContext.favoriteThemes.filter(
                t => !previousStories.some(s => s.toLowerCase().includes(t.toLowerCase()))
            )
            theme = availableThemes[0] ?? childContext.favoriteThemes[0]
            reasoning = `${childContext.name} loves ${theme} stories. Tonight's adventure awaits!`
        } else {
            theme = 'adventure'
            reasoning = `A gentle adventure to spark ${childContext.name}'s imagination.`
        }

        // Adjust for mood
        let suggestedDuration = 15
        if (currentMood === 'tired') {
            suggestedDuration = 8
            reasoning += ' Keeping it short since they seem tired.'
        } else if (currentMood === 'energetic') {
            suggestedDuration = 20
            reasoning += ' A longer story to help wind down.'
        }

        return {
            theme,
            title: this.generateTitle(theme, childContext.name),
            reasoning,
            confidence: 0.85,
            suggestedDuration,
        }
    }

    /**
     * Set an active goal for the session
     */
    setGoal(input: CreateGoalInput): ActiveGoal {
        this.activeGoal = ActiveGoalEntity.createNew(input)
        return this.activeGoal
    }

    /**
     * Get the current active goal
     */
    getActiveGoal(): ActiveGoal | null {
        return this.activeGoal
    }

    /**
     * Update goal progress
     */
    updateGoalProgress(progress: number): void {
        if (!this.activeGoal) {
            throw new Error('No active goal to update')
        }
        this.activeGoal.updateProgress(progress)
    }

    /**
     * Mark goal as achieved
     */
    achieveGoal(): void {
        if (!this.activeGoal) {
            throw new Error('No active goal to achieve')
        }
        this.activeGoal.markAchieved()
    }

    private extractThemeFromQuestion(question: string): string {
        const themeKeywords: Record<string, string[]> = {
            'space': ['star', 'moon', 'planet', 'rocket', 'astronaut', 'galaxy', 'mars'],
            'animals': ['dog', 'cat', 'elephant', 'lion', 'bear', 'rabbit', 'bird'],
            'nature': ['tree', 'flower', 'garden', 'forest', 'rain', 'sun', 'rainbow'],
            'ocean': ['fish', 'whale', 'shark', 'mermaid', 'sea', 'beach', 'water'],
            'magic': ['wizard', 'fairy', 'unicorn', 'dragon', 'spell', 'magic', 'princess'],
        }

        const lowerQuestion = question.toLowerCase()

        for (const [theme, keywords] of Object.entries(themeKeywords)) {
            if (keywords.some(k => lowerQuestion.includes(k))) {
                return theme
            }
        }

        return 'adventure'
    }

    private generateTitle(theme: string, childName: string): string {
        const titles: Record<string, string[]> = {
            'space': [`${childName}'s Cosmic Journey`, 'The Star Shepherd', "Moon's Lullaby"],
            'animals': [`${childName} and the Forest Friends`, 'The Sleepy Safari', 'The Cozy Burrow'],
            'nature': ['The Whispering Garden', "Rainbow's Rest", 'The Gentle Rain'],
            'ocean': ['The Singing Waves', "Pearl's Dream", 'The Calm Cove'],
            'magic': [`${childName}'s Enchanted Night`, "The Fairy's Gift", 'The Dreaming Dragon'],
            'adventure': [`${childName}'s Bedtime Adventure`, 'The Moonlit Path', 'The Cozy Quest'],
        }

        const themeTitles = titles[theme] ?? titles['adventure']
        return themeTitles[Math.floor(Math.random() * themeTitles.length)]
    }
}
