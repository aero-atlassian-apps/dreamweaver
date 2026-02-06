/**
 * SupabaseStoryRepository Unit Tests (Mocked)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SupabaseStoryRepository } from './SupabaseStoryRepository'
import { Story } from '../domain/entities/Story'
import { StoryContent } from '../domain/value-objects/StoryContent'

// Mock the supabase module
vi.mock('./supabase', () => ({
    supabase: {
        from: vi.fn(),
    }
}))

import { supabase } from './supabase'

describe('SupabaseStoryRepository (Unit)', () => {
    let repo: SupabaseStoryRepository

    beforeEach(() => {
        vi.clearAllMocks()
        repo = new SupabaseStoryRepository()
    })

    it('should save a story successfully', async () => {
        // Setup chain mocks
        const upsertMock = vi.fn().mockResolvedValue({ error: null })
        const fromMock = vi.fn().mockReturnValue({ upsert: upsertMock })
        // @ts-ignore
        supabase.from.mockImplementation(fromMock)

        const story = Story.create({
            id: '123e4567-e89b-12d3-a456-426614174000',
            ownerId: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Test',
            content: StoryContent.fromRawText('Once upon time'),
            theme: 'space',
            status: 'completed',
            createdAt: new Date(),
        })

        await repo.save(story)

        expect(fromMock).toHaveBeenCalledWith('stories')
        expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Test'
        }), expect.anything())
    })

    it('should find story by ID and map correctly', async () => {
        const mockData = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Test',
            content: JSON.stringify({ paragraphs: ['Once upon time'], chapters: [] }), // The implementation expects raw text or JSON? 
            // implementation says: StoryContent.fromRawText(row.content)
            // If row.content is string "{"paragraphs":...}", fromRawText treats it as text.
            // Let's check implementation: StoryContent.fromRawText(text) -> splits by \n\n.
            // So DB content should be plain text for this implementation.
            // "Once upon time"
            theme: 'space',
            status: 'completed',
            created_at: new Date().toISOString(),
            audio_url: null
        }
        // Fix content for mock
        mockData.content = "Once upon time\n\nThe end."

        const singleMock = vi.fn().mockResolvedValue({ data: mockData, error: null })
        const eqMock = vi.fn().mockReturnValue({ single: singleMock })
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
        const fromMock = vi.fn().mockReturnValue({ select: selectMock })
        // @ts-ignore
        supabase.from.mockImplementation(fromMock)

        const story = await repo.findById('123e4567-e89b-12d3-a456-426614174000')

        expect(story).toBeDefined()
        expect(story?.id).toBe('123e4567-e89b-12d3-a456-426614174000')
        expect(story?.title).toBe('Test')
        expect(story?.content.paragraphs.length).toBe(2)
    })
})
