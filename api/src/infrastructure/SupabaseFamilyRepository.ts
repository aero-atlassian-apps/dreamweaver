import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { FamilyRepositoryPort } from '../application/ports/FamilyRepositoryPort.js'
import { Family, FamilyId } from '../domain/entities/Family.js'
import { LoggerPort } from '../application/ports/LoggerPort.js'
import { supabaseConfig, isConfigValid } from './supabaseConfig.js'

export class SupabaseFamilyRepository implements FamilyRepositoryPort {
    private client: SupabaseClient | null = null

    constructor(private readonly logger: LoggerPort) {
    }

    private getClient(): SupabaseClient {
        if (this.client) return this.client

        if (!isConfigValid || !supabaseConfig.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase Service Role credentials required for SupabaseFamilyRepository')
        }

        this.client = createClient(supabaseConfig.SUPABASE_URL, supabaseConfig.SUPABASE_SERVICE_ROLE_KEY)
        return this.client
    }

    async save(family: Family): Promise<void> {
        const client = this.getClient()

        // 1. Upsert Family
        const { error: famError } = await client
            .from('families')
            .upsert({
                id: family.id,
                name: family.name,
                created_at: family.createdAt.toISOString()
            })

        if (famError) {
            this.logger.error('Failed to save family', famError)
            throw new Error('Database error saving family')
        }

        // 2. Upsert Members (Bulk Operation)
        // Optimization: [PERF-01] Replaced N+1 loop with single bulk upsert
        if (family.members.length > 0) {
            const membersToUpsert = family.members.map(member => ({
                family_id: family.id,
                user_id: member.userId,
                role: member.role,
                permissions: member.permissions
            }))

            const { error: memError } = await client
                .from('family_members')
                .upsert(membersToUpsert)

            if (memError) {
                this.logger.error('Failed to save family members', memError)
                throw new Error('Database error saving family members')
            }
        }
    }

    async findById(id: FamilyId): Promise<Family | null> {
        const client = this.getClient()
        const { data: famData, error: famError } = await client
            .from('families')
            .select('*')
            .eq('id', id)
            .single()

        if (famError || !famData) return null

        const { data: memData } = await client
            .from('family_members')
            .select('*')
            .eq('family_id', id)

        const members = (memData || []).map((m: any) => ({
            userId: m.user_id,
            role: m.role,
            permissions: m.permissions || []
        }))

        return new Family(
            famData.id,
            famData.name,
            members,
            new Date(famData.created_at)
        )
    }

    async findByUserId(userId: string): Promise<Family | null> {
        const client = this.getClient()
        // Find membership first
        const { data: memData, error: memError } = await client
            .from('family_members')
            .select('family_id')
            .eq('user_id', userId)
            .single()

        if (memError || !memData) return null

        return this.findById(memData.family_id)
    }

    async addMember(familyId: FamilyId, userId: string): Promise<void> {
        const client = this.getClient()
        // Helper specifically for adding without full save
        const { error } = await client
            .from('family_members')
            .insert({
                family_id: familyId,
                user_id: userId,
                role: 'parent', // Default
                permissions: []
            })

        if (error) {
            this.logger.error('Failed to add member', error)
            throw error
        }
    }
}
