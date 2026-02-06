/**
 * HuggingFaceVoiceAdapter - Adapter for Free Voice Cloning via HF Inference API
 * 
 * Uses 'coqui/XTTS-v2' model for zero-shot voice cloning.
 * Requires HUGGINGFACE_API_KEY.
 * 
 * LIMITATIONS:
 * - Cold starts can be slow (30s+)
 * - Rate limits on free tier
 */

import { TextToSpeechPort, SynthesizeInput, SynthesizeOutput, VoiceCloneInput, VoiceCloneOutput, TTSVoice } from '../../application/ports/TextToSpeechPort.js'

export class HuggingFaceVoiceAdapter implements TextToSpeechPort {
    private apiKey: string | undefined
    private readonly modelName: string
    private readonly API_BASE = 'https://api-inference.huggingface.co/models/'

    constructor() {
        this.apiKey = process.env['HUGGINGFACE_API_KEY']
        this.modelName = process.env['HUGGINGFACE_TTS_MODEL'] || 'coqui/XTTS-v2'
        if (!this.apiKey) {
            console.warn('[HuggingFace] API Key missing. Cloning will fail.')
        }
    }

    private get apiUrl(): string {
        return `${this.API_BASE}${this.modelName}`
    }

    supportsCloning(): boolean {
        return !!this.apiKey
    }

    async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
        if (!this.apiKey) {
            throw new Error('Hugging Face API Key is missing')
        }

        // XTTS v2 expectation:
        // For zero-shot cloning, it needs 'speaker_wav' (URL or Upload).
        // The Inference API is tricky with file uploads.
        // We will try to pass the sample URL if available.

        if (!input.voiceProfile?.voiceModelId) {
            throw new Error('Voice Profile ID required for cloning')
        }

        // For this implementation, we assume voiceModelId IS the sample URL for simplicity 
        // (stored in DB as such for cloned voices).
        // Or we need to fetch the sample URL from the VoiceProfile (which we don't have direct access to here without repo).
        // For MVP: We assume the input.voiceProfile.voiceModelId passed down IS the sample URL.
        const sampleUrl = input.voiceProfile.voiceModelId

        try {
            console.log('[HuggingFace] Synthesizing with sample:', sampleUrl)

            // Note: Standard HF Inference API for XTTS usually takes "inputs" (text).
            // Passing embeddings/samples via JSON payload is model-specific.
            // If this fails, we might need a dedicated Space or endpoint.
            // Attempting standard payload for XTTS.

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: input.text,
                    parameters: {
                        speaker_wav: sampleUrl,
                        language: "en"
                    }
                })
            })

            if (!response.ok) {
                const err = await response.text()
                throw new Error(`HF API Failed: ${response.status} ${err}`)
            }

            const arrayBuffer = await response.arrayBuffer()
            const audioBase64 = Buffer.from(arrayBuffer).toString('base64')
            const audioUrl = `data:audio/wav;base64,${audioBase64}`

            return {
                audioUrl,
                audioBase64,
                durationSeconds: input.text.length / 15, // Rough estimate
                format: 'wav'
            }

        } catch (error) {
            console.error('[HuggingFace] Synthesis error:', error)
            throw error
        }
    }

    async cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneOutput> {
        // XTTS is zero-shot, so "cloning" is just "saving the sample".
        // Use the sample URL as the "model ID" for future reference.

        return {
            voiceModelId: input.sampleAudioUrl, // Storing the URL as the ID because XTTS needs the WAV every time
            status: 'ready'
        }
    }

    async listVoices(): Promise<TTSVoice[]> {
        // HF Adapter only handles custom clones, no presets
        return []
    }
}
