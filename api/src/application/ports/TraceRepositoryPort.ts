import { ReasoningTrace } from '../../domain/agents/BedtimeConductorAgent.js'

export interface TraceRepositoryPort {
    save(trace: ReasoningTrace): Promise<void>
}
