/**
 * Story Entity - Frontend domain object
 */

export type StoryId = string
export type StoryStatus = 'generating' | 'completed' | 'failed'

export interface StoryContent {
    paragraphs: string[]
    sleepScore: number
    getWordCount?: () => number
    getFullText?: () => string
}

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

export class Story {
    readonly id: StoryId
    readonly title: string
    readonly content: StoryContent
    readonly theme: string
    readonly ownerId: string
    readonly status: StoryStatus
    readonly createdAt: Date
    readonly generatedAt?: Date
    readonly audioUrl?: string

    constructor(props: StoryProps) {
        this.id = props.id
        this.title = props.title
        this.content = props.content
        this.theme = props.theme
        this.ownerId = props.ownerId
        this.status = props.status
        this.createdAt = props.createdAt
        this.generatedAt = props.generatedAt
        this.audioUrl = props.audioUrl
    }

    static create(props: StoryProps): Story {
        return new Story(props)
    }

    getEstimatedReadingTime(): number {
        const text = this.content.paragraphs.join(' ')
        const wordCount = text.split(/\s+/).length
        return Math.ceil(wordCount / 150)
    }
}
