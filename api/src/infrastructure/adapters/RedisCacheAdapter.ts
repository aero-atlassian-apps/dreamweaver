/**
 * RedisCacheAdapter - Distributed caching via Upstash REST API
 */
import { CachePort } from '../../application/ports/CachePort.js'

export class RedisCacheAdapter implements CachePort {
    constructor(
        private restUrl: string,
        private token: string
    ) { }

    private async command<T>(command: string, ...args: (string | number)[]): Promise<T> {
        try {
            const response = await fetch(`${this.restUrl}/pipeline`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([
                    [command, ...args]
                ])
            })

            if (!response.ok) {
                throw new Error(`Upstash error: ${response.statusText}`)
            }

            const results = await response.json() as { result: T, error?: string }[]
            if (results[0].error) {
                throw new Error(`Redis command error: ${results[0].error}`)
            }

            return results[0].result
        } catch (error) {
            console.error('[RedisCacheAdapter] Command failed', { command, error })
            throw error
        }
    }

    async get(key: string): Promise<string | null> {
        return this.command<string | null>('GET', key)
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.command('SET', key, value, 'EX', ttlSeconds)
        } else {
            await this.command('SET', key, value)
        }
    }

    async increment(key: string, ttlSeconds?: number): Promise<number> {
        if (ttlSeconds) {
            // Script to increment and set expiry if new
            // Simplified: Just incr, then expire if it was 1
            const val = await this.command<number>('INCR', key)
            if (val === 1) {
                await this.command('EXPIRE', key, ttlSeconds)
            }
            return val
        }
        return this.command<number>('INCR', key)
    }

    async delete(key: string): Promise<void> {
        await this.command('DEL', key)
    }
}
