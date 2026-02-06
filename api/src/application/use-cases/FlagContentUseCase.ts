import { CreateFeedbackInput, Feedback } from '../../domain/entities/Feedback.js'
import { FeedbackRepositoryPort } from '../../application/ports/FeedbackRepositoryPort.js'

export class FlagContentUseCase {
    constructor(private feedbackRepo: FeedbackRepositoryPort) { }

    async execute(input: CreateFeedbackInput): Promise<Feedback> {
        // Basic validation
        if (!input.userId) throw new Error('UserId is required')
        if (!input.contentId) throw new Error('ContentId is required')
        if (!input.type) throw new Error('Feedback type is required')

        // In a real system, we might want to:
        // 1. Verify content exists (via ContentService)
        // 2. Check for duplicate flags
        // 3. Notify admins (via EventBus)

        return this.feedbackRepo.create(input)
    }
}
