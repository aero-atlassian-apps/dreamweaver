import { SharedLink } from '../domain/entities/SharedLink'

export interface ShareRepositoryPort {
    save(link: SharedLink): Promise<void>
    findByToken(token: string): Promise<SharedLink | null>
    incrementViews(token: string): Promise<void>
}
