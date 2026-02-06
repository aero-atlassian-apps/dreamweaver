import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SupabaseFamilyRepository } from './SupabaseFamilyRepository'
import { Family } from '../domain/entities/Family'
import { LoggerPort } from '../application/ports/LoggerPort'

// Mock Logger
const mockLogger: LoggerPort = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
}

// Mock Config
vi.mock('../infrastructure/supabaseConfig', () => ({
    supabaseConfig: { SUPABASE_URL: 'https://mock.io', SUPABASE_SERVICE_ROLE_KEY: 'mock_key' },
    isConfigValid: true
}))

// Mock Supabase Client
// We need to mock the module requires/imports or the client itself.
// Since SupabaseFamilyRepository creates client via createClient, we should mock @supabase/supabase-js
const mockUpsertFamily = vi.fn().mockReturnValue({ error: null })
const mockUpsertMembers = vi.fn().mockReturnValue({ error: null })
const mockFrom = vi.fn().mockImplementation((table) => {
    if (table === 'families') return { upsert: mockUpsertFamily }
    if (table === 'family_members') return { upsert: mockUpsertMembers }
    return {}
})
const mockCreateClient = vi.fn().mockReturnValue({ from: mockFrom })

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({ from: mockFrom })
}))

describe('SupabaseFamilyRepository', () => {
    let repo: SupabaseFamilyRepository

    beforeEach(() => {
        vi.clearAllMocks()
        repo = new SupabaseFamilyRepository(mockLogger)
    })

    it('should bulk upsert family members (Performance Fix Check)', async () => {
        const family = new Family(
            'fam_123',
            'The Jetsons',
            [
                { userId: 'user_1', role: 'parent', permissions: [] },
                { userId: 'user_2', role: 'child', permissions: [] }
            ],
            new Date()
        )

        await repo.save(family)

        // Check Family Upsert
        expect(mockUpsertFamily).toHaveBeenCalledTimes(1)

        // Critical: Check Bulk Member Upsert
        expect(mockUpsertMembers).toHaveBeenCalledTimes(1) // Should be called ONCE

        const calledArg = mockUpsertMembers.mock.calls[0][0]
        expect(calledArg).toHaveLength(2) // Should contain array of 2 members
        expect(calledArg[0].user_id).toBe('user_1')
        expect(calledArg[1].user_id).toBe('user_2')
    })
})
