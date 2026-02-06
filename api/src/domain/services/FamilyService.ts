import { Family, FamilyId } from '../entities/Family.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'
import { FamilyRepositoryPort } from '../../application/ports/FamilyRepositoryPort.js'
import { randomUUID } from 'node:crypto'

export class FamilyService {
    constructor(
        private readonly repository: FamilyRepositoryPort,
        private readonly logger: LoggerPort
    ) { }

    async createFamily(name: string, creatorId: string): Promise<Family> {
        const id: FamilyId = randomUUID()
        const family = Family.create(id, name, creatorId)

        await this.repository.save(family)
        this.logger.info(`Family created: ${name} by ${creatorId}`)
        return family
    }

    async getFamily(id: FamilyId): Promise<Family | null> {
        return this.repository.findById(id)
    }

    async getFamilyByUserId(userId: string): Promise<Family | null> {
        return this.repository.findByUserId(userId)
    }

    async addMemberToFamily(familyId: FamilyId, userId: string): Promise<void> {
        await this.repository.addMember(familyId, userId)
        this.logger.info(`Added user ${userId} to family ${familyId}`)
    }
}
