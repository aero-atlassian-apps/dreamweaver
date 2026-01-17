/**
 * VoiceOnboardingPage - Parent voice sample recording
 * 
 * Allows parents to record a voice sample for TTS cloning.
 * For MVP, shows the UI with mock functionality.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageTransition } from '../components/ui/PageTransition'

type RecordingState = 'idle' | 'recording' | 'recorded' | 'processing' | 'complete'

export function VoiceOnboardingPage() {
    const [state, setState] = useState<RecordingState>('idle')
    const [recordingTime, setRecordingTime] = useState(0)
    const navigate = useNavigate()

    const TARGET_DURATION = 30 // 30 seconds target

    const handleStartRecording = () => {
        setState('recording')
        // Mock recording timer
        const interval = setInterval(() => {
            setRecordingTime(prev => {
                if (prev >= TARGET_DURATION) {
                    clearInterval(interval)
                    setState('recorded')
                    return TARGET_DURATION
                }
                return prev + 1
            })
        }, 1000)
    }

    const handleStopRecording = () => {
        setState('recorded')
    }

    const handleRetry = () => {
        setState('idle')
        setRecordingTime(0)
    }

    const handleSubmit = async () => {
        setState('processing')
        // Mock processing delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        setState('complete')
    }

    const handleContinue = () => {
        navigate('/dashboard')
    }

    const handleSkip = () => {
        navigate('/dashboard')
    }

    return (
        <div className="min-h-screen bg-background-dark flex flex-col font-sans">
            {/* Header */}
            <header className="px-5 pt-6 pb-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-white font-serif">Your Voice</h1>
                <p className="text-text-subtle mt-1">Record a sample so stories sound like you</p>
            </header>

            {/* Content */}
            <main className="flex-1 px-5 pb-8 flex flex-col">
                <PageTransition className="flex-1 flex flex-col items-center justify-center">
                    {state === 'idle' && (
                        <div className="text-center space-y-6 w-full max-w-sm">
                            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 mb-4">
                                <span className="material-symbols-outlined text-5xl text-primary">mic</span>
                            </div>
                            <h2 className="text-xl font-bold text-white">Ready to Record</h2>
                            <p className="text-text-subtle text-sm leading-relaxed">
                                Read the sample text for about 30 seconds. This helps us capture your unique voice.
                            </p>
                            <Card variant="solid" padding="md" className="text-left">
                                <p className="text-sm text-slate-300 italic leading-relaxed">
                                    "Once upon a time, in a land of dreams and starlight, there lived a little bunny
                                    named Luna. Every night, she would hop through the meadows, collecting moonbeams
                                    to share with all the sleepy forest friends..."
                                </p>
                            </Card>
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                onClick={handleStartRecording}
                                leftIcon={<span className="material-symbols-outlined">mic</span>}
                            >
                                Start Recording
                            </Button>
                            <Button variant="ghost" fullWidth onClick={handleSkip}>
                                Skip for now
                            </Button>
                        </div>
                    )}

                    {state === 'recording' && (
                        <div className="text-center space-y-6 w-full max-w-sm">
                            <div className="relative">
                                <div className="inline-flex items-center justify-center h-32 w-32 rounded-full bg-red-500/20 animate-pulse">
                                    <span className="material-symbols-outlined text-6xl text-red-400">mic</span>
                                </div>
                                <div className="absolute inset-0 rounded-full border-4 border-red-500/50 animate-ping" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white font-mono">
                                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                </p>
                                <p className="text-text-subtle text-sm mt-1">
                                    Recording... ({TARGET_DURATION - recordingTime}s remaining)
                                </p>
                            </div>
                            <Card variant="solid" padding="md" className="text-left">
                                <p className="text-sm text-slate-300 italic leading-relaxed">
                                    "Once upon a time, in a land of dreams and starlight, there lived a little bunny
                                    named Luna. Every night, she would hop through the meadows, collecting moonbeams
                                    to share with all the sleepy forest friends..."
                                </p>
                            </Card>
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
                            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-500/20">
                                <span className="material-symbols-outlined text-5xl text-green-400">check_circle</span>
                            </div>
                            <h2 className="text-xl font-bold text-white">Recording Complete</h2>
                            <p className="text-text-subtle text-sm">
                                {recordingTime} seconds captured. Ready to create your voice profile!
                            </p>
                            <div className="space-y-3">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    onClick={handleSubmit}
                                    leftIcon={<span className="material-symbols-outlined">upload</span>}
                                >
                                    Create Voice Profile
                                </Button>
                                <Button variant="ghost" fullWidth onClick={handleRetry}>
                                    Record Again
                                </Button>
                            </div>
                        </div>
                    )}

                    {state === 'processing' && (
                        <div className="text-center space-y-6 w-full max-w-sm">
                            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10">
                                <span className="material-symbols-outlined text-5xl text-primary animate-spin">
                                    progress_activity
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white">Creating Your Voice</h2>
                            <p className="text-text-subtle text-sm">
                                This may take a moment...
                            </p>
                        </div>
                    )}

                    {state === 'complete' && (
                        <div className="text-center space-y-6 w-full max-w-sm">
                            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-accent-green/20">
                                <span className="material-symbols-outlined text-5xl text-accent-green">
                                    record_voice_over
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white">Voice Profile Ready!</h2>
                            <p className="text-text-subtle text-sm">
                                Stories will now be read in your voice.
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                onClick={handleContinue}
                            >
                                Continue to Dashboard
                            </Button>
                        </div>
                    )}
                </PageTransition>
            </main>
        </div>
    )
}
