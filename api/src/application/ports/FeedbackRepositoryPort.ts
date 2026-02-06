import { CreateFeedbackInput, Feedback } from '../../domain/entities/Feedback.js'

export interface FeedbackRepositoryPort {
    create(data: CreateFeedbackInput): Promise<Feedback>
    update(feedback: Feedback): Promise<void>
    findPending(): Promise<Feedback[]>
    findById(id: string): Promise<Feedback | null>
}
