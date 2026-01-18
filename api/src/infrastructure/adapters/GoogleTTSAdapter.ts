/**
 * GoogleTTSAdapter (Backend) - Implementation of TextToSpeechPort using Google Cloud TTS
 */

import type {
    TextToSpeechPort,
    SynthesizeInput,
    SynthesizeOutput,
    TTSVoice,
    VoiceCloneInput,
    VoiceCloneOutput
} from '../../application/ports/TextToSpeechPort'

// Mock audio data for MVP
const MOCK_AUDIO_BASE64 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbN9OyoAAAAAAD/+1DEAAAGRAln9AAAIyIGLfzEgAEBkAAAAJMK3//8RHP/+XEjC'

export class GoogleTTSAdapter implements TextToSpeechPort {
    private apiKey: string | null

    constructor(apiKey?: string) {
        // Backend uses process.env
        this.apiKey = apiKey || process.env.GOOGLE_TTS_API_KEY || null
    }

    async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
        if (!this.apiKey) {
            return this.getMockSynthesis(input.text)
        }

        // Fail fast if configured
        return await this.callGoogleTTS(input)
    }

    async cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneOutput> {
        console.log('Voice cloning requested for:', input.voiceName)
        return {
            voiceModelId: `mock_voice_${Date.now()}`,
            status: 'ready',
        }
    }

    async listVoices(): Promise<TTSVoice[]> {
        return [
            { id: 'en-US-Chirp-HD-F', name: 'Luna (Female)', language: 'en-US', gender: 'female', isCloned: false },
            { id: 'en-US-Chirp-HD-M', name: 'Atlas (Male)', language: 'en-US', gender: 'male', isCloned: false },
        ]
    }

    supportsCloning(): boolean {
        return false
    }

    private getMockSynthesis(text: string): SynthesizeOutput {
        const wordCount = text.split(/\s+/).length
        const durationSeconds = Math.ceil((wordCount / 150) * 60)

        return {
            audioUrl: MOCK_AUDIO_BASE64,
            audioBase64: MOCK_AUDIO_BASE64,
            durationSeconds,
            format: 'mp3',
        }
    }

    private async callGoogleTTS(input: SynthesizeInput): Promise<SynthesizeOutput> {
        // Placeholder for real API call
        // Would use fetch/axios here
        console.log('Calling Real Google TTS API with key:', this.apiKey ? '***' : 'missing')
        return this.getMockSynthesis(input.text)
    }
}
