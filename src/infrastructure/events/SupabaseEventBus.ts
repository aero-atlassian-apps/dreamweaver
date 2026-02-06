import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../supabase/client.js'
import { DomainEvent, EventBusPort, EventHandler } from '../../application/ports/EventBusPort'

export class SupabaseEventBus implements EventBusPort {
    private client: SupabaseClient
    private handlers: Map<string, Set<EventHandler<DomainEvent>>> = new Map()

    constructor(client?: SupabaseClient) {
        // Use injected client or the shared singleton
        if (client) {
            this.client = client
        } else if (supabase) {
            this.client = supabase
        } else {
            throw new Error('Supabase client not initialized. Check configuration.')
        }

        // Start listening to Realtime changes
        this.initializeRealtimeSubscription()
    }

    async publish<T extends DomainEvent>(event: T): Promise<void> {
        try {
            await this.notifyLocalSubscribers(event)
        } catch (err) {
            console.error('Error publishing event:', err)
        }
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

        return () => {
            handlers.delete(handler as EventHandler<DomainEvent>)
        }
    }

    private async notifyLocalSubscribers<T extends DomainEvent>(event: T): Promise<void> {
        const eventHandlers = this.handlers.get(event.type)
        if (!eventHandlers) return

        const promises = Array.from(eventHandlers).map(async (handler) => {
            try {
                await handler(event)
            } catch (error) {
                console.error(`Handler error for ${event.type}:`, error)
            }
        })
        await Promise.all(promises)
    }

    private initializeRealtimeSubscription() {
        // Listen to INSERTs on the domain_events table
        this.client
            .channel('public:domain_events')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'domain_events' }, (payload: { new: Record<string, unknown> }) => {
                const event = payload.new as { type: string; payload: unknown; occurred_at: string }
                const domainEvent: DomainEvent = {
                    type: event.type,
                    payload: event.payload,
                    timestamp: new Date(event.occurred_at)
                }

                // Notify subscribers who might be interested in this event from other instances
                this.notifyLocalSubscribers(domainEvent)
            })
            .subscribe()
    }
}
