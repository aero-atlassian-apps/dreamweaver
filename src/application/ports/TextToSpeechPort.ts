/**
 * TextToSpeechPort - Interface for text-to-speech services
 * 
 * This port defines the contract for any TTS service.
 * Implementations can be Google Cloud TTS, ElevenLabs, etc.
 */

import type { VoiceProfile } from '../../domain/entities/VoiceProfile'

export interface SynthesizeInput {
    text: string
    voiceProfile?: VoiceProfile
    language?: string
    speakingRate?: number // 0.5 to 2.0
    pitch?: number // -20.0 to 20.0
}

export interface SynthesizeOutput {
    audioUrl: string
    audioBase64?: string
    durationSeconds: number
    format: 'mp3' | 'wav' | 'ogg'
}

export interface VoiceCloneInput {
    sampleAudioUrl: string
    voiceName: string
}

export interface VoiceCloneOutput {
    voiceModelId: string
    status: 'processing' | 'ready' | 'failed'
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
     * Synthesize text to speech
     */
    synthesize(input: SynthesizeInput): Promise<SynthesizeOutput>

    /**
     * Clone a voice from audio sample (if supported)
     */
    cloneVoice?(input: VoiceCloneInput): Promise<VoiceCloneOutput>

    /**
     * Get available voices
     */
    listVoices(): Promise<TTSVoice[]>

    /**
     * Check if voice cloning is supported
     */
    supportsCloning(): boolean
}
