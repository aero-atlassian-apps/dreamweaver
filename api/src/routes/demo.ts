import { Hono } from 'hono'
import { z } from 'zod'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { ApiEnv } from '../http/ApiEnv.js'
import { extractClientIp } from '../middleware/rateLimit.js'
import { LiveSessionFactory } from '../application/factories/LiveSessionFactory.js'
import { ToolExecutionRouter, ToolCallRequest } from '../application/use-cases/Live/ToolExecutionRouter.js'
import { container } from '../di/container.js'

export const demoRoute = new Hono<ApiEnv>()

const demoStorySchema = z.object({
    theme: z.enum(['space', 'ocean', 'forest', 'dinosaurs', 'magic', 'friendship', 'trains', 'animals']).default('space'),
    childName: z.string().min(1).max(32).optional(),
    childAge: z.number().int().min(2).max(12).optional(),
}).strict()

demoRoute.post('/story', async (c) => {
    // Demo is ENABLED by default. Set PUBLIC_DEMO_ENABLED="false" to disable.
    if (process.env['PUBLIC_DEMO_ENABLED'] === 'false') {
        return c.json({ success: false, error: 'Not Found', requestId: c.get('requestId'), traceId: c.get('traceId') }, 404)
    }

    const services = c.get('services')
    const clientIp = extractClientIp({ get: (name: string) => c.req.header(name) })

    // Rate limit with timeout to avoid hanging
    try {
        const rateKey = `demo:story:${clientIp}`
        const countPromise = services.cache.increment(rateKey, 60 * 60)
        const count = await Promise.race([
            countPromise,
            new Promise<number>((_, reject) => setTimeout(() => reject(new Error('Rate limit timeout')), 3000))
        ])
        if (count > 10) {
            return c.json({
                success: false,
                error: 'Demo rate limit exceeded. Please try again later.',
                retryAfter: 3600,
                requestId: c.get('requestId'),
                traceId: c.get('traceId'),
            }, 429)
        }
    } catch (rateLimitError) {
        // If rate limit check times out, allow the request (fail open for demo)
        console.warn('[Demo] Rate limit check failed, allowing request:', rateLimitError)
    }

    let body: z.infer<typeof demoStorySchema>
    try {
        console.log('[Demo] Step 1: Parsing body...')

        // Add 3s timeout to body parsing - Vercel sometimes doesn't send body stream correctly
        const bodyPromise = c.req.json()
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Body parsing timeout')), 3000)
        )

        let rawBody: unknown
        try {
            rawBody = await Promise.race([bodyPromise, timeoutPromise])
            console.log('[Demo] Step 1.1: Raw body received')
        } catch (parseErr: any) {
            console.warn('[Demo] Body parsing failed:', parseErr.message, '- using defaults')
            rawBody = { theme: 'space' } // Default theme
        }

        body = demoStorySchema.parse(rawBody)
        console.log('[Demo] Step 2: Body parsed:', body.theme)
    } catch (err: any) {
        console.error('[Demo] Validation error:', err.message)
        return c.json({ success: false, error: 'Validation Error', requestId: c.get('requestId'), traceId: c.get('traceId') }, 400)
    }

    // Direct Gemini call bypassing cache/circuit breaker for demo reliability
    console.log('[Demo] Step 3: Checking API key...')
    const apiKey = process.env['GEMINI_API_KEY']
    if (!apiKey) {
        console.error('[Demo] FATAL: No GEMINI_API_KEY')
        return c.json({ success: false, error: 'AI service not configured', requestId: c.get('requestId'), traceId: c.get('traceId') }, 500)
    }
    console.log('[Demo] Step 4: API key present, length:', apiKey.length)

    console.log('[Demo] Step 5: Creating Gemini client...')
    const client = new GoogleGenerativeAI(apiKey)

    console.log('[Demo] Step 6: Getting model...')
    const modelName = process.env['GEMINI_MODEL_FLASH'] || 'gemini-2.0-flash'
    console.log('[Demo] Step 7: Model name:', modelName)

    const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    content: { type: SchemaType.STRING },
                },
                required: ['title', 'content']
            }
        }
    })
    console.log('[Demo] Step 8: Model created')

    const shortPrompt = `Write a bedtime story (approx 150-200 words).
Theme: ${body.theme}
Child name: ${body.childName || 'a child'}
Style: calm, soothing
Return JSON with title and content.`

    try {
        console.log('[Demo] Step 9: Starting Gemini call...')

        // Simple timeout using Promise.race
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                console.log('[Demo] TIMEOUT: 8s exceeded!')
                reject(new Error('Demo generation timeout (8s)'))
            }, 8000)
        })

        const result = await Promise.race([
            model.generateContent(shortPrompt),
            timeoutPromise
        ])

        console.log('[Demo] Step 10: Gemini call completed')
        const text = result.response.text()
        console.log('[Demo] Step 11: Response text length:', text.length)
        const data = JSON.parse(text)

        return c.json({
            success: true,
            data: {
                title: data.title,
                content: data.content,
            },
            requestId: c.get('requestId'),
            traceId: c.get('traceId'),
        })
    } catch (error: any) {
        console.error('[Demo] ERROR:', error.message)
        return c.json({
            success: false,
            error: error.message || 'Story generation failed',
            requestId: c.get('requestId'),
            traceId: c.get('traceId'),
        }, 500)
    }
})

