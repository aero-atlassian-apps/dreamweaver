/**
 * LogInteractionUseCase
 * 
 * Logs user interactions (Story Completion, Skips, etc.) to update Procedural Memory.
 */
import { AgentMemoryPort } from '../ports/AgentMemoryPort.js'
import { LoggerPort } from '../ports/LoggerPort.js'

export interface LogInteractionRequest {
    userId: string
    theme: string
    interactionType: 'story_completed' | 'story_skipped' | 'volume_down'
}

export class LogInteractionUseCase {
    constructor(
        private readonly memory: AgentMemoryPort,
        private readonly logger: LoggerPort
    ) { }

    async execute(request: LogInteractionRequest): Promise<void> {
        this.logger.info('Logging interaction', { ...request })

        const outcome = request.interactionType === 'story_completed' ? 'POSITIVE' : 'NEGATIVE'

        // Update Procedural Stats
        await this.memory.trackOutcome(request.theme, outcome, { userId: request.userId })

        this.logger.debug(`Updated stats for theme: ${request.theme} -> ${outcome}`)
    }
}
