import { describe, expect, it, vi } from 'vitest'
import { SendWeeklyDigestUseCase } from './SendWeeklyDigestUseCase'

describe('SendWeeklyDigestUseCase', () => {
    it('uses highlight moment when available and includes share link', async () => {
        const storyRepository = {
            findRecent: vi.fn().mockResolvedValue([
                { id: 's1', createdAt: new Date(), title: 'Story 1', theme: 'space' },
            ])
        } as any

        const momentRepository = {
            findByUserId: vi.fn().mockResolvedValue([
                { id: 'm1', createdAt: new Date(), description: 'Emma asked about Mars' },
            ])
        } as any

        const shareLinkCreator = {
            execute: vi.fn().mockResolvedValue({ url: 'https://example.com/share/t', expiresAt: new Date() })
        }

        const emailService = {
            send: vi.fn().mockResolvedValue(true)
        }

        const logger = {
            info: vi.fn(),
            error: vi.fn(),
        } as any

        const useCase = new SendWeeklyDigestUseCase(
            storyRepository,
            momentRepository,
            shareLinkCreator,
            emailService,
            logger
        )

        const result = await useCase.execute({
            userId: 'u1',
            email: 'parent@example.com',
            childName: 'Emma'
        })

        expect(result.sent).toBe(true)
        expect(result.storiesCount).toBe(1)
        expect(result.highlightMoment).toBe('Emma asked about Mars')
        expect(shareLinkCreator.execute).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 'm1', type: 'MOMENT' }))
        expect(emailService.send).toHaveBeenCalled()
        const html = (emailService.send as any).mock.calls[0][2] as string
        expect(html).toContain('https://example.com/share/t')
    })

    it('falls back to story highlight when no moments exist', async () => {
        const storyRepository = {
            findRecent: vi.fn().mockResolvedValue([
                { id: 's1', createdAt: new Date(), title: 'The Umbrella Kingdom', theme: 'cozy' },
            ])
        } as any

        const momentRepository = {
            findByUserId: vi.fn().mockResolvedValue([])
        } as any

        const shareLinkCreator = {
            execute: vi.fn().mockResolvedValue({ url: 'https://example.com/share/t2', expiresAt: new Date() })
        }

        const emailService = {
            send: vi.fn().mockResolvedValue(true)
        }

        const logger = {
            info: vi.fn(),
            error: vi.fn(),
        } as any

        const useCase = new SendWeeklyDigestUseCase(
            storyRepository,
            momentRepository,
            shareLinkCreator,
            emailService,
            logger
        )

        const result = await useCase.execute({
            userId: 'u1',
            email: 'parent@example.com',
            childName: 'Emma'
        })

        expect(result.highlightMoment).toBe('The Umbrella Kingdom')
        expect(shareLinkCreator.execute).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 's1', type: 'STORY' }))
    })
})

