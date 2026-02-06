/**
 * SupabaseAgentMemory Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SupabaseAgentMemory } from './SupabaseAgentMemory'

// Mock Supabase client
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockEq = vi.fn()
const mockIlike = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockRpc = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: mockSelect,
            insert: mockInsert,
        })),
        rpc: mockRpc
    }))
}))

describe('SupabaseAgentMemory', () => {
    let memory: SupabaseAgentMemory

    beforeEach(() => {
        vi.clearAllMocks()

        // Recursive builder mock to support arbitrary chaining
        const builder: any = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnValue(Promise.resolve({
                data: [
                    {
                        id: 'mem_1',
                        user_id: 'user_1',
                        type: 'EPISODIC',
                        content: 'Test memory',
                        confidence: 1.0,
                        created_at: new Date().toISOString(),
                        metadata: null
                    }
                ],
                error: null
            })),
            then: (resolve: any) => resolve({ data: [], error: null }) // Fallback for await
        }

        mockSelect.mockReturnValue(builder)

        mockInsert.mockResolvedValue({ error: null })

        memory = new SupabaseAgentMemory('http://test.supabase.co', 'test-key')
    })

    describe('retrieve', () => {
        it('should query memories by user and type', async () => {
            const results = await memory.retrieve('test', { userId: 'user_1' }, 'EPISODIC')

            expect(results).toHaveLength(1)
            expect(results[0].type).toBe('EPISODIC')
            expect(results[0].content).toBe('Test memory')
        })
    })

    describe('store', () => {
        it('should insert memory into Supabase', async () => {
            await memory.store(
                'New memory content',
                'SEMANTIC',
                { userId: 'user_1' },
                { source: 'test' }
            )

            expect(mockInsert).toHaveBeenCalled()
        })
    })
})
