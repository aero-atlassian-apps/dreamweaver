import { VerifiableContent } from '../../domain/services/VerificationPipeline.js'

export interface EnqueueHumanReviewInput {
    item: VerifiableContent
    reason: string
    confidence: number
}

export interface HumanReviewQueuePort {
    enqueue(input: EnqueueHumanReviewInput): Promise<void>
}

