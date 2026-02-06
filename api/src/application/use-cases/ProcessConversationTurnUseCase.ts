/**
 * ProcessConversationTurnUseCase
 * 
 * Orchestrates a single turn of conversation between the user and the agent.
 * Handles:
 * 1. Log Transparency (Input)
 * 2. Agent Execution (ReAct)
 * 3. Log Transparency (Output)
 */

import { BedtimeConductorAgent, ReasoningTrace } from '../../domain/agents/BedtimeConductorAgent.js'
import { LoggerPort } from '../ports/LoggerPort.js'
import { AgentMemoryPort } from '../ports/AgentMemoryPort.js'

export interface ProcessTurnRequest {
    userId: string
    sessionId: string
    message: string
    traceId?: string
}

export interface ProcessTurnResponse {
    reply: string
    trace: ReasoningTrace[]
}

export class ProcessConversationTurnUseCase {
    constructor(
        private readonly agent: BedtimeConductorAgent,
        private readonly logger: LoggerPort,
        private readonly memory: AgentMemoryPort // [2026] Inject Memory
    ) { }

    async execute(request: ProcessTurnRequest): Promise<ProcessTurnResponse> {
        this.logger.info('Processing conversation turn', { userId: request.userId, sessionId: request.sessionId })

        const context = {
            userId: request.userId,
            sessionId: request.sessionId
        }

        // [2026] Generate TraceId EARLY so it anchors both sides of the conversation
        const traceId = request.traceId || `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const extendedContext = { ...context, traceId }

        // [2026] 1. Store User Input (Episodic) with Trace Anchor
        await this.memory.store(request.message, 'EPISODIC', context, {
            traceId, // Anchor User Message
            role: 'user'
        })

        const { reply, trace } = await this.agent.processTurn(request.message, extendedContext)

        // [2026] 2. Store Agent Reply (Episodic) with Trace Anchor
        await this.memory.store(reply, 'EPISODIC', context, {
            traceId, // Anchor Agent Reply (Same Trace)
            role: 'agent'
        })

        this.logger.info('Agent Turn Completed', { traceId })

        return {
            reply,
            trace
        }
    }
}
