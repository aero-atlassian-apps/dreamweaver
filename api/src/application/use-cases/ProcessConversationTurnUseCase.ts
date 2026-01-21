/**
 * ProcessConversationTurnUseCase
 * 
 * Orchestrates a single turn of conversation between the user and the agent.
 * Handles:
 * 1. Log Transparency (Input)
 * 2. Agent Execution (ReAct)
 * 3. Log Transparency (Output)
 */

import { BedtimeConductorAgent, ReasoningTrace } from '../../domain/agents/BedtimeConductorAgent'
import { LoggerPort } from '../ports/LoggerPort'

export interface ProcessTurnRequest {
    userId: string
    sessionId: string
    message: string
}

export interface ProcessTurnResponse {
    reply: string
    trace: ReasoningTrace[]
}

export class ProcessConversationTurnUseCase {
    constructor(
        private readonly agent: BedtimeConductorAgent,
        private readonly logger: LoggerPort
    ) { }

    async execute(request: ProcessTurnRequest): Promise<ProcessTurnResponse> {
        this.logger.info('Processing conversation turn', { userId: request.userId, sessionId: request.sessionId })

        const { reply, trace } = await this.agent.processTurn(request.message, {
            userId: request.userId,
            sessionId: request.sessionId,
            // In a real app, we'd hydrate mood/age from a UserProfile repository here
        })

        this.logger.info('Agent Turn Completed', { trace })

        return {
            reply,
            trace
        }
    }
}
