/**
 * SleepSentinelAgent - The "Bedtime Guardian"
 * 
 * Responsibilities:
 * 1. Monitors audio environment via AudioSensorPort (MCP).
 * 2. Evaluates sleep probability.
 * 3. Takes autonomous action to adjust the story.
 */

import { LiveSessionPort } from '../../application/ports/AIServicePort.js'
import { EventBusPort } from '../../application/ports/EventBusPort.js'
import type { ReasoningTrace } from './BedtimeConductorAgent.js'

export interface SentinelStatus {
    isMonitoring: boolean
    currentConfidence: number
    lastAction?: string
}

export class SleepSentinelAgent {
    private isMonitoring = false
    private confidence = 0.0
    private silenceCounter = 0 // Tracks consecutive silent observations
    private liveSessionId: string | null = null
    private liveUserId: string | null = null
    private liveTraceId: string | null = null
    private lastCueAtMs = 0
    private readonly cueCooldownMs = 30_000
    private readonly envelopeRms: number[] = []
    private readonly envelopeWindowSeconds = 16
    private lastEnvelopeSampleRateHz = 50
    private latestBreathing: { isStable: boolean; frequencyHz?: number; strength?: number } | null = null
    private envelopeSamplesSinceLastAnalysis = 0

    constructor(
        private readonly eventBus: EventBusPort
    ) { }

    /**
     * Connects the Sentinel to a live Gemini session.
     * Replaces simulated polling with real-time audio analysis.
     */
    monitorLiveSession(session: LiveSessionPort, sessionId: string, userId?: string, traceId?: string): void {
        this.isMonitoring = true
        this.liveSessionId = sessionId
        this.liveUserId = userId || null
        this.liveTraceId = traceId || null

        session.onAudio((chunk) => {
            const pcm = new Int16Array(chunk)
            const rms = this.calculateRmsFromPcm16(pcm)
            const variance = this.calculateVarianceFromPcm16(pcm)
            const sampleRateHz = 16_000
            const dtMs = pcm.length > 0 ? (pcm.length / sampleRateHz) * 1000 : 0

            this.observeEnvelope(rms, dtMs)
            this.updateConfidenceFromAudio(rms, variance)
        })

        session.onInterruption(() => {
            this.silenceCounter = 0
            this.confidence = Math.max(0, this.confidence - 0.3) // Interruption = Active
        })
    }

    private calculateRmsFromPcm16(int16: Int16Array): number {
        let sumSq = 0
        for (let i = 0; i < int16.length; i++) {
            const normalized = int16[i] / 32768.0
            sumSq += normalized * normalized
        }
        return int16.length > 0 ? Math.sqrt(sumSq / int16.length) : 0
    }

    /**
     * Calculates variance of signal amplitude.
     * High variance = Chaotic/Active
     * Low, Regular variance = Rhythmic/Breathing (Simulated)
     */
    private calculateVarianceFromPcm16(int16: Int16Array): number {
        if (int16.length === 0) return 0

        let sum = 0
        for (let i = 0; i < int16.length; i++) {
            sum += Math.abs(int16[i] / 32768.0)
        }
        const mean = sum / int16.length

        let sumSqDiff = 0
        for (let i = 0; i < int16.length; i++) {
            const val = Math.abs(int16[i] / 32768.0)
            sumSqDiff += (val - mean) * (val - mean)
        }
        return sumSqDiff / int16.length
    }

    private observeEnvelope(rms: number, dtMs: number): void {
        const sampleRateHz = dtMs > 0 ? 1000 / dtMs : this.lastEnvelopeSampleRateHz
        this.lastEnvelopeSampleRateHz = sampleRateHz

        this.envelopeRms.push(rms)
        this.envelopeSamplesSinceLastAnalysis++

        const maxSamples = Math.max(64, Math.floor(sampleRateHz * this.envelopeWindowSeconds))
        while (this.envelopeRms.length > maxSamples) {
            this.envelopeRms.shift()
        }

        if (this.envelopeRms.length >= 256 && this.envelopeSamplesSinceLastAnalysis >= Math.max(16, Math.floor(sampleRateHz))) {
            this.envelopeSamplesSinceLastAnalysis = 0
            this.latestBreathing = this.analyzeBreathingCadence(this.envelopeRms, sampleRateHz)
        }
    }

