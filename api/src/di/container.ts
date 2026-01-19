import { GeminiAIGateway } from '../infrastructure/adapters/GeminiAIGateway'
import { GoogleTTSAdapter } from '../infrastructure/adapters/GoogleTTSAdapter'
import { SupabaseStoryRepository } from '../infrastructure/SupabaseStoryRepository'
import { SupabaseVoiceRepository } from '../infrastructure/SupabaseVoiceRepository'
import { SupabaseFileStorageAdapter } from '../infrastructure/SupabaseFileStorageAdapter'
import { SupabaseEventBus } from '../infrastructure/events/SupabaseEventBus'
import { InMemoryEventBus } from '../infrastructure/events/InMemoryEventBus'
import { GenerateStoryUseCase } from '../application/use-cases/GenerateStoryUseCase'
import { UploadVoiceUseCase } from '../application/use-cases/UploadVoiceUseCase'

import { BedtimeConductorAgent } from '../domain/agents/BedtimeConductorAgent'

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

    // Domain Agents
    readonly bedtimeConductorAgent = new BedtimeConductorAgent()

    // Use Cases (Factories)
    get generateStoryUseCase(): GenerateStoryUseCase {
        return new GenerateStoryUseCase(
            this.aiService,
            this.bedtimeConductorAgent,
            this.storyRepository,
            this.eventBus,
            this.ttsService
        )
    }

    get uploadVoiceUseCase(): UploadVoiceUseCase {
        return new UploadVoiceUseCase(
            this.voiceRepository,
            this.fileStorage
        )
    }

    // Singleton Accessor
    static getInstance(): ServiceContainer {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer()
        }
        return ServiceContainer.instance
    }
}

export const container = ServiceContainer.getInstance()
