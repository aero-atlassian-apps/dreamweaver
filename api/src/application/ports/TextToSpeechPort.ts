/**
 * TextToSpeechPort - Interface for TTS services
 */

import { VoiceProfile } from '../../domain/entities/VoiceProfile'

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
    synthesize(input: SynthesizeInput): Promise<SynthesizeOutput>
    cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneOutput>
    listVoices(): Promise<TTSVoice[]>
    supportsCloning(): boolean
}
