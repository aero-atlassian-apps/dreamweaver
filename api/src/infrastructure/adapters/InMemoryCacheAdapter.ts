/**
 * InMemoryCacheAdapter - Local caching for Development/Testing
 */
import { CachePort } from '../../application/ports/CachePort.js'

interface CacheItem {
    value: string
    expiry: number
}

export class InMemoryCacheAdapter implements CachePort {
    private store = new Map<string, CacheItem>()
    private counters = new Map<string, { value: number, expiry: number }>()

    async get(key: string): Promise<string | null> {
        const item = this.store.get(key)
        if (!item) return null

        if (item.expiry > 0 && item.expiry < Date.now()) {
            this.store.delete(key)
            return null
        }

        return item.value
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : 0
        this.store.set(key, { value, expiry })
    }

    async increment(key: string, ttlSeconds?: number): Promise<number> {
        let item = this.counters.get(key)
        const now = Date.now()

        // Check expiry for counters too
        if (item && item.expiry > 0 && item.expiry < now) {
            item = undefined
        }

        if (!item) {
            const expiry = ttlSeconds ? now + (ttlSeconds * 1000) : 0
            item = { value: 0, expiry }
        }

        item.value++
        this.counters.set(key, item)
        return item.value
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key)
        this.counters.delete(key)
    }
}
