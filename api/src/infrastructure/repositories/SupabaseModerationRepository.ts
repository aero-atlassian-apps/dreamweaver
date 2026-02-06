import type { LoggerPort } from '../../application/ports/LoggerPort.js'
import type { ModerationRepositoryPort, ModerationContentType } from '../../application/ports/ModerationRepositoryPort.js'
import { supabaseAdmin } from '../supabaseAdmin.js'

export class SupabaseModerationRepository implements ModerationRepositoryPort {
    constructor(private readonly logger: LoggerPort) { }

    async block(contentType: ModerationContentType, contentId: string, adminId: string, reason?: string, notes?: string): Promise<void> {
        if (!supabaseAdmin) {
            throw new Error('Supabase service role is required for moderation actions')
        }

        const { error } = await supabaseAdmin
            .from('moderation_blocks')
            .upsert({
                content_type: contentType,
                content_id: contentId,
                admin_id: adminId,
                reason: reason || null,
                notes: notes || null,
                blocked_at: new Date().toISOString()
            }, { onConflict: 'content_type,content_id' })

        if (error) {
            this.logger.error('Failed to persist moderation block', error)
            throw new Error(`Failed to persist moderation block: ${error.message}`)
        }
    }

    async listBlockedCharacterIds(): Promise<string[]> {
        if (!supabaseAdmin) {
            throw new Error('Supabase service role is required for moderation actions')
        }

        const { data, error } = await supabaseAdmin
            .from('moderation_blocks')
            .select('content_id')
            .eq('content_type', 'character')

        if (error) {
            this.logger.error('Failed to list blocked characters', error)
            throw new Error(`Failed to list blocked characters: ${error.message}`)
        }

        return (data || [])
            .map((row: any) => (typeof row?.content_id === 'string' ? row.content_id : null))
            .filter((x: string | null): x is string => !!x)
    }
}

