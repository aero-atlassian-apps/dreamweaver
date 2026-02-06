import { z } from 'zod';

export const ReasoningTraceSchema = z.object({
    type: z.literal('trace_object'),
    goals_considered: z.array(z.string()),
    conflict_detected: z.boolean(),
    conflicts_identified: z.string().optional(),
    trade_off_made: z.string().optional(),
    thought: z.string(),
    action: z.string(),
    confidence: z.number().min(0).max(1),
    timestamp: z.date().or(z.string().transform(str => new Date(str))),
    resilience_meta: z.object({
        failure_encountered: z.string().optional(),
        correction_attempted: z.boolean().optional(),
        recovery_cost_usd: z.number().optional(),
    }).optional(),
});

export type ReasoningTraceDTO = z.infer<typeof ReasoningTraceSchema>;

export const SessionConfigSchema = z.object({
    theme: z.string().min(1, "Theme is required"),
    duration: z.enum(['short', 'medium', 'long']).optional(),
    style: z.string().optional(),
    childName: z.string().optional(),
    childAge: z.number().min(0).max(18).optional(),
});

export type SessionConfigDTO = z.infer<typeof SessionConfigSchema>;

export const AgentContextSchema = z.object({
    childName: z.string().optional(),
    childAge: z.number().optional(),
    currentMood: z.enum(['energetic', 'calm', 'tired', 'fussy']).optional(),
    recentInterests: z.array(z.string()).optional(),
    userId: z.string().uuid("User ID must be a valid UUID").optional(),
    sessionId: z.string().optional(),
    accessToken: z.string().optional(),
    envContext: z.any().optional(), // Looser for now as AmbientContext is complex
});

export type AgentContextDTO = z.infer<typeof AgentContextSchema>;
