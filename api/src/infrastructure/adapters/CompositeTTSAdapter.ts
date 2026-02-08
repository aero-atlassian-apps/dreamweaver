/**
 * CompositeTTSAdapter - Routes requests between Stable (Google) and Cloning (HF)
 */
import { TextToSpeechPort, SynthesizeInput, SynthesizeOutput, VoiceCloneInput, VoiceCloneOutput, TTSVoice } from '../../application/ports/TextToSpeechPort.js'
import { GoogleTTSAdapter } from './GoogleTTSAdapter.js'

export class CompositeTTSAdapter implements TextToSpeechPort {
    constructor(
        private readonly googleAdapter: GoogleTTSAdapter,
        private readonly cloningAdapter: TextToSpeechPort // Generic Cloning Adapter
    ) { }

    supportsCloning(): boolean {
        return this.cloningAdapter.supportsCloning()
    }

    async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
        // Check if the requested voice is a "Clone" (URL-like ID or marked as such)
        const voiceId = input.voiceProfile?.voiceModelId || ''

        // Robust check: If voiceId looks like a URL, it's a clone sample for XTTS
        if (voiceId.startsWith('http')) {
            console.log('[CompositeTTS] Routing to Cloning Adapter (Clone)')
            return this.cloningAdapter.synthesize(input)
        }

        // Default to Google
        return this.googleAdapter.synthesize(input)
    }

    async cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneOutput> {
        // Always route cloning to Cloning Adapter
        return this.cloningAdapter.cloneVoice(input)
    }

    async listVoices(): Promise<TTSVoice[]> {
        const standard = await this.googleAdapter.listVoices()
        // We could list 'My Clones' here if we had access to repo, but standard listing is usually presets.
        // Returns Google voices as the 'Available Presets'
        return standard
    }
}
