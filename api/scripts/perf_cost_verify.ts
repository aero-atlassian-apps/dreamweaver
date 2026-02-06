import { MockAIService } from '../src/infrastructure/adapters/MockAIService.js'
import { PromptAdapter } from '../src/infrastructure/ai/PromptAdapter.js'
import { InMemoryAgentMemory } from '../src/infrastructure/memory/InMemoryAgentMemory.js'
import { InMemorySessionState } from '../src/infrastructure/adapters/InMemorySessionState.js'
import { BedtimeConductorAgent } from '../src/domain/agents/BedtimeConductorAgent.js'
import { GenerateStoryUseCase } from '../src/application/use-cases/GenerateStoryUseCase.js'
import { CheckUnlockUseCase } from '../src/application/use-cases/CheckUnlockUseCase.js'

function percentile(sorted: number[], p: number) {
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))
    return sorted[idx] ?? 0
}

async function main() {
    const originalConsoleError = console.error
    console.error = () => { }

    const aiService = new MockAIService()
    const promptService = new PromptAdapter()
    const memory = new InMemoryAgentMemory()
    const sessionState = new InMemorySessionState()
    const logger = { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }

    const conductor = new BedtimeConductorAgent(
        aiService,
        promptService,
        sessionState,
        memory,
        logger
    )

    const storyRepoStub = {
        findById: async () => null,
        findByUserId: async () => [],
        findRecent: async () => [],
        save: async () => { }
    }

    const checkUnlock = new CheckUnlockUseCase(
        storyRepoStub as any,
        logger as any,
        { listBlockedCharacterIds: async () => [] } as any,
        { listUnlockedByUserId: async () => [], upsertUnlock: async () => { } } as any
    )

    const useCase = new GenerateStoryUseCase(
        aiService,
        conductor,
        checkUnlock,
        promptService,
        storyRepoStub as any,
        undefined,
        undefined,
        logger,
        undefined
    )

    const iterations = Number(process.argv[2] || 20)
    const latencies: number[] = []

    for (let i = 0; i < iterations; i++) {
        const start = Date.now()
        await useCase.execute({
            theme: 'space adventure',
            childName: 'Tester',
            childAge: 7,
            duration: 'short',
            mood: 'calm',
            userId: `perf_user_${i}`,
            requestId: `req_${i}_${Date.now()}`
        })
        latencies.push(Date.now() - start)
    }

    latencies.sort((a, b) => a - b)
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length

    const result = {
        iterations,
        avgMs: Number(avg.toFixed(2)),
        p50Ms: percentile(latencies, 0.5),
        p95Ms: percentile(latencies, 0.95),
        p99Ms: percentile(latencies, 0.99)
    }

    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    console.error = originalConsoleError
}

main().catch((err) => {
    process.stderr.write(String(err?.stack || err) + '\n')
    process.exitCode = 1
})
