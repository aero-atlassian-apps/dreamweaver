import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RedisSessionState } from './RedisSessionState.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'
import { SessionState } from '../../application/ports/SessionStatePort.js'

// Mock ioredis before import
const mockRedisGet = vi.fn()
const mockRedisSet = vi.fn()
const mockRedisDel = vi.fn()
const mockRedisOn = vi.fn()
const mockRedisDefineCommand = vi.fn()
const mockUpdateSessionAtomic = vi.fn()
const mockPatchSessionAtomic = vi.fn()
const mockRollbackSessionAtomic = vi.fn()

vi.mock('ioredis', () => {
    return {
        Redis: vi.fn().mockImplementation(() => {
            const client: any = {
                get: mockRedisGet,
                set: mockRedisSet,
                del: mockRedisDel,
                exists: vi.fn(),
                pipeline: vi.fn().mockReturnValue({
                    del: vi.fn(),
                    srem: vi.fn(),
                    exec: vi.fn().mockResolvedValue([])
                }),
                on: mockRedisOn,
                defineCommand: mockRedisDefineCommand,
            }
            // Bind custom commands
            client.updateSessionAtomic = mockUpdateSessionAtomic
            client.patchSessionAtomic = mockPatchSessionAtomic
            client.rollbackSessionAtomic = mockRollbackSessionAtomic
            return client
        })
    }
})

describe('RedisSessionState (Infrastructure)', () => {
    let adapter: RedisSessionState
    let mockLogger: LoggerPort

    const mockSessionId = 's1'
    const mockUserId = 'u1'
    const mockState: SessionState = {
        sessionId: mockSessionId,
        userId: mockUserId,
        phase: 'IDLE',
        activeIntent: 'IDLE',
        emotionalTone: 0.5,
        context: {},
        updatedAt: new Date()
    }

    beforeEach(() => {
        vi.clearAllMocks()

        // Reset default mock returns
        mockUpdateSessionAtomic.mockResolvedValue(1)
        mockPatchSessionAtomic.mockResolvedValue(1)
        mockRollbackSessionAtomic.mockResolvedValue(1)

        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
        }

        adapter = new RedisSessionState('redis://localhost:6379', mockLogger)
    })

    it('should define atomic Lua scripts on initialization', () => {
        expect(mockRedisDefineCommand).toHaveBeenCalledWith('updateSessionAtomic', expect.any(Object))
        expect(mockRedisDefineCommand).toHaveBeenCalledWith('patchSessionAtomic', expect.any(Object))
        expect(mockRedisDefineCommand).toHaveBeenCalledWith('rollbackSessionAtomic', expect.any(Object))
    })

    it('should retrieve and parse session state using lookup resolution', async () => {
        // Mock lookup finding the user
        mockRedisGet.mockImplementation((key: string) => {
            if (key === `dreamweaver:lookup:${mockSessionId}`) return Promise.resolve(mockUserId)
            if (key === `dreamweaver:session:${mockUserId}:${mockSessionId}`) return Promise.resolve(JSON.stringify(mockState))
            return Promise.resolve(null)
        })

        const state = await adapter.get(mockSessionId)

        expect(state).toEqual(expect.objectContaining({ sessionId: mockSessionId }))
        expect(mockRedisGet).toHaveBeenCalledWith(`dreamweaver:lookup:${mockSessionId}`)
        expect(mockRedisGet).toHaveBeenCalledWith(`dreamweaver:session:${mockUserId}:${mockSessionId}`)
    })


    it('should use atomic update script for set() with indexing', async () => {
        await adapter.set(mockSessionId, mockState)

        expect(mockUpdateSessionAtomic).toHaveBeenCalled()
        const args = mockUpdateSessionAtomic.mock.calls[0]

        expect(args[0]).toBe(`dreamweaver:session:${mockUserId}:${mockSessionId}`) // Key
        expect(args[1]).toBe(`dreamweaver:user:${mockUserId}:sessions`) // User Index
        expect(args[2]).toBe(`dreamweaver:lookup:${mockSessionId}`) // Lookup Key

        const payload = JSON.parse(args[3])
        expect(payload.sessionId).toBe(mockSessionId)

        expect(args[6]).toBe(mockSessionId) // Arg4
        expect(args[7]).toBe(mockUserId)    // Arg5
    })

    it('should use atomic patch script for patch()', async () => {
        mockRedisGet.mockResolvedValue(mockUserId) // Resolve lookup

        await adapter.patch(mockSessionId, { phase: 'STORYTELLING' })

        expect(mockPatchSessionAtomic).toHaveBeenCalledWith(
            `dreamweaver:session:${mockUserId}:${mockSessionId}`,
            expect.stringContaining('"phase":"STORYTELLING"'),
            expect.any(Number),
            10
        )
    })

    it('should use atomic rollback script for rollback()', async () => {
        mockRedisGet.mockResolvedValue(mockUserId) // Resolve lookup

        await adapter.rollback(mockSessionId, 2)

        expect(mockRollbackSessionAtomic).toHaveBeenCalledWith(
            `dreamweaver:session:${mockUserId}:${mockSessionId}`,
            2,
            expect.any(Number)
        )
    })
})
