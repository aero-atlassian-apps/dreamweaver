import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { DomainEvent, EventBusPort, EventHandler } from '../../application/ports/EventBusPort'

export class SupabaseEventBus implements EventBusPort {
    private client: SupabaseClient
    private handlers: Map<string, Set<EventHandler<DomainEvent>>> = new Map()

    constructor(client?: SupabaseClient) {
        // Use injected client or create one from env
        // In production, better to inject the authenticated client from context if possible,
        // but for an Event Bus (system-wide), the service role key is often appropriate for publishing
        // global events, while subscription might need user context.
        // Here we use the service role key for reliability as the bus is a system component.
        const url = process.env.SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (client) {
            this.client = client
        } else if (url && key) {
            this.client = createClient(url, key)
        } else {
            console.warn('SupabaseEventBus initialized without credentials. Events will be in-memory only/fail.')
            // Fallback to avoid crash, but this should be caught by config check
            this.client = createClient('https://placeholder.supabase.co', 'placeholder')
        }

        // Start listening to Realtime changes
        this.initializeRealtimeSubscription()
    }

    async publish<T extends DomainEvent>(event: T): Promise<void> {
        try {
            // 1. Persist to database (Audit Log)
            const { error } = await this.client
                .from('domain_events')
                .insert({
                    type: event.type,
                    payload: event.payload,
                    occurred_at: event.timestamp || new Date().toISOString()
                })

            if (error) {
                console.error('Failed to persist event:', error)
                // Fallback: don't crash, still try to notify local subscribers
            }

            // 2. Notify local subscribers (In-Memory)
            await this.notifyLocalSubscribers(event)

            // 3. (Optional) Explicit Realtime broadcast if not using Postgres Changes
            // The table insert above automatically triggers Realtime if enabled on the table.

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
