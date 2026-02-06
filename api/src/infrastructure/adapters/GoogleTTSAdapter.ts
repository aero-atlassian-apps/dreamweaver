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
} from '../../application/ports/TextToSpeechPort.js'

export class GoogleTTSAdapter implements TextToSpeechPort {
    private apiKey: string | null

    constructor(apiKey?: string) {
        // Backend uses process.env
        this.apiKey = apiKey || process.env['GOOGLE_TTS_API_KEY'] || null
    }

    async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
        if (!this.apiKey) throw new Error('GOOGLE_TTS_API_KEY is missing')
        return await this.callGoogleTTS(input)
    }

    async cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneOutput> {
        void input
        throw new Error('GoogleTTSAdapter does not support voice cloning')
    }

    async listVoices(): Promise<TTSVoice[]> {
        return [
            { id: 'en-US-Chirp-HD-F', name: 'Luna (Female)', language: 'en-US', gender: 'female', isCloned: false },
            { id: 'en-US-Chirp-HD-M', name: 'Atlas (Male)', language: 'en-US', gender: 'male', isCloned: false },
        ]
    }

    // [HYBRID-VOICE] Google Adapter is for Standard Personas only.
    supportsCloning(): boolean {
        return false
    }

    private async callGoogleTTS(input: SynthesizeInput): Promise<SynthesizeOutput> {
        if (!this.apiKey) throw new Error('GOOGLE_TTS_API_KEY is missing')

        try {
            // Map internal voice ID to Google Voice
            const voiceId = input.voiceProfile?.voiceModelId || 'en-US-Neural2-F'

            // Handle "Cloned" voices by mapping them to high-quality varients
            let googleVoiceName = this.mapVoiceIdToGoogle(voiceId)

            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: { text: input.text },
                    voice: {
                        languageCode: 'en-US',
                        name: googleVoiceName
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: input.speakingRate || 1.0,
                        pitch: input.pitch || 0.0
                    }
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Google TTS API Failed: ${response.status} ${response.statusText} - ${errorText}`)
            }

            const data = await response.json() as { audioContent: string }

            // Calculate approximate duration (Google doesn't return it directly in simple response)
            // Heuristic: 150 words/min = 2.5 words/sec. 
            // Better: Decode MP3 header? Too complex for now. 
            // Use word count heuristic for metadata.
            const wordCount = input.text.split(/\s+/).length
            const durationSeconds = Math.max(1, Math.ceil(wordCount / 2.5))

            return {
                audioBase64: data.audioContent,
                audioUrl: `data:audio/mp3;base64,${data.audioContent}`, // Data URI for direct playback
                durationSeconds,
                format: 'mp3'
            }

        } catch (error) {
            console.error('Google TTS Call Failed:', error)
            throw error
        }
    }

    private mapVoiceIdToGoogle(internalId: string): string {
        const mapping: Record<string, string> = {
            'en-US-Chirp-HD-F': 'en-US-Neural2-F', // Map Chirp to Neural2 for reliability/cost
            'en-US-Chirp-HD-M': 'en-US-Neural2-D',
            'luna': 'en-US-Neural2-F',
            'atlas': 'en-US-Neural2-D'
        }
        return mapping[internalId] || internalId // support direct google IDs if passed
    }
}
