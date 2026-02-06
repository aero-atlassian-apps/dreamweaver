import { LoggerPort } from '../../application/ports/LoggerPort.js'

export type MetricName = 'UCR' | 'ORR' | 'MTTH' | 'LATENCY_MS' | 'ERROR_RATE'

export interface QualityAlert {
    metric: MetricName
    currentValue: number
    threshold: number
    severity: 'WARNING' | 'CRITICAL'
    timestamp: Date
}

/**
 * QualityGate - The "Heartbeat Monitor" of the 2026 Architected Agent.
 * 
 * Instead of passive logging, this component ACTIVELY guards quality.
 * If metrics degrade (e.g., UCR drops below 80%), it can trigger alerts or circuit breakers.
 */
export class QualityGate {
    private thresholds: Record<MetricName, { warn: number, critical: number, direction: 'above' | 'below' }> = {
        'UCR': { warn: 0.85, critical: 0.70, direction: 'below' }, // Unattended Completion Rate
        'ORR': { warn: 0.50, critical: 0.20, direction: 'below' }, // Obstacle Recovery Rate
        'MTTH': { warn: 300, critical: 60, direction: 'below' }, // Mean Time To Human (seconds - strictly implies shorter is worse for autonomoy? Or longer is better?) - Wait, typically MTTH measure time *until* human needed. So longer is better.
        // Let's assume MTTH: Higher is Better (Agent survives longer autonomously).
        'LATENCY_MS': { warn: 1500, critical: 3000, direction: 'above' },
        'ERROR_RATE': { warn: 0.05, critical: 0.10, direction: 'above' }
    }

    constructor(private logger: LoggerPort) { }

    checkMetric(metric: MetricName, value: number): void {
        const rules = this.thresholds[metric]
        if (!rules) return

        let alert: QualityAlert | null = null

        if (rules.direction === 'below') {
            if (value < rules.critical) {
                alert = { metric, currentValue: value, threshold: rules.critical, severity: 'CRITICAL', timestamp: new Date() }
            } else if (value < rules.warn) {
                alert = { metric, currentValue: value, threshold: rules.warn, severity: 'WARNING', timestamp: new Date() }
            }
        } else {
            if (value > rules.critical) {
                alert = { metric, currentValue: value, threshold: rules.critical, severity: 'CRITICAL', timestamp: new Date() }
            } else if (value > rules.warn) {
                alert = { metric, currentValue: value, threshold: rules.warn, severity: 'WARNING', timestamp: new Date() }
            }
        }

        if (alert) {
            this.handleAlert(alert)
        }
    }

    private handleAlert(alert: QualityAlert): void {
        this.logger.warn(`[QualityGate] ${alert.severity} Alert: ${alert.metric} is ${alert.currentValue} (Threshold: ${alert.threshold})`)

        if (alert.severity === 'CRITICAL') {
            // [2026] Hard Enforcement
            // Critical quality failure must trigger immediate recovery/safe-mode
            throw new QualityGateError(alert)
        }
    }
}

export class QualityGateError extends Error {
    constructor(public alert: QualityAlert) {
        super(`Quality Gate Breach: ${alert.metric} = ${alert.currentValue} (Threshold: ${alert.threshold})`)
        this.name = 'QualityGateError'
    }
}
