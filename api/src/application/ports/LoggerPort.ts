/**
 * LoggerPort - Interface for structured logging
 */
export interface LogMetadata {
    context?: string
    userId?: string
    storyId?: string
    latencyMs?: number
    tokens?: number
    costUsd?: number
    [key: string]: unknown
}

export interface LoggerPort {
    info(message: string, metadata?: LogMetadata): void
    warn(message: string, metadata?: LogMetadata): void
    error(message: string, error?: Error | unknown, metadata?: LogMetadata): void
    debug(message: string, metadata?: LogMetadata): void
}
