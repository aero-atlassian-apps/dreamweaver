/**
 * GeminiAIGateway (Backend) - Implementation of AIServicePort using Google Gemini
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { z } from 'zod'
import type { AIServicePort, GenerateStoryInput, GenerateStoryOutput, AgentThoughtInput, AgentThoughtOutput, LiveSessionOptions, LiveSessionPort } from '../../application/ports/AIServicePort.js'
import { CachePort } from '../../application/ports/CachePort.js'
import { GeminiLiveSession } from './GeminiLiveSession.js'

const storyResponseSchema = z.object({
    title: z.string(),
    content: z.string(),
    sleepScore: z.number().optional().default(0),
    metadata: z.object({
        theme: z.string().optional(),
        tone: z.string().optional()
    }).optional()
})

const agentThoughtZodSchema = z.object({
    goals_considered: z.array(z.string()),
    conflicts_identified: z.string().nullable(),
    trade_off_made: z.string().nullable(),
    thought: z.string(),
    action: z.string(),
    confidence: z.number(),
    parameters: z.record(z.unknown()).optional()
})

export function estimateFinOpsCost(usage: unknown): {
    tokensInput: number
    tokensOutput: number
    tokensTotal: number
    costEstimateUsd: number
} | null {
    if (!usage || typeof usage !== 'object') return null

    const usageRecord = usage as Record<string, unknown>
    const tokensInput = typeof usageRecord['promptTokenCount'] === 'number' ? usageRecord['promptTokenCount'] : 0
    const tokensOutput = typeof usageRecord['candidatesTokenCount'] === 'number' ? usageRecord['candidatesTokenCount'] : 0
    const tokensTotal = typeof usageRecord['totalTokenCount'] === 'number' ? usageRecord['totalTokenCount'] : tokensInput + tokensOutput
    const costEstimateUsd = (tokensInput * 0.000000075) + (tokensOutput * 0.0000003)

    return { tokensInput, tokensOutput, tokensTotal, costEstimateUsd }
}

export interface AIConfig {
    modelName?: string
    modelFlash?: string
    modelPro?: string
    enableThinkingLevel?: boolean
    thinkingLevelFlash?: string
    thinkingLevelPro?: string
    timeoutMs?: number
    /** Maximum tokens allowed per session (default: 50000) */
    tokenBudgetPerSession?: number
    /** Maximum cost in USD before circuit trips (default: 0.50) */
    costThresholdUsd?: number
    /** Number of consecutive failures before circuit opens (default: 5) */
    failureThreshold?: number
    /** Circuit reset time in ms (default: 60000 = 1 minute) */
    circuitResetMs?: number
}

/**
 * Circuit Breaker State
 */
interface CircuitBreakerState {
    isOpen: boolean
    failures: number
    lastFailureTime: number
    totalTokensUsed: number
    totalCostUsd: number
}

export class GeminiAIGateway implements AIServicePort {
    private client: GoogleGenerativeAI | null = null
    private apiKey: string | null
    private readonly modelName: string
    private readonly modelFlash: string
    private readonly modelPro: string
    private readonly enableThinkingLevel: boolean
    private readonly thinkingLevelFlash: string | null
    private readonly thinkingLevelPro: string | null
    private readonly timeoutMs: number

    // Circuit Breaker Configuration
    private readonly tokenBudgetPerSession: number
    private readonly costThresholdUsd: number
    private readonly failureThreshold: number
    private readonly circuitResetMs: number

    // Distributed State via CachePort
    private cache: CachePort
    private readonly CACHE_TTL_SEC = 60 * 30 // 30 minutes
    private readonly CB_KEY_prefix = 'cb:gemini:'