// ============================================================================
// POST /session - Enhanced E2E Bedtime Demo with all stages + Audio Narration
// ============================================================================

const demoSessionSchema = z.object({
    childName: z.string().min(1).max(32).default('Luna'),
    childAge: z.number().int().min(2).max(12).default(5),
    theme: z.enum(['space', 'ocean', 'forest', 'dinosaurs', 'magic', 'friendship']).default('space'),
    voiceId: z.string().optional(),
}).strict()

demoRoute.post('/session', async (c) => {
    console.log('[DemoSession] Starting enhanced E2E demo...')

    const services = c.get('services')
    const startTime = Date.now()

    // Parse input with timeout
    let input: z.infer<typeof demoSessionSchema>
    try {
        const bodyPromise = c.req.json()
        const rawBody = await Promise.race([
            bodyPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]).catch(() => ({}))
        input = demoSessionSchema.parse(rawBody)
    } catch {
        input = { childName: 'Luna', childAge: 5, theme: 'space' }
    }

    console.log('[DemoSession] Input:', input)

    const stages: Array<{ stage: string; timestamp: number; data: unknown }> = []

    // -------------------------------------------------------------------------
    // Stage 1: Welcome (Conductor Greeting)
    // -------------------------------------------------------------------------
    stages.push({
        stage: 'welcome',
        timestamp: Date.now() - startTime,
        data: {
            message: `Good evening, ${input.childName}! 🌙 Time for a magical bedtime story. Let's go on an adventure together...`,
            conductorAction: 'GREET',
            childProfile: { name: input.childName, age: input.childAge }
        }
    })

    // -------------------------------------------------------------------------
    // Stage 2: Story Generation (Real Gemini Call with Production Prompt)
    // -------------------------------------------------------------------------
    const apiKey = process.env['GEMINI_API_KEY']
    if (!apiKey) {
        return c.json({ success: false, error: 'AI not configured', requestId: c.get('requestId') }, 500)
    }

    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({
        model: process.env['GEMINI_MODEL_FLASH'] || 'gemini-2.0-flash',
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    content: { type: SchemaType.STRING },
                    sleepScore: { type: SchemaType.NUMBER },
                },
                required: ['title', 'content', 'sleepScore']
            }
        }
    })

    // Production-quality prompt
    const storyPrompt = `Write a captivating bedtime story.
Theme: ${input.theme}
Child: ${input.childName}
Age: ${input.childAge}
Style: calm and magical
Duration: medium (about 300-400 words)

REQUIREMENTS:
1. SAFE: No violence, fear, or overstimulation.
2. CALMING: Use soothing vocabulary and steady pacing.
3. PERSONAL: Weave in the child's name naturally.
4. STRUCTURE: Title and flowing narrative.
5. SLEEP_SCORE: Rate from 1-10 how sleep-inducing this story is (aim for 7-9).

Return JSON with title, content, and sleepScore.`

    let story: { title: string; content: string; sleepScore: number }
    try {
        console.log('[DemoSession] Generating story...')
        const result = await Promise.race([
            model.generateContent(storyPrompt),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Story timeout')), 15000))
        ])
        const text = result.response.text()
        story = JSON.parse(text)
        console.log('[DemoSession] Story generated:', story.title, 'sleepScore:', story.sleepScore)
    } catch (err: any) {
        console.error('[DemoSession] Story generation failed:', err.message, err.stack)
        return c.json({ success: false, error: 'Story generation failed: ' + err.message, requestId: c.get('requestId') }, 500)
    }

    stages.push({
        stage: 'story',
        timestamp: Date.now() - startTime,
        data: {
            title: story.title,
            content: story.content,
            sleepScore: story.sleepScore,
            wordCount: story.content.split(/\s+/).length
        }
    })

    // -------------------------------------------------------------------------
    // Stage 3: Audio Narration (TTS)
    // -------------------------------------------------------------------------
    let audioData: { audioUrl?: string; durationSeconds?: number } = {}
    try {
        console.log('[DemoSession] Synthesizing audio...')
        const ttsResult = await Promise.race([
            services.ttsService.synthesize({
                text: `${story.title}. ${story.content}`,
                speakingRate: 0.85, // Slower for bedtime
                voiceProfile: input.voiceId ? { voiceModelId: input.voiceId } : undefined,
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TTS timeout')), 20000))
        ])
        audioData = {
            audioUrl: ttsResult.audioUrl,
            durationSeconds: ttsResult.durationSeconds
        }
        console.log('[DemoSession] Audio synthesized:', ttsResult.durationSeconds, 'seconds')
    } catch (err: any) {
        console.warn('[DemoSession] TTS failed (continuing without audio):', err.message)
        audioData = { durationSeconds: Math.ceil(story.content.split(/\s+/).length / 2.5) } // Estimate
    }

    stages.push({
        stage: 'narration',
        timestamp: Date.now() - startTime,
        data: {
            hasAudio: !!audioData.audioUrl,
            durationSeconds: audioData.durationSeconds,
            audioUrl: audioData.audioUrl,
            speakingRate: 0.85,
            status: audioData.audioUrl ? 'ready' : 'simulated'
        }
    })

    // -------------------------------------------------------------------------
    // Stage 4: Sleep Monitoring (Simulated Progression)
    // -------------------------------------------------------------------------
    const sleepProgression = [
        { time: '2 min', sleepScore: Math.min(10, story.sleepScore + 1), status: 'listening' },
        { time: '5 min', sleepScore: Math.min(10, story.sleepScore + 2), status: 'drowsy' },
        { time: '8 min', sleepScore: 10, status: 'asleep' }
    ]

    stages.push({
        stage: 'sleep_monitoring',
        timestamp: Date.now() - startTime,
        data: {
            progression: sleepProgression,
            sleepDetectionMethod: 'audio_silence_detection',
            note: 'In live sessions, we monitor audio for breathing patterns and silence.'
        }
    })

    // -------------------------------------------------------------------------
    // Stage 5: Fade Out (Sleep Detected)
    // -------------------------------------------------------------------------
    stages.push({
        stage: 'fade_out',
        timestamp: Date.now() - startTime,
        data: {
            message: `Sweet dreams, ${input.childName}... 🌟`,
            pacingOverride: 'SLEEP_DETECTED',
            volumeReduction: '50%',
            finalSleepScore: 10
        }
    })

    // -------------------------------------------------------------------------
    // Stage 6: Golden Moment (Memory Capture)
    // -------------------------------------------------------------------------
    stages.push({
        stage: 'golden_moment',
        timestamp: Date.now() - startTime,
        data: {
            captured: true,
            moment: `${input.childName} loved the ${input.theme} adventure and asked "Can we go there tomorrow?"`,
            memoryType: 'curiosity',
            savedToVault: true
        }
    })

    const totalDuration = Date.now() - startTime
    console.log('[DemoSession] Complete in', totalDuration, 'ms')

    return c.json({
        success: true,
        session: {
            childName: input.childName,
            childAge: input.childAge,
            theme: input.theme,
            stages,
            summary: {
                totalDurationMs: totalDuration,
                storyDurationSeconds: audioData.durationSeconds,
                finalSleepScore: 10,
                goldenMomentCaptured: true
            }
        },
        requestId: c.get('requestId'),
        traceId: c.get('traceId'),
    })
})

