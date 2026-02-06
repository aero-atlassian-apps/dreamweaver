import { TicketStorePort } from '../../application/ports/TicketStorePort.js'
import { randomUUID } from 'node:crypto'

export class InMemoryTicketStore implements TicketStorePort {
    private store = new Map<string, { userId: string, expiresAt: number }>()

    constructor() {
        // Cleanup periodically
        const timer = setInterval(() => this.cleanup(), 60000)
        timer.unref?.()
    }

    async issue(userId: string, ttlSeconds: number = 90): Promise<string> {
        const ticketId = randomUUID()
        this.store.set(ticketId, {
            userId,
            expiresAt: Date.now() + (ttlSeconds * 1000)
        })
        return ticketId
    }

    async validate(ticketId: string): Promise<string | null> {
        const ticket = this.store.get(ticketId)
        if (!ticket) return null

        if (Date.now() > ticket.expiresAt) {
            this.store.delete(ticketId)
            return null
        }

        // Single use - consume it
        this.store.delete(ticketId)
        return ticket.userId
    }

    private cleanup() {
        const now = Date.now()
        for (const [id, ticket] of this.store.entries()) {
            if (ticket.expiresAt < now) {
                this.store.delete(id)
            }
        }
    }
}
