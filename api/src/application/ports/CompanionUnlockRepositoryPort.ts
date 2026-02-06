export interface CompanionUnlockRecord {
    companionId: string
    unlockedAt: Date
}

export interface CompanionUnlockRepositoryPort {
    listUnlockedByUserId(userId: string): Promise<CompanionUnlockRecord[]>
    upsertUnlock(userId: string, companionId: string, unlockedAt: Date): Promise<void>
}

