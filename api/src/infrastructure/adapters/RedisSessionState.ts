import { Redis as IoRedis } from 'ioredis'
import { Redis as UpstashRedis } from '@upstash/redis'
import { SessionState, SessionStatePort, SessionStatePatch } from '../../application/ports/SessionStatePort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

// LUA SCRIPTS
const UPDATE_SESSION_SCRIPT = `
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

const PATCH_SESSION_SCRIPT = `
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

const ROLLBACK_SESSION_SCRIPT = `
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

export type RedisConfig = {
    url: string
    token?: string
}

export class RedisSessionState implements SessionStatePort {
    private ioClient?: IoRedis
    private upstashClient?: UpstashRedis
    private readonly TTL_SECONDS = 86400 // 24 hours

    constructor(
        config: RedisConfig,
        private logger: LoggerPort
    ) {
        if (config.url.startsWith('https://')) {
            // Upstash HTTP mode
            if (!config.token) throw new Error('Upstash Redis requires a token')
            this.upstashClient = new UpstashRedis({
                url: config.url,
                token: config.token
            })
            this.logger.info('[RedisSessionState] Using Upstash HTTP Client')
        } else {
            // Standard Redis mode
            this.ioClient = new IoRedis(config.url, {
                retryStrategy: (times: number) => Math.min(times * 50, 2000),
                maxRetriesPerRequest: 3
            })

            this.ioClient.on('error', (err: any) => {
                this.logger.error('[RedisSessionState] Connection Error', err)
            })
            this.ioClient.on('connect', () => {
                this.logger.info('[RedisSessionState] Connected to Redis (TCP)')
            })

            // Define Commands for IoRedis
            this.ioClient.defineCommand('updateSessionAtomic', {
                numberOfKeys: 3,
                lua: UPDATE_SESSION_SCRIPT
            })
            this.ioClient.defineCommand('patchSessionAtomic', {
                numberOfKeys: 1,
                lua: PATCH_SESSION_SCRIPT
            })
            this.ioClient.defineCommand('rollbackSessionAtomic', {
                numberOfKeys: 1,
                lua: ROLLBACK_SESSION_SCRIPT
            })
        }
    }

    private getLegacyKey(sessionId: string): string {
        return `dreamweaver:session:${sessionId}`
    }

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
        let userId: string | null = null
        if (this.upstashClient) {
            userId = await this.upstashClient.get(this.getLookupKey(sessionId)) as string | null
        } else {
            userId = await this.ioClient!.get(this.getLookupKey(sessionId))
        }

        if (userId) {
            return this.getStrictKey(userId, sessionId)
        }
        // Fallback to legacy key (migration/backwards compat)
        const legacy = this.getLegacyKey(sessionId)

        let exists = 0
        if (this.upstashClient) {
            exists = await this.upstashClient.exists(legacy)
        } else {
            exists = await this.ioClient!.exists(legacy)
        }

        if (exists) return legacy
        return legacy
    }

    async get(sessionId: string): Promise<SessionState | null> {
        try {
            const key = await this.resolveKey(sessionId)
            let data: string | null = null

            if (this.upstashClient) {
                // Upstash might return object if JSON, but we store as string via LUA
                // However, our Lua scripts encode to JSON string.
                // Re-verify if Upstash auto-parses. It typically returns what Redis returns.
                // GET returns bulk string.

                // Note: Upstash Node SDK might auto-deserialize JSON if it detects it? 
                // Let's assume it behaves like Redis for string keys.
                // Actually Upstash SDK DOES auto-deserialize if it looks like JSON. 
                // We'll handle both string and object.
                const raw = await this.upstashClient.get(key)
                if (typeof raw === 'object' && raw !== null) {
                    return this.parseDates(raw) as SessionState
                }
                data = raw as string | null
            } else {
                data = await this.ioClient!.get(key)
            }

            if (!data) return null
            return JSON.parse(data, (key, value) => this.dateReviver(key, value))
        } catch (error) {
            this.logger.error('[RedisSessionState] Failed to get session', { sessionId, error })
            return null
        }
    }

    private parseDates(obj: any): any {
        // Recursive date parsing for Upstash auto-deserialized objects
        if (!obj || typeof obj !== 'object') return obj
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key]
                if (typeof value === 'string' && (key === 'updatedAt' || key === 'sessionStartTime' || key === 'targetTime' || key === 'createdAt' || key === 'achievedAt')) {
                    const parsed = Date.parse(value)
                    if (!Number.isNaN(parsed)) obj[key] = new Date(parsed)
                } else if (typeof value === 'object') {
                    this.parseDates(value)
                }
            }
        }
        return obj
    }

    private dateReviver(key: string, value: any): any {
        if (
            (key === 'updatedAt' || key === 'sessionStartTime' || key === 'targetTime' || key === 'createdAt' || key === 'achievedAt')
            && typeof value === 'string'
        ) {
            const parsed = Date.parse(value)
            if (!Number.isNaN(parsed)) return new Date(parsed)
        }
        return value
    }

    async set(sessionId: string, state: SessionState): Promise<void> {
        try {
            const key = this.getStrictKey(state.userId, sessionId)
            const userIndexKey = this.getUserIndexKey(state.userId)
            const lookupKey = this.getLookupKey(sessionId)

            const { history, ...statePayload } = state
            const payload = JSON.stringify({ ...statePayload, updatedAt: new Date() })

            if (this.upstashClient) {
                await this.upstashClient.eval(
                    UPDATE_SESSION_SCRIPT,
                    [key, userIndexKey, lookupKey],
                    [payload, this.TTL_SECONDS, 10, sessionId, state.userId]
                )
            } else {
                // @ts-ignore
                await this.ioClient!.updateSessionAtomic(
                    key,
                    userIndexKey,
                    lookupKey,
                    payload,
                    this.TTL_SECONDS,
                    10,
                    sessionId,
                    state.userId
                )
            }
        } catch (error) {
            this.logger.error('[RedisSessionState] Failed to set session', { sessionId, error })
            throw error
        }
    }

    async patch(sessionId: string, partial: SessionStatePatch): Promise<void> {
        try {
            const key = await this.resolveKey(sessionId)
            const payload = JSON.stringify({ ...partial, updatedAt: new Date() })

            let result: number | null = 0

            if (this.upstashClient) {
                result = await this.upstashClient.eval(
                    PATCH_SESSION_SCRIPT,
                    [key],
                    [payload, this.TTL_SECONDS, 10]
                ) as number
            } else {
                // @ts-ignore
                result = await this.ioClient!.patchSessionAtomic(
                    key,
                    payload,
                    this.TTL_SECONDS,
                    10
                )
            }

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

            if (this.upstashClient) {
                await this.upstashClient.eval(
                    ROLLBACK_SESSION_SCRIPT,
                    [key],
                    [steps, this.TTL_SECONDS]
                )
            } else {
                // @ts-ignore
                await this.ioClient!.rollbackSessionAtomic(key, steps, this.TTL_SECONDS)
            }
        } catch (error) {
            this.logger.error('[RedisSessionState] Failed to rollback session', { sessionId, error })
            throw error
        }
    }

    async delete(sessionId: string): Promise<void> {
        try {
            const key = await this.resolveKey(sessionId)
            const parts = key.split(':')
            let userId = null
            if (parts.length === 4) {
                userId = parts[2]
            }

            if (this.upstashClient) {
                const pipe = this.upstashClient.pipeline()
                pipe.del(key)
                pipe.del(this.getLookupKey(sessionId))
                if (userId) {
                    pipe.srem(this.getUserIndexKey(userId), sessionId)
                }
                await pipe.exec()
            } else {
                const pipe = this.ioClient!.pipeline()
                pipe.del(key)
                pipe.del(this.getLookupKey(sessionId))
                if (userId) {
                    pipe.srem(this.getUserIndexKey(userId), sessionId)
                }
                await pipe.exec()
            }
        } catch (error) {
            this.logger.error('[RedisSessionState] Failed to delete session', { sessionId, error })
        }
    }
}
