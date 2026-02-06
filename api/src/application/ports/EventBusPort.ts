/**
 * EventBusPort - Interface for event publishing and subscription
 * 
 * This port defines the contract for pub/sub event communication.
 * Implementations can be in-memory, Redis, etc.
 */

export interface DomainEvent {
    id: string      // Unique ID for idempotency
    requestId: string // Correlation ID for tracing
    traceId?: string
    type: string
    payload: unknown
    timestamp: Date
}

export type EventHandler<T extends DomainEvent> = (event: T) => void | Promise<void>

export interface EventBusPort {
    /**
     * Publishes a domain event to all interested subscribers.
     * @param event The event object containing type, payload, and timestamp.
     * @returns Promise that resolves when the event has been successfully dispatched (or persisted).
     */
    publish<T extends DomainEvent>(event: T): Promise<void>

    /**
     * Subscribes a handler to a specific event type.
     * @param eventType The string identifier for the event type (e.g., 'STORY_STARTED').
     * @param handler The function to execute when the event occurs.
     * @returns An unsubscribe function to remove the listener.
     */
    subscribe<T extends DomainEvent>(
        eventType: T['type'],
        handler: EventHandler<T>
    ): () => void
}

// Common event types for DreamWeaver Backend
export interface StoryBeatCompletedEvent extends DomainEvent {
    type: 'STORY_BEAT_COMPLETED'
    payload: {
        userId: string
        storyId: string
        beatIndex: number
        totalBeats: number
        context?: Record<string, any> // [NEW] Context
    }
}
export interface SleepCueDetectedEvent extends DomainEvent {
    type: 'SLEEP_CUE_DETECTED'
    payload: {
        userId: string
        sessionId: string
        confidence: number
        cue: 'silence' | 'breathing' | 'snoring'
        source: string
        context?: Record<string, any> // [NEW] Context
    }
}

export interface StoryEnvsAdjustedEvent extends DomainEvent {
    type: 'STORY_ENVS_ADJUSTED'
    payload: {
        adjustment: 'fade_out' | 'slower_tempo' | 'warmer_tone'
        reason: string
    }
}

export interface StoryChunkGeneratedEvent extends DomainEvent {
    type: 'STORY_CHUNK_GENERATED'
    payload: {
        userId: string
        sessionId: string
        storyId: string
        text: string
        isFullBeat: boolean
    }
}

export interface StoryGenerationCompletedEvent extends DomainEvent {
    type: 'STORY_GENERATION_COMPLETED'
    payload: {
        userId: string
        sessionId: string
        storyId: string
    }
}

export type AnyDomainEvent =
    | StoryBeatCompletedEvent
    | SleepCueDetectedEvent
    | StoryEnvsAdjustedEvent
    | StoryChunkGeneratedEvent
    | StoryGenerationCompletedEvent
