/**
 * VoiceOnboardingPage - Parent voice sample recording
 * 
 * Implements design_vFinal.md Section 3.2: Voice Clone Setup
 * - Step progress indicator (Step 1 of 3)
 * - Waveform visualizer
 * - Audio preview after recording
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageTransition } from '../components/ui/PageTransition'
import { useVoiceUpload } from '../hooks/useVoiceUpload'
import { useAuth } from '../context/AuthContext'

type RecordingState = 'intro' | 'idle' | 'recording' | 'recorded' | 'processing' | 'complete' | 'error'

// Placeholder waveform component - uses CSS animation instead of Math.random()
function WaveformVisualizer({ isActive }: { isActive: boolean }) {
    // Pre-defined heights to avoid Math.random() in render (impure)
    const barHeights = [20, 32, 48, 28, 40, 56, 24, 44, 36, 52, 20, 60, 28, 48, 32, 56, 24, 40, 48, 28, 52, 36, 44, 32]

    return (
        <div className="flex items-center justify-center gap-1 h-16 px-4">
            {barHeights.map((height, i) => (
                <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${isActive ? 'bg-red-400' : 'bg-white/20'
                        }`}
                    style={{
                        height: isActive ? `${height}px` : '8px',
                        transitionDelay: `${i * 20}ms`,
                    }}
                />
            ))}
        </div>
    )
}

// Step progress indicator
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    return (
        <div className="mb-6">
            <p className="text-sm text-text-subtle mb-2">Step {currentStep} of {totalSteps}</p>
            <div className="flex gap-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < currentStep ? 'bg-primary' : 'bg-white/10'
                            }`}
                    />
                ))}
            </div>
        </div>
    )
}

export function VoiceOnboardingPage() {
    const [state, setState] = useState<RecordingState>('intro')
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const intervalRef = useRef<number | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const navigate = useNavigate()
    const { user } = useAuth()
    const { upload, uploading } = useVoiceUpload()

    const TARGET_DURATION = 30 // 30 seconds target
    const SAMPLE_TEXT = `"Once upon a time, in a cozy little house on a starlit hill, there lived a curious child who loved to explore. Every night, the moonbeams would dance through the window, bringing dreams of magical adventures..."`

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop()
            }
            if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
    }, [audioUrl])

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setState('recording')

            // Recording timer
            intervalRef.current = window.setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= TARGET_DURATION) {
                        handleStopRecording()
                        return TARGET_DURATION
                    }
                    return prev + 1
                })
            }, 1000)
        } catch (err) {
            console.error('Microphone access denied:', err)
            setUploadError('Microphone access required for voice recording')
            setState('error')
        }
    }

    const handleStopRecording = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
        setState('recorded')
    }

    const handleRetry = () => {
        setState('idle')
        setRecordingTime(0)
        setAudioBlob(null)
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
        setUploadError(null)
    }

    const handlePlayPreview = () => {
        if (audioUrl && audioRef.current) {
            audioRef.current.play()
        }
    }

    const handleSubmit = async () => {
        if (!audioBlob || !user?.id) {
            setUploadError('No recording or user not authenticated')
            return
        }

        setState('processing')
        try {
            const file = new File([audioBlob], 'voice-sample.webm', { type: 'audio/webm' })
            await upload(user.id, 'Parent Voice', file)
            setState('complete')
        } catch (err) {
            console.error('Upload failed:', err)
            setUploadError(err instanceof Error ? err.message : 'Upload failed')
            setState('error')
        }
    }

    const handleContinue = () => {
        navigate('/dashboard')
    }

    const handleSkip = () => {
        navigate('/dashboard')
    }

    const getCurrentStep = (): number => {
        switch (state) {
            case 'idle':
            case 'recording':
            case 'recorded':
                return 1
            case 'processing':
                return 2
            case 'complete':
                return 3
            default:
                return 1
        }
    }

    return (
        <div className="min-h-screen bg-background-dark flex flex-col font-sans">
            {/* Header */}
            <header className="px-5 pt-6 pb-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Button>
                <StepIndicator currentStep={getCurrentStep()} totalSteps={3} />
                <h1 className="text-2xl font-bold text-white font-serif">Let's Create Your Voice</h1>
                <p className="text-text-subtle mt-1">Read this short passage aloud (just 30 seconds!)</p>
            </header>

            {/* Content */}
            <main className="flex-1 px-5 pb-8 flex flex-col">
                {/* Hidden audio element for preview playback */}
                {audioUrl && <audio ref={audioRef} src={audioUrl} />}

                {/* Error display */}
                {uploadError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-300">{uploadError}</p>
                    </div>
                )}

                <PageTransition className="flex-1 flex flex-col">
                    {/* Intro View */}
                    {state === 'intro' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-8">
                            <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center animate-pulse-slow">
                                <span className="material-symbols-outlined text-6xl text-primary">graphic_eq</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Create Your AI Voice</h2>
                                <p className="text-text-subtle text-sm">
                                    DreamWeaver uses AI to clone your voice so you can narrate stories even when you're away.
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-left border border-white/10 w-full">
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="material-symbols-outlined text-green-400 mt-1">check_circle</span>
                                    <div>
                                        <p className="text-white font-medium text-sm">Private & Secure</p>
                                        <p className="text-xs text-text-subtle">Your voice is encrypted and only used for your stories.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-blue-400 mt-1">timer</span>
                                    <div>
                                        <p className="text-white font-medium text-sm">Takes 30 Seconds</p>
                                        <p className="text-xs text-text-subtle">Just read a short paragraph.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full space-y-3">
                                <Button size="lg" variant="primary" fullWidth onClick={() => setState('idle')}>
                                    Allow Microphone Access
                                </Button>
                                <Button variant="ghost" fullWidth onClick={handleSkip}>
                                    Skip for now
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Sample text card - always visible during recording states */}
                    {(state === 'idle' || state === 'recording') && (
                        <Card variant="solid" padding="md" className="mb-6">
                            <p className="text-sm text-slate-300 italic leading-relaxed">
                                {SAMPLE_TEXT}
                            </p>
                        </Card>
                    )}

                    {/* Waveform area */}
                    {(state === 'idle' || state === 'recording' || state === 'recorded') && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            {state === 'idle' && (
                                <div className="text-center space-y-6 w-full max-w-sm">
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                        <WaveformVisualizer isActive={false} />
                                        <p className="text-xs text-text-subtle mt-4">Waveform will appear here</p>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        onClick={handleStartRecording}
                                        leftIcon={<span className="material-symbols-outlined">mic</span>}
                                    >
                                        🎙️ Hold to Record
                                    </Button>
                                    <Button variant="ghost" fullWidth onClick={handleSkip}>
                                        Skip for now (generic voice)
                                    </Button>
                                </div>
                            )}

                            {state === 'recording' && (
                                <div className="text-center space-y-6 w-full max-w-sm">
                                    <div className="bg-red-500/10 rounded-2xl p-6 border-2 border-red-500/50 animate-pulse">
                                        <WaveformVisualizer isActive={true} />
                                        <p className="text-2xl font-bold text-white font-mono mt-4">
                                            0:{recordingTime.toString().padStart(2, '0')}
                                        </p>
                                        <p className="text-xs text-red-300 mt-1">Recording...</p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        fullWidth
                                        onClick={handleStopRecording}
                                        leftIcon={<span className="material-symbols-outlined">stop</span>}
                                    >
                                        Stop Recording
                                    </Button>
                                </div>
                            )}

                            {state === 'recorded' && (
                                <div className="text-center space-y-6 w-full max-w-sm">
                                    <div className="bg-green-500/10 rounded-2xl p-6 border border-green-500/30">
                                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4">
                                            <span className="material-symbols-outlined text-3xl text-green-400">check</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">Recording Complete</p>
                                        <p className="text-sm text-text-subtle">{recordingTime} seconds captured</p>
                                    </div>

                                    {/* Audio Preview Section */}
                                    <Card variant="interactive" padding="md" className="text-left">
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="icon"
                                                className="h-12 w-12 rounded-full bg-primary/20"
                                                onClick={handlePlayPreview}
                                            >
                                                <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                    play_arrow
                                                </span>
                                            </Button>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">Preview Recording</p>
                                                <p className="text-xs text-text-subtle">Does this sound like you?</p>
                                            </div>
                                            <span className="text-xs text-text-subtle font-mono">0:{recordingTime.toString().padStart(2, '0')}</span>
                                        </div>
                                    </Card>

                                    <div className="space-y-3">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            fullWidth
                                            onClick={handleSubmit}
                                            disabled={uploading}
                                        >
                                            Yes, Create My Voice
                                        </Button>
                                        <Button variant="ghost" fullWidth onClick={handleRetry}>
                                            Record Again
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {state === 'processing' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10">
                                <span className="material-symbols-outlined text-5xl text-primary animate-spin">
                                    progress_activity
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Creating your voice...</h2>
                                <p className="text-text-subtle text-sm mt-2">(10 seconds)</p>
                            </div>
                        </div>
                    )}

                    {state === 'complete' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-sm mx-auto">
                            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-accent-green/20">
                                <span className="material-symbols-outlined text-5xl text-accent-green">
                                    record_voice_over
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Voice Profile Ready!</h2>
                                <p className="text-text-subtle text-sm mt-2">
                                    Stories will now be read in your voice.
                                </p>
                            </div>
                            <Button variant="primary" size="lg" fullWidth onClick={handleContinue}>
                                Start Dreaming →
                            </Button>
                        </div>
                    )}
                </PageTransition>
            </main>
        </div>
    )
}
