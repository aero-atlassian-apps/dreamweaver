export type ToolAuditRecord = {
    userId: string
    sessionId: string
    requestId?: string
    traceId?: string
    toolName: string
    toolCallId?: string
    allowed: boolean
    args: unknown
    result: unknown
    error?: string
    occurredAt: Date
}

export interface ToolAuditLogPort {
    write(record: ToolAuditRecord): Promise<void>
}

