/**
 * OpenTelemetry Tracing Setup
 * 
 * Provides distributed tracing capabilities for the application.
 * Currently configured for console export in development.
 * In production, this should be configured to export to an OTLP collector (e.g. Honeycomb, Jaeger, Datadog).
 */

import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

export const setupTracing = () => {
    // Only enable if explicitly requested or in production
    if (process.env['ENABLE_TELEMETRY'] !== 'true') {
        return null
    }

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [SemanticResourceAttributes.SERVICE_NAME]: 'dreamweaver-api',
            [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        }),
        traceExporter: new ConsoleSpanExporter(), // Replace with OTLPTraceExporter for production
        instrumentations: [getNodeAutoInstrumentations()],
    })

    sdk.start()

    console.log('[Observability] OpenTelemetry SDK started')

    return sdk
}
