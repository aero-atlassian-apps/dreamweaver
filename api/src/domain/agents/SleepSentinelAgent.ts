/**
 * SleepSentinelAgent - The "Bedtime Guardian"
 * 
 * Responsibilities:
 * 1. Monitors audio environment via AudioSensorPort (MCP).
 * 2. Evaluates sleep probability.
 * 3. Takes autonomous action to adjust the story.
 */

import { AudioSensorPort } from '../../application/ports/AudioSensorPort'
import { EventBusPort } from '../../application/ports/EventBusPort'
import { ReasoningTrace } from './BedtimeConductorAgent'
export { ReasoningTrace } from './BedtimeConductorAgent'

export interface SentinelStatus {
    isMonitoring: boolean
    currentConfidence: number
    lastAction?: string
}

export class SleepSentinelAgent {
    private isMonitoring = false
    private confidence = 0.0

    constructor(
        private readonly audioSensor: AudioSensorPort,
        private readonly eventBus: EventBusPort
    ) { }

    /**
     * The Main ReAct Loop for the Sentinel
     */
    async evaluateEnvironment(): Promise<ReasoningTrace[]> {
        const trace: ReasoningTrace[] = []
        this.isMonitoring = true

        // 1. Observe (Action: Check Sensor)
        trace.push({ step: 'ACTION', content: 'Reading Audio Sensor (MCP)...', timestamp: new Date() })

        const volume = await this.audioSensor.getAmbientVolume()
        const breathing = await this.audioSensor.detectBreathingPattern()

        trace.push({
            step: 'OBSERVATION',
            content: `Volume: ${volume.toFixed(2)}, Breathing: ${breathing}`,
            timestamp: new Date()
        })

        // 2. Reason
        trace.push({ step: 'THOUGHT', content: 'Evaluating sleep signals...', timestamp: new Date() })

        let signalStrength = 0
        if (volume < 0.1) signalStrength += 0.3
        if (breathing === 'rhythmic') signalStrength += 0.6

        const rawConfidence = Math.min(1.0, signalStrength) // Simple heuristic for R6
        this.confidence = Math.round(rawConfidence * 100) / 100 // Round to 2 decimals

        // 3. Act
        if (this.confidence > 0.8) {
            trace.push({ step: 'CONCLUSION', content: 'High sleep probability. Publishing SLEEP_CUE_DETECTED.', timestamp: new Date() })

            await this.eventBus.publish({
                type: 'SLEEP_CUE_DETECTED',
                timestamp: new Date(),
                payload: {
                    confidence: this.confidence,
                    cue: breathing === 'rhythmic' ? 'breathing' : 'silence',
                    source: 'SleepSentinel'
                }
            })
        } else {
            trace.push({ step: 'CONCLUSION', content: 'Subject awake. No action taken.', timestamp: new Date() })
        }

        return trace
    }

    getStatus(): SentinelStatus {
        return {
            isMonitoring: this.isMonitoring,
            currentConfidence: this.confidence
        }
    }
}
