/**
 * ReviewFeedbackUseCase - Admin review of flagged content
 */
import { Feedback } from '../../domain/entities/Feedback.js'
import { FeedbackRepositoryPort } from '../ports/FeedbackRepositoryPort.js'
import { StoryRepositoryPort } from '../ports/StoryRepositoryPort.js'
import type { MomentRepositoryPort } from '../ports/MomentRepositoryPort.js'
import type { ModerationRepositoryPort } from '../ports/ModerationRepositoryPort.js'

export interface ReviewFeedbackInput {
    feedbackId: string
    adminId: string
    resolution: 'dismissed' | 'ban_content' | 'warning'
    adminNotes?: string
}

export interface ReviewFeedbackOutput {
    feedback: Feedback
    actionTaken: string
}

export class ReviewFeedbackUseCase {
    constructor(
        private feedbackRepo: FeedbackRepositoryPort,
        private storyRepo: StoryRepositoryPort,
        private momentRepo: MomentRepositoryPort,
        private moderationRepo: ModerationRepositoryPort
    ) { }

    async execute(input: ReviewFeedbackInput): Promise<ReviewFeedbackOutput> {
        const feedback = await this.feedbackRepo.findById(input.feedbackId)
        if (!feedback) {
            throw new Error('Feedback not found')
        }

        // Apply Action
        let actionDescription = 'No action taken'

        if (input.resolution === 'ban_content') {
            if (feedback.contentType === 'story') {
                const story = await this.storyRepo.findById(feedback.contentId)
                if (story) {
                    story.block()
                    await this.storyRepo.save(story)
                    actionDescription = 'Content blocked'
                } else {
                    actionDescription = 'Content not found (already deleted?)'
                }
            } else if (feedback.contentType === 'moment') {
                const blocked = await this.momentRepo.block(feedback.contentId)
                actionDescription = blocked ? 'Moment blocked' : 'Moment not found (already deleted?)'
            } else if (feedback.contentType === 'character') {
                await this.moderationRepo.block('character', feedback.contentId, input.adminId, feedback.reason, input.adminNotes)
                actionDescription = 'Character blocked'
            } else {
                actionDescription = 'Content blocked'
            }
        }

        // Update Feedback Status
        feedback.status = 'resolved'
        feedback.resolution = input.resolution === 'dismissed' ? 'dismissed' : 'action_taken'
        feedback.adminNotes = input.adminNotes
        feedback.resolvedAt = new Date()

        await this.feedbackRepo.update(feedback)

        return {
            feedback,
            actionTaken: actionDescription
        }
    }
}
