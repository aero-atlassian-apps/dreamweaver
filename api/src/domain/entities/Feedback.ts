export type FeedbackType = 'flag' | 'rating' | 'correction'

export interface Feedback {
    id: string
    userId: string
    contentId: string // story_id, moment_id, etc.
    contentType: 'story' | 'moment' | 'character' | 'conversation'
    type: FeedbackType
    reason?: string // e.g. 'harmful', 'boring', 'inaccurate'
    details?: string
    status: 'pending' | 'reviewed' | 'resolved'
    resolution?: 'dismissed' | 'action_taken'
    adminNotes?: string
    resolvedAt?: Date
    createdAt: Date
}

export interface CreateFeedbackInput {
    userId: string
    contentId: string
    contentType: 'story' | 'moment' | 'character' | 'conversation'
    type: FeedbackType
    reason?: string
    details?: string
}
