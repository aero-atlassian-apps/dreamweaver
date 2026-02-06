import type { CompanionUnlockRecord, CompanionUnlockRepositoryPort } from '../application/ports/CompanionUnlockRepositoryPort.js'
import type { LoggerPort } from '../application/ports/LoggerPort.js'
import { supabase } from './supabase.js'
import { supabaseAdmin } from './supabaseAdmin.js'
import { withRetry } from './resilience.js'

interface CompanionUnlockRow {
    user_id: string
    companion_id: string
    unlocked_at: string
}

export class SupabaseCompanionUnlockRepository implements CompanionUnlockRepositoryPort {
    private readonly logger: LoggerPort

    constructor(logger?: LoggerPort) {
        this.logger = logger || { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }
    }

    private get client() {
        return supabaseAdmin || supabase
    }

    async listUnlockedByUserId(userId: string): Promise<CompanionUnlockRecord[]> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized - Critical Infrastructure Missing')

        return withRetry(async () => {
            const { data, error } = await client
                .from('companion_unlocks')
                .select('user_id, companion_id, unlocked_at')
                .eq('user_id', userId)
                .order('unlocked_at', { ascending: true })

            if (error) throw new Error(`Failed to fetch companion unlocks: ${error.message}`)
            return (data as CompanionUnlockRow[]).map((row) => ({
                companionId: row.companion_id,
                unlockedAt: new Date(row.unlocked_at),
            }))
        }, this.logger, `Fetch companion unlocks for user ${userId}`)
    }

    async upsertUnlock(userId: string, companionId: string, unlockedAt: Date): Promise<void> {
        const client = this.client
        if (!client) throw new Error('Supabase client not initialized')

        await withRetry(async () => {
            const { error } = await client
                .from('companion_unlocks')
                .upsert({
                    user_id: userId,
                    companion_id: companionId,
                    unlocked_at: unlockedAt.toISOString(),
                }, {
                    onConflict: 'user_id,companion_id'
                })

            if (error) throw new Error(`Failed to upsert companion unlock: ${error.message}`)
        }, this.logger, `Upsert companion unlock ${companionId} for user ${userId}`)
    }
}