    constructor(cache: CachePort, apiKey?: string, config?: AIConfig) {
        this.cache = cache
        this.apiKey = apiKey || process.env['GEMINI_API_KEY'] || null
        this.modelName = config?.modelName || process.env['GEMINI_MODEL'] || 'gemini-3-flash-preview'
        this.modelFlash = config?.modelFlash || process.env['GEMINI_MODEL_FLASH'] || this.modelName
        this.modelPro = config?.modelPro || process.env['GEMINI_MODEL_PRO'] || this.modelName
        this.enableThinkingLevel = config?.enableThinkingLevel ?? (process.env['GEMINI_ENABLE_THINKING_LEVEL'] === 'true')
        this.thinkingLevelFlash = config?.thinkingLevelFlash || process.env['GEMINI_THINKING_LEVEL_FLASH'] || null
        this.thinkingLevelPro = config?.thinkingLevelPro || process.env['GEMINI_THINKING_LEVEL_PRO'] || null
        this.timeoutMs = config?.timeoutMs || 15000

        this.tokenBudgetPerSession = config?.tokenBudgetPerSession || 50000
        this.costThresholdUsd = config?.costThresholdUsd || 0.50
        this.failureThreshold = config?.failureThreshold || 5
        this.circuitResetMs = config?.circuitResetMs || 60000

        if (this.apiKey) {
            this.client = new GoogleGenerativeAI(this.apiKey)
        }
    }

    /**
     * Check if circuit breaker should prevent the call
     */
    async checkCircuitBreaker(): Promise<void> {
        // 1. Check if Open
        const isOpen = await this.cache.get(`${this.CB_KEY_prefix}open`)
        if (isOpen) {
            throw new Error('[CircuitBreaker] Circuit is OPEN - AI calls temporarily blocked due to failures or cost threshold')
        }

        // 2. Check Cost Threshold
        const totalCostUsage = await this.cache.get(`${this.CB_KEY_prefix}cost`)
        const totalCostUsd = totalCostUsage ? parseFloat(totalCostUsage) : 0
        if (totalCostUsd >= this.costThresholdUsd) {
            await this.openCircuit('cost_threshold')
            throw new Error(`[CircuitBreaker] Cost threshold exceeded: $${totalCostUsd.toFixed(4)} >= $${this.costThresholdUsd}`)
        }

        // 3. Check Token Budget
        const totalTokens = await this.cache.get(`${this.CB_KEY_prefix}tokens`)
        const tokensUsed = totalTokens ? parseInt(totalTokens) : 0
        if (tokensUsed >= this.tokenBudgetPerSession) {
            await this.openCircuit('token_budget')
            throw new Error(`[CircuitBreaker] Token budget exceeded: ${tokensUsed} >= ${this.tokenBudgetPerSession}`)
        }
    }

    private async openCircuit(reason: string): Promise<void> {
        console.error(`[CircuitBreaker] Opening circuit due to: ${reason}`)
        // Set Open flag with TTL (reset time)
        await this.cache.set(`${this.CB_KEY_prefix}open`, 'true', this.circuitResetMs / 1000)
    }

    /**
     * Record successful call metrics
     */
    private async recordSuccess(tokensUsed: number, costUsd: number): Promise<void> {
        // Reset failures on success
        await this.cache.delete(`${this.CB_KEY_prefix}failures`)

        // Increment usage stats
        await this.cache.increment(`${this.CB_KEY_prefix}tokens`) // Simplified, assumes increments by 1 usually, but here we ideally need atomic add. 
        // NOTE: CachePort.increment increments by 1. For adding arbitrary amounts, we need a better primitive or just GET/SET (racey but acceptable for budget).
        // For Proof of Concept, we will just GET/SET.

        const currentTokens = await this.cache.get(`${this.CB_KEY_prefix}tokens`)
        const newTokens = (currentTokens ? parseInt(currentTokens) : 0) + tokensUsed
        await this.cache.set(`${this.CB_KEY_prefix}tokens`, newTokens.toString(), 60 * 60 * 24) // 24h retention

        const currentCost = await this.cache.get(`${this.CB_KEY_prefix}cost`)
        const newCost = (currentCost ? parseFloat(currentCost) : 0) + costUsd
        await this.cache.set(`${this.CB_KEY_prefix}cost`, newCost.toFixed(6), 60 * 60 * 24)
    }

