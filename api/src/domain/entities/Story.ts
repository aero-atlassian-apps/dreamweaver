/**
 * Story Entity - Core domain object representing a bedtime story
 * 
 * This entity encapsulates all business logic related to stories.
 * No external dependencies - pure domain logic.
 */

import { z } from 'zod'
import { StoryContent } from '../value-objects/StoryContent.js'

// [CLEAN-ARCH] Runtime Schema for Validation
export const StorySchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(255),
    theme: z.string(),
    ownerId: z.string().uuid(),
    status: z.enum(['generating', 'completed', 'failed', 'blocked']),
    createdAt: z.date(),
    generatedAt: z.date().optional(),
    audioUrl: z.string().url().optional(),
})

export type StoryId = string
export type StoryStatus = 'generating' | 'completed' | 'failed' | 'blocked'

export interface StoryProps {
    id: StoryId
    title: string
    content: StoryContent
    theme: string
    status: StoryStatus
    ownerId: string
    createdAt: Date
    generatedAt?: Date
    audioUrl?: string
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
    readonly ownerId: string
    private _status: StoryStatus
    readonly createdAt: Date
    readonly generatedAt: Date | undefined
    readonly audioUrl: string | undefined

    private constructor(
        id: StoryId,
        title: string,
        content: StoryContent,
        theme: string,
        ownerId: string,
        status: StoryStatus,
        createdAt: Date,
        generatedAt: Date | undefined,
        audioUrl: string | undefined,
    ) {
        this.id = id
        this.title = title
        this.content = content
        this.theme = theme
        this.ownerId = ownerId
        this._status = status
        this.createdAt = createdAt
        this.generatedAt = generatedAt
        this.audioUrl = audioUrl
    }

    get status(): StoryStatus {
        return this._status
    }

    /**
     * Create a new Story from generated content
     */
    static create(props: StoryProps): Story {
        // [CLEAN-ARCH] Validate Business Invariants at creation boundary
        // We validate the props excluding 'content' (value object) using strip() or partial if needed
        // Since content is part of StoryProps but not StorySchema initially, we can just parse the primitives.
        // Actually, let's just validte the ones we defind.
        StorySchema.parse({
            id: props.id,
            title: props.title,
            theme: props.theme,
            ownerId: props.ownerId,
            status: props.status,
            createdAt: props.createdAt,
            generatedAt: props.generatedAt,
            audioUrl: props.audioUrl
        })

        return new Story(
            props.id,
            props.title,
            props.content,
            props.theme,
            props.ownerId,
            props.status,
            props.createdAt,
            props.generatedAt,
            props.audioUrl,
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
    /**
     * getEstimatedReadingTime
     */
    getEstimatedReadingTime(): number {
        const wordsPerMinute = 150 // Slower pace for bedtime stories
        const wordCount = this.content.getWordCount()
        return Math.ceil(wordCount / wordsPerMinute)
    }

    /**
     * [SAFETY] Block content from being viewed
     */
    block(): void {
        this._status = 'blocked'
    }

    isBlocked(): boolean {
        return this._status === 'blocked'
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
            ownerId: this.ownerId,
            status: this._status,
            createdAt: this.createdAt,
            generatedAt: this.generatedAt,
            audioUrl: this.audioUrl,
        }
    }

    /**
     * Convert to plain object for PUBLIC serialization.
     * [SEC-02] Excludes ownerId to prevent leaking internal user IDs.
     */
    toPublicJSON(): Omit<StoryProps, 'ownerId'> {
        const { ownerId: _, ...publicProps } = this.toJSON()
        return publicProps
    }
}
