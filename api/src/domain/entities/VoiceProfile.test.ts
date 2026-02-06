/**
 * VoiceProfile Entity Tests
 */
import { describe, it, expect } from 'vitest'
import { VoiceProfile } from './VoiceProfile'

describe('VoiceProfile', () => {
    it('should create a pending profile', () => {
        const profile = VoiceProfile.createPending({
            userId: 'user_1',
            name: 'Mom Voice'
        })

        expect(profile.id).toContain('voice_')
        expect(profile.status).toBe('pending')
        expect(profile.name).toBe('Mom Voice')
        expect(profile.userId).toBe('user_1')
        expect(profile.sampleUrl).toBeUndefined()
    })

    it('should transition to processing when sample URL is set', () => {
        const profile = VoiceProfile.createPending({ userId: 'u1', name: 'test' })

        profile.setSampleUrl('http://url.com')

        expect(profile.status).toBe('processing')
        expect(profile.sampleUrl).toBe('http://url.com')
        expect(profile.updatedAt).toBeDefined()
    })

    it('should transition to ready when marked ready', () => {
        const profile = VoiceProfile.createPending({ userId: 'u1', name: 'test' })
        profile.setSampleUrl('http://url.com')

        profile.markReady('model_123')

        expect(profile.status).toBe('ready')
        expect(profile.voiceModelId).toBe('model_123')
        expect(profile.isReady()).toBe(true)
    })

    it('should allow standard voices without sample URL', () => {
        const profile = VoiceProfile.createPending({ userId: 'u1', name: 'test' })

        profile.setStandardVoice('en-US-Journey-F')

        expect(profile.status).toBe('ready')
        expect(profile.sampleUrl).toBeUndefined()
        expect(profile.voiceModelId).toBe('en-US-Journey-F')
        expect(profile.isReady()).toBe(true)
    })

    it('should throw if marking ready without sample', () => {
        const profile = VoiceProfile.createPending({ userId: 'u1', name: 'test' })

        expect(() => profile.markReady('m1')).toThrow('Cannot mark ready without sample URL')
    })

    it('should serialize to JSON', () => {
        const profile = VoiceProfile.createPending({ userId: 'u1', name: 'test' })
        const json = profile.toJSON()

        expect(json.id).toBe(profile.id)
        expect(json.name).toBe('test')
        expect(json.status).toBe('pending')
    })

    it('should reconstruct from props', () => {
        const now = new Date()
        const profile = VoiceProfile.create({
            id: 'v1',
            userId: 'u1',
            name: 'Restored',
            status: 'ready',
            createdAt: now,
            sampleUrl: 'url',
            voiceModelId: 'm1'
        })

        expect(profile.id).toBe('v1')
        expect(profile.name).toBe('Restored')
        expect(profile.status).toBe('ready')
        expect(profile.createdAt).toEqual(now)
    })
})
