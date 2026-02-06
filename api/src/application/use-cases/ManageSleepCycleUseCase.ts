/**
 * ManageSleepCycleUseCase.ts
 * 
 * Orchestrates the "Sleep Sentinel" loop.
 * This use case would be triggered by a cron job or a client "Keep Alive" ping.
 */

import { SleepSentinelAgent } from '../../domain/agents/SleepSentinelAgent.js'
import { ReasoningTrace } from '../../domain/agents/BedtimeConductorAgent.js'
import { LoggerPort } from '../ports/LoggerPort.js'

export interface ManageSleepCycleRequest {
    userId: string
    sessionId: string
    traceId?: string
}

export interface ManageSleepCycleResponse {
    status: 'monitoring' | 'action_taken' | 'idle'
    reasoningTrace: ReasoningTrace[]
    confidence: number
}

export class ManageSleepCycleUseCase {
    constructor(
        private readonly sentinel: SleepSentinelAgent,
        private readonly logger: LoggerPort
    ) { }

    async execute(request: ManageSleepCycleRequest): Promise<ManageSleepCycleResponse> {
        this.logger.debug('Waking Sleep Sentinel', { sessionId: request.sessionId })

        const statusDetails = this.sentinel.getStatus()
        const confidence = statusDetails.currentConfidence

        const thought = `SleepSentinel confidence=${confidence.toFixed(2)} (live monitoring).`
        const trace: ReasoningTrace[] = [{
            goals_considered: ['RELAXATION', 'SAFETY'],
            thought,
            action: confidence > 0.8 ? 'ALERT_SLEEP' : 'CONTINUE_MONITORING',
            confidence,
            timestamp: new Date(),
            type: 'trace_object',
            conflict_detected: false
        }]

        let status: 'monitoring' | 'action_taken' | 'idle' = 'monitoring'
        if (trace.some(t => t.action === 'ALERT_SLEEP')) {
            status = 'action_taken'
        } else if (trace.some(t => t.action === 'CONTINUE_MONITORING')) {
            status = 'monitoring'
        }

        // 3. Log transparency
        this.logger.info('🛡️ Sleep Sentinel Report', {
            sessionId: request.sessionId,
            confidence: statusDetails.currentConfidence,
            trace
        })

        return {
            status,
            reasoningTrace: trace,
            confidence
        }
    }
}
