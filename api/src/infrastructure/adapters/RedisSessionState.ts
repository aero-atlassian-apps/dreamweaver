import { Redis } from 'ioredis'
import { SessionState, SessionStatePort, SessionStatePatch } from '../../application/ports/SessionStatePort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

export class RedisSessionState implements SessionStatePort {
    private client: Redis
    private readonly TTL_SECONDS = 86400 // 24 hours

    constructor(
        private connectionString: string,
        private logger: LoggerPort
    ) {
        // Fix for "This expression is not constructable" - standard ioredis import
        this.client = new Redis(connectionString, {
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000)
                return delay
            },
            maxRetriesPerRequest: 3
        })

        this.client.on('error', (err: any) => {
            this.logger.error('[RedisSessionState] Connection Error', err)
        })

        this.client.on('connect', () => {
            this.logger.info('[RedisSessionState] Connected to Redis')
        })

        // [2026] Atomic Update Script (SET)
        // KEYS[1] = sessionKey (Namespaced)
        // KEYS[2] = userIndexKey
        // KEYS[3] = lookupKey (sessionId -> userId)
        // ARGV[1] = new state JSON (without history updated)
        // ARGV[2] = TTL seconds
        // ARGV[3] = Max history length (e.g., 10)
        // ARGV[4] = sessionId
        // ARGV[5] = userId
        this.client.defineCommand('updateSessionAtomic', {
            numberOfKeys: 3,
            lua: `
                local sessionKey = KEYS[1]
                local userIndexKey = KEYS[2]
                local lookupKey = KEYS[3]
                local newStateJson = ARGV[1]
                local ttl = tonumber(ARGV[2])
                local maxHistory = tonumber(ARGV[3])
                local sessionId = ARGV[4]
                local userId = ARGV[5]

                local currentJson = redis.call('GET', sessionKey)
                local newState = cjson.decode(newStateJson)

                if currentJson then
                    local currentState = cjson.decode(currentJson)
                    local history = currentState.history or {}
                    currentState.history = nil
                    table.insert(history, currentState)
                    if #history > maxHistory then
                        table.remove(history, 1)
                    end
                    newState.history = history
                end

                local finalJson = cjson.encode(newState)
                redis.call('SET', sessionKey, finalJson, 'EX', ttl)
                
                -- Manage Indices
                redis.call('SADD', userIndexKey, sessionId)
                redis.call('SET', lookupKey, userId, 'EX', ttl)

                return 1
            `
        })

        // [2026] Atomic Patch Script
        // KEYS[1] = sessionKey
        // ARGV[1] = partial JSON
        // ARGV[2] = TTL
        // ARGV[3] = Max History
        this.client.defineCommand('patchSessionAtomic', {
            numberOfKeys: 1,
            lua: `
                local sessionKey = KEYS[1]
                local partialJson = ARGV[1]
                local ttl = tonumber(ARGV[2])
                local maxHistory = tonumber(ARGV[3])

                local currentJson = redis.call('GET', sessionKey)
                if not currentJson then return 0 end -- Not found

                local currentState = cjson.decode(currentJson)
                local partial = cjson.decode(partialJson)

                -- Create Snapshot of current state for history
                local snapshot = {}
                for k,v in pairs(currentState) do snapshot[k] = v end
                local history = snapshot.history or {}
                snapshot.history = nil

                table.insert(history, snapshot)
                if #history > maxHistory then table.remove(history, 1) end

                -- Apply Patch (Merge)
                for k,v in pairs(partial) do currentState[k] = v end
                currentState.history = history
                currentState.updatedAt = partial.updatedAt or currentState.updatedAt

                local finalJson = cjson.encode(currentState)
                redis.call('SET', sessionKey, finalJson, 'EX', ttl)
                return 1
            `
        })

        // [2026] Atomic Rollback Script
        // KEYS[1] = sessionKey
        // ARGV[1] = steps
        // ARGV[2] = TTL
        this.client.defineCommand('rollbackSessionAtomic', {
            numberOfKeys: 1,
            lua: `
                local sessionKey = KEYS[1]
                local steps = tonumber(ARGV[1])
                local ttl = tonumber(ARGV[2])
                
                local currentJson = redis.call('GET', sessionKey)
                if not currentJson then return 0 end

                local currentState = cjson.decode(currentJson)
                local history = currentState.history or {}
                
                if #history == 0 then return 0 end -- Nothing to rollback to

                local targetSnapshot = nil
                for i=1, steps do
                    targetSnapshot = table.remove(history)
                    if not targetSnapshot then break end
                    if #history == 0 then break end -- Consumed all
                end

                if targetSnapshot then
                    targetSnapshot.history = history
                    targetSnapshot.updatedAt = currentState.updatedAt 
                    local finalJson = cjson.encode(targetSnapshot)
                    redis.call('SET', sessionKey, finalJson, 'EX', ttl)
                    return 1
                end
                return 0
            `
        })

    }

    private getLegacyKey(sessionId: string): string {
        return `dreamweaver:session:${sessionId}`
    }

    // [2026] Strict Namespace
    private getStrictKey(userId: string, sessionId: string): string {
        return `dreamweaver:session:${userId}:${sessionId}`
    }

    private getUserIndexKey(userId: string): string {
        return `dreamweaver:user:${userId}:sessions`
    }

    private getLookupKey(sessionId: string): string {
        return `dreamweaver:lookup:${sessionId}`
    }

    private async resolveKey(sessionId: string): Promise<string> {
        // Try strict lookup first
        const userId = await this.client.get(this.getLookupKey(sessionId))
        if (userId) {
            return this.getStrictKey(userId, sessionId)
        }
        // Fallback to legacy key (migration/backwards compat)
        const legacy = this.getLegacyKey(sessionId)
        const exists = await this.client.exists(legacy)
        if (exists) return legacy

        return legacy
    }

    async get(sessionId: string): Promise<SessionState | null> {
        try {
            const key = await this.resolveKey(sessionId)
            const data = await this.client.get(key)
            if (!data) return null
            return JSON.parse(data, (key, value) => {
                if (
                    (key === 'updatedAt' || key === 'sessionStartTime' || key === 'targetTime' || key === 'createdAt' || key === 'achievedAt')
                    && typeof value === 'string'
                ) {
                    const parsed = Date.parse(value)
                    if (!Number.isNaN(parsed)) return new Date(parsed)
                }
                return value
            })
        } catch (error) {
            this.logger.error('[RedisSessionState] Failed to get session', { sessionId, error })
            return null
        }
    }

    async set(sessionId: string, state: SessionState): Promise<void> {
        try {
            // Enforce Strict Key
            const key = this.getStrictKey(state.userId, sessionId)
            const userIndexKey = this.getUserIndexKey(state.userId)
            const lookupKey = this.getLookupKey(sessionId)

            // Clean history from input to ensure it doesn't overwrite
            const { history, ...statePayload } = state
            const payload = JSON.stringify({ ...statePayload, updatedAt: new Date() })

            // @ts-ignore - custom command
            await this.client.updateSessionAtomic(
                key,
                userIndexKey,
                lookupKey,
                payload,
                this.TTL_SECONDS,
                10,
                sessionId,
                state.userId
            )
        } catch (error) {
            this.logger.error('[RedisSessionState] Failed to set session', { sessionId, error })
            throw error
        }
    }

    async patch(sessionId: string, partial: SessionStatePatch): Promise<void> {
        try {
            const key = await this.resolveKey(sessionId)
            const payload = JSON.stringify({ ...partial, updatedAt: new Date() })

            // @ts-ignore
            const result = await this.client.patchSessionAtomic(
                key,
                payload,
                this.TTL_SECONDS,
                10
            )

            if (result === 0) {
                throw new Error(`Failed to patch session ${sessionId}: Not found`)
            }
        } catch (error) {
            this.logger.error('[RedisSessionState] Failed to patch session', { sessionId, error })
            throw error
        }
    }

    async rollback(sessionId: string, steps: number = 1): Promise<void> {
        try {
            const key = await this.resolveKey(sessionId)
            // @ts-ignore
            await this.client.rollbackSessionAtomic(key, steps, this.TTL_SECONDS)
        } catch (error) {
            this.logger.error('[RedisSessionState] Failed to rollback session', { sessionId, error })
            throw error
        }
    }

    async delete(sessionId: string): Promise<void> {
        try {
            const key = await this.resolveKey(sessionId)
            // We need userId to clean the index. We can get it from key if it's strict.
            // Strict key format: dreamweaver:session:{userId}:{sessionId}
            const parts = key.split(':')
            let userId = null
            if (parts.length === 4) {
                userId = parts[2]
            }

            const pipe = this.client.pipeline()
            pipe.del(key)
            pipe.del(this.getLookupKey(sessionId))
            if (userId) {
                pipe.srem(this.getUserIndexKey(userId), sessionId)
            }
            await pipe.exec()
        } catch (error) {
            this.logger.error('[RedisSessionState] Failed to delete session', { sessionId, error })
        }
    }
}
