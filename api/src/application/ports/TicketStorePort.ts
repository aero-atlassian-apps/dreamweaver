export interface TicketStorePort {
    /**
     * Issue a new ticket for a user.
     * @param userId The validated user ID
     * @param ttlSeconds Time to live in seconds (default 15)
     * @returns The ticket ID string
     */
    issue(userId: string, ttlSeconds?: number): Promise<string>

    /**
     * Validate and consume a ticket.
     * @param ticketId The ticket string
     * @returns The userId if valid, null if invalid or expired.
     */
    validate(ticketId: string): Promise<string | null>
}
