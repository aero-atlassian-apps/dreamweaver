/**
 * InMemoryEventBus - Simple in-memory event bus implementation
 */

import { DomainEvent, EventBusPort, EventHandler } from '../../application/ports/EventBusPort.js'

export class InMemoryEventBus implements EventBusPort {
    private handlers: Map<string, Set<EventHandler<DomainEvent>>> = new Map()

    async publish<T extends DomainEvent>(event: T): Promise<void> {
        const typehandlers = this.handlers.get(event.type)
        if (!typehandlers) return

        const promises = Array.from(typehandlers).map(async (handler) => {
            try {
                await handler(event)
            } catch (error) {
                console.error(`Error in event handler for ${event.type} (ID: ${event.id}):`, error)
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

        const typehandlers = this.handlers.get(eventType)!
        typehandlers.add(handler as EventHandler<DomainEvent>)

        return () => {
            typehandlers.delete(handler as EventHandler<DomainEvent>)
        }
    }
}