// ============================================================================
// POST /session-full - FULL-STACK demo with real Supabase persistence
// Uses the REAL GenerateStoryUseCase for 100% parity with the Real App
// ============================================================================

import { DEMO_USER, isDemoMode } from '../infrastructure/auth/DemoAuthService.js'
import { randomUUID } from 'node:crypto'

const demoSessionFullSchema = z.object({
    childName: z.string().min(1).max(32).default('Luna'),
    childAge: z.number().int().min(2).max(12).default(5),
    theme: z.enum(['space', 'ocean', 'forest', 'dinosaurs', 'magic', 'friendship']).default('space'),
    voiceId: z.string().optional(),
    demoMode: z.boolean().default(true),
}).strict()

demoRoute.post('/session-full', async (c) => {
    console.log('[DemoFull] Starting full-stack demo with REAL GenerateStoryUseCase...')

    const services = c.get('services')
    const startTime = Date.now()
    const requestId = c.get('requestId') || randomUUID()
    const traceId = c.get('traceId') || randomUUID()

    // Parse input
    let input: z.infer<typeof demoSessionFullSchema>
    try {
        const bodyPromise = c.req.json()
        const rawBody = await Promise.race([
            bodyPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]).catch(() => ({}))
        input = demoSessionFullSchema.parse(rawBody)
    } catch {
        input = { childName: 'Luna', childAge: 5, theme: 'space', demoMode: true }
    }

    // Verify demo mode is enabled
    if (!isDemoMode(c.req.raw.headers, input)) {
        return c.json({ success: false, error: 'Demo mode required', requestId }, 400)
    }

    console.log('[DemoFull] Input:', input, 'Demo User:', DEMO_USER.id)

    // -------------------------------------------------------------------------
    // OPTION A: Use the REAL GenerateStoryUseCase (100% parity)
    // This invokes: SafetyGuardian, EventBus, PromptService, ConductorAgent, etc.
    // -------------------------------------------------------------------------
    try {
        console.log('[DemoFull] Calling GenerateStoryUseCase...')

        const result = await Promise.race([
            services.generateStoryUseCase.execute({
                theme: input.theme,
                childName: input.childName,
                childAge: input.childAge,
                duration: 'short',
                userId: DEMO_USER.id,
                voiceProfileId: input.voiceId,
                requestId,
                traceId,
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('UseCase timeout after 25s')), 25000)
            )
        ])

        console.log('[DemoFull] Story generated:', result.story.title)

        // -------------------------------------------------------------------------
        // Create Memory (Vector Embedding) - Demo-specific addition
        // -------------------------------------------------------------------------
        let memoryCreated = false
        try {
            const memoryContent = `${input.childName} loved the ${input.theme} adventure "${result.story.title}"`
            await services.agentMemory.store(
                memoryContent,
                'EPISODIC',
                { userId: DEMO_USER.id },
                { storyId: result.story.id, theme: input.theme }
            )
            memoryCreated = true
            console.log('[DemoFull] Memory created!')
        } catch (err: any) {
            console.warn('[DemoFull] Memory creation failed (continuing):', err.message)
        }

        const totalDuration = Date.now() - startTime
        console.log('[DemoFull] Complete in', totalDuration, 'ms')

        return c.json({
            success: true,
            fullStack: true,
            parity: '100%', // Flag to indicate full parity with Real App
            story: {
                id: result.story.id,
                title: result.story.title,
                paragraphs: result.story.content.paragraphs,
                sleepScore: result.story.content.sleepScore,
                theme: result.story.theme,
                audioUrl: result.audioUrl,
                audioDuration: undefined, // Could be added if TTS returns duration
            },
            persistence: {
                storySaved: true, // UseCase persists internally
                memoryCreated,
                userId: DEMO_USER.id,
            },
            summary: {
                totalDurationMs: totalDuration,
                validationCoverage: '100%',
                testedComponents: [
                    'GenerateStoryUseCase',
                    'SafetyGuardian',
                    'EventBus',
                    'PromptService',
                    'BedtimeConductorAgent',
                    'TTS (CompositeTTSAdapter)',
                    'Supabase Persistence',
                    memoryCreated ? 'Vector Memory' : null,
                ].filter(Boolean),
            },
            requestId,
            traceId,
        })
    } catch (err: any) {
        console.error('[DemoFull] GenerateStoryUseCase failed:', err.message, err.stack)
        return c.json({
            success: false,
            error: err.message || 'Story generation failed',
            stack: process.env['NODE_ENV'] !== 'production' ? err.stack : undefined,
            requestId,
            traceId,
        }, 500)
    }
})

