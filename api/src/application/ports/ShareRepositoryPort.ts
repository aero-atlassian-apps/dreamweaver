import { SharedLink } from '../../domain/entities/SharedLink.js'

export interface ShareRepositoryPort {
    /**
     * Persists a shared link to storage.
     * @param link The SharedLink entity to save.
     */
    save(link: SharedLink): Promise<void>

    /**
     * Retrieves a shared link by its unique access token.
     * @param token The secure token string.
     * @returns The SharedLink if found and valid, null otherwise.
     */
    findByToken(token: string): Promise<SharedLink | null>

    /**
     * Increment the view counter for a shared link.
     * @param token The access token of the link viewed.
     */
    incrementViews(token: string): Promise<void>
}
