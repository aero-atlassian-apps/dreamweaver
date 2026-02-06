/**
 * ResilienceStrategyPort - Interface for Autonomous Self-Correction
 * 
 * Defines the contract for determining recovery strategies during
 * failure scenarios (Network, Schema, Safety) while adhering to FinOps constraints.
 */

export type FailureType =
    | 'NETWORK_TIMEOUT'
    | 'SCHEMA_DRIFT'
    | 'SAFETY_VIOLATION'
    | 'TOKEN_LIMIT'
    | 'API_RATE_LIMIT'
    | 'API_AUTH_ERROR'
    | 'API_SERVER_ERROR'
    | 'API_BAD_REQUEST'
    | 'QUALITY_BREACH' // [2026]
    | 'UNKNOWN'

export interface ResilienceEvent {
    type: FailureType
    context: Record<string, unknown>
    attempt: number
    costSoFar: number
}

export interface CorrectionPlan {
    action: 'RETRY' | 'SELF_CORRECT' | 'FALLBACK' | 'ABORT' | 'DEGRADE_SERVICE' // [2026]
    model: 'flash' | 'pro' | 'edge' // 'edge' implies local/no-cost
    parameters?: Record<string, unknown>
    estimatedCost: number
}

export interface ResilienceStrategyPort {
    /**
     * Determines the best course of action given a failure.
     * Enforces FinOps limits.
     */
    assessFailure(event: ResilienceEvent): Promise<CorrectionPlan>
}
