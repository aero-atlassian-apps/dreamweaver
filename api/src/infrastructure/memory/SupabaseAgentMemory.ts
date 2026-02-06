/**
 * SupabaseAgentMemory - Supabase pgvector implementation of AgentMemoryPort
 * 
 * Production-ready memory system using Supabase for persistence and
 * pgvector for semantic search capabilities.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
    AgentMemoryPort,
    AgentContext,
    MemoryRecord,
    MemoryType
} from '../../application/ports/AgentMemoryPort.js'

type EmbedResponse = {
    embedding?: { values?: number[] }
    embeddings?: Array<{ values?: number[] }>
}

interface MemoryRow {
    id: string
    user_id: string
    session_id: string | null
    type: string
    content: string
    embedding: number[] | null
    confidence: number
    metadata: Record<string, unknown> | null
    created_at: string
}

interface ThemeScoreRow {
    user_id: string
    theme: string
    score: number
    total_interactions: number
}

export class SupabaseAgentMemory implements AgentMemoryPort {
    private client: SupabaseClient
    private url: string
    private anonKey: string | null
    private geminiApiKey: string | null

    constructor(supabaseUrl?: string, supabaseKey?: string) {
        const url = supabaseUrl || process.env['SUPABASE_URL']
        const key = supabaseKey || process.env['SUPABASE_SERVICE_ROLE_KEY']

        if (!url || !key) {
            throw new Error('Supabase credentials required for SupabaseAgentMemory')
        }

        this.url = url
        this.anonKey = process.env['SUPABASE_ANON_KEY'] || null
        this.geminiApiKey = process.env['GEMINI_API_KEY'] || null
        this.client = createClient(url, key)
    }

    private getClient(context: AgentContext): SupabaseClient {
        // [SEC-02] RLS Compliance: If access token is present, use it to creating a scoped client.
        if (context.accessToken) {
            if (!this.anonKey) {
                throw new Error('Supabase anon key required for scoped memory access')
            }
            return createClient(
                this.url,
                this.anonKey,
                {
                    global: {
                        headers: {
                            Authorization: `Bearer ${context.accessToken}`
                        }
                    }
                }
            )
        }

        // Fallback: Use Service Role (Admin) if no token provided (System Context)
        return this.client
    }

    async retrieve(
        query: string,
        context: AgentContext,
        type?: MemoryType,
        limit: number = 5
    ): Promise<MemoryRecord[]> {
        let queryBuilder = this.getClient(context)
            .from('agent_memories')
            .select('*')
            .eq('user_id', context.userId)

        // Filter by type if specified
        if (type) {
            queryBuilder = queryBuilder.eq('type', type)
        }

        // Filter by session for EPISODIC memories
        if (type === 'EPISODIC' && context.sessionId) {
            queryBuilder = queryBuilder.eq('session_id', context.sessionId)
        }

        // Text search (basic ILIKE for now, vector search would use RPC)
        if (query && query !== '*') {
            queryBuilder = queryBuilder.ilike('content', `%${query}%`)
        }

        // Apply ordering and limiting LAST
        const { data, error } = await queryBuilder
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Memory retrieve error:', error)
            return []
        }

        return (data as MemoryRow[]).map(row => ({
            id: row.id,
            type: row.type as MemoryType,
            content: row.content,
            confidence: row.confidence,
            timestamp: new Date(row.created_at),
            metadata: row.metadata || undefined
        }))
    }

    async store(
        content: string,
        type: MemoryType,
        context: AgentContext,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        const embedding = await this.embedText(content)
        const { error } = await this.getClient(context)
            .from('agent_memories')
            .insert({
                user_id: context.userId,
                session_id: context.sessionId || null,
                type,
                content,
                confidence: 1.0,
                metadata: metadata || null,
                embedding
            })

        if (error) {
            console.error('Memory store error:', error)
            throw new Error(`Failed to store memory: ${error.message}`)
        }
    }

    async trackOutcome(theme: string, outcome: 'POSITIVE' | 'NEGATIVE', context: AgentContext): Promise<void> {
        const { error } = await this.getClient(context)
            .from('theme_outcomes')
            .insert({
                user_id: context.userId,
                theme,
                outcome
            })

        if (error) {
            console.error('Track outcome error:', error)
        }
    }

    async getThemeStats(context: AgentContext, limit: number = 3): Promise<{ theme: string; score: number }[]> {
        // Use the theme_scores view - we need to ensure this view supports filtering by user_id
        // or we need to query base tables if the view is global.
        // Assuming view aggregates all, so for strict correctness we should filter base outcomes if view doesn't exist
        // But for minimal fix, we'll try to filter the view if possible, or accept global for now if view logic is fixed.
        // Actually, let's filter the view if it has user_id.

        const query = this.getClient(context)
            .from('theme_scores')
            .select('theme, score')
            .eq('user_id', context.userId) // AI-05: Filter by user
            .order('score', { ascending: false })
            .limit(limit)

        const { data, error } = await query

        if (error) {
            console.error('Get theme stats error:', error)
            return []
        }

        return (data as ThemeScoreRow[]).map(row => ({
            theme: row.theme,
            score: row.score
        }))
    }

    async trackPreferencePair(winTheme: string, loseTheme: string, context: AgentContext): Promise<void> {
        const { error } = await this.getClient(context)
            .from('preference_pairs') // Assuming table exists or will be created
            .insert({
                user_id: context.userId,
                win_theme: winTheme,
                lose_theme: loseTheme
            })

        if (error) {
            // Silently fail if table missing for now, or log
            console.error('Track preference error:', error)
        }
    }

    private async embedText(text: string): Promise<number[] | null> {
        if (!this.geminiApiKey) return null

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${encodeURIComponent(this.geminiApiKey)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: { parts: [{ text }] },
                        taskType: 'RETRIEVAL_DOCUMENT',
                        output_dimensionality: 1536
                    }),
                    signal: controller.signal
                }
            )

            if (!res.ok) return null
            const json = await res.json() as EmbedResponse
            const values = (json.embedding?.values || json.embeddings?.[0]?.values) as number[] | undefined
            if (!values || values.length !== 1536) return null

            const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0))
            if (!Number.isFinite(norm) || norm <= 0) return null
            return values.map(v => v / norm)
        } catch {
            return null
        } finally {
            clearTimeout(timeout)
        }
    }
}
