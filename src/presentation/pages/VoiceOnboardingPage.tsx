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
import { convertBlobToWavFile } from '../../infrastructure/audio/wav'

type RecordingState = 'intro' | 'idle' | 'recording' | 'recorded' | 'processing' | 'complete' | 'error'

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
    // Mode: 'persona' (default) or 'clone' (recording)
    const [mode, setMode] = useState<'persona' | 'clone'>('persona')

    // Recording State
    const [state, setState] = useState<RecordingState>('intro')
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)

    // Mock Journey Voices for Selection
    const personas = [
        { id: 'en-US-Journey-F', name: 'Luna', gender: 'Female', desc: 'Warm, whimsical, perfect for bedtime.', color: 'bg-purple-500/20 text-purple-300' },
        { id: 'en-US-Journey-D', name: 'Atlas', gender: 'Male', desc: 'Deep, calm, reassuring storyteller.', color: 'bg-blue-500/20 text-blue-300' }
    ]
    const [selectedPersona, setSelectedPersona] = useState<string | null>(null)

    const intervalRef = useRef<number | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const navigate = useNavigate()
    const { user } = useAuth()
    const { upload, select, uploading } = useVoiceUpload()

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

    // Submit Logic depending on Mode
    const handleSubmit = async () => {
        if (!user?.id) {
            setUploadError('User not authenticated')
            return
        }

        setState('processing')
        try {
            if (mode === 'clone') {
                if (!audioBlob) throw new Error('No recording found')
                // Calls 'upload' which triggers HF check on backend
                let file: File
                try {
                    file = await convertBlobToWavFile(audioBlob, 'voice-sample.wav')
                } catch {
                    file = new File([audioBlob], 'voice-sample.webm', { type: 'audio/webm' })
                }
                await upload(user.id, 'My Cloned Voice', file)
            } else {
                // Persona Mode
                if (!selectedPersona) throw new Error('No persona selected')
                const persona = personas.find(p => p.id === selectedPersona)
                await select(user.id, `Storyteller ${persona?.name}`, selectedPersona)
            }
            setState('complete')
        } catch (err) {
            console.error('Submission failed:', err)
            setUploadError(err instanceof Error ? err.message : 'Operation failed')
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
            case 'intro': return 0
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

    // Render
    return (
        <div className="min-h-screen bg-background-dark flex flex-col font-sans">
            {/* Header */}
            <header className="px-5 pt-6 pb-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Button>
                <StepIndicator currentStep={getCurrentStep() === 0 ? 1 : getCurrentStep()} totalSteps={3} />
                <h1 className="text-2xl font-bold text-white font-serif">
                    {mode === 'persona' ? 'Choose Your Storyteller' : 'Create Your AI Voice'}
                </h1>
                <p className="text-text-subtle mt-1">
                    {mode === 'persona'
                        ? 'Select a high-quality voice for your stories.'
                        : 'Read this short passage aloud (30s).'}
                </p>
            </header>

            {/* Content */}
            <main className="flex-1 px-5 pb-8 flex flex-col">
                {audioUrl && <audio ref={audioRef} src={audioUrl} />}

                {uploadError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-300">{uploadError}</p>
                    </div>
                )}

                <PageTransition className="flex-1 flex flex-col">
                    {/* Intro / Mode Selection */}
                    {state === 'intro' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-8">
                            {/* Toggle */}
                            <div className="flex bg-white/5 p-1 rounded-xl w-full max-w-xs mx-auto mb-4">
                                <button
                                    onClick={() => setMode('persona')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'persona' ? 'bg-primary text-white' : 'text-text-subtle hover:text-white'}`}
                                >
                                    Personas
                                </button>
                                <button
                                    onClick={() => setMode('clone')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'clone' ? 'bg-primary text-white' : 'text-text-subtle hover:text-white'}`}
                                >
                                    Clone
                                </button>
                            </div>

                            {mode === 'persona' ? (
                                <div className="w-full space-y-4">
                                    <div className="grid gap-3">
                                        {personas.map(p => (
                                            <Card
                                                key={p.id}
                                                variant={selectedPersona === p.id ? 'solid' : 'interactive'}
                                                padding="md"
                                                onClick={() => setSelectedPersona(p.id)}
                                                className="text-left relative overflow-hidden"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${p.color}`}>
                                                        <span className="material-symbols-outlined text-2xl">
                                                            {p.gender === 'Female' ? 'face_3' : 'face_6'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{p.name}</p>
                                                        <p className="text-xs text-text-subtle">{p.desc}</p>
                                                    </div>
                                                    {selectedPersona === p.id && (
                                                        <span className="material-symbols-outlined text-primary ml-auto">check_circle</span>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                    <Button
                                        size="lg"
                                        variant="primary"
                                        fullWidth
                                        disabled={!selectedPersona}
                                        onClick={handleSubmit} // Direct submit for persona
                                    >
                                        Select Voice
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-white/5 rounded-xl p-4 text-left border border-white/10 w-full">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="material-symbols-outlined text-purple-400 mt-1">auto_awesome</span>
                                            <div>
                                                <p className="text-white font-medium text-sm">Professional Voice Cloning</p>
                                                <p className="text-xs text-accent-green font-medium mt-0.5">✨ Ready | Powered by Google Chirp 3</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button size="lg" variant="primary" fullWidth onClick={() => setState('idle')}>
                                        Start Recording
                                    </Button>
                                </div>
                            )}

                            <Button variant="ghost" fullWidth onClick={handleSkip}>
                                Skip for now
                            </Button>
                        </div>
                    )}

                    {/* Recording Flow (Clone Mode) */}
                    {(state === 'idle' || state === 'recording') && mode === 'clone' && (
                        <Card variant="solid" padding="md" className="mb-6">
                            <p className="text-sm text-slate-300 italic leading-relaxed">
                                {SAMPLE_TEXT}
                            </p>
                        </Card>
                    )}

                    {(state === 'idle' || state === 'recording' || state === 'recorded') && mode === 'clone' && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            {state === 'idle' && (
                                <div className="text-center space-y-6 w-full max-w-sm">
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 h-32 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl text-white/20">graphic_eq</span>
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
                                    <Button variant="ghost" fullWidth onClick={() => setState('intro')}>
                                        Back
                                    </Button>
                                </div>
                            )}

                            {state === 'recording' && (
                                <div className="text-center space-y-6 w-full max-w-sm">
                                    <div className="bg-red-500/10 rounded-2xl p-6 border-2 border-red-500/50 animate-pulse h-32 flex flex-col items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl text-red-400 mb-2">mic</span>
                                        <p className="text-2xl font-bold text-white font-mono">
                                            0:{recordingTime.toString().padStart(2, '0')}
                                        </p>
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

                                    <Card variant="interactive" padding="md" className="text-left">
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="icon"
                                                className="h-12 w-12 rounded-full bg-primary/20"
                                                onClick={handlePlayPreview}
                                            >
                                                <span className="material-symbols-outlined text-xl text-primary">play_arrow</span>
                                            </Button>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">Preview Recording</p>
                                            </div>
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
                                            Create My Voice
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
                                <h2 className="text-xl font-bold text-white">
                                    {mode === 'persona' ? 'Setting up...' : 'Creating your voice...'}
                                </h2>
                                <p className="text-text-subtle text-sm mt-2">
                                    {mode === 'persona' ? 'Configuring your storyteller.' : 'This might take a moment.'}
                                </p>
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
                                <h2 className="text-xl font-bold text-white">Voice Ready!</h2>
                                <p className="text-text-subtle text-sm mt-2">
                                    Stories will now be read in your selected voice.
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
