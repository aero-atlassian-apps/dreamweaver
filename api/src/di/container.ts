import { GeminiAIGateway } from '../infrastructure/adapters/GeminiAIGateway.js'
import { MockAIService } from '../infrastructure/adapters/MockAIService.js'
import { GoogleTTSAdapter } from '../infrastructure/adapters/GoogleTTSAdapter.js'
import { HuggingFaceVoiceAdapter } from '../infrastructure/adapters/HuggingFaceVoiceAdapter.js'
import { CompositeTTSAdapter } from '../infrastructure/adapters/CompositeTTSAdapter.js'
import { RedisCacheAdapter } from '../infrastructure/adapters/RedisCacheAdapter.js'
import { InMemoryCacheAdapter } from '../infrastructure/adapters/InMemoryCacheAdapter.js'
import { SupabaseStoryRepository } from '../infrastructure/SupabaseStoryRepository.js'
import { SupabaseVoiceRepository } from '../infrastructure/SupabaseVoiceRepository.js'
import { SupabaseFileStorageAdapter } from '../infrastructure/SupabaseFileStorageAdapter.js'
import { SupabaseEventBus } from '../infrastructure/events/SupabaseEventBus.js'
import { InMemoryEventBus } from '../infrastructure/events/InMemoryEventBus.js'
import { GenerateStoryUseCase } from '../application/use-cases/GenerateStoryUseCase.js'
import { UploadVoiceUseCase } from '../application/use-cases/UploadVoiceUseCase.js'
import { PersistedAgentMemory } from '../infrastructure/memory/PersistedAgentMemory.js'
import { SupabaseAgentMemory } from '../infrastructure/memory/SupabaseAgentMemory.js'
import { ManageSleepCycleUseCase } from '../application/use-cases/ManageSleepCycleUseCase.js'
import { ProcessConversationTurnUseCase } from '../application/use-cases/ProcessConversationTurnUseCase.js'
import { GetSuggestionsUseCase } from '../application/use-cases/GetSuggestionsUseCase.js'
import { GetStoryUseCase } from '../application/use-cases/GetStoryUseCase.js'
import { LogInteractionUseCase } from '../application/use-cases/LogInteractionUseCase.js'
import { CreateShareLinkUseCase } from '../application/use-cases/CreateShareLinkUseCase.js'
import { GetSharedContentUseCase } from '../application/use-cases/GetSharedContentUseCase.js'
import { SupabaseShareRepository } from '../infrastructure/SupabaseShareRepository.js'
import { SupabaseMomentRepository } from '../infrastructure/SupabaseMomentRepository.js'
import { BedtimeConductorAgent } from '../domain/agents/BedtimeConductorAgent.js'
import { SleepSentinelAgent } from '../domain/agents/SleepSentinelAgent.js'
import { PinoLoggerAdapter } from '../infrastructure/adapters/PinoLoggerAdapter.js'
import { AmbientContextService } from '../infrastructure/services/AmbientContextService.js'
import { SendWeeklyDigestUseCase } from '../application/use-cases/SendWeeklyDigestUseCase.js'
import { SmtpEmailService } from '../infrastructure/adapters/SmtpEmailService.js'
import { SupabaseFeedbackRepository } from '../infrastructure/repositories/SupabaseFeedbackRepository.js'
import { FlagContentUseCase } from '../application/use-cases/FlagContentUseCase.js'
import { GetStoryHistoryUseCase } from '../application/use-cases/GetStoryHistoryUseCase.js'
import { CheckUnlockUseCase } from '../application/use-cases/CheckUnlockUseCase.js'
import { AnalyzeSessionForMomentsUseCase } from '../application/use-cases/AnalyzeSessionForMomentsUseCase.js'
import { SelectVoiceUseCase } from '../application/use-cases/SelectVoiceUseCase.js'
import { ReviewFeedbackUseCase } from '../application/use-cases/ReviewFeedbackUseCase.js'
import { PromptAdapter } from '../infrastructure/ai/PromptAdapter.js'
import { SafetyGuardian } from '../domain/services/SafetyGuardian.js'
import { FileTraceRepository } from '../infrastructure/repositories/FileTraceRepository.js' // [TRACE-01]
import { InMemoryTicketStore } from '../infrastructure/memory/InMemoryTicketStore.js'
import { SupabaseTicketStore } from '../infrastructure/tickets/SupabaseTicketStore.js'
import { TicketStorePort } from '../application/ports/TicketStorePort.js'
import { FamilyService } from '../domain/services/FamilyService.js'
import { SupabaseFamilyRepository } from '../infrastructure/SupabaseFamilyRepository.js'
import { InMemorySessionState } from '../infrastructure/adapters/InMemorySessionState.js'
import { MemorySummarizationService } from '../domain/services/MemorySummarizationService.js'
import { VerificationPipeline } from '../domain/services/VerificationPipeline.js'
import { QualityGate } from '../domain/services/QualityGate.js'
import { ResilienceEngine } from '../domain/services/ResilienceEngine.js'
import { SessionConsolidator } from '../application/handlers/SessionConsolidator.js'
import { RedisSessionState } from '../infrastructure/adapters/RedisSessionState.js'
import { SupabaseToolAuditLog } from '../infrastructure/audit/SupabaseToolAuditLog.js'
import { SupabaseHumanReviewQueue } from '../infrastructure/repositories/SupabaseHumanReviewQueue.js'
import { SupabaseModerationRepository } from '../infrastructure/repositories/SupabaseModerationRepository.js'
import { SupabaseCompanionUnlockRepository } from '../infrastructure/SupabaseCompanionUnlockRepository.js'

