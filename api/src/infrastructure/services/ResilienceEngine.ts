/**
 * ResilienceEngine - Implementation of ResilienceStrategyPort
 * 
 * Implements the "Self-Healer" logic using a FinOps-first approach.
 * Decides whether to Retry, Self-Correct, Fallback, or Abort based on
 * failure type and budget constraints.
 */

import { ResilienceStrategyPort, ResilienceEvent, CorrectionPlan } from '../../application/ports/ResilienceStrategyPort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

export class ResilienceEngine implements ResilienceStrategyPort {
    private logger: LoggerPort

    constructor(logger: LoggerPort) {
        this.logger = logger
    }

    async assessFailure(event: ResilienceEvent): Promise<CorrectionPlan> {
        // 0. Refine Failure Type if UNKNOWN
        let refinedType = event.type
        if (refinedType === 'UNKNOWN' && event.context['error']) {
            refinedType = this.mapErrorToFailureType(event.context['error'])
            this.logger.debug(`[ResilienceEngine] Refined failure type from UNKNOWN to ${refinedType}`)
        }

        const refinedEvent = { ...event, type: refinedType }
        this.logger.warn(`[ResilienceEngine] Assessing failure: ${refinedEvent.type}`, { ...refinedEvent })

        // 1. FinOps Circuit Breaker
        // $0.05 is a rough upper bound for a single turn in a low-cost session
        if (refinedEvent.costSoFar > 0.05) {
            this.logger.warn('[ResilienceEngine] FinOps Budget Exceeded. Aborting.', { cost: refinedEvent.costSoFar })
            return { action: 'ABORT', model: 'edge', estimatedCost: 0 }
        }

        // 2. Max Attempts Check
        // Hard limit of 3 attempts to prevent infinite loops
        if (refinedEvent.attempt >= 3) {
            this.logger.warn('[ResilienceEngine] Max attempts reached. Falling back.', { attempt: refinedEvent.attempt })
            return { action: 'FALLBACK', model: 'edge', estimatedCost: 0 }
        }

        // 3. Strategy Selection based on Failure Type
        switch (refinedEvent.type) {
            case 'SCHEMA_DRIFT':
                // For schema errors, we try to Self-Correct using a cheaper model (Flash)
                // We assume self-correction costs distinctively less than a full retry
                return {
                    action: 'SELF_CORRECT',
                    model: 'flash',
                    estimatedCost: 0.00005,
                    parameters: {
                        instruction: 'Fix the JSON syntax',
                        errorContext: refinedEvent.context['error']
                    }
                }

            case 'NETWORK_TIMEOUT':
            case 'API_SERVER_ERROR':
                // Transient network/server issues get a Retry
                // Use Flash if possible to save cost on the retry, unless strategy dictates otherwise
                return {
                    action: 'RETRY',
                    model: 'flash',
                    estimatedCost: 0,
                    parameters: {
                        timeoutMs: 5000 * (refinedEvent.attempt + 1) // Linear backoff
                    }
                }

            case 'API_RATE_LIMIT':
                // Rate limits need longer backoff
                return {
                    action: 'RETRY',
                    model: 'flash',
                    estimatedCost: 0,
                    parameters: {
                        timeoutMs: 1000 * Math.pow(2, refinedEvent.attempt) // Exponential backoff (2s, 4s, 8s)
                    }
                }

            case 'SAFETY_VIOLATION':
            case 'API_AUTH_ERROR':
            case 'API_BAD_REQUEST':
                // Fatal or non-retriable errors -> Immediate Fallback/Abort
                return {
                    action: 'FALLBACK',
                    model: 'edge',
                    estimatedCost: 0
                }

            case 'TOKEN_LIMIT':
                // If we hit token limits, we must Abort or summarize (not implemented yet)
                return {
                    action: 'ABORT',
                    model: 'edge',
                    estimatedCost: 0
                }

            case 'QUALITY_BREACH':
                // [2026] Degradation Strategy
                // If quality fails (e.g., child is crying/ignoring), switch to "Safe Mode"
                // This means simpler prompts, strictly safety-aligned, or predefined scripts.
                return {
                    action: 'DEGRADE_SERVICE', // New Action Type
                    model: 'edge', // Use cheapest/fastest model
                    estimatedCost: 0
                }

            default:
                this.logger.warn(`[ResilienceEngine] Unknown failure type: ${refinedEvent.type}. Defaulting to Fallback.`)
                return {
                    action: 'FALLBACK',
                    model: 'edge',
                    estimatedCost: 0
                }
        }
    }

    private mapErrorToFailureType(error: unknown): any {
        const msg = typeof error === 'string' ? error : (error as any).message || String(error)
        const lowerMsg = msg.toLowerCase()

        if (lowerMsg.includes('429') || lowerMsg.includes('rate limit') || lowerMsg.includes('quota')) return 'API_RATE_LIMIT'
        if (lowerMsg.includes('401') || lowerMsg.includes('403') || lowerMsg.includes('auth') || lowerMsg.includes('permission')) return 'API_AUTH_ERROR'
        if (lowerMsg.includes('500') || lowerMsg.includes('503') || lowerMsg.includes('internal') || lowerMsg.includes('unavailable')) return 'API_SERVER_ERROR'
        if (lowerMsg.includes('400') || lowerMsg.includes('bad request') || lowerMsg.includes('invalid argument')) return 'API_BAD_REQUEST'
        if (lowerMsg.includes('json') || lowerMsg.includes('parse')) return 'SCHEMA_DRIFT'
        if (lowerMsg.includes('safety') || lowerMsg.includes('blocked')) return 'SAFETY_VIOLATION'
        if (lowerMsg.includes('timeout')) return 'NETWORK_TIMEOUT'
        if (lowerMsg.includes('quality gate') || lowerMsg.includes('breach')) return 'QUALITY_BREACH'

        return 'UNKNOWN'
    }
}
