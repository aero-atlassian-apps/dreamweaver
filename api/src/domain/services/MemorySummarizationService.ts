import { AIServicePort } from '../../application/ports/AIServicePort.js'
import { AgentMemoryPort, AgentContext } from '../../application/ports/AgentMemoryPort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'
import { PromptServicePort } from '../../application/ports/PromptServicePort.js'

/**
 * SemanticFact - A discrete unit of knowledge with provenance.
 */
export interface SemanticFact {
    fact: string
    confidence: number
    sourceAnchor: {
        sessionId: string
        transcriptOffset?: number // approximate line number or turn index
        traceId?: string
    }
}

/**
 * MemorySummarizationService - The "Ralph Loop" Manager.
 * 
 * Periodically consolidates raw session logs (Episodic) into structured knowledge (Semantic).
 * Reduces Hallucinations by forcing the AI to cite its sources (Anchoring).
 */
export class MemorySummarizationService {
    private readonly logger: LoggerPort

    constructor(
        private memory: AgentMemoryPort,
        private aiService: AIServicePort,
        private readonly promptService: PromptServicePort,
        logger?: LoggerPort
    ) {
        this.logger = logger || { info: () => { }, warn: () => { }, error: () => { }, debug: () => { } }
    }

    /**
     * Consolidates a session's memories into semantic facts.
     * Should be called via background job or after session end.
     */
    async summarizeSession(sessionId: string, userId: string): Promise<void> {
        this.logger.info(`[RalphLoop] Summarizing session: ${sessionId}`)

        // 1. Retrieve Raw Transcripts
        const context: AgentContext = { userId, sessionId }
        // [2026] Fix: Use wildcard '*' to bypass ILIKE filter and retrieve ALL episodic memories for the session
        const rawMemories = await this.memory.retrieve('*', context, 'EPISODIC', 50)

        if (rawMemories.length === 0) {
            this.logger.info('[RalphLoop] No episodic memories found to summarize.')
            return
        }

        // Prepare Transcript with Line Numbers for Anchoring
        const transcript = rawMemories
            .map((m, index) => `[Line ${index}] ${m.content}`)
            .join('\n')

        // 2. AI Extraction with Strict Schema
        // We ask Gemini to extract facts and CITE the Line Number.
        const systemPrompt = this.promptService.getMemorySummarizerSystemPrompt()
        // Schema definition for Gemini
        const factsSchema = {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    fact: { type: 'STRING' },
                    confidence: { type: 'NUMBER' },
                    lineReference: { type: 'NUMBER' }
                },
                required: ['fact', 'confidence', 'lineReference']
            }
        }

        try {
            // [2026] Strict JSON Generation
            const facts = await this.aiService.generateStructured<any[]>({
                systemPrompt,
                userMessage: transcript,
                schema: factsSchema
            })


            // 3. Store Anchored Facts
            for (const item of facts) {
                // [2026] TraceId Anchoring
                // Resolve traceId from the original memory record using the line reference
                const sourceMemory = rawMemories[item.lineReference]
                const traceId = sourceMemory?.metadata?.['traceId'] as string | undefined

                const fact: SemanticFact = {
                    fact: item.fact,
                    confidence: item.confidence || 0.8,
                    sourceAnchor: {
                        sessionId,
                        transcriptOffset: item.lineReference,
                        traceId
                    }
                }

                await this.memory.store(
                    fact.fact,
                    'SEMANTIC',
                    context,
                    { anchor: fact.sourceAnchor } // Storing provenance in metadata
                )
                this.logger.info(`[RalphLoop] Learned: "${fact.fact}" (from Line ${fact.sourceAnchor.transcriptOffset}, Trace ${traceId || 'N/A'})`)
            }

        } catch (error) {
            this.logger.error('[RalphLoop] Summarization failed', error)
        }
    }
}