/**
 * Dependency Injection Container
 * 
 * Manages the lifecycle of application dependencies.
 * Currently uses Singleton pattern for stateless services.
 */
export class ServiceContainer {
    private static instance: ServiceContainer

    constructor() {
    }

    // Infrastucture (Singletons)
    readonly logger = new PinoLoggerAdapter()
    readonly resilienceEngine = new ResilienceEngine(this.logger)

    // [Phase 2] Cache Service
    private createCacheAdapter(): import('../application/ports/CachePort.js').CachePort {
        const upstashUrl = process.env['UPSTASH_REDIS_REST_URL']
        const upstashToken = process.env['UPSTASH_REDIS_REST_TOKEN']

        if (upstashUrl && upstashToken) {
            this.logger.info('[ServiceContainer] Using RedisCacheAdapter (Upstash)')
            return new RedisCacheAdapter(upstashUrl, upstashToken)
        }

        if (process.env['NODE_ENV'] === 'production') {
            throw new Error('FATAL: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production')
        }
        this.logger.info('[ServiceContainer] Using InMemoryCacheAdapter')
        return new InMemoryCacheAdapter()
    }
    readonly cache = this.createCacheAdapter()

    readonly aiService = (() => {
        if (process.env['NODE_ENV'] === 'production' && process.env['USE_MOCK_AI'] === 'true') {
            throw new Error('FATAL: USE_MOCK_AI must not be enabled in production')
        }
        if (process.env['USE_MOCK_AI'] === 'true') return new MockAIService()
        return new GeminiAIGateway(this.cache, undefined, {
            modelName: process.env['GEMINI_MODEL'],
            modelFlash: process.env['GEMINI_MODEL_FLASH'],
            modelPro: process.env['GEMINI_MODEL_PRO'],
            timeoutMs: process.env['GEMINI_TIMEOUT_MS'] ? parseInt(process.env['GEMINI_TIMEOUT_MS'], 10) : undefined,
            tokenBudgetPerSession: process.env['AI_TOKEN_BUDGET'] ? parseInt(process.env['AI_TOKEN_BUDGET'], 10) : undefined,
            costThresholdUsd: process.env['AI_COST_THRESHOLD'] ? parseFloat(process.env['AI_COST_THRESHOLD']) : undefined
        })
    })()

    // TTS Service (Hybrid: Google + HF)
    private createTTSAdapter(): import('../application/ports/TextToSpeechPort.js').TextToSpeechPort {
        if (process.env['NODE_ENV'] === 'production' && !process.env['GOOGLE_TTS_API_KEY']) {
            throw new Error('FATAL: GOOGLE_TTS_API_KEY is required in production for TTS')
        }
        if (process.env['NODE_ENV'] === 'production' && process.env['VOICE_CLONING_ENABLED'] === 'true' && !process.env['HUGGINGFACE_API_KEY']) {
            throw new Error('FATAL: HUGGINGFACE_API_KEY is required when VOICE_CLONING_ENABLED=true')
        }
        const googleAdapter = new GoogleTTSAdapter()
        const hfAdapter = new HuggingFaceVoiceAdapter()
        return new CompositeTTSAdapter(googleAdapter, hfAdapter)
    }

    readonly ttsService = this.createTTSAdapter()
    readonly storyRepository = new SupabaseStoryRepository(this.logger)
    readonly voiceRepository = new SupabaseVoiceRepository()
    readonly fileStorage = new SupabaseFileStorageAdapter()
    readonly eventBus = this.createEventBus()
    readonly agentMemory = this.createAgentMemory()
    readonly sessionState = this.createSessionState()

