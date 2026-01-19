/**
 * EventBusPort - Interface for event publishing and subscription
 * 
 * This port defines the contract for pub/sub event communication.
 * Implementations can be in-memory, Redis, etc.
 */

export interface DomainEvent {
    type: string
    payload: unknown
    timestamp: Date
}

export type EventHandler<T extends DomainEvent> = (event: T) => void | Promise<void>

export interface EventBusPort {
    /**
     * Publish an event to all subscribers
     */
    publish<T extends DomainEvent>(event: T): Promise<void>

    /**
     * Subscribe to events of a specific type
     * Returns an unsubscribe function
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
        storyId: string
        beatIndex: number
        totalBeats: number
    }
}
export interface SleepCueDetectedEvent extends DomainEvent {
    type: 'SLEEP_CUE_DETECTED'
    payload: {
        confidence: number
        cue: 'silence' | 'breathing' | 'snoring'
        source: string
    }
}

export interface StoryEnvsAdjustedEvent extends DomainEvent {
    type: 'STORY_ENVS_ADJUSTED'
    payload: {
        adjustment: 'fade_out' | 'slower_tempo' | 'warmer_tone'
        reason: string
    }
}

export type AnyDomainEvent = StoryBeatCompletedEvent | SleepCueDetectedEvent | StoryEnvsAdjustedEvent
