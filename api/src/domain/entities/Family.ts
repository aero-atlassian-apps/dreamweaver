export type FamilyId = string

export interface FamilyMember {
    userId: string
    role: 'parent' | 'child' | 'grandparent' | 'caregiver'
    permissions: string[]
}

export class Family {
    constructor(
        public readonly id: FamilyId,
        public readonly name: string,
        public readonly members: FamilyMember[],
        public readonly createdAt: Date
    ) { }

    static create(id: FamilyId, name: string, creatorId: string): Family {
        return new Family(
            id,
            name,
            [{ userId: creatorId, role: 'parent', permissions: ['admin'] }],
            new Date()
        )
    }

    addMember(userId: string, role: FamilyMember['role']): void {
        if (this.members.find(m => m.userId === userId)) {
            throw new Error('User already in family')
        }
        this.members.push({ userId, role, permissions: [] })
    }

    isMember(userId: string): boolean {
        return this.members.some(m => m.userId === userId)
    }
}
