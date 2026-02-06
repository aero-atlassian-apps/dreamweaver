import { AIServicePort } from '../../application/ports/AIServicePort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'
import { PromptServicePort } from '../../application/ports/PromptServicePort.js'
import type { HumanReviewQueuePort } from '../../application/ports/HumanReviewQueuePort.js'
import { z } from 'zod'

export interface VerifiableContent {
    type: 'GOLDEN_MOMENT' | 'SAFETY_ACTION'
    content: unknown
    metadata?: Record<string, unknown>
}

export interface VerificationResult {
    approved: boolean
    stage: 'RULE' | 'MODEL' | 'HUMAN'
    reason: string
    confidence: number
}

/**
 * VerificationPipeline - The "GKD" (Generate-Knowledge-Decide) Enforcer.
 * 
 * Ensures high-stakes actions pass multiple gates before execution.
 * 1. Rule Check: Fast, deterministic, cheap.
 * 2. Model Check: Smart, context-aware, costs tokens.
 * 3. Human Queue: Slow, ultimate safety (optional).
 */
export class VerificationPipeline {
    private readonly logger: LoggerPort

    constructor(
        private aiService: AIServicePort,
        private readonly promptService: PromptServicePort,
        private readonly humanReviewQueue: HumanReviewQueuePort,
        logger?: LoggerPort
    ) {
        this.logger = logger || { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }
    }

    async verify(item: VerifiableContent): Promise<VerificationResult> {
        this.logger.info(`[VerificationPipeline] Inspecting ${item.type}...`)

        // Stage 1: Rule Check (Deterministic)
        if (!this.passedRuleCheck(item)) {
            return { approved: false, stage: 'RULE', reason: 'Failed static safety rules', confidence: 1.0 }
        }

        // Stage 2: Model Check (GKD)
        const modelResult = await this.performModelCheck(item)
        if (!modelResult.approved) {
            return {
                approved: false,
                stage: 'MODEL',
                reason: modelResult.reason || 'AI Validator rejected',
                confidence: modelResult.confidence
            }
        }

        // Stage 3: Human Queue (For low confidence or specific types)
        // In this MVP, we auto-approve if high confidence, else reject/flag.
        if (modelResult.confidence < 0.8) {
            this.logger.warn('[VerificationPipeline] Low confidence -> Flagging for Human Review')
            await this.humanReviewQueue.enqueue({
                item,
                reason: 'Low confidence model validation',
                confidence: modelResult.confidence
            })
            return { approved: false, stage: 'HUMAN', reason: 'Flagged for human review', confidence: modelResult.confidence }
        }

        return { approved: true, stage: 'MODEL', reason: 'All checks passed', confidence: modelResult.confidence }
    }

    private passedRuleCheck(item: VerifiableContent): boolean {
        // Example: JSON Schema validation or regex checks
        if (item.type === 'GOLDEN_MOMENT') {
            const content = item.content as any
            if (!content || typeof content.description !== 'string') return false
            if (content.description.length < 10) return false // Too short to be a moment
        }
        return true
    }

    private async performModelCheck(item: VerifiableContent): Promise<{ approved: boolean, reason?: string, confidence: number }> {
        try {
            const outputSchema = z.object({
                approved: z.boolean(),
                reason: z.string(),
                confidence: z.number().min(0).max(1),
            }).strict()

            const schema = {
                type: 'object',
                properties: {
                    approved: { type: 'boolean' },
                    reason: { type: 'string' },
                    confidence: { type: 'number' },
                },
                required: ['approved', 'reason', 'confidence'],
                additionalProperties: false,
            }

            const result = await this.aiService.generateStructured({
                systemPrompt: this.promptService.getVerificationValidatorSystemPrompt({ type: item.type }),
                userMessage: JSON.stringify({ type: item.type, content: item.content, metadata: item.metadata || {} }),
                schema,
            } as any)

            const validated = outputSchema.parse(result)
            return { approved: validated.approved, reason: validated.reason, confidence: validated.confidence }

        } catch (error) {
            this.logger.error('[VerificationPipeline] Model check failed', error)
            return { approved: false, reason: 'Validator error', confidence: 0 }
        }
    }
}