    private async recordFailure(): Promise<void> {
        const failures = await this.cache.increment(`${this.CB_KEY_prefix}failures`, this.circuitResetMs / 1000)

        if (failures >= this.failureThreshold) {
            await this.openCircuit('consecutive_failures')
        }
    }

    /**
     * Reset circuit breaker (for testing or manual intervention)
     */
    async resetCircuitBreaker(): Promise<void> {
        await this.cache.delete(`${this.CB_KEY_prefix}open`)
        await this.cache.delete(`${this.CB_KEY_prefix}failures`)
        await this.cache.delete(`${this.CB_KEY_prefix}tokens`)
        await this.cache.delete(`${this.CB_KEY_prefix}cost`)
        console.log('[CircuitBreaker] Manually reset')
    }

    async getCircuitStatus(): Promise<{ isOpen: boolean; failures: number; totalCostUsd: number; totalTokensUsed: number }> {
        const isOpen = await this.cache.get(`${this.CB_KEY_prefix}open`)
        const failures = await this.cache.get(`${this.CB_KEY_prefix}failures`)
        const cost = await this.cache.get(`${this.CB_KEY_prefix}cost`)
        const tokens = await this.cache.get(`${this.CB_KEY_prefix}tokens`)

        return {
            isOpen: isOpen === 'true',
            failures: failures ? parseInt(failures) : 0,
            totalCostUsd: cost ? parseFloat(cost) : 0,
            totalTokensUsed: tokens ? parseInt(tokens) : 0
        }
    }

    /**
     * Simple hash function for cache keys
     */
    private hashPrompt(prompt: string): string {
        let hash = 0
        for (let i = 0; i < prompt.length; i++) {
            const char = prompt.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32bit integer
        }
        return `story_${hash}`
    }

    async generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
        if (!this.client) {
            throw new Error('Gemini API Key not configured')
        }