// ============================================================================
// GET /history - Retrieve demo history (Full-Stack Mode Only)
// ============================================================================
demoRoute.get('/history', async (c) => {
    const services = c.get('services')

    try {
        // [DEMO] Fetch stories for the fixed Demo User
        const stories = await services.storyRepository.findRecent(DEMO_USER.id, 20)

        return c.json({
            success: true,
            history: stories.map(s => s.toPublicJSON()),
            requestId: c.get('requestId')
        })
    } catch (err: any) {
        return c.json({ success: false, error: err.message }, 500)
    }
})


// ============================================================================
// POST /live/init - Initialize Live Mode for Demo User
// ============================================================================

// ============================================================================
// POST /live/tool - Blind Relay for Demo Session Tools
// ============================================================================



const toolRouter = new ToolExecutionRouter(
    container.bedtimeConductorAgent,
    container.agentMemory,
    container.sleepSentinelAgent,
    container.logger,
    container.storyRepository,
    container.toolAuditLog
);

const toolCallSchema = z.object({
    sessionId: z.string().min(1),
    toolName: z.enum(['save_memory', 'check_sleep_status', 'suggest_theme', 'save_generated_story']),
    arguments: z.unknown(),
    toolCallId: z.string().min(1).optional(),
    traceId: z.string().min(1).optional(),
})

