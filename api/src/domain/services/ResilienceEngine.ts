import { ResilienceStrategyPort, ResilienceEvent, CorrectionPlan } from '../../application/ports/ResilienceStrategyPort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

export class ResilienceEngine implements ResilienceStrategyPort {
    private logger: LoggerPort

    constructor(logger: LoggerPort) {
        this.logger = logger
    }

    async assessFailure(event: ResilienceEvent): Promise<CorrectionPlan> {
        let refinedType = event.type
        if (refinedType === 'UNKNOWN' && event.context['error']) {
            refinedType = this.mapErrorToFailureType(event.context['error'])
            this.logger.debug(`[ResilienceEngine] Refined failure type from UNKNOWN to ${refinedType}`)
        }

        const refinedEvent = { ...event, type: refinedType }
        this.logger.warn(`[ResilienceEngine] Assessing failure: ${refinedEvent.type}`, { ...refinedEvent })

        if (refinedEvent.costSoFar > 0.05) {
            this.logger.warn('[ResilienceEngine] FinOps Budget Exceeded. Aborting.', { cost: refinedEvent.costSoFar })
            return { action: 'ABORT', model: 'edge', estimatedCost: 0 }
        }

        if (refinedEvent.attempt >= 3) {
            this.logger.warn('[ResilienceEngine] Max attempts reached. Falling back.', { attempt: refinedEvent.attempt })
            return { action: 'FALLBACK', model: 'edge', estimatedCost: 0 }
        }

        switch (refinedEvent.type) {
            case 'SCHEMA_DRIFT':
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
                return {
                    action: 'RETRY',
                    model: 'flash',
                    estimatedCost: 0,
                    parameters: {
                        timeoutMs: 5000 * (refinedEvent.attempt + 1)
                    }
                }

            case 'API_RATE_LIMIT':
                return {
                    action: 'RETRY',
                    model: 'flash',
                    estimatedCost: 0,
                    parameters: {
                        timeoutMs: 1000 * Math.pow(2, refinedEvent.attempt)
                    }
                }

            case 'SAFETY_VIOLATION':
            case 'API_AUTH_ERROR':
            case 'API_BAD_REQUEST':
                return {
                    action: 'FALLBACK',
                    model: 'edge',
                    estimatedCost: 0
                }

            case 'TOKEN_LIMIT':
                return {
                    action: 'ABORT',
                    model: 'edge',
                    estimatedCost: 0
                }

            case 'QUALITY_BREACH':
                return {
                    action: 'DEGRADE_SERVICE',
                    model: 'edge',
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

