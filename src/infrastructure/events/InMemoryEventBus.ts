/**
 * InMemoryEventBus - In-memory implementation of EventBusPort
 * 
 * Simple pub/sub event bus for local event communication.
 * Suitable for MVP; can be replaced with Redis/Kafka for production.
 */

import type { DomainEvent, EventHandler, EventBusPort } from '../../application/ports/EventBusPort'

export class InMemoryEventBus implements EventBusPort {
    private handlers: Map<string, Set<EventHandler<DomainEvent>>> = new Map()

    async publish<T extends DomainEvent>(event: T): Promise<void> {
        const eventHandlers = this.handlers.get(event.type)

        if (!eventHandlers || eventHandlers.size === 0) {
            return
        }

        // Call all handlers, catching errors to ensure all handlers are called
        const promises = Array.from(eventHandlers).map(async (handler) => {
            try {
                await handler(event)
            } catch (error) {
                console.error(`Event handler error for ${event.type}:`, error)
                // Don't rethrow - continue notifying other handlers
            }
        })

        await Promise.all(promises)
    }

    subscribe<T extends DomainEvent>(
        eventType: T['type'],
        handler: EventHandler<T>
    ): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set())
        }

        const handlers = this.handlers.get(eventType)!
        handlers.add(handler as EventHandler<DomainEvent>)

        // Return unsubscribe function
        return () => {
            handlers.delete(handler as EventHandler<DomainEvent>)
        }
    }

    /**
     * Clear all handlers (useful for testing)
     */
    clear(): void {
        this.handlers.clear()
    }

    /**
     * Get subscriber count for an event type (useful for debugging)
     */
    getSubscriberCount(eventType: string): number {
        return this.handlers.get(eventType)?.size ?? 0
    }
}