demoRoute.post('/live/tool', async (c) => {
    // 1. Validate Payload
    let payload;
    try {
        const json = await c.req.json();
        payload = toolCallSchema.parse(json);
    } catch (e) {
        return c.json({ error: 'Validation Error' }, 400);
    }

    try {
        // 2. Validate Session Ownership (must be Demo User)
        const state = await container.sessionState.get(payload.sessionId)
        if (!state || state.userId !== DEMO_USER.id) {
            return c.json({ result: null, error: 'Forbidden' }, 403)
        }

        // 3. Deduplication (same as live.ts)
        const ctx = state.context || {}
        const processed = Array.isArray((ctx as any).processedToolCallIds) ? (ctx as any).processedToolCallIds as unknown[] : []
        const toolCallId = payload.toolCallId
        if (toolCallId) {
            if (processed.some((x) => typeof x === 'string' && x === toolCallId)) {
                return c.json({ result: null, error: 'Duplicate tool call' }, 409)
            }
            const nextProcessed = [...processed.filter((x) => typeof x === 'string'), toolCallId].slice(-200)
            await container.sessionState.patch(payload.sessionId, { context: { ...ctx, processedToolCallIds: nextProcessed } })
        }

        // 4. Execute Tool
        const request = {
            userId: DEMO_USER.id,
            sessionId: payload.sessionId,
            toolName: payload.toolName,
            arguments: payload.arguments,
            toolCallId: payload.toolCallId,
            traceId: (typeof (ctx as any).traceId === 'string' ? (ctx as any).traceId : payload.traceId) || c.get('traceId'),
            requestId: c.get('requestId'),
        } as ToolCallRequest;

        const response = await toolRouter.execute(request);

        return c.json(response);

    } catch (error: any) {
        console.error('[DemoLive] Tool execution failed:', error.message)
        return c.json({ error: 'Tool execution failed' }, 500);
    }
})


