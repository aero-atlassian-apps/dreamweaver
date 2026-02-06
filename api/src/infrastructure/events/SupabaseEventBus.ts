import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { DomainEvent, EventBusPort, EventHandler } from '../../application/ports/EventBusPort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

export class SupabaseEventBus implements EventBusPort {
    private client: SupabaseClient
    private handlers: Map<string, Set<EventHandler<DomainEvent>>> = new Map()
    private processedEventIds: Set<string> = new Set()
    private logger: LoggerPort

    // [PHASE-3] Batch Eventing
    private eventQueue: Array<{ id: string, user_id: string | null, request_id: string, trace_id: string | null, type: string, payload: unknown, occurred_at: string }> = []
    private flushTimer: ReturnType<typeof setTimeout> | null = null
    private readonly BATCH_SIZE = 25
    private readonly FLUSH_INTERVAL_MS = 500

    constructor(logger?: LoggerPort, client?: SupabaseClient) {
        this.logger = logger || { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }
        const url = process.env['SUPABASE_URL']
        const key = process.env['SUPABASE_SERVICE_ROLE_KEY']

        if (client) {
            this.client = client
        } else if (url && key) {
            this.client = createClient(url, key)
        } else {
            throw new Error('SupabaseEventBus requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Fail-Fast)')
        }

        this.initializeRealtimeSubscription()
    }

    async publish<T extends DomainEvent>(event: T): Promise<void> {
        try {
            // Local Deduplication
            if (this.processedEventIds.has(event.id)) return
            this.processedEventIds.add(event.id)

            // Cleanup
            if (this.processedEventIds.size > 2000) {
                const ids = Array.from(this.processedEventIds)
                this.processedEventIds = new Set(ids.slice(500))
            }

            // 1. Enqueue for Batched Persist
            const payloadUserId = (event.payload && typeof event.payload === 'object')
                ? (event.payload as Record<string, unknown>)['userId']
                : undefined
            this.eventQueue.push({
                id: event.id,
                user_id: typeof payloadUserId === 'string' ? payloadUserId : null,
                request_id: event.requestId,
                trace_id: event.traceId ?? null,
                type: event.type,
                payload: event.payload,
                occurred_at: (event.timestamp || new Date()).toISOString()
            })

            // Trigger flush if batch is full
            if (this.eventQueue.length >= this.BATCH_SIZE) {
                await this.flushEvents()
            } else if (!this.flushTimer) {
                // Schedule a flush if not already scheduled
                this.flushTimer = setTimeout(() => this.flushEvents(), this.FLUSH_INTERVAL_MS)
            }

            // 2. Notify local
            await this.notifyLocalSubscribers(event)

        } catch (err) {
            this.logger.error('Error publishing event', { err })
        }
    }

    /**
     * [PHASE-3] Flushes the batched event queue to the database.
     */
    private async flushEvents(): Promise<void> {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer)
            this.flushTimer = null
        }
        if (this.eventQueue.length === 0) return

        const eventsToFlush = [...this.eventQueue]
        this.eventQueue = []

        const { error } = await this.client
            .from('domain_events')
            .insert(eventsToFlush)

        if (error && error.code !== '23505') { // Ignore duplicate key errors
            this.logger.error('Failed to persist event batch', { error, count: eventsToFlush.length })
        } else {
            this.logger.debug(`Flushed ${eventsToFlush.length} events to database`)
        }
    }

    subscribe<T extends DomainEvent>(eventType: T['type'], handler: EventHandler<T>): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set())
        }
        const handlers = this.handlers.get(eventType)!
        handlers.add(handler as EventHandler<DomainEvent>)
        return () => handlers.delete(handler as EventHandler<DomainEvent>)
    }

    private async notifyLocalSubscribers<T extends DomainEvent>(event: T): Promise<void> {
        const eventHandlers = this.handlers.get(event.type)
        if (!eventHandlers) return

        for (const handler of eventHandlers) {
            try {
                await handler(event)
            } catch (error) {
                this.logger.error(`Handler error for ${event.type}`, { error, eventId: event.id })
            }
        }
    }

    private initializeRealtimeSubscription() {
        this.client
            .channel('public:domain_events')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'domain_events' }, (payload) => {
                const row = payload.new as Record<string, unknown>
                const id = typeof row['id'] === 'string' ? row['id'] : null
                if (!id) return

                // Idempotency: skip if we already processed this ID locally
                if (this.processedEventIds.has(id)) return
                this.processedEventIds.add(id)

                const domainEvent: DomainEvent = {
                    id,
                    requestId: typeof row['request_id'] === 'string' ? row['request_id'] : 'unknown',
                    traceId: typeof row['trace_id'] === 'string' ? row['trace_id'] : undefined,
                    type: row['type'] as DomainEvent['type'],
                    payload: row['payload'] as DomainEvent['payload'],
                    timestamp: new Date(typeof row['occurred_at'] === 'string' ? row['occurred_at'] : Date.now())
                }
                this.notifyLocalSubscribers(domainEvent)
            })
            .subscribe()
    }
}
