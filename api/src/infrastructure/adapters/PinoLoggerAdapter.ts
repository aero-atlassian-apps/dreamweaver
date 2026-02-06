/**
 * PinoLoggerAdapter - Production-grade structured logging using Pino.
 * 
 * Capability:
 * - High performance (low overhead)
 * - JSON output for log aggregation (Datadog, Splunk, etc.)
 * - Pretty printing for development
 * - Automatic context binding
 */

import { LoggerPort, LogMetadata } from '../../application/ports/LoggerPort.js'
import pino, { Logger } from 'pino'

export class PinoLoggerAdapter implements LoggerPort {
    private logger: Logger

    constructor() {
        const isProduction = process.env['NODE_ENV'] === 'production'

        this.logger = pino({
            level: process.env['LOG_LEVEL'] || 'info',
            transport: isProduction ? undefined : {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname'
                }
            },
            base: {
                service: 'dreamweaver-api',
                // timestamp will be added automatically
            },
            formatters: {
                level: (label) => {
                    return { level: label.toUpperCase() }
                }
            }
        })
    }

    info(message: string, metadata?: LogMetadata): void {
        this.logger.info(metadata || {}, message)
    }

    warn(message: string, metadata?: LogMetadata): void {
        this.logger.warn(metadata || {}, message)
    }

    error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
        if (error instanceof Error) {
            this.logger.error({
                err: {
                    type: error.name,
                    message: error.message,
                    stack: error.stack
                },
                ...metadata
            }, message)
        } else {
            this.logger.error({
                err: error,
                ...metadata
            }, message)
        }
    }

    debug(message: string, metadata?: LogMetadata): void {
        this.logger.debug(metadata || {}, message)
    }
}