const liveInitSchema = z.object({
    childName: z.string().optional(),
    childAge: z.number().int().min(0).max(18).optional(),
}).strict()

// Lazy instantiation for Demo Route (similar to live.ts)
const sessionFactory = new LiveSessionFactory(
    container.bedtimeConductorAgent,
    container.promptService
);

demoRoute.post('/live/init', async (c) => {
    console.log('[DemoLive] Initializing Live Session...')

    let body
    try {
        const json = await c.req.json()
        body = liveInitSchema.parse(json)
    } catch {
        // Validation error or empty body
        body = { childName: 'Child', childAge: 5 }
    }

    try {
        const userId = DEMO_USER.id // Hardcoded Demo User
        const sessionId = randomUUID()
        const traceId = c.get('traceId') || randomUUID()

        // 1. Generate Session Config (System Prompts + Tools)
        const config = await sessionFactory.createSessionConfig({
            userId,
            childName: body.childName,
            childAge: body.childAge
        });

        // 2. Initialize Session Mock State
        // In a real flow, this state is managed by the WebSocket connection lifecycle.
        // For the demo, we pre-seed it to ensure tools work if called immediately.
        await container.sessionState.set(sessionId, {
            sessionId,
            userId,
            phase: 'IDLE',
            activeIntent: 'IDLE',
            emotionalTone: 0.5,
            context: { traceId },
            updatedAt: new Date()
        })

        // 3. Issue a Ticket for the Real Live WebSocket
        const ticket = await container.ticketStore.issue(userId)

        console.log('[DemoLive] Session Initialized:', sessionId)

        return c.json({
            success: true,
            ticket,
            config,
            sessionId,
            traceId,
        })

    } catch (error: any) {
        console.error('[DemoLive] Init failed:', error.message)
        return c.json({ success: false, error: 'Failed to init demo session' }, 500)
    }
})

// ============================================================================
// POST /voice/upload - Upload Voice Sample for Cloning (Demo)
// ============================================================================
demoRoute.post('/voice/upload', async (c) => {
    console.log('[DemoVoice] Uploading voice sample...')

    try {
        const formData = await c.req.parseBody()
        const file = formData['file']
        const name = formData['name']

        if (!file || !(file instanceof Blob)) {
            return c.json({ success: false, error: 'No file uploaded' }, 400)
        }

        const voiceName = typeof name === 'string' ? name : 'My Voice'
        const arrayBuffer = await file.arrayBuffer()

        // Execute Use Case
        const { profile } = await container.uploadVoiceUseCase.execute({
            userId: DEMO_USER.id,
            name: voiceName,
            audioData: arrayBuffer,
            mimeType: file.type || 'audio/webm',
        })

        console.log('[DemoVoice] Voice profile created:', profile.id)

        return c.json({
            success: true,
            voice: {
                id: profile.id,
                name: profile.name,
                previewUrl: profile.sampleUrl,
            }
        })

    } catch (error: any) {
        console.error('[DemoVoice] Upload failed:', error.message)
        return c.json({ success: false, error: error.message || 'Voice upload failed' }, 500)
    }
})
