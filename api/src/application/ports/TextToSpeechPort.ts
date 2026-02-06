/**
 * TextToSpeechPort - Interface for TTS services
 */

export interface SynthesizeInput {
    text: string
    voiceProfile?: {
        voiceModelId: string
    }
    speakingRate?: number
    pitch?: number
}

export interface SynthesizeOutput {
    audioUrl: string // Data URI or remote URL
    audioBase64: string
    durationSeconds: number
    format: 'mp3' | 'wav' | 'ogg'
}

export interface VoiceCloneInput {
    voiceName: string
    sampleAudioUrl: string
}

export interface VoiceCloneOutput {
    voiceModelId: string
    status: 'pending' | 'processing' | 'ready' | 'failed'
}

export interface TTSVoice {
    id: string
    name: string
    language: string
    gender: 'male' | 'female' | 'neutral'
    isCloned: boolean
}

export interface TextToSpeechPort {
    /**
     * Synthesizes text to speech using a standard or cloned voice.
     * @param input Parameters including text and optional voice profile.
     * @returns Object containing the audio URL and raw base64 data.
     */
    synthesize(input: SynthesizeInput): Promise<SynthesizeOutput>

    /**
     * Initiates a voice cloning process from an audio sample.
     * @param input Name and sample audio URL for the new voice.
     * @returns Information about the created voice model and its status.
     */
    cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneOutput>

    /**
     * Lists available voices (standard + cloned if applicable).
     * @returns Array of available voices.
     */
    listVoices(): Promise<TTSVoice[]>

    /**
     * Checks if the implementation supports voice cloning.
     * @returns True if voice cloning is supported.
     */
    supportsCloning(): boolean
}
