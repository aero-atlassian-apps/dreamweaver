/**
 * SafetyGuardian - The "4-Layer Defense" for child safety.
 * 
 * Responsibilities:
 * 1. Scans generated content for prohibited topics.
 * 2. Validates against age-appropriate constraints.
 * 3. Provides fail-safe fallbacks if AI hallucinations occur.
 */

export interface SafetyCheckResult {
    isSafe: boolean
    reason?: string
    fallbackContent?: string
    sanitizedContent?: string
}

import { AIServicePort } from '../../application/ports/AIServicePort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'
import { PromptServicePort } from '../../application/ports/PromptServicePort.js'
import { z } from 'zod'

export class SafetyGuardian {
    private static readonly BANNED_PATTERNS = [
        /\b(violence|blood|killing|death|monster\s+under\s+the\s+bed)\b/i,
        /\b(scary|fright|terror|nightmare)\b/i,
        /\b(bad\s+words|adult\s+themes)\b/i
    ]

    private static readonly INJECTION_PATTERNS = [
        /ignore\s+(previous|all|above)\s+instructions?/i,
        /disregard\s+(your|the)\s+(rules|guidelines|instructions)/i,
        /you\s+are\s+now\s+(?:a|an)?\s*\w+/i, // "You are now DAN"
        /pretend\s+(?:to\s+be|you\s+are)/i,
        /\bDAN\b|\bDeveloper\s+Mode\b/i,
        /\[\s*SYSTEM\s*\]/i, // Fake system prompts
        /\{\s*"role"\s*:\s*"system"/i, // JSON injection attempts
        /<\/?(?:system|assistant|user)>/i, // XML tag injection
        /roleplay\s+as\s+(?:a|an)?\s*(?:evil|malicious|bad)/i
    ]

    private readonly logger: LoggerPort

    constructor(
        private aiService: AIServicePort,
        private readonly promptService: PromptServicePort,
        logger?: LoggerPort
    ) {
        this.logger = logger || { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }
    }

    /**
     * Performs a multi-layer safety check on generated text.
     * [SAFE-01] Upgraded to 4-Layer Defense
     */
    async checkContent(text: string, childAge: number = 5, fallbackContent?: string, traceId?: string): Promise<SafetyCheckResult> {

        for (const pattern of SafetyGuardian.INJECTION_PATTERNS) {
            if (pattern.test(text)) {
                this.logger.warn('Layer 0: Prompt injection attempt detected', { pattern: pattern.toString(), traceId })
                return {
                    isSafe: false,
                    reason: `Layer 0 Violation: Prompt injection attempt detected`,
                    fallbackContent: fallbackContent || 'Content blocked for security.'
                }
            }
        }

        // Layer 1: Pattern Matching (Fast Fail)
        for (const pattern of SafetyGuardian.BANNED_PATTERNS) {
            if (pattern.test(text)) {
                return {
                    isSafe: false,
                    reason: `Layer 1 Violation: Found prohibited pattern: ${pattern}`,
                    fallbackContent: fallbackContent || 'Story removed for safety.'
                }
            }
        }

        // Layer 2: Semantic/LLM Check (Contextual)
        try {
            const safetySchema = z.object({
                isSafe: z.boolean(),
                reason: z.string().optional(),
            }).strict()

            const schema = {
                type: 'object',
                properties: {
                    isSafe: { type: 'boolean' },
                    reason: { type: 'string' }
                },
                required: ['isSafe'],
                additionalProperties: false,
            }

            const verdict = await this.aiService.generateStructured({
                systemPrompt: this.promptService.getSafetyValidatorSystemPrompt({ childAge }),
                userMessage: `Content: ${text.substring(0, 2000)}`,
                schema,
                traceId,
            } as any)

            const safetyJson = safetySchema.parse(verdict)

            if (safetyJson.isSafe === false) {
                return {
                    isSafe: false,
                    reason: `Layer 2 Violation: ${safetyJson.reason || 'AI Flagged Content'}`,
                    fallbackContent: fallbackContent || 'Content filtered.'
                }
            }

        } catch (e) {
            // [SAFE-01] Fail Closed
            // If the safety check errors out, we cannot guarantee safety, so we block content.
            this.logger.error('Safety Layer 2 failed - FAILING CLOSED', e)
            return {
                isSafe: false,
                reason: 'Safety Validation System Error (Fail Closed)',
                fallbackContent: fallbackContent || 'Content unavailable due to safety system error.'
            }
        }

        // Layer 3: Output Validation (Age Appropriateness) [AI-04]
        // Explicit heuristic check for complex words or themes for very young children
        if (childAge < 5) {
            const complexWords = ['existential', 'misery', 'taxes', 'politics']
            if (complexWords.some(w => text.toLowerCase().includes(w))) {
                return {
                    isSafe: false,
                    reason: `Layer 3 Violation: Content too complex for age ${childAge}`,
                    fallbackContent: fallbackContent
                }
            }
        }

        // Layer 4: Output Sanitization [AI-04]
        // Remove Any internal <thinking> tags if leakage occurred
        const sanitized = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim()
        if (sanitized !== text.trim()) {
            this.logger.debug('Layer 4: Sanitized output artifacts')
            return { isSafe: true, sanitizedContent: sanitized }
        }

        return { isSafe: true, sanitizedContent: text }
    }
}
