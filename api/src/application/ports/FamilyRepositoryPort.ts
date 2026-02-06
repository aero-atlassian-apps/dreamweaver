import { Family, FamilyId } from '../../domain/entities/Family.js'

export interface FamilyRepositoryPort {
    save(family: Family): Promise<void>
    findById(id: FamilyId): Promise<Family | null>
    findByUserId(userId: string): Promise<Family | null>
    addMember(familyId: FamilyId, userId: string): Promise<void>
}
