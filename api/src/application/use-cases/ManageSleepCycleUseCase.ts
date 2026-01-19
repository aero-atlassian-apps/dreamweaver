/**
 * ManageSleepCycleUseCase.ts
 * 
 * Orchestrates the "Sleep Sentinel" loop.
 * This use case would be triggered by a cron job or a client "Keep Alive" ping.
 */

import { SleepSentinelAgent, ReasoningTrace } from '../../domain/agents/SleepSentinelAgent'
import { LoggerPort } from '../ports/LoggerPort'

export interface ManageSleepCycleRequest {
    userId: string
    sessionId: string
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

        // 1. Trigger Agent Evaluation
        const trace = await this.sentinel.evaluateEnvironment()

        // 2. Determine High-Level Status based on trace
        const statusDetails = this.sentinel.getStatus()

        let status: 'monitoring' | 'action_taken' | 'idle' = 'monitoring'
        if (trace.some(t => t.step === 'ACTION')) status = 'monitoring'
        if (trace.some(t => t.content.includes('Publishing SLEEP_CUE'))) status = 'action_taken'

        // 3. Log transparency
        this.logger.info('🛡️ Sleep Sentinel Report', {
            sessionId: request.sessionId,
            confidence: statusDetails.currentConfidence,
            trace
        })

        return {
            status,
            reasoningTrace: trace,
            confidence: statusDetails.currentConfidence
        }
    }
}
