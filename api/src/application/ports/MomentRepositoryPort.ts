import { Moment } from '../../domain/entities/Moment.js'

export interface MomentRepositoryPort {
    findById(id: string): Promise<Moment | null>
    save(moment: Moment): Promise<void>
    findByUserId(userId: string): Promise<Moment[]>
    findByStoryId(storyId: string): Promise<Moment[]>
    block(id: string): Promise<boolean>
}
