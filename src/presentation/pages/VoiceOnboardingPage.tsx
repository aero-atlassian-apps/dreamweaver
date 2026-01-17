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

type RecordingState = 'idle' | 'recording' | 'recorded' | 'processing' | 'complete'

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
    const [state, setState] = useState<RecordingState>('idle')
    const [recordingTime, setRecordingTime] = useState(0)
    const intervalRef = useRef<number | null>(null)
    const navigate = useNavigate()

    const TARGET_DURATION = 30 // 30 seconds target
    const SAMPLE_TEXT = `"Once upon a time, in a cozy little house on a starlit hill, there lived a curious child who loved to explore. Every night, the moonbeams would dance through the window, bringing dreams of magical adventures..."`

    // Cleanup intervals on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    const handleStartRecording = () => {
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
    }

    const handleStopRecording = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setState('recorded')
    }

    const handleRetry = () => {
        setState('idle')
        setRecordingTime(0)
    }

    const handlePlayPreview = () => {
        // Mock preview - would play recorded audio
        console.log('Playing preview...')
    }

    const handleSubmit = async () => {
        setState('processing')
        await new Promise(resolve => setTimeout(resolve, 2000))
        setState('complete')
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
                <PageTransition className="flex-1 flex flex-col">
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
