/**
 * VoiceSettingsPage - Manage voice profiles for TTS
 * 
 * Allows users to:
 * - View their custom cloned voice (if any)
 * - Record a new voice sample
 * - Select from preset voices
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { VoiceRecorder } from '../components/VoiceRecorder'
import { PageTransition } from '../components/ui/PageTransition'
import { useVoiceProfile } from '../context/VoiceProfileContext'

const PRESET_VOICES = [
    { id: 'en-US-Journey-F', name: 'Luna', gender: 'Female', desc: 'Warm, whimsical, perfect for bedtime.' },
    { id: 'en-US-Journey-D', name: 'Atlas', gender: 'Male', desc: 'Deep, calm, reassuring storyteller.' },
]

export function VoiceSettingsPage() {
    const navigate = useNavigate()
    const { voiceProfile, uploadVoice, isLoading, error, hasVoice } = useVoiceProfile()

    const [isRecorderOpen, setIsRecorderOpen] = useState(false)
    const [uploadingVoice, setUploadingVoice] = useState(false)
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

    // Check if user has a custom cloned voice (voiceModelId starts with http)
    const hasClonedVoice = hasVoice && voiceProfile?.voiceModelId?.startsWith('http')

    const handleRecordingComplete = async (blob: Blob, duration: number) => {
        setUploadingVoice(true)
        try {
            const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
            await uploadVoice(`My Voice (${Math.round(duration)}s)`, file)
            setIsRecorderOpen(false)
        } finally {
            setUploadingVoice(false)
        }
    }

    return (
        <div className="min-h-screen bg-background-dark font-sans text-white p-5 flex flex-col">
            <header className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="-ml-2 text-text-subtle"
                    leftIcon={<span className="material-symbols-outlined">arrow_back</span>}
                >
                    Dashboard
                </Button>
                <div className="mt-4">
                    <h1 className="text-3xl font-bold font-serif bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Voice Settings
                    </h1>
                    <p className="text-text-subtle mt-1">
                        Choose or clone a voice for story narration.
                    </p>
                </div>
            </header>

            <main className="flex-1 max-w-lg mx-auto w-full space-y-6">
                <PageTransition>
                    {/* Custom Cloned Voice */}
                    <Card variant="solid" padding="lg" className="mb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full flex items-center justify-center bg-green-500/20 text-green-300">
                                <span className="material-symbols-outlined text-2xl">graphic_eq</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-white text-lg">
                                    {hasClonedVoice ? voiceProfile?.name || 'My Voice' : 'Create Your Voice'}
                                </p>
                                <p className="text-sm text-text-subtle">
                                    {hasClonedVoice ? (
                                        <span className="inline-flex items-center gap-1 text-accent-green bg-accent-green/10 px-2 py-0.5 rounded text-xs">
                                            <span className="material-symbols-outlined text-[10px]">verified</span>
                                            Ready | Awaiting Google "Chirp 3" Allowance
                                        </span>
                                    ) : 'Record a sample to clone your voice.'}
                                </p>
                            </div>
                            {hasClonedVoice && (
                                <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                            )}
                        </div>
                        <div className="mt-4">
                            {hasClonedVoice ? (
                                <Button
                                    variant="secondary"
                                    size="md"
                                    fullWidth
                                    onClick={() => setIsRecorderOpen(true)}
                                    disabled={isLoading || uploadingVoice}
                                >
                                    Re-record Voice
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="md"
                                    fullWidth
                                    onClick={() => setIsRecorderOpen(true)}
                                    disabled={isLoading || uploadingVoice}
                                >
                                    <span className="material-symbols-outlined mr-2">mic</span>
                                    Record Voice Sample
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Preset Voices */}
                    <h2 className="text-lg font-semibold mb-3 text-white/80">Preset Voices</h2>
                    <div className="space-y-3">
                        {PRESET_VOICES.map(voice => (
                            <Card
                                key={voice.id}
                                variant={selectedPreset === voice.id ? 'solid' : 'interactive'}
                                padding="md"
                                onClick={() => setSelectedPreset(voice.id)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-300">
                                        <span className="material-symbols-outlined text-xl">
                                            {voice.gender === 'Female' ? 'face_3' : 'face_6'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white">{voice.name}</p>
                                        <p className="text-sm text-text-subtle">{voice.desc}</p>
                                    </div>
                                    {selectedPreset === voice.id && (
                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>

                    <p className="text-xs text-white/40 text-center mt-4">
                        Note: Cloning feature is implemented and ready. Awaiting Google Cloud "Chirp 3" allowance to activate instant synthesis.
                    </p>

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}
                </PageTransition>
            </main>

            {/* Recorder Modal */}
            {isRecorderOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <VoiceRecorder
                        onRecordingComplete={handleRecordingComplete}
                        onCancel={() => setIsRecorderOpen(false)}
                    />
                </div>
            )}
        </div>
    )
}
