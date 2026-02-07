import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'

export const docsRoute = new Hono()

// OpenAPI Specification Object
const openApiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'DreamWeaver API',
        version: '1.0.0',
        description: 'AI-powered Bedtime Story Service. Generates specific, personalized stories with voice narration, enables live interaction, and family sharing.',
        contact: {
            name: 'DreamWeaver Support',
            email: 'support@dreamweaver.app'
        }
    },
    servers: [
        { url: 'http://localhost:3001', description: 'Local Development' },
        { url: 'https://api.dreamweaver.app', description: 'Production' }
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Supabase Access Token'
            }
        },
        schemas: {
            // Shared
            Error: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string' }
                }
            },
            // Auth / User
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            UserPreferences: {
                type: 'object',
                properties: {
                    mic_enabled: { type: 'boolean' },
                    reminders_enabled: { type: 'boolean' },
                    weekly_digest_enabled: { type: 'boolean' }
                }
            },
            // Stories
            Story: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    theme: { type: 'string' },
                    content: {
                        type: 'object',
                        properties: {
                            paragraphs: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    status: { type: 'string', enum: ['PENDING', 'GENERATING', 'READY', 'FAILED'] },
                    estimatedReadingTime: { type: 'integer', description: 'In minutes' },
                    audioUrl: { type: 'string', format: 'uri', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    generatedAt: { type: 'string', format: 'date-time', nullable: true },
                    newlyUnlockedCompanions: { type: 'array', items: { type: 'object' } }
                }
            },
            GenerateStoryRequest: {
                type: 'object',
                required: ['theme'],
                properties: {
                    theme: { type: 'string', example: 'Dragons in space' },
                    childName: { type: 'string', example: 'Leo' },
                    childAge: { type: 'integer', example: 5 },
                    duration: { type: 'string', enum: ['short', 'medium', 'long'], default: 'medium' },
                    previousStoryId: { type: 'string', format: 'uuid' },
                    requestId: { type: 'string' },
                    voiceProfileId: { type: 'string', format: 'uuid', description: 'ID of the voice profile to use for narration' }
                }
            },
            // Voice
            VoiceProfile: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    sampleUrl: { type: 'string', format: 'uri' },
                    status: { type: 'string', enum: ['pending', 'processing', 'ready', 'failed'] },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            // Live
            LiveSessionConfig: {
                type: 'object',
                properties: {
                    ticket: { type: 'string' },
                    sessionId: { type: 'string', format: 'uuid' },
                    traceId: { type: 'string', format: 'uuid' },
                    config: { type: 'object' }
                }
            }
        }
    },
    security: [{ BearerAuth: [] }],
    tags: [
        { name: 'Stories', description: 'Story generation and management' },
        { name: 'Voice', description: 'Voice cloning and profile management' },
        { name: 'Live', description: 'Real-time interactive sessions' },
        { name: 'User', description: 'User profile and preferences' },
        { name: 'Social', description: 'Sharing and Family features' },
        { name: 'System', description: 'Health checks and metadata' }
    ],
    paths: {
        // System
        '/api/v1/health': {
            get: {
                tags: ['System'],
                summary: 'System Health Check',
                security: [],
                responses: {
                    '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' }, version: { type: 'string' } } } } } }
                }
            }
        },
        '/api/v1/cron/weekly-digest': {
            get: {
                tags: ['System'],
                summary: 'Trigger Weekly Digest',
                description: 'Internal endpoint for CRON jobs. Requires CRON_SECRET.',
                security: [{ BearerAuth: [] }],
                responses: {
                    '200': { description: 'Digest processing started', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, processedCount: { type: 'integer' } } } } } },
                    '401': { description: 'Unauthorized' }
                }
            }
        },
        // Stories
        '/api/v1/stories/generate': {
            post: {
                tags: ['Stories'],
                summary: 'Generate a Story',
                requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateStoryRequest' } } } },
                responses: {
                    '200': { description: 'Story created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Story' } } } } } }
                }
            }
        },
        '/api/v1/stories/generate/stream': {
            post: {
                tags: ['Stories'],
                summary: 'Stream a Story Generation',
                description: 'Returns Server-Sent Events (SSE) with the story content as it is generated.',
                requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateStoryRequest' } } } },
                responses: {
                    '200': { description: 'SSE Stream', content: { 'text/event-stream': { schema: { type: 'string' } } } }
                }
            }
        },
        '/api/v1/stories': {
            get: {
                tags: ['Stories'],
                summary: 'List Stories',
                parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }],
                responses: {
                    '200': { description: 'List of stories', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { properties: { stories: { type: 'array', items: { $ref: '#/components/schemas/Story' } }, total: { type: 'integer' } } } } } } } }
                }
            }
        },
        '/api/v1/stories/{id}': {
            get: {
                tags: ['Stories'],
                summary: 'Get Story Details',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    '200': { description: 'Story details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Story' } } } } } },
                    '404': { description: 'Story not found' }
                }
            }
        },
        // Voice
        '/api/v1/voice': {
            get: {
                tags: ['Voice'],
                summary: 'List Voice Profiles',
                responses: {
                    '200': { description: 'List of voice profiles', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/VoiceProfile' } } } } } } }
                }
            }
        },
        '/api/v1/voice/upload': {
            post: {
                tags: ['Voice'],
                summary: 'Upload Voice Sample',
                requestBody: {
                    content: {
                        'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, name: { type: 'string' } } } },
                        'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, mimeType: { type: 'string' }, dataBase64: { type: 'string' } } } }
                    }
                },
                responses: {
                    '200': { description: 'Voice profile created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/VoiceProfile' } } } } } }
                }
            }
        },
        // Live
        '/api/v1/live/init': {
            post: {
                tags: ['Live'],
                summary: 'Initialize Live Session',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { childName: { type: 'string' }, childAge: { type: 'integer' }, sessionId: { type: 'string' } } } } } },
                responses: {
                    '200': { description: 'Session initialized', content: { 'application/json': { schema: { $ref: '#/components/schemas/LiveSessionConfig' } } } }
                }
            }
        },
        // User
        '/api/v1/user/me': {
            get: {
                tags: ['User'],
                summary: 'Get Current User',
                responses: {
                    '200': { description: 'User profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }
                }
            }
        },
        '/api/v1/user/preferences': {
            get: {
                tags: ['User'],
                summary: 'Get User Preferences',
                responses: {
                    '200': { description: 'Preferences', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/UserPreferences' } } } } } }
                }
            },
            put: {
                tags: ['User'],
                summary: 'Update User Preferences',
                requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPreferences' } } } },
                responses: {
                    '200': { description: 'Updated preferences', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/UserPreferences' } } } } } }
                }
            }
        },
        // Share
        '/api/v1/share': {
            post: {
                tags: ['Social'],
                summary: 'Create Share Link',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { resourceId: { type: 'string' }, type: { type: 'string', enum: ['STORY', 'MOMENT'] }, expiresInDays: { type: 'integer' }, maxViews: { type: 'integer' } } } } } },
                responses: {
                    '200': { description: 'Share link created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { url: { type: 'string' }, expiresAt: { type: 'string' } } } } } } } }
                }
            }
        },
        '/api/v1/share/email': {
            post: {
                tags: ['Social'],
                summary: 'Share via Email',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { resourceId: { type: 'string' }, type: { type: 'string', enum: ['STORY', 'MOMENT'] }, grandmaEmail: { type: 'string', format: 'email' } } } } } },
                responses: {
                    '200': { description: 'Email sent', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { sent: { type: 'boolean' } } } } } } } }
                }
            }
        },
        '/api/v1/share/{token}': {
            get: {
                tags: ['Social'],
                summary: 'View Shared Content',
                security: [],
                parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    '200': { description: 'Shared content', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object' } } } } } }
                }
            }
        },
        // Companions
        '/api/v1/companions/progress': {
            get: {
                tags: ['Gamification'],
                summary: 'Get Companion Unlock Progress',
                responses: {
                    '200': { description: 'Progress data', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { storyCount: { type: 'integer' }, unlockedCompanions: { type: 'array' } } } } } } } }
                }
            }
        },
        // Conversation
        '/api/v1/conversations/turn': {
            post: {
                tags: ['Live'],
                summary: 'Process Conversation Turn',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { sessionId: { type: 'string' }, message: { type: 'string' } } } } } },
                responses: {
                    '200': { description: 'AI Response', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { message: { type: 'string' } } } } } } } }
                }
            }
        },
        // Suggestions
        '/api/v1/suggestions': {
            get: {
                tags: ['Stories'],
                summary: 'Get Story Suggestions',
                parameters: [{ name: 'sessionId', in: 'query', schema: { type: 'string' } }],
                responses: {
                    '200': { description: 'Suggestions', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { type: 'string' } } } } } } }
                }
            }
        },
        '/api/v1/suggestions/feedback': {
            post: {
                tags: ['Stories'],
                summary: 'Submit Suggestion Feedback',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { theme: { type: 'string' }, type: { type: 'string', enum: ['story_completed', 'story_skipped'] } } } } } },
                responses: {
                    '200': { description: 'Feedback logged', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } } }
                }
            }
        },
        // Moments
        '/api/v1/moments': {
            get: {
                tags: ['Social'],
                summary: 'List Moments',
                parameters: [{ name: 'storyId', in: 'query', schema: { type: 'string' } }],
                responses: {
                    '200': { description: 'List of moments', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { moments: { type: 'array' } } } } } } } }
                }
            }
        },
        '/api/v1/moments/{id}': {
            get: {
                tags: ['Social'],
                summary: 'Get Moment Details',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    '200': { description: 'Moment details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object' } } } } } }
                }
            }
        },
        // Family
        '/api/v1/family': {
            post: {
                tags: ['Social'],
                summary: 'Create Family',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } },
                responses: {
                    '200': { description: 'Family created', content: { 'application/json': { schema: { type: 'object' } } } }
                }
            }
        },
        '/api/v1/family/invite': {
            post: {
                tags: ['Social'],
                summary: 'Invite Member',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { targetUserId: { type: 'string' } } } } } },
                responses: {
                    '200': { description: 'Invite sent', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } } }
                }
            }
        },
        // Feedback
        '/api/v1/feedback': {
            post: {
                tags: ['System'],
                summary: 'Submit Content Feedback',
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { contentId: { type: 'string' }, type: { type: 'string' }, reason: { type: 'string' } } } } } },
                responses: {
                    '200': { description: 'Feedback submitted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } } }
                }
            }
        }
    }
}

// Routes
docsRoute.get('/openapi.json', (c) => c.json(openApiSpec))
docsRoute.get('/', swaggerUI({ url: '/api/docs/openapi.json' }))
docsRoute.get('', swaggerUI({ url: '/api/docs/openapi.json' }))
