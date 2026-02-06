import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'

export const docsRoute = new Hono()

// OpenAPI Specification Object
const openApiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'DreamWeaver API',
        version: '0.2.0',
        description: 'AI-powered Bedtime Story Service. Generates specific, personalized stories with voice narration.'
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
            Story: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    theme: { type: 'string' },
                    status: { type: 'string', enum: ['PENDING', 'GENERATING', 'READY', 'FAILED'] },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            GenerateStoryRequest: {
                type: 'object',
                required: ['theme'],
                properties: {
                    theme: { type: 'string', example: 'Dragons in space' },
                    childName: { type: 'string', example: 'Leo' },
                    childAge: { type: 'integer', example: 5 },
                    duration: { type: 'string', enum: ['short', 'medium', 'long'], default: 'medium' }
                }
            }
        }
    },
    security: [{ BearerAuth: [] }],
    paths: {
        '/api/v1/health': {
            get: {
                summary: 'System Health Check',
                description: 'Returns the status of the API services.',
                security: [], // Public
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                        version: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/stories/generate': {
            post: {
                summary: 'Generate a Story',
                description: 'Creates a new story based on the provided theme and child details. Triggers AI generation.',
                tags: ['Stories'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenerateStoryRequest' }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Story created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/Story' }
                                    }
                                }
                            }
                        }
                    },
                    '401': { description: 'Unauthorized' }
                }
            }
        },
        '/api/v1/stories': {
            get: {
                summary: 'Get Story History',
                tags: ['Stories'],
                parameters: [
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
                ],
                responses: {
                    '200': {
                        description: 'List of past stories',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                stories: { type: 'array', items: { $ref: '#/components/schemas/Story' } },
                                                total: { type: 'integer' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Routes
docsRoute.get('/openapi.json', (c) => c.json(openApiSpec))
docsRoute.get('/', swaggerUI({ url: '/api/docs/openapi.json' }))