    private async updateConfidenceFromAudio(volume: number, variance: number) {
        const isQuiet = volume < 0.05
        const isStable = variance < 0.01 // Threshold for "rhythmic" stability

        if (isQuiet) {
            this.silenceCounter++
            const silenceBonus = Math.min(0.4, this.silenceCounter * 0.02)
            this.confidence = Math.min(1.0, this.confidence + 0.01 + (silenceBonus * 0.01))
        } else {
            this.silenceCounter = 0
            this.confidence = Math.max(0, this.confidence - 0.05)
        }

        if (isQuiet && isStable && this.silenceCounter > 10) {
            this.confidence = Math.min(1.0, this.confidence + 0.02)
        } else if (!isStable && volume > 0.1) {
            this.confidence = Math.max(0, this.confidence - 0.1) // Active movement
        }

        const breathingStable = this.latestBreathing?.isStable === true
        if (isQuiet && breathingStable && this.silenceCounter > 20) {
            this.confidence = Math.min(1.0, this.confidence + 0.02)
        }

        const now = Date.now()
        if (this.confidence > 0.85 && (now - this.lastCueAtMs) > this.cueCooldownMs) {
            const sessionId = this.liveSessionId || 'unknown'
            const userId = this.liveUserId || 'unknown'
            await this.eventBus.publish({
                id: `sentinel_${now}`,
                requestId: sessionId,
                traceId: this.liveTraceId || undefined,
                type: 'SLEEP_CUE_DETECTED',
                timestamp: new Date(),
                payload: {
                    userId,
                    sessionId,
                    confidence: this.confidence,
                    cue: breathingStable ? 'breathing' : 'silence',
                    source: 'SleepSentinel',
                    context: {
                        userId,
                        sessionId,
                        breathingHz: this.latestBreathing?.frequencyHz,
                        breathingStrength: this.latestBreathing?.strength,
                    }
                }
            })
            // Reset slightly to avoid flooding events
            this.confidence = 0.8
            this.lastCueAtMs = now
        }
    }

    getStatus(): SentinelStatus {
        return {
            isMonitoring: this.isMonitoring,
            currentConfidence: this.confidence
        }
    }

    private analyzeBreathingCadence(envelope: number[], sampleRateHz: number): { isStable: boolean; frequencyHz?: number; strength?: number } {
        const minHz = 0.12
        const maxHz = 0.65

        const desiredWindow = 512
        const n = this.nextPowerOfTwo(Math.min(desiredWindow, envelope.length))
        if (n < 256) return { isStable: false }

        const slice = envelope.slice(envelope.length - n)
        const mean = slice.reduce((a, b) => a + b, 0) / slice.length

        const input = new Array(n)
        for (let i = 0; i < n; i++) {
            const x = slice[i] - mean
            const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)))
            input[i] = x * w
        }

        const mags = this.fftMagnitudes(input)
        const binHz = sampleRateHz / n

        const startBin = Math.max(1, Math.floor(minHz / binHz))
        const endBin = Math.min(mags.length - 1, Math.ceil(maxHz / binHz))
        if (endBin <= startBin) return { isStable: false }

        let peak = 0
        let peakBin = startBin
        const band: number[] = []
        for (let i = startBin; i <= endBin; i++) {
            const v = mags[i]
            band.push(v)
            if (v > peak) {
                peak = v
                peakBin = i
            }
        }

        band.sort((a, b) => a - b)
        const median = band[Math.floor(band.length / 2)] || 0
        const ratio = median > 0 ? peak / median : 0

        const frequencyHz = peakBin * binHz
        const isStable = peak > 0.0005 && ratio >= 6 && Number.isFinite(frequencyHz)

        return { isStable, frequencyHz: isStable ? frequencyHz : undefined, strength: isStable ? ratio : undefined }
    }

    private nextPowerOfTwo(n: number): number {
        let p = 1
        while (p < n) p <<= 1
        return p
    }

    private fftMagnitudes(input: number[]): number[] {
        const n = input.length
        const re = input.slice()
        const im = new Array(n).fill(0)

        let j = 0
        for (let i = 0; i < n; i++) {
            if (i < j) {
                const tr = re[i]
                re[i] = re[j]
                re[j] = tr
                const ti = im[i]
                im[i] = im[j]
                im[j] = ti
            }
            let m = n >> 1
            while (j >= m && m > 0) {
                j -= m
                m >>= 1
            }
            j += m
        }

        for (let len = 2; len <= n; len <<= 1) {
            const ang = (-2 * Math.PI) / len
            const wlenRe = Math.cos(ang)
            const wlenIm = Math.sin(ang)
            for (let i = 0; i < n; i += len) {
                let wRe = 1
                let wIm = 0
                for (let k = 0; k < (len >> 1); k++) {
                    const uRe = re[i + k]
                    const uIm = im[i + k]
                    const vRe = re[i + k + (len >> 1)] * wRe - im[i + k + (len >> 1)] * wIm
                    const vIm = re[i + k + (len >> 1)] * wIm + im[i + k + (len >> 1)] * wRe

                    re[i + k] = uRe + vRe
                    im[i + k] = uIm + vIm
                    re[i + k + (len >> 1)] = uRe - vRe
                    im[i + k + (len >> 1)] = uIm - vIm

                    const nextWRe = wRe * wlenRe - wIm * wlenIm
                    wIm = wRe * wlenIm + wIm * wlenRe
                    wRe = nextWRe
                }
            }
        }

        const mags: number[] = new Array(Math.floor(n / 2) + 1)
        for (let i = 0; i < mags.length; i++) {
            mags[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / n
        }
        return mags
    }
}
