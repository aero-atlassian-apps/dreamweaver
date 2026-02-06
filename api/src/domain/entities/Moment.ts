export interface MomentProps {
    id: string
    userId: string
    storyId: string
    mediaUrl: string
    description?: string
    createdAt: Date
}

export class Moment {
    constructor(private props: MomentProps) { }

    get id(): string { return this.props.id }
    get userId(): string { return this.props.userId }
    get storyId(): string { return this.props.storyId }
    get mediaUrl(): string { return this.props.mediaUrl }
    get description(): string | undefined { return this.props.description }
    get createdAt(): Date { return this.props.createdAt }

    static create(props: MomentProps): Moment {
        return new Moment(props)
    }

    toJSON(): MomentProps {
        return {
            ...this.props
        }
    }

    /**
     * Convert to plain object for PUBLIC serialization.
     * [SEC-02] Excludes userId to prevent leaking internal user IDs.
     */
    toPublicJSON(): Omit<MomentProps, 'userId'> {
        const { userId: _, ...publicProps } = this.toJSON()
        return publicProps
    }
}
