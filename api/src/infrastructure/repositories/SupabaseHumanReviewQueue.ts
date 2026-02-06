import type { HumanReviewQueuePort, EnqueueHumanReviewInput } from '../../application/ports/HumanReviewQueuePort.js'
import { supabaseAdmin } from '../supabaseAdmin.js'
import type { LoggerPort } from '../../application/ports/LoggerPort.js'

export class SupabaseHumanReviewQueue implements HumanReviewQueuePort {
    constructor(private readonly logger: LoggerPort) { }

    async enqueue(input: EnqueueHumanReviewInput): Promise<void> {
        if (!supabaseAdmin) {
            throw new Error('Supabase service role is required for Human Review Queue')
        }

        const { error } = await supabaseAdmin
            .from('human_review_queue')
            .insert({
                item_type: input.item.type,
                item_content: input.item.content as any,
                item_metadata: (input.item.metadata || {}) as any,
                reason: input.reason,
                confidence: input.confidence,
                status: 'pending'
            })

        if (error) {
            this.logger.error('Failed to enqueue human review item', error)
            throw new Error(`Failed to enqueue human review item: ${error.message}`)
        }
    }
}

