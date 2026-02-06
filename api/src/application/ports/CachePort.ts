/**
 * CachePort - Interface for distributed caching and counters
 * 
 * Supports:
 * - Simple Key-Value storage (with TTL)
 * - Atomic increment (for Rate Limiting and Circuit Breakers)
 */
export interface CachePort {
    /**
     * Get a value from the cache
     * @param key Cache key
     * @returns The value or null if not found/expired
     */
    get(key: string): Promise<string | null>

    /**
     * Set a value in the cache
     * @param key Cache key
     * @param value String value
     * @param ttlSeconds Time to live in seconds (optional)
     */
    set(key: string, value: string, ttlSeconds?: number): Promise<void>

    /**
     * Atomically increment a counter
     * @param key Counter key
     * @param ttlSeconds Time to live for the key (optional, only applied on creation usually)
     * @returns The new value
     */
    increment(key: string, ttlSeconds?: number): Promise<number>

    /**
     * Delete a key
     * @param key Cache key
     */
    delete(key: string): Promise<void>
}
