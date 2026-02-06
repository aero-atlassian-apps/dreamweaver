/**
 * VoiceProfile Entity - Represents a parent's cloned voice profile
 * 
 * This entity manages voice sample data and synthesis preferences.
 * No external dependencies - pure domain logic.
 */

export type VoiceProfileId = string
export type VoiceProfileStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface VoiceProfileProps {
    id: VoiceProfileId
    userId: string
    name: string
    sampleUrl?: string
    voiceModelId?: string // External TTS provider voice ID
    status: VoiceProfileStatus
    createdAt: Date
    updatedAt?: Date
}

export interface CreateVoiceProfileInput {
    userId: string
    name: string
}

export class VoiceProfile {
    readonly id: VoiceProfileId
    readonly userId: string
    readonly name: string
    private _sampleUrl: string | undefined
    private _voiceModelId: string | undefined
    private _status: VoiceProfileStatus
    readonly createdAt: Date
    private _updatedAt: Date | undefined

    private constructor(
        id: VoiceProfileId,
        userId: string,
        name: string,
        sampleUrl: string | undefined,
        voiceModelId: string | undefined,
        status: VoiceProfileStatus,
        createdAt: Date,
        updatedAt: Date | undefined,
    ) {
        this.id = id
        this.userId = userId
        this.name = name
        this._sampleUrl = sampleUrl
        this._voiceModelId = voiceModelId
        this._status = status
        this.createdAt = createdAt
        this._updatedAt = updatedAt
    }

    get sampleUrl(): string | undefined {
        return this._sampleUrl
    }

    get voiceModelId(): string | undefined {
        return this._voiceModelId
    }

    get status(): VoiceProfileStatus {
        return this._status
    }

    get updatedAt(): Date | undefined {
        return this._updatedAt
    }

    /**
     * Create a new VoiceProfile
     */
    static create(props: VoiceProfileProps): VoiceProfile {
        return new VoiceProfile(
            props.id,
            props.userId,
            props.name,
            props.sampleUrl,
            props.voiceModelId,
            props.status,
            props.createdAt,
            props.updatedAt,
        )
    }

    /**
     * Create a new pending voice profile
     */
    static createPending(input: CreateVoiceProfileInput): VoiceProfile {
        return new VoiceProfile(
            `voice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            input.userId,
            input.name,
            undefined,
            undefined,
            'pending',
            new Date(),
            undefined,
        )
    }

    /**
     * Set the voice sample URL after upload
     */
    setSampleUrl(url: string): void {
        this._sampleUrl = url
        this._status = 'processing'
        this._updatedAt = new Date()
    }

    /**
     * Mark the voice model as ready with provider ID
     */
    markReady(voiceModelId: string): void {
        if (!this._sampleUrl) {
            throw new Error('Cannot mark ready without sample URL')
        }
        this._voiceModelId = voiceModelId
        this._status = 'ready'
        this._updatedAt = new Date()
    }

    setStandardVoice(voiceModelId: string): void {
        this._voiceModelId = voiceModelId
        this._status = 'ready'
        this._updatedAt = new Date()
    }

    /**
     * Mark voice processing as failed
     */
    markFailed(): void {
        this._status = 'failed'
        this._updatedAt = new Date()
    }

    /**
     * Check if profile is ready for TTS
     */
    isReady(): boolean {
        return this._status === 'ready' && !!this._voiceModelId
    }

    /**
     * Check if profile is usable (has at least a sample)
     */
    hasSample(): boolean {
        return !!this._sampleUrl
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON(): VoiceProfileProps {
        return {
            id: this.id,
            userId: this.userId,
            name: this.name,
            sampleUrl: this._sampleUrl,
            voiceModelId: this._voiceModelId,
            status: this._status,
            createdAt: this.createdAt,
            updatedAt: this._updatedAt,
        }
    }
}
