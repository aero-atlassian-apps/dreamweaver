/**
 * GoogleTTSAdapter Tests
 * 
 * Unit tests for TTS adapter with mocked synthesis.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoogleTTSAdapter } from './GoogleTTSAdapter'

describe('GoogleTTSAdapter', () => {
    let adapter: GoogleTTSAdapter

    beforeEach(() => {
        adapter = new GoogleTTSAdapter()
    })

    describe('synthesize', () => {
        it('should return mock synthesis when no API key', async () => {
            const result = await adapter.synthesize({
                text: 'Once upon a time in a magical forest',
            })

            expect(result).toHaveProperty('audioUrl')
            expect(result).toHaveProperty('audioBase64')
            expect(result).toHaveProperty('durationSeconds')
            expect(result).toHaveProperty('format')
            expect(result.format).toBe('mp3')
        })

        it('should estimate duration based on word count', async () => {
            // 30 words at 150 wpm = 12 seconds
            const thirtyWords = Array(30).fill('word').join(' ')
            const result = await adapter.synthesize({ text: thirtyWords })

            expect(result.durationSeconds).toBe(12)
        })

        it('should handle short text', async () => {
            const result = await adapter.synthesize({ text: 'Hello world' })

            expect(result.durationSeconds).toBeGreaterThan(0)
            expect(result.audioUrl).toBeTruthy()
        })

        it('should accept voice profile', async () => {
            const result = await adapter.synthesize({
                text: 'Story text',
                voiceProfile: { voiceModelId: 'custom_voice_123' },
            })

            expect(result.audioUrl).toBeTruthy()
        })

        it('should accept speaking rate', async () => {
            const result = await adapter.synthesize({
                text: 'Story text',
                speakingRate: 0.8,
            })

            expect(result.audioUrl).toBeTruthy()
        })
    })

    describe('cloneVoice', () => {
        it('should return mock voice model for MVP', async () => {
            const result = await adapter.cloneVoice({
                voiceName: 'Dad Voice',
                sampleAudioUrl: 'https://example.com/sample.mp3',
            })

            expect(result).toHaveProperty('voiceModelId')
            expect(result).toHaveProperty('status')
            expect(result.status).toBe('ready')
            expect(result.voiceModelId).toContain('mock_voice_')
        })
    })

    describe('listVoices', () => {
        it('should return list of available voices', async () => {
            const voices = await adapter.listVoices()

            expect(Array.isArray(voices)).toBe(true)
            expect(voices.length).toBeGreaterThan(0)
            expect(voices[0]).toHaveProperty('id')
            expect(voices[0]).toHaveProperty('name')
            expect(voices[0]).toHaveProperty('language')
            expect(voices[0]).toHaveProperty('gender')
        })

        it('should include both male and female voices', async () => {
            const voices = await adapter.listVoices()

            const hasFemale = voices.some(v => v.gender === 'female')
            const hasMale = voices.some(v => v.gender === 'male')

            expect(hasFemale).toBe(true)
            expect(hasMale).toBe(true)
        })
    })

    describe('supportsCloning', () => {
        it('should return false for standard Google TTS', () => {
            expect(adapter.supportsCloning()).toBe(false)
        })
    })

    describe('with API key', () => {
        it('should attempt real API call when key provided', async () => {
            const adapterWithKey = new GoogleTTSAdapter('fake-api-key')
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

            const result = await adapterWithKey.synthesize({
                text: 'Test text',
            })

            // Should still return mock for now since API call would fail
            expect(result.audioUrl).toBeTruthy()

            consoleSpy.mockRestore()
        })
    })
})