        const storyGenerationConfig: any = {
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    content: { type: SchemaType.STRING },
                    sleepScore: { type: SchemaType.NUMBER },
                    metadata: {
                        type: SchemaType.OBJECT,
                        properties: {
                            theme: { type: SchemaType.STRING },
                            tone: { type: SchemaType.STRING }
                        }
                    }
                },
                required: ['title', 'content', 'sleepScore']
            }
        }
        if (this.enableThinkingLevel && this.thinkingLevelFlash) {
            storyGenerationConfig.thinking_level = this.thinkingLevelFlash
        }

        const model = this.client.getGenerativeModel({
            model: this.modelFlash,
            generationConfig: storyGenerationConfig
        })

        // Enforce prompt-as-code
        if (!input.customPrompt) {
            throw new Error('GeminiAIGateway requires customPrompt (Prompt-as-Code violation)')
        }

        const cacheKey = this.hashPrompt(input.customPrompt)

        // Use CachePort
        const cachedJson = await this.cache.get(cacheKey)
        if (cachedJson) {
            const cached = JSON.parse(cachedJson)
            console.log('[FinOps] Cache HIT for story generation', { cacheKey, traceId: input.traceId })
            return cached
        }

        await this.checkCircuitBreaker()

        // [AO] Latency Hardening: Race against timeout
        const timeoutMs = this.timeoutMs
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

        try {
            const result = await Promise.race([
                model.generateContent(input.customPrompt),
                new Promise<never>((_, reject) => {
                    controller.signal.addEventListener('abort', () => reject(new Error('AI Service Timeout')))
                })
            ])
            clearTimeout(timeoutId)

            const response = result.response.text()

            const finOps = this.logFinOps(result.response.usageMetadata, this.modelFlash, input.theme, input.traceId)
            if (finOps) {
                await this.recordSuccess(finOps.tokensTotal, finOps.costEstimateUsd)
            }

            try {
                const rawData = JSON.parse(response)
                const data = storyResponseSchema.parse(rawData)

                const storyResult: GenerateStoryOutput = {
                    title: data.title,
                    content: data.content,
                    metadata: {
                        theme: input.theme,
                        readingLevel: input.childAge ? `Age ${input.childAge}` : 'General',
                        tone: input.style || 'bedtime',
                        ...data.metadata
                    }
                }

                await this.cacheStoryResponse(cacheKey, storyResult)
                return storyResult
            } catch (e) {
                throw new Error(`Failed to validate Gemini response: ${e}`)
            }
        } catch (error) {
            await this.recordFailure()
            if (error instanceof Error && error.message === 'AI Service Timeout') {
                throw error
            }
            throw error
        }
    }

    /**
     * Store response in cache with TTL
     */
    private async cacheStoryResponse(cacheKey: string, response: GenerateStoryOutput): Promise<void> {
        await this.cache.set(cacheKey, JSON.stringify(response), this.CACHE_TTL_SEC)
        console.log('[FinOps] Cache STORE for story generation', { cacheKey })
    }

    async * generateStoryStream(input: GenerateStoryInput): AsyncGenerator<string, void, unknown> {
        if (!this.client) {
            throw new Error('Gemini API Key not configured')
        }

        await this.checkCircuitBreaker()

        // Use Text mode for streaming to avoid JSON parsing issues
        const model = this.client.getGenerativeModel({
            model: this.modelFlash
        })

        if (!input.customPrompt) {
            throw new Error('GeminiAIGateway: Streaming requires customPrompt')
        }
        const startTime = Date.now()

        try {
            const result = await model.generateContentStream(input.customPrompt)

            for await (const chunk of result.stream) {
                if (Date.now() - startTime > this.timeoutMs) {
                    throw new Error('AI Service Timeout')
                }
                const chunkText = chunk.text()
                yield chunkText
            }

            const response = await result.response
            const finOps = this.logFinOps(response.usageMetadata, `${this.modelFlash}-stream`, input.theme, input.traceId)
            if (finOps) {
                await this.recordSuccess(finOps.tokensTotal, finOps.costEstimateUsd)
            }
        } catch (error) {
            await this.recordFailure()
            throw error
        }
    }

    async generateAgentThought(input: AgentThoughtInput): Promise<AgentThoughtOutput> {
        if (!this.client) {
            throw new Error('Gemini API Key not configured')
        }

        await this.checkCircuitBreaker()

        const thoughtGenerationConfig: any = {
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    goals_considered: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    conflicts_identified: { type: SchemaType.STRING, nullable: true },
                    trade_off_made: { type: SchemaType.STRING, nullable: true },
                    thought: { type: SchemaType.STRING },
                    action: { type: SchemaType.STRING },
                    confidence: { type: SchemaType.NUMBER },
                    parameters: { type: SchemaType.OBJECT, properties: {} }
                },
                required: ['goals_considered', 'thought', 'action', 'confidence']
            }
        }
        if (this.enableThinkingLevel && this.thinkingLevelPro) {
            thoughtGenerationConfig.thinking_level = this.thinkingLevelPro
        }

        const model = this.client.getGenerativeModel({
            model: this.modelPro,
            systemInstruction: input.systemPrompt,
            generationConfig: thoughtGenerationConfig
        })

        const timeoutMs = this.timeoutMs
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

        try {
            let result
            if (input.messageHistory && input.messageHistory.length > 0) {
                const chat = model.startChat({
                    history: input.messageHistory.map(m => ({
                        role: m.role,
                        parts: [{ text: m.content }]
                    }))
                })
                result = await Promise.race([
                    chat.sendMessage(input.userMessage || ''),
                    new Promise<never>((_, reject) => {
                        controller.signal.addEventListener('abort', () => reject(new Error('AI Service Timeout')))
                    })
                ])
            } else {
                result = await Promise.race([
                    model.generateContent(input.userMessage || 'Evaluate current state.'),
                    new Promise<never>((_, reject) => {
                        controller.signal.addEventListener('abort', () => reject(new Error('AI Service Timeout')))
                    })
                ])
            }

            const response = result.response.text()
            const finOps = this.logFinOps(result.response.usageMetadata, `${this.modelPro}-thought`, 'AgentThought', input.traceId)
            if (finOps) {
                await this.recordSuccess(finOps.tokensTotal, finOps.costEstimateUsd)
            }

            const rawData = JSON.parse(response)
            const validated = agentThoughtZodSchema.parse(rawData)
            return {
                goals_considered: validated.goals_considered,
                conflicts_identified: validated.conflicts_identified,
                trade_off_made: validated.trade_off_made,
                thought: validated.thought,
                reasoning: validated.thought,
                action: validated.action,
                confidence: validated.confidence,
                parameters: validated.parameters
            }
        } catch (error) {
            await this.recordFailure()
            throw error instanceof Error ? error : new Error(String(error))
        } finally {
            clearTimeout(timeoutId)
        }
    }

    async startLiveSession(options?: LiveSessionOptions): Promise<LiveSessionPort> {
        // [LAZY-LOAD] Check env var at runtime if not configured at startup
        const effectiveKey = this.apiKey || process.env['GEMINI_API_KEY']

        if (!effectiveKey) {
            throw new Error('Gemini API Key not configured (checked constructor and process.env)')
        } else if (!this.apiKey) {
            // If we found it now but didn't have it before, update state (optional but good for consistency)
            this.apiKey = effectiveKey
        }

        return new GeminiLiveSession(effectiveKey, options)
    }



    async generateStructured<T = unknown>(input: { systemPrompt?: string, userMessage: string, schema: unknown, traceId?: string }): Promise<T> {
        if (!this.client) {
            throw new Error('Gemini API Key not configured')
        }

        await this.checkCircuitBreaker()

        const structuredGenerationConfig: any = {
            responseMimeType: 'application/json',
            responseSchema: input.schema as any
        }
        if (this.enableThinkingLevel && this.thinkingLevelPro) {
            structuredGenerationConfig.thinking_level = this.thinkingLevelPro
        }

        const model = this.client.getGenerativeModel({
            model: this.modelPro,
            systemInstruction: input.systemPrompt,
            generationConfig: structuredGenerationConfig
        })

        const timeoutMs = this.timeoutMs
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

        try {
            const result = await Promise.race([
                model.generateContent(input.userMessage),
                new Promise<never>((_, reject) => {
                    controller.signal.addEventListener('abort', () => reject(new Error('AI Service Timeout')))
                })
            ])
            const responseText = result.response.text()

            const finOps = this.logFinOps(result.response.usageMetadata, `${this.modelPro}-structured`, 'StructuredGen', input.traceId)
            if (finOps) {
                await this.recordSuccess(finOps.tokensTotal, finOps.costEstimateUsd)
            }

            return JSON.parse(responseText) as T
        } catch (error) {
            await this.recordFailure()
            throw error instanceof Error ? error : new Error(String(error))
        } finally {
            clearTimeout(timeoutId)
        }
    }

    private logFinOps(usage: unknown, modelName: string, context?: string, traceId?: string): { tokensTotal: number; costEstimateUsd: number } | null {
        const estimate = estimateFinOpsCost(usage)
        if (!estimate) return null

        console.log('[FinOps] AI Call Complete', {
            model: modelName,
            traceId,
            tokens_input: estimate.tokensInput,
            tokens_output: estimate.tokensOutput,
            tokens_total: estimate.tokensTotal,
            cost_estimate_usd: estimate.costEstimateUsd.toFixed(6),
            context: context
        })

        return { tokensTotal: estimate.tokensTotal, costEstimateUsd: estimate.costEstimateUsd }
    }
}
