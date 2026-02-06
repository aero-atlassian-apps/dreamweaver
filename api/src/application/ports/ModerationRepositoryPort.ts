export type ModerationContentType = 'character'

export interface ModerationRepositoryPort {
    block(contentType: ModerationContentType, contentId: string, adminId: string, reason?: string, notes?: string): Promise<void>
    listBlockedCharacterIds(): Promise<string[]>
}

