/**
 * Story Entity - Core domain object representing a bedtime story
 * 
 * This entity encapsulates all business logic related to stories.
 * No external dependencies - pure domain logic.
 */

import { StoryContent } from '../value-objects/StoryContent'

export type StoryId = string
export type StoryStatus = 'generating' | 'completed' | 'failed'

export interface StoryProps {
    id: StoryId
    title: string
    content: StoryContent
    theme: string
    status: StoryStatus
    createdAt: Date
    generatedAt?: Date
}

export interface CreateStoryInput {
    theme: string
    childName?: string
    childAge?: number
}

export class Story {
    readonly id: StoryId
    readonly title: string
    readonly content: StoryContent
    readonly theme: string
    private _status: StoryStatus
    readonly createdAt: Date
    readonly generatedAt: Date | undefined

    private constructor(
        id: StoryId,
        title: string,
        content: StoryContent,
        theme: string,
        status: StoryStatus,
        createdAt: Date,
        generatedAt: Date | undefined,
    ) {
        this.id = id
        this.title = title
        this.content = content
        this.theme = theme
        this._status = status
        this.createdAt = createdAt
        this.generatedAt = generatedAt
    }

    get status(): StoryStatus {
        return this._status
    }

    /**
     * Create a new Story from generated content
     */
    static create(props: StoryProps): Story {
        return new Story(
            props.id,
            props.title,
            props.content,
            props.theme,
            props.status,
            props.createdAt,
            props.generatedAt,
        )
    }

    /**
     * Mark story as completed after successful generation
     */
    complete(): void {
        if (this._status === 'completed') {
            throw new Error('Story is already completed')
        }
        this._status = 'completed'
    }

    /**
     * Mark story as failed if generation fails
     */
    fail(): void {
        this._status = 'failed'
    }

    /**
     * Check if story is ready to be displayed
     */
    isReadable(): boolean {
        return this._status === 'completed' && this.content.paragraphs.length > 0
    }

    /**
     * Get estimated reading time in minutes
     */
    getEstimatedReadingTime(): number {
        const wordsPerMinute = 150 // Slower pace for bedtime stories
        const wordCount = this.content.getWordCount()
        return Math.ceil(wordCount / wordsPerMinute)
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON(): StoryProps {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            theme: this.theme,
            status: this._status,
            createdAt: this.createdAt,
            generatedAt: this.generatedAt,
        }
    }
}
