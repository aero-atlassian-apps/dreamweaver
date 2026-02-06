
import { CheckUnlockUseCase } from '../api/src/application/use-cases/CheckUnlockUseCase';
import { StoryRepositoryPort } from '../api/src/application/ports/StoryRepositoryPort';
import { LoggerPort } from '../api/src/application/ports/LoggerPort';
import { Story } from '../api/src/domain/entities/Story';
import type { ModerationRepositoryPort } from '../api/src/application/ports/ModerationRepositoryPort';
import type { CompanionUnlockRepositoryPort } from '../api/src/application/ports/CompanionUnlockRepositoryPort';

// Mock Repository
class MockStoryRepo implements StoryRepositoryPort {
    constructor(private count: number) { }
    async findByUserId(_userId: string): Promise<Story[]> {
        void _userId
        // Return array of 'count' length
        return Array(this.count).fill({} as Story);
    }
    // minimal implementations for others
    async save(_story: Story): Promise<void> { void _story }
    async findById(_id: string): Promise<Story | null> { void _id; return null; }
    async findRecent(_userId: string, _limit: number): Promise<Story[]> { void _userId; void _limit; return []; }
}

const mockLogger: LoggerPort = {
    info: (msg) => console.log('[INFO]', msg),
    warn: (msg) => console.log('[WARN]', msg),
    error: (msg) => console.log('[ERROR]', msg),
    debug: () => { }
};

const mockModerationRepo: ModerationRepositoryPort = {
    listBlockedCharacterIds: async () => []
} as any

class MockCompanionUnlockRepo implements CompanionUnlockRepositoryPort {
    private unlocked = new Map<string, Date>()

    async listUnlockedByUserId(_userId: string) {
        void _userId
        return [...this.unlocked.entries()].map(([companionId, unlockedAt]) => ({ companionId, unlockedAt }))
    }

    async upsertUnlock(_userId: string, companionId: string, unlockedAt: Date) {
        void _userId
        if (!this.unlocked.has(companionId)) this.unlocked.set(companionId, unlockedAt)
    }
}

async function run() {
    console.log('--- Verifying CheckUnlockUseCase Fix ---');

    // Scenario: Threshold is 5. User has 6 stories.

    const repo = new MockStoryRepo(6);
    const unlockRepo = new MockCompanionUnlockRepo()
    const useCase = new CheckUnlockUseCase(repo, mockLogger, mockModerationRepo, unlockRepo);

    const companions = await useCase.execute('user_123');

    // Assuming first companion unlocks at 5
    const unlocked = companions.length > 0;

    console.log(`User has 6 stories.`);
    console.log(`Companions unlocked: ${companions.length}`);

    if (unlocked) {
        console.log('✅ PASS: Companion remains unlocked after passing threshold.');
        process.exit(0);
    } else {
        console.error('❌ FAIL: Companion locked despite exceeding threshold.');
        process.exit(1);
    }
}

run();
