import { TicketStorePort } from '../../application/ports/TicketStorePort.js'
import { supabaseAdmin } from '../supabaseAdmin.js'
import { randomUUID } from 'node:crypto'

export class SupabaseTicketStore implements TicketStorePort {
    async issue(userId: string, ttlSeconds: number = 90): Promise<string> {
        if (!supabaseAdmin) {
            throw new Error('Supabase service role is required for SupabaseTicketStore')
        }

        const ticket = randomUUID()
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()

        const { error } = await supabaseAdmin
            .from('ws_tickets')
            .insert({
                ticket,
                user_id: userId,
                expires_at: expiresAt,
            })

        if (error) throw new Error(`Failed to issue ws ticket: ${error.message}`)
        return ticket
    }

    async validate(ticketId: string): Promise<string | null> {
        if (!supabaseAdmin) {
            throw new Error('Supabase service role is required for SupabaseTicketStore')
        }

        const { data, error } = await supabaseAdmin
            .rpc('consume_ws_ticket', { p_ticket: ticketId })

        if (error) throw new Error(`Failed to validate ws ticket: ${error.message}`)
        return typeof data === 'string' && data.length > 0 ? data : null
    }
}
