import { GeminiAIGateway } from '../infrastructure/adapters/GeminiAIGateway'
import { GoogleTTSAdapter } from '../infrastructure/adapters/GoogleTTSAdapter'
import { SupabaseStoryRepository } from '../infrastructure/SupabaseStoryRepository'
import { SupabaseVoiceRepository } from '../infrastructure/SupabaseVoiceRepository'
import { SupabaseFileStorageAdapter } from '../infrastructure/SupabaseFileStorageAdapter'
import { SupabaseEventBus } from '../infrastructure/events/SupabaseEventBus'
import { InMemoryEventBus } from '../infrastructure/events/InMemoryEventBus'
import { GenerateStoryUseCase } from '../application/use-cases/GenerateStoryUseCase'
import { UploadVoiceUseCase } from '../application/use-cases/UploadVoiceUseCase'
import { InMemoryAgentMemory } from '../infrastructure/memory/InMemoryAgentMemory'
import { MCPAudioSensorAdapter } from '../infrastructure/adapters/MCPAudioSensorAdapter'
import { ManageSleepCycleUseCase } from '../application/use-cases/ManageSleepCycleUseCase'

import { BedtimeConductorAgent } from '../domain/agents/BedtimeConductorAgent'
import { SleepSentinelAgent } from '../domain/agents/SleepSentinelAgent'
import { ConsoleLoggerAdapter } from '../infrastructure/adapters/ConsoleLoggerAdapter'

/**
 * Dependency Injection Container
 * 
 * Manages the lifecycle of application dependencies.
 * Currently uses Singleton pattern for stateless services.
 * 
 * Future improvement: Use a real DI library like InversifyJS if complexity grows.
 */
export class ServiceContainer {
    private static instance: ServiceContainer

    // Infrastucture (Singletons)
    readonly aiService = new GeminiAIGateway()
    readonly ttsService = new GoogleTTSAdapter()
    readonly storyRepository = new SupabaseStoryRepository()
    readonly voiceRepository = new SupabaseVoiceRepository()
    readonly fileStorage = new SupabaseFileStorageAdapter()
    readonly eventBus = new SupabaseEventBus() // Using Persisted Bus
    readonly logger = new ConsoleLoggerAdapter()
    readonly agentMemory = new InMemoryAgentMemory()
    readonly audioSensor = new MCPAudioSensorAdapter() // MCP Adapter

    // Domain Agents
    readonly bedtimeConductorAgent = new BedtimeConductorAgent(this.agentMemory, this.logger)
    readonly sleepSentinelAgent = new SleepSentinelAgent(this.audioSensor, this.eventBus)

    // Use Cases (Factories)
    get generateStoryUseCase(): GenerateStoryUseCase {
        return new GenerateStoryUseCase(
            this.aiService,
            this.bedtimeConductorAgent,
            this.storyRepository,
            this.eventBus,
            this.ttsService,
            this.logger
        )
    }

    get uploadVoiceUseCase(): UploadVoiceUseCase {
        return new UploadVoiceUseCase(
            this.voiceRepository,
            this.fileStorage
        )
    }

    get manageSleepCycleUseCase(): ManageSleepCycleUseCase {
        return new ManageSleepCycleUseCase(
            this.sleepSentinelAgent,
            this.logger
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
        // Wire BedtimeConductorAgent to listen for story beats
        this.eventBus.subscribe('STORY_BEAT_COMPLETED', (event) => {
            this.bedtimeConductorAgent.handleStoryBeat(event as any)
        })

        this.logger.info('Agent subscriptions initialized')
    }
}

export const container = ServiceContainer.getInstance()
