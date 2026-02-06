import { EventBusPort, SleepCueDetectedEvent, StoryBeatCompletedEvent } from '../ports/EventBusPort.js'
import { MemorySummarizationService } from '../../domain/services/MemorySummarizationService.js'
import { LoggerPort } from '../ports/LoggerPort.js'
import { SessionStatePort } from '../ports/SessionStatePort.js'

/**
 * SessionConsolidator
 * 
 * Subscribes to session lifecycle events to trigger the "Ralph Loop" (Memory Summarization).
 * This ensures that episodic memories are consolidated into semantic facts when a session ends.
 */
export class SessionConsolidator {
    constructor(
        private readonly eventBus: EventBusPort,
        private readonly summarizationService: MemorySummarizationService,
        private readonly sessionState: SessionStatePort,
        private readonly logger: LoggerPort
    ) { }

    subscribe(): void {
        this.eventBus.subscribe('SLEEP_CUE_DETECTED', this.handleSleepDetected.bind(this))
        this.eventBus.subscribe('STORY_BEAT_COMPLETED', this.handleStoryBeat.bind(this))

        this.logger.info('[SessionConsolidator] Subscribed to lifecycle events for Ralph Loop')
    }

    private async handleSleepDetected(event: SleepCueDetectedEvent): Promise<void> {
        const payload = event.payload as any
        // Prefer explicit context from payload, fallback to requestId
        const sessionId = payload.context?.sessionId || event.requestId
        let userId = payload.context?.userId

        if (!sessionId || sessionId === 'unknown') {
            this.logger.warn('[SessionConsolidator] Skipping summarization: No sessionId found in Sleep event', { eventId: event.id })
            return
        }

        // Resolve userId if missing
        if (!userId) {
            const state = await this.sessionState.get(sessionId)
            if (state) userId = state.userId
        }

        if (!userId) {
            this.logger.warn('[SessionConsolidator] Skipping summarization: Could not resolve userId', { sessionId })
            return
        }

        this.logger.info('[SessionConsolidator] Sleep Detected. Triggering summarization (Ralph Loop)...', { sessionId })
        try {
            await this.summarizationService.summarizeSession(sessionId, userId)
            this.logger.info('[SessionConsolidator] Summarization complete for sleep event.', { sessionId })
        } catch (error) {
            this.logger.error('[SessionConsolidator] Summarization failed', { error, sessionId })
        }
    }

    private async handleStoryBeat(event: StoryBeatCompletedEvent): Promise<void> {
        const { beatIndex, totalBeats, storyId } = event.payload

        // Only trigger on the final beat (Story Completion)
        if (beatIndex >= totalBeats - 1) {
            const sessionId = event.requestId // In GenerateStoryUseCase, requestId is the sessionId

            if (sessionId && sessionId !== 'unknown') {
                this.logger.info('[SessionConsolidator] Story Completed. Triggering summarization...', { storyId, sessionId })
                try {
                    const state = await this.sessionState.get(sessionId)
                    const userId = state?.userId

                    if (userId) {
                        await this.summarizationService.summarizeSession(sessionId, userId)
                    } else {
                        this.logger.warn('[SessionConsolidator] Story Completed but no userId found via SessionState.', { sessionId })
                    }
                } catch (error) {
                    this.logger.error('[SessionConsolidator] Summarization failed for story completion', { error, sessionId })
                }
            }
        }
    }
}
