/**
 * StoryContent Value Object - Immutable representation ofstory text content
 * 
 * Value objects are immutable and compared by value, not identity.
 * Contains structured story content with title, paragraphs, and chapters.
 */

export interface StoryChapter {
    title: string
    content: string
    audioHint?: 'gentle' | 'excited' | 'whispered' | 'normal'
}

export interface StoryContentProps {
    paragraphs: string[]
    chapters?: StoryChapter[]
    sleepScore?: number // 1-10, how sleep-inducing the story is
}

export class StoryContent {
    public readonly paragraphs: string[]
    public readonly chapters: StoryChapter[]
    public readonly sleepScore: number

    private constructor(props: StoryContentProps) {
        this.paragraphs = [...props.paragraphs]
        this.chapters = props.chapters ? [...props.chapters] : []
        this.sleepScore = props.sleepScore ?? 5
    }

    /**
     * Create a new StoryContent from props
     */
    static create(props: StoryContentProps): StoryContent {
        if (!props.paragraphs || props.paragraphs.length === 0) {
            throw new Error('Story must have at least one paragraph')
        }
        return new StoryContent(props)
    }

    /**
     * Create StoryContent from raw text (splits by double newlines)
     */
    static fromRawText(text: string): StoryContent {
        const paragraphs = text
            .split(/\n\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0)

        return StoryContent.create({ paragraphs })
    }

    /**
     * Get full text content
     */
    getFullText(): string {
        return this.paragraphs.join('\n\n')
    }

    /**
     * Get word count for reading time estimation
     */
    getWordCount(): number {
        return this.paragraphs
            .join(' ')
            .split(/\s+/)
            .filter(word => word.length > 0)
            .length
    }

    /**
     * Get paragraph count
     */
    getParagraphCount(): number {
        return this.paragraphs.length
    }

    /**
     * Check if story is suitable for bedtime (high sleep score)
     */
    isBedtimeSuitable(): boolean {
        return this.sleepScore >= 7
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON(): StoryContentProps {
        return {
            paragraphs: this.paragraphs,
            chapters: this.chapters,
            sleepScore: this.sleepScore,
        }
    }
}
