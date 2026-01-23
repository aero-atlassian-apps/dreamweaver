/**
 * SharedLink Entity
 * 
 * Represents a secure, temporary link to a resource (Story or Golden Moment).
 * Uses a high-entropy token for access.
 */

import { randomBytes } from 'crypto'

export type SharedLinkType = 'STORY' | 'MOMENT'

export interface SharedLinkProps {
    id: string
    resourceId: string
    type: SharedLinkType
    token: string
    maxViews: number
    currentViews: number
    expiresAt: Date
    createdAt: Date
}

export class SharedLink {
    readonly id: string
    readonly resourceId: string
    readonly type: SharedLinkType
    readonly token: string
    readonly maxViews: number
    readonly expiresAt: Date
    readonly createdAt: Date
    private _currentViews: number

    private constructor(props: SharedLinkProps) {
        this.id = props.id
        this.resourceId = props.resourceId
        this.type = props.type
        this.token = props.token
        this.maxViews = props.maxViews
        this._currentViews = props.currentViews
        this.expiresAt = props.expiresAt
        this.createdAt = props.createdAt
    }

    get currentViews(): number {
        return this._currentViews
    }

    static create(props: SharedLinkProps): SharedLink {
        return new SharedLink(props)
    }

    /**
     * Generate a new secure shared link
     */
    static generate(resourceId: string, type: SharedLinkType, maxViews: number = 5, expiresInDays: number = 7): SharedLink {
        const token = randomBytes(16).toString('hex') // 32 chars hex
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)

        return new SharedLink({
            id: crypto.randomUUID(),
            resourceId,
            type,
            token,
            maxViews,
            currentViews: 0,
            expiresAt,
            createdAt: new Date()
        })
    }

    /**
     * Check if link is still valid
     */
    isValid(): boolean {
        const now = new Date()
        return now < this.expiresAt && this._currentViews < this.maxViews
    }

    /**
     * Increment view count (Business Logic)
     */
    incrementView(): void {
        this._currentViews++
    }

    toJSON(): SharedLinkProps {
        return {
            id: this.id,
            resourceId: this.resourceId,
            type: this.type,
            token: this.token,
            maxViews: this.maxViews,
            currentViews: this._currentViews,
            expiresAt: this.expiresAt,
            createdAt: this.createdAt
        }
    }
}
