import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { ToolAuditLogPort, ToolAuditRecord } from '../../application/ports/ToolAuditLogPort.js'
import { LoggerPort } from '../../application/ports/LoggerPort.js'

function stableStringify(value: unknown): string {
    return JSON.stringify(value, (_key, v) => {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            return Object.keys(v as Record<string, unknown>).sort().reduce<Record<string, unknown>>((acc, k) => {
                acc[k] = (v as Record<string, unknown>)[k]
                return acc
            }, {})
        }
        return v
    })
}

function sha256Hex(input: string): string {
    return createHash('sha256').update(input).digest('hex')
}

export class SupabaseToolAuditLog implements ToolAuditLogPort {
    private readonly client: SupabaseClient
    private readonly logger: LoggerPort

    constructor(logger: LoggerPort) {
        this.logger = logger
        const url = process.env['SUPABASE_URL']
        const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY']
        if (!url || !key) {
            if (process.env['NODE_ENV'] === 'production') {
                throw new Error('SupabaseToolAuditLog requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
            }
            this.client = createClient('https://placeholder.supabase.co', 'placeholder')
            return
        }
        this.client = createClient(url, key)
    }

    async write(record: ToolAuditRecord): Promise<void> {
        try {
            const argsJson = record.args ?? null
            const resultJson = record.result ?? null
            const argsStr = stableStringify(argsJson)
            const resultStr = stableStringify(resultJson)
            const argsHash = sha256Hex(argsStr)
            const resultHash = sha256Hex(resultStr)

            const { error } = await this.client
                .from('agent_tool_audit')
                .insert({
                    occurred_at: record.occurredAt.toISOString(),
                    user_id: record.userId,
                    session_id: record.sessionId,
                    request_id: record.requestId ?? null,
                    trace_id: record.traceId ?? null,
                    tool_name: record.toolName,
                    tool_call_id: record.toolCallId ?? null,
                    allowed: record.allowed,
                    args: argsJson,
                    result: resultJson,
                    error: record.error ?? null,
                    args_hash: argsHash,
                    result_hash: resultHash,
                })

            if (error) {
                this.logger.warn('[ToolAudit] Failed to persist tool audit record', { code: error.code, message: error.message })
            }
        } catch (err) {
            this.logger.warn('[ToolAudit] Failed to write tool audit record', { err })
        }
    }
}