    private createAgentMemory(): import('../application/ports/AgentMemoryPort.js').AgentMemoryPort {
        const supabaseUrl = process.env['SUPABASE_URL']
        const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY']
        const supabaseAnonKey = process.env['SUPABASE_ANON_KEY']

        if (supabaseUrl && supabaseServiceKey) {
            if (process.env['NODE_ENV'] === 'production' && !supabaseAnonKey) {
                throw new Error('FATAL: SUPABASE_ANON_KEY is required in production for RLS-scoped memory access')
            }
            this.logger.info('[ServiceContainer] Using SupabaseAgentMemory')
            return new SupabaseAgentMemory()
        }

        if (process.env['NODE_ENV'] === 'production') {
            throw new Error('FATAL: SupabaseAgentMemory is required in production. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
        }

        this.logger.warn('[DEV ONLY] Using PersistedAgentMemory. Use SupabaseAgentMemory for production.')
        return new PersistedAgentMemory()
    }

    private createEventBus() {
        const supabaseUrl = process.env['SUPABASE_URL']
        const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY']
        if (supabaseUrl && supabaseServiceKey) {
            return new SupabaseEventBus(this.logger)
        }
        if (process.env['NODE_ENV'] === 'production') {
            throw new Error('FATAL: SupabaseEventBus requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in production')
        }
        return new InMemoryEventBus()
    }

    private createSessionState(): import('../application/ports/SessionStatePort.js').SessionStatePort {
        const redisUrl = process.env['REDIS_URL']
        if (redisUrl) {
            this.logger.info('[ServiceContainer] Using Redis for Session State')
            return new RedisSessionState(redisUrl, this.logger)
        }
        if (process.env['NODE_ENV'] === 'production') {
            throw new Error('FATAL: REDIS_URL is required in production for Session State')
        }
        this.logger.info('[ServiceContainer] Using InMemory Session State (No REDIS_URL)')
        return new InMemorySessionState()
    }

    readonly shareRepository = new SupabaseShareRepository()

    // Adapters
    readonly promptService = new PromptAdapter()

    // New Services
    readonly ambientContextService = new AmbientContextService()
    readonly emailService = new SmtpEmailService()
    readonly safetyGuardian = new SafetyGuardian(this.aiService, this.promptService, this.logger)
    readonly traceRepository = new FileTraceRepository() // [TRACE-01]
    readonly ticketStore: TicketStorePort = this.createTicketStore()
    readonly momentRepository = new SupabaseMomentRepository(this.logger)
    readonly feedbackRepo = new SupabaseFeedbackRepository(this.logger)
    readonly familyRepository = new SupabaseFamilyRepository(this.logger)
    readonly familyService = new FamilyService(this.familyRepository, this.logger)
    readonly toolAuditLog = new SupabaseToolAuditLog(this.logger)
    readonly humanReviewQueue = new SupabaseHumanReviewQueue(this.logger)
    readonly moderationRepository = new SupabaseModerationRepository(this.logger)
    readonly companionUnlockRepository = new SupabaseCompanionUnlockRepository(this.logger)

    private createTicketStore(): TicketStorePort {
        const hasSupabaseConfig = process.env['SUPABASE_URL'] &&
            (process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY'])

        if (hasSupabaseConfig) {
            return new SupabaseTicketStore()
        }

        // [SCALE-03] Enforce persistent ticket store in production
        if (process.env['NODE_ENV'] === 'production') {
            throw new Error(
                'FATAL: SupabaseTicketStore is required in production. ' +
                'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
            )
        }

        // Development only - warn about limitations
        this.logger.warn('[DEV ONLY] Using InMemoryTicketStore. Tickets will not persist across restarts.')
        return new InMemoryTicketStore()
    }

    // 2026 Core Services
    readonly qualityGate = new QualityGate(this.logger)
    readonly verificationPipeline = new VerificationPipeline(this.aiService, this.promptService, this.humanReviewQueue, this.logger)
    readonly memorySummarizationService = new MemorySummarizationService(this.agentMemory, this.aiService, this.promptService, this.logger)
    readonly sessionConsolidator = new SessionConsolidator(this.eventBus, this.memorySummarizationService, this.sessionState, this.logger)

    // State Mapping
    // Moved up to Infrastructure

    // Domain Agents
    readonly bedtimeConductorAgent = new BedtimeConductorAgent(
        this.aiService,
        this.promptService,
        this.sessionState, // [NEW] Injected State
        this.resilienceEngine,
        this.agentMemory,
        this.logger,
        this.traceRepository, // [TRACE-01]
        this.qualityGate
    )
    readonly sleepSentinelAgent = new SleepSentinelAgent(this.eventBus)

    // Use Cases (Factories)
    get generateStoryUseCase(): GenerateStoryUseCase {
        return new GenerateStoryUseCase(
            this.aiService,
            this.bedtimeConductorAgent,
            this.checkUnlockUseCase,
            this.promptService,
            this.storyRepository,
            this.eventBus,
            this.ttsService,
            this.logger,
            this.ambientContextService,
            this.safetyGuardian
        )
    }

    get uploadVoiceUseCase(): UploadVoiceUseCase {
        return new UploadVoiceUseCase(
            this.voiceRepository,
            this.fileStorage
        )
    }

    get selectVoiceUseCase(): SelectVoiceUseCase {
        return new SelectVoiceUseCase(
            this.voiceRepository
        )
    }

    get manageSleepCycleUseCase(): ManageSleepCycleUseCase {
        return new ManageSleepCycleUseCase(
            this.sleepSentinelAgent,
            this.logger
        )
    }

    get processConversationTurnUseCase(): ProcessConversationTurnUseCase {
        return new ProcessConversationTurnUseCase(
            this.bedtimeConductorAgent,
            this.logger,
            this.agentMemory
        )
    }

    get getSuggestionsUseCase(): GetSuggestionsUseCase {
        return new GetSuggestionsUseCase(
            this.bedtimeConductorAgent,
            this.logger,
            this.ambientContextService
        )
    }

    get logInteractionUseCase(): LogInteractionUseCase {
        return new LogInteractionUseCase(
            this.agentMemory,
            this.logger
        )
    }

    get createShareLinkUseCase(): CreateShareLinkUseCase {
        return new CreateShareLinkUseCase(
            this.shareRepository,
            this.storyRepository,
            this.momentRepository,
            this.logger
        )
    }

    get getSharedContentUseCase(): GetSharedContentUseCase {
        return new GetSharedContentUseCase(
            this.shareRepository,
            this.storyRepository,
            this.momentRepository,
            this.logger
        )
    }

    get getStoryHistoryUseCase(): GetStoryHistoryUseCase {
        return new GetStoryHistoryUseCase(
            this.storyRepository
        )
    }

    get getStoryUseCase(): GetStoryUseCase {
        return new GetStoryUseCase(
            this.storyRepository,
            this.logger
        )
    }

    get sendWeeklyDigestUseCase(): SendWeeklyDigestUseCase {
        return new SendWeeklyDigestUseCase(
            this.storyRepository,
            this.momentRepository,
            this.createShareLinkUseCase,
            this.emailService,
            this.logger
        )
    }

    get checkUnlockUseCase(): CheckUnlockUseCase {
        return new CheckUnlockUseCase(
            this.storyRepository,
            this.logger,
            this.moderationRepository,
            this.companionUnlockRepository
        )
    }

    get analyzeSessionForMomentsUseCase(): AnalyzeSessionForMomentsUseCase {
        return new AnalyzeSessionForMomentsUseCase(
            this.agentMemory,
            this.momentRepository,
            this.storyRepository,
            this.aiService,
            this.promptService,
            this.logger,
            this.verificationPipeline
        )
    }

    get flagContentUseCase(): FlagContentUseCase {
        return new FlagContentUseCase(
            this.feedbackRepo
        )
    }

    get reviewFeedbackUseCase(): ReviewFeedbackUseCase {
        return new ReviewFeedbackUseCase(
            this.feedbackRepo,
            this.storyRepository,
            this.momentRepository,
            this.moderationRepository
        )
    }

    // Singleton Accessor
    static getInstance(): ServiceContainer {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer()
            ServiceContainer.instance.initializeAgentSubscriptions()
        }
        return ServiceContainer.instance
    }

    private initializeAgentSubscriptions(): void {
        this.eventBus.subscribe('STORY_BEAT_COMPLETED', (event: any) => {
            const typedEvent = event as unknown as import('../application/ports/EventBusPort.js').StoryBeatCompletedEvent
            // 1.2 Fetch Unlocked Companions for context
            const companions: import('../domain/entities/DreamCompanion.js').DreamCompanion[] = []
            this.bedtimeConductorAgent.handleStoryBeat(typedEvent)
        })

        this.eventBus.subscribe('SLEEP_CUE_DETECTED', (event: any) => {
            const typedEvent = event as unknown as import('../application/ports/EventBusPort.js').SleepCueDetectedEvent
            this.bedtimeConductorAgent.handleSleepCueDetected(typedEvent)
        })

        this.eventBus.subscribe('STORY_GENERATION_COMPLETED', (event: any) => {
            const typedEvent = event as unknown as import('../application/ports/EventBusPort.js').StoryGenerationCompletedEvent
            const userId = typedEvent.payload.userId
            const sessionId = typedEvent.payload.sessionId
            this.analyzeSessionForMomentsUseCase.execute(sessionId, userId)
                .catch((err: unknown) => this.logger.error('[MemoryCurator] Auto moment analysis failed', err))
        })

        this.logger.info('Agent subscriptions initialized')

        // [2026] Ralph Loop
        this.sessionConsolidator.subscribe()
    }
}

export const container = ServiceContainer.getInstance()
