/**
 * GetSuggestionsUseCase
 * 
 * Orchestrates the retrieval of proactive suggestions from the agent.
 */
import { BedtimeConductorAgent } from '../../domain/agents/BedtimeConductorAgent'
import { Suggestion } from '../../domain/entities/Suggestion'
import { LoggerPort } from '../ports/LoggerPort'

export interface GetSuggestionsRequest {
    userId: string
    sessionId: string
}

export interface GetSuggestionsResponse {
    suggestions: Suggestion[]
}

export class GetSuggestionsUseCase {
    constructor(
        private readonly agent: BedtimeConductorAgent,
        private readonly logger: LoggerPort
    ) { }

    async execute(request: GetSuggestionsRequest): Promise<GetSuggestionsResponse> {
        this.logger.info('Generating suggestions', { userId: request.userId })

        const suggestions = await this.agent.generateSuggestions({
            // Hydrate context if needed
        })

        this.logger.info('Suggestions generated', { count: suggestions.length })

        return {
            suggestions
        }
    }
}
