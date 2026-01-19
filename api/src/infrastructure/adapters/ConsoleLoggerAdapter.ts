/**
 * ConsoleLoggerAdapter - Implementation of LoggerPort using structured console logs.
 * Optimized for cloud logging platforms (Datadog, Vercel, GCP) that parse JSON.
 */
import { LoggerPort, LogMetadata } from '../../application/ports/LoggerPort'

export class ConsoleLoggerAdapter implements LoggerPort {
    private serviceName = 'dreamweaver-api'

    info(message: string, metadata?: LogMetadata): void {
        this.log('info', message, metadata)
    }

    warn(message: string, metadata?: LogMetadata): void {
        this.log('warn', message, metadata)
    }

    error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
        const errorMeta = error instanceof Error
            ? { error_name: error.name, error_stack: error.stack, ...metadata }
            : { error: String(error), ...metadata }

        this.log('error', message, errorMeta)
    }

    debug(message: string, metadata?: LogMetadata): void {
        if (process.env.NODE_ENV !== 'production') {
            this.log('debug', message, metadata)
        }
    }

    private log(level: string, message: string, metadata?: LogMetadata): void {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            service: this.serviceName,
            message,
            ...metadata
        }

        // In 2026, structured JSON logs are the industry standard for SaaS observability
        console.log(JSON.stringify(logEntry))
    }
}
