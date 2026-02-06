/**
 * GetSuggestionsUseCase
 * 
 * Orchestrates the retrieval of proactive suggestions from the agent.
 */
import { BedtimeConductorAgent } from '../../domain/agents/BedtimeConductorAgent.js'
import { Suggestion } from '../../domain/entities/Suggestion.js'
import { LoggerPort } from '../ports/LoggerPort.js'

import { AmbientContextPort } from '../ports/AmbientContextPort.js'

export interface GetSuggestionsRequest {
    userId: string
    sessionId: string
    traceId?: string
}

export interface GetSuggestionsResponse {
    suggestions: Suggestion[]
}

export class GetSuggestionsUseCase {
    constructor(
        private readonly agent: BedtimeConductorAgent,
        private readonly logger: LoggerPort,
        private readonly ambientContext?: AmbientContextPort
    ) { }

    async execute(request: GetSuggestionsRequest): Promise<GetSuggestionsResponse> {
        this.logger.info('Generating suggestions', { userId: request.userId })

        let envContext = undefined
        if (this.ambientContext) {
            try {
                envContext = await this.ambientContext.getAmbientContext()
            } catch (error) {
                this.logger.warn('Failed to fetch ambient context for suggestions', { error })
            }
        }

        const suggestions = await this.agent.generateSuggestions({
            // Hydrate context
            userId: request.userId,
            sessionId: request.sessionId,
            traceId: request.traceId,
            envContext
        })

        this.logger.info('Suggestions generated', { count: suggestions.length })

        return {
            suggestions
        }
    }
}
