/**
 * MediaVault - Offline Resilience for DreamWeaver
 * 
 * Uses IndexedDB to store stories locally, ensuring the child
 * can listen to their favorite stories even without internet.
 * 
 * Satisfies: GATE-PWA-02
 */
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface StoryRecord {
    id: string
    title: string
    content: string // Text content
    audioBlob?: Blob // Offline audio
    theme: string
    createdAt: Date
    lastPlayedAt?: Date
}

interface DreamWeaverDB extends DBSchema {
    stories: {
        key: string
        value: StoryRecord
        indexes: { 'by-theme': string }
    }
}

export class MediaVault {
    private dbPromise: Promise<IDBPDatabase<DreamWeaverDB>>

    constructor() {
        this.dbPromise = openDB<DreamWeaverDB>('dreamweaver-vault', 1, {
            upgrade(db) {
                const store = db.createObjectStore('stories', { keyPath: 'id' })
                store.createIndex('by-theme', 'theme')
            }
        })
    }

    /**
     * Save a story for offline playback with a 50-story eviction policy.
     */
    async saveStory(story: StoryRecord): Promise<void> {
        const db = await this.dbPromise

        // Eviction Logic: Maintain max 50 stories
        const allStories = await db.getAll('stories')
        if (allStories.length >= 50) {
            // Sort by date and remove oldest
            const oldest = allStories.sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )[0]
            if (oldest) {
                await db.delete('stories', oldest.id)
                console.log('[MediaVault] Evicted oldest story to save space:', oldest.title)
            }
        }

        await db.put('stories', story)
        console.log('[MediaVault] Story saved offline:', story.title)
    }

    /**
     * Retrieve a story by ID
     */
    async getStory(id: string): Promise<StoryRecord | undefined> {
        const db = await this.dbPromise
        return db.get('stories', id)
    }

    /**
     * Get all offline stories
     */
    async getAllStories(): Promise<StoryRecord[]> {
        const db = await this.dbPromise
        return db.getAll('stories')
    }

    /**
     * Delete a story to free up space
     */
    async deleteStory(id: string): Promise<void> {
        const db = await this.dbPromise
        await db.delete('stories', id)
    }
}

export const mediaVault = new MediaVault()
