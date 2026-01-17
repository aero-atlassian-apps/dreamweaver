/**
 * GoldenMoment Entity - A memorable moment from a bedtime story
 * 
 * Captures special interactions: questions asked, milestones, quotes
 * No external dependencies - pure domain logic.
 */

export type GoldenMomentId = string
export type MomentType = 'question' | 'milestone' | 'quote' | 'interaction'

export interface GoldenMomentProps {
    id: GoldenMomentId
    storyId: string
    userId: string
    type: MomentType
    title: string
    quote?: string
    audioClipUrl?: string
    audioDurationSeconds?: number
    tags: string[]
    isStarred: boolean
    timestamp: Date
}

export interface CreateMomentInput {
    storyId: string
    userId: string
    type: MomentType
    title: string
    quote?: string
    tags?: string[]
}

export class GoldenMoment {
    private constructor(
        public readonly id: GoldenMomentId,
        public readonly storyId: string,
        public readonly userId: string,
        public readonly type: MomentType,
        public readonly title: string,
        public readonly quote: string | undefined,
        private _audioClipUrl: string | undefined,
        private _audioDurationSeconds: number | undefined,
        private _tags: string[],
        private _isStarred: boolean,
        public readonly timestamp: Date,
    ) { }

    get audioClipUrl(): string | undefined {
        return this._audioClipUrl
    }

    get audioDurationSeconds(): number | undefined {
        return this._audioDurationSeconds
    }

    get tags(): readonly string[] {
        return [...this._tags]
    }

    get isStarred(): boolean {
        return this._isStarred
    }

    /**
     * Create a GoldenMoment from props
     */
    static create(props: GoldenMomentProps): GoldenMoment {
        return new GoldenMoment(
            props.id,
            props.storyId,
            props.userId,
            props.type,
            props.title,
            props.quote,
            props.audioClipUrl,
            props.audioDurationSeconds,
            [...props.tags],
            props.isStarred,
            props.timestamp,
        )
    }

    /**
     * Create a new moment
     */
    static createNew(input: CreateMomentInput): GoldenMoment {
        return new GoldenMoment(
            `moment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            input.storyId,
            input.userId,
            input.type,
            input.title,
            input.quote,
            undefined,
            undefined,
            input.tags ?? [],
            false,
            new Date(),
        )
    }

    /**
     * Add audio clip to this moment
     */
    setAudioClip(url: string, durationSeconds: number): void {
        this._audioClipUrl = url
        this._audioDurationSeconds = durationSeconds
    }

    /**
     * Toggle starred status
     */
    toggleStar(): void {
        this._isStarred = !this._isStarred
    }

    /**
     * Star this moment
     */
    star(): void {
        this._isStarred = true
    }

    /**
     * Add a tag
     */
    addTag(tag: string): void {
        const normalizedTag = tag.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (!this._tags.includes(normalizedTag)) {
            this._tags.push(normalizedTag)
        }
    }

    /**
     * Remove a tag
     */
    removeTag(tag: string): void {
        const normalizedTag = tag.toLowerCase().replace(/[^a-z0-9]/g, '')
        this._tags = this._tags.filter(t => t !== normalizedTag)
    }

    /**
     * Format audio duration as MM:SS
     */
    formatDuration(): string {
        if (!this._audioDurationSeconds) return '0:00'
        const mins = Math.floor(this._audioDurationSeconds / 60)
        const secs = Math.floor(this._audioDurationSeconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON(): GoldenMomentProps {
        return {
            id: this.id,
            storyId: this.storyId,
            userId: this.userId,
            type: this.type,
            title: this.title,
            quote: this.quote,
            audioClipUrl: this._audioClipUrl,
            audioDurationSeconds: this._audioDurationSeconds,
            tags: [...this._tags],
            isStarred: this._isStarred,
            timestamp: this.timestamp,
        }
    }
}
