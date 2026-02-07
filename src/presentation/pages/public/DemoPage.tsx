/**
 * DemoPage - Immersive E2E Bedtime Experience Showcase
 * 
 * Shows the complete DreamWeaver flow using REAL API calls:
 * 1. Welcome - Child profile setup
 * 2. Voice - Persona selection (Luna/Atlas)
 * 3. Story - Real Gemini generation with progress
 * 4. Narration - Real TTS audio playback
 * 5. Sleep - Dimming simulation
 * 6. Complete - Golden moment + CTA
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageTransition } from '../../components/ui/PageTransition'
import { DemoService, type DemoTheme, type DemoSessionResponse } from '../../../infrastructure/api/DemoService'
import { getApiOrigin } from '../../../infrastructure/api/apiClient'
import { DemoLiveSession } from '../../components/DemoLiveSession'
import { VoiceRecorder } from '../../components/VoiceRecorder'
import { JuryVerdict } from '../../components/JuryVerdict'
import { FeedbackService } from '../../../infrastructure/api/FeedbackService'

// Illustrations
const ILLUS_VISION = '/illustrations/01_vision_sketchnote.png'
const ILLUS_PROBLEM = '/illustrations/02_problem_sketchnote.png'
const ILLUS_USERS = '/illustrations/03_target_users_sketchnote.png'
const ILLUS_ARCH = '/illustrations/05_agentic_ai_architecture_sketchnote.png'
const ILLUS_GEMINI = '/illustrations/07_gemini_3_integration_sketchnote.png'

type JuryStep = 'intro' | 'problem' | 'vision' | 'tech' | 'demo' | 'verdict'
type DemoStep = 'welcome' | 'voice' | 'generating' | 'story' | 'sleep' | 'complete'

// Theme hero images (from StoryViewPage)
const THEME_IMAGES: Record<string, string> = {
    space: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDn-VmgV6N_f03Z6HZGoNAlGCg5TK3c8-J5JgglufeRp4w7Kwxhz5Tk9WYb3Q3ZRWuVSvNI7Rs3CR1WwasQHFgFSL3jTHosQOuRBqxakCxGTdVQ9vO1d3GVXthkIjKf9IctfODbg3BJ6kfLGoAE0IKaLgMaQFgAFDZpCmTL4PXh35yOY2wYDlFfIi0r7xBmFmw6FUcBIhkqZzHg3UMrvUvrXJbMRHGDnd7Al89eLh2g6nz7yNql2gmLGj_2ypUw6wAk0EdiGLMnZkgP',
    ocean: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBDtrlMyOHRaZjJ753ASImy6KkrZ0ngrFv_TByhNLZhxFp_L-8XEPC03pXjXcnU7GULi2ABjxYfzDkQgW0aBSVTj084puRptRsThz7djGROVF1nZECyh9gH9ocHE8kQKiBPqLI7ndxlYDcq0j6jFssGwcbSMmwjcSd8HoKn-1g44CrHS1aHoytf0U503XTjf1a77OF7aQpbmBjbcNiHlfxZLyZ_UlzA3tdI6Tr2s1TpPojFN1z83LF5N1k_M20YxK3AXev8gFlhcO8',
    forest: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHBgOx2ziqlrNlppTR1oGWWwsW7IBjKTvZfPtoedNNsg398bm96EruVR7bvmugWJ66TNIfwBWxoFzGSKekMnKeweLosUFZ5WwCfD1ayrtj81XWPyyhUR4PQrVbVJUP6KJe5Gu5-SnSDFZ_rRqRaOSvun5n-PqEZK0-0uWZjoPW6Ok1lmV8cq22yRwQGxPV7yFNekg8EwoXjBCS1mb6ZGjQivPs9qnBIMsMbLRpgmQPqBmKo0DuXvhaiwJ6zLv2oX4Zd_ZMwOinXQRM',
    magic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnUzuLPgFUYEq1RIhN6HmRWfBCdKE5hMiAkG8EO3uWoLZUaxGO68KTqvyjSFg25MwAYkDjlb_TkHtZ_o5BifmhEqpqnw6_F2MDvGuZcjzKCy-mS_RYGqYu5nveXy9LT0W-tE5dLzeBCOF1dD1-b3ddAPAC7kWOTwk1P6r6Ut_6do6UNKvmtN0jcygBm91IOblR8k0pnNTg4iowKoF8_lgY2APX2VswjfeMoYMqu0v4f4PMKKctvUH7fCww1j1fO9gyJWjKpc4PBXT8',
}

// Personas matching VoiceOnboardingPage
const PERSONAS = [
    { id: 'en-US-Journey-F', name: 'Luna', gender: 'Female', desc: 'Warm, whimsical, perfect for bedtime.', color: 'bg-purple-500/20 text-purple-300', icon: 'face_3' },
    { id: 'en-US-Journey-D', name: 'Atlas', gender: 'Male', desc: 'Deep, calm, reassuring storyteller.', color: 'bg-blue-500/20 text-blue-300', icon: 'face_6' },
    { id: 'en-GB-Neural2-A', name: 'Custom (Clone)', gender: 'Any', desc: 'Narrated with your voice (Preview)', color: 'bg-green-500/20 text-green-300', icon: 'graphic_eq' },
]

const THEMES: { value: DemoTheme; label: string; emoji: string }[] = [
    { value: 'space', label: 'Space', emoji: '🚀' },
    { value: 'ocean', label: 'Ocean', emoji: '🌊' },
    { value: 'forest', label: 'Forest', emoji: '🌲' },
    { value: 'magic', label: 'Magic', emoji: '✨' },
    { value: 'dinosaurs', label: 'Dinosaurs', emoji: '🦕' },
    { value: 'friendship', label: 'Friendship', emoji: '💝' },
]

export function DemoPage() {
    // Jury State
    const [juryStep, setJuryStep] = useState<JuryStep>('intro')
    const [evidenceCollected, setEvidenceCollected] = useState<string[]>([])
    // const sectionRef = useRef<HTMLDivElement>(null)

    // Demo State (Wizard)
    const [step, setStep] = useState<DemoStep>('welcome')
    const [activeTab, setActiveTab] = useState<'demo' | 'history' | 'live'>('demo')
    const [history, setHistory] = useState<any[]>([])

    const unlockEvidence = (id: string) => {
        if (!evidenceCollected.includes(id)) {
            setEvidenceCollected(prev => [...prev, id])
        }
    }

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    // Load history when tab changes
    useEffect(() => {
        if (activeTab === 'history') {
            DemoService.getDemoHistory().then(setHistory)
        }
    }, [activeTab])

    // Form state
    const [childName, setChildName] = useState('Luna')
    const [childAge, setChildAge] = useState(5)
    const [theme, setTheme] = useState<DemoTheme>('space')
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
    const [fullStackMode, setFullStackMode] = useState(false) // Test with real Supabase

    // Voice Cloning State
    const [isRecorderOpen, setIsRecorderOpen] = useState(false)
    const [customVoice, setCustomVoice] = useState<{ id: string; name: string } | null>(null)

    // Session state
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [session, setSession] = useState<DemoSessionResponse | null>(null)
    const [fullStackResult, setFullStackResult] = useState<Awaited<ReturnType<typeof DemoService.generateDemoSessionFull>> | null>(null)
    const [sleepProgress, setSleepProgress] = useState(0)

    // Audio ref
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioProgress, setAudioProgress] = useState(0)

    // Extract story data from session (standard mode)
    const storyStage = session?.session.stages.find(s => s.stage === 'story')
    const narrationStage = session?.session.stages.find(s => s.stage === 'narration')
    const goldenMomentStage = session?.session.stages.find(s => s.stage === 'golden_moment')

    const _storyData = storyStage?.data as { title?: string; content?: string; sleepScore?: number } | undefined
    const _narrationData = narrationStage?.data as { audioUrl?: string; durationSeconds?: number; hasAudio?: boolean } | undefined
    const goldenMomentData = goldenMomentStage?.data as { moment?: string } | undefined

    // Unified story data (works for both modes)
    const storyData = fullStackResult ? {
        title: fullStackResult.title,
        paragraphs: fullStackResult.paragraphs,
        sleepScore: fullStackResult.sleepScore,
        audioUrl: fullStackResult.audioUrl,
        audioDuration: fullStackResult.audioDuration,
        storyId: fullStackResult.storyId,
        persistence: fullStackResult.persistence,
    } : _storyData ? {
        title: _storyData.title,
        paragraphs: _storyData.content?.split('\n\n') || [],
        sleepScore: _storyData.sleepScore || 8,
        audioUrl: _narrationData?.audioUrl,
        audioDuration: _narrationData?.durationSeconds,
        storyId: undefined,
        persistence: undefined,
    } : null

    const narrationData = storyData ? {
        audioUrl: storyData.audioUrl,
        durationSeconds: storyData.audioDuration,
        hasAudio: !!storyData.audioUrl,
    } : null

    // Get hero image for current theme
    const heroImage = THEME_IMAGES[theme] || THEME_IMAGES['magic']

    // Handle session generation (REAL API CALL)
    const handleStartJourney = async () => {
        setLoading(true)
        setError(null)
        setStep('generating')

        try {
            if (fullStackMode) {
                // Full-stack mode: Real Supabase persistence + vector memory
                const result = await DemoService.generateDemoSessionFull({
                    childName,
                    childAge,
                    theme,
                    voiceId: selectedVoice || undefined,
                })
                setFullStackResult(result)
                setSession(null)
            } else {
                // Standard mode: API only, no persistence
                const response = await DemoService.generateDemoSession({
                    childName,
                    childAge,
                    theme,
                    voiceId: selectedVoice || undefined,
                })
                setSession(response)
                setFullStackResult(null)
            }
            setStep('story')
        } catch (err) {
            console.error('Demo session failed:', err)
            setError(err instanceof Error ? err.message : 'Session generation failed')
            setStep('welcome')
        } finally {
            setLoading(false)
        }
    }

    // Handle Voice Upload
    const handleVoiceUpload = async (blob: Blob, duration: number) => {
        setLoading(true)
        try {
            const result = await DemoService.uploadVoice(blob, `My Voice (${Math.round(duration)}s)`)
            setCustomVoice(result)
            setSelectedVoice(result.id)
            setIsRecorderOpen(false)
        } catch (err) {
            console.error('Voice upload failed:', err)
            setError('Failed to upload voice')
        } finally {
            setLoading(false)
        }
    }


    const handlePlayHistory = (story: any) => {
        // Mock a session from history for playback
        setSession({
            session: {
                childName: 'Child',
                childAge: 5,
                theme: story.theme as DemoTheme,
                stages: [
                    { stage: 'story', timestamp: 0, data: { title: story.title, content: story.content || story.paragraphs?.join('\n\n'), sleepScore: 8 } },
                    { stage: 'narration', timestamp: 0, data: { audioUrl: story.audioUrl, durationSeconds: 60, hasAudio: !!story.audioUrl } }
                ] as any[],
                summary: { totalDurationMs: 0, finalSleepScore: 10, goldenMomentCaptured: true }
            },
            requestId: 'history',
            traceId: 'history'
        })
        setFullStackResult({
            storyId: story.id,
            title: story.title,
            paragraphs: story.paragraphs || (story.content ? story.content.split('\n\n') : []),
            sleepScore: 8,
            theme: story.theme,
            audioUrl: story.audioUrl,
            audioDuration: 60,
            persistence: { storySaved: true, memoryCreated: true, userId: 'demo' },
            summary: { totalDurationMs: 0, validationCoverage: '100%', testedComponents: [] },
            requestId: 'history',
            traceId: 'history'
        } as any)

        setActiveTab('demo')
        setStep('story')
    }

    // Audio playback handlers
    const handlePlayAudio = () => {
        if (narrationData?.audioUrl && audioRef.current) {
            audioRef.current.play()
            setIsPlaying(true)
        }
    }

    const handlePauseAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
        }
    }

    // Audio progress tracking
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const updateProgress = () => {
            if (audio.duration) {
                setAudioProgress((audio.currentTime / audio.duration) * 100)
            }
        }

        const handleEnded = () => {
            setIsPlaying(false)
            // Auto-transition to sleep mode after audio ends
            setStep('sleep')
        }

        audio.addEventListener('timeupdate', updateProgress)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', updateProgress)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [narrationData?.audioUrl])

    // Sleep mode simulation
    useEffect(() => {
        if (step !== 'sleep') return

        const interval = setInterval(() => {
            setSleepProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setStep('complete')
                    return 100
                }
                return prev + 10
            })
        }, 800)

        return () => clearInterval(interval)
    }, [step])

    // Render step indicator
    const StepIndicator = ({ current }: { current: number }) => (
        <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
                <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= current ? 'bg-primary' : 'bg-white/10'
                        }`}
                />
            ))}
        </div>
    )

    const stepNumber = { welcome: 1, voice: 2, generating: 3, story: 3, sleep: 4, complete: 5 }[step]

    return (
        <div className="min-h-screen bg-background-dark text-white font-sans">
            {/* Gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0" />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background-dark/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🌙</span>
                        <span className="font-serif font-bold text-xl tracking-wide text-white">DreamWeaver</span>
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-accent-green/20 text-accent-green tracking-widest uppercase">
                            Jury Mode
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Evidence Progress */}
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-xs text-white/40 uppercase tracking-widest">Evidence</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div
                                        key={i}
                                        className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i <= evidenceCollected.length ? 'bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'bg-white/10'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <Link to="/login" className="text-sm font-medium text-white/60 hover:text-white transition-all">
                            Admin Login
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 pt-24 pb-20">
                {/* INTRO HERO */}
                <section id="intro" className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4">
                    <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
                        <div className="inline-flex flex-col items-center gap-2">
                            <div className="h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
                                <span className="text-5xl">⚖️</span>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/50 uppercase tracking-widest">
                                Case #2026-DW-AI
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 drop-shadow-2xl">
                            The Future of <br /> Bedtime Stories
                        </h1>

                        <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                            Welcome, Juror. You have been selected to evaluate <strong className="text-white">DreamWeaver</strong>,
                            an Agentic AI system designed to reimagine how families connect.
                        </p>

                        <div className="pt-8">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => {
                                    setJuryStep('problem')
                                    scrollToSection('problem')
                                    unlockEvidence('intro')
                                }}
                                className="h-16 px-12 text-lg rounded-full shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] transition-all transform hover:-translate-y-1"
                            >
                                Begin Evaluation →
                            </Button>
                        </div>
                    </div>
                </section>

                {/* VISUAL JOURNEY SECTIONS */}
                {/* EXHIBIT A: THE PROBLEM */}
                <section id="problem" className="min-h-screen py-24 px-4 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-red-500/5 -skew-y-3 z-0 pointer-events-none" />
                    <div className="max-w-6xl w-full z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6 order-2 md:order-1 animate-slide-up">
                            <span className="text-red-400 font-mono text-xs uppercase tracking-widest">Exhibit A</span>
                            <h2 className="text-4xl md:text-5xl font-bold font-serif">The Disconnection</h2>
                            <p className="text-lg text-white/60 leading-relaxed">
                                Modern parents are exhausted. Screen time is replacing dream time.
                                We identified a critical need for a tool that uses technology to
                                <em className="text-white not-italic"> reduce</em> technology dependence.
                            </p>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setJuryStep('vision')
                                    scrollToSection('vision')
                                    unlockEvidence('problem')
                                }}
                            >
                                Examine Solution ↓
                            </Button>
                        </div>
                        <div className="order-1 md:order-2 bg-white/5 p-4 rounded-3xl border border-white/10 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
                            <img src={ILLUS_PROBLEM} alt="Problem Sketchnote" className="rounded-xl w-full" />
                        </div>
                    </div>
                </section>

                {/* EXHIBIT B: THE VISION */}
                <section id="vision" className="min-h-screen py-24 px-4 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-blue-500/5 skew-y-3 z-0 pointer-events-none" />
                    <div className="max-w-6xl w-full z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/10 shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-700">
                            <img src={ILLUS_VISION} alt="Vision Sketchnote" className="rounded-xl w-full mb-4" />
                            <img src={ILLUS_USERS} alt="Users Sketchnote" className="rounded-xl w-full opacity-80" />
                        </div>
                        <div className="space-y-6 animate-slide-up">
                            <span className="text-blue-400 font-mono text-xs uppercase tracking-widest">Exhibit B</span>
                            <h2 className="text-4xl md:text-5xl font-bold font-serif">A Magical Bridge</h2>
                            <p className="text-lg text-white/60 leading-relaxed">
                                Not just an app, but a companion. DreamWeaver connects parents and children through
                                personalized storytelling, voice cloning, and ambient intelligence.
                            </p>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setJuryStep('tech')
                                    scrollToSection('tech')
                                    unlockEvidence('vision')
                                }}
                            >
                                Inspect Architecture ↓
                            </Button>
                        </div>
                    </div>
                </section>

                {/* EXHIBIT C: THE ENGINE */}
                <section id="tech" className="min-h-screen py-24 px-4 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-purple-500/5 -skew-y-3 z-0 pointer-events-none" />
                    <div className="max-w-7xl w-full z-10 space-y-12">
                        <div className="text-center max-w-3xl mx-auto space-y-4">
                            <span className="text-purple-400 font-mono text-xs uppercase tracking-widest">Exhibit C</span>
                            <h2 className="text-4xl md:text-5xl font-bold font-serif">Powering Dreams with Gemini 3</h2>
                            <p className="text-lg text-white/60">
                                Under the hood lies a sophisticated Agentic Architecture.
                                The <strong className="text-purple-300">Conductor Agent</strong> orchestrates memory,
                                creativity, and safety in real-time.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <Card variant="interactive" padding="none" className="overflow-hidden group">
                                <img src={ILLUS_ARCH} alt="Architecture" className="w-full transition-transform duration-700 group-hover:scale-105" />
                                <div className="p-6 bg-white/5">
                                    <h3 className="font-bold text-lg mb-2">Agentic Core</h3>
                                    <p className="text-sm text-white/60">Multi-agent system with Clean Architecture</p>
                                </div>
                            </Card>
                            <Card variant="interactive" padding="none" className="overflow-hidden group">
                                <img src={ILLUS_GEMINI} alt="Gemini Integration" className="w-full transition-transform duration-700 group-hover:scale-105" />
                                <div className="p-6 bg-white/5">
                                    <h3 className="font-bold text-lg mb-2">Gemini 3 Integration</h3>
                                    <p className="text-sm text-white/60">Multimodal generation with long-context windows</p>
                                </div>
                            </Card>
                        </div>

                        <div className="text-center pt-8">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => {
                                    setJuryStep('demo')
                                    scrollToSection('demo')
                                    unlockEvidence('tech')
                                }}
                                className="h-14 px-10"
                            >
                                Test The System (Live Demo) ↓
                            </Button>
                        </div>
                    </div>
                </section>

                {/* EXHIBIT D: LIVE DEMO (The Original Wizard) */}
                <section id="demo" className="min-h-screen py-12 px-4 flex flex-col items-center relative bg-black/20">
                    <div className="max-w-4xl w-full space-y-8">
                        <div className="text-center mb-8">
                            <span className="text-accent-green font-mono text-xs uppercase tracking-widest">Exhibit D</span>
                            <h2 className="text-3xl font-bold font-serif mb-2">The Evidence</h2>
                            <p className="text-white/60">Experience the magic firsthand. No login required.</p>

                            {/* Tab Switcher */}
                            <div className="inline-flex bg-white/10 rounded-full p-1 backdrop-blur-md border border-white/10 mt-6">
                                <button
                                    onClick={() => setActiveTab('demo')}
                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'demo' ? 'bg-primary text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                                >
                                    Story Engine
                                </button>
                                <button
                                    onClick={() => setActiveTab('live')}
                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'live' ? 'bg-primary text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                                >
                                    Live Mode
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                                >
                                    History
                                </button>
                            </div>
                        </div>

                        {/* EXISTING WIZARD CONTENT WRAPPED HERE */}
                        {activeTab === 'live' ? (
                            <div className="animate-fade-in w-full">
                                <DemoLiveSession childName={childName} childAge={childAge} />
                            </div>
                        ) : activeTab === 'history' ? (
                            <div className="space-y-4 animate-fade-in">
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold font-serif mb-2">My Stories</h1>
                                    <p className="text-white/60 text-sm">Recent adventures created in full-stack mode</p>
                                </div>

                                {history.length === 0 ? (
                                    <div className="text-center py-12 text-white/40 bg-white/5 rounded-2xl border border-white/10">
                                        <span className="material-symbols-outlined text-4xl mb-2">history_edu</span>
                                        <p>No stories yet.</p>
                                        <p className="text-xs mt-1">Try "Full-Stack Mode" to save one!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {history.map((story) => (
                                            <Card
                                                key={story.id}
                                                variant="interactive"
                                                padding="md"
                                                onClick={() => handlePlayHistory(story)}
                                                className="flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-colors"
                                            >
                                                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                                                    {THEME_IMAGES[story.theme] ? (story.theme === 'space' ? '🚀' : story.theme === 'ocean' ? '🌊' : '✨') : '📖'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-white truncate">{story.title}</h3>
                                                    <p className="text-xs text-white/50 truncate">
                                                        {new Date(story.createdAt).toLocaleDateString()} • {story.theme}
                                                    </p>
                                                </div>
                                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <StepIndicator current={stepNumber} />

                                {/* Hidden audio element */}
                                {narrationData?.audioUrl && (
                                    <audio ref={audioRef} src={narrationData.audioUrl} preload="auto" />
                                )}

                                <PageTransition>
                                    {/* ========== STEP 1: WELCOME ========== */}
                                    {step === 'welcome' && (
                                        <div className="space-y-6">
                                            <div className="text-center mb-8">
                                                <h1 className="text-3xl font-bold font-serif mb-2">Try DreamWeaver</h1>
                                                <p className="text-white/60">Experience a magical bedtime story journey</p>
                                            </div>

                                            {error && (
                                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                                                    {error}
                                                </div>
                                            )}

                                            <Card variant="solid" padding="lg" className="space-y-5">
                                                <div className="text-center mb-2">
                                                    <span className="text-4xl">👶</span>
                                                    <h2 className="text-lg font-semibold mt-2">Child Profile</h2>
                                                </div>

                                                <Input
                                                    label="Child's Name"
                                                    value={childName}
                                                    onChange={e => setChildName(e.target.value)}
                                                    placeholder="Luna"
                                                />

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-text-subtle uppercase tracking-wide ml-1 block">Age</label>
                                                    <div className="flex gap-2">
                                                        {[3, 4, 5, 6, 7, 8].map(age => (
                                                            <button
                                                                key={age}
                                                                onClick={() => setChildAge(age)}
                                                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${childAge === age
                                                                    ? 'bg-primary text-white'
                                                                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                                                                    }`}
                                                            >
                                                                {age}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-text-subtle uppercase tracking-wide ml-1 block">Theme</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {THEMES.map(t => (
                                                            <button
                                                                key={t.value}
                                                                onClick={() => setTheme(t.value)}
                                                                className={`py-3 px-2 rounded-xl text-sm transition-all flex flex-col items-center gap-1 ${theme === t.value
                                                                    ? 'bg-primary text-white'
                                                                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                                                                    }`}
                                                            >
                                                                <span className="text-xl">{t.emoji}</span>
                                                                <span className="text-xs">{t.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Full-Stack Mode Toggle */}
                                                <div className="pt-4 border-t border-white/10">
                                                    <label className="flex items-center justify-between cursor-pointer">
                                                        <div>
                                                            <p className="text-sm font-medium text-white">Full-Stack Mode</p>
                                                            <p className="text-xs text-white/50">Test with real Supabase + Vector DB</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setFullStackMode(!fullStackMode)}
                                                            className={`relative w-12 h-6 rounded-full transition-colors ${fullStackMode ? 'bg-accent-green' : 'bg-white/20'
                                                                }`}
                                                        >
                                                            <span
                                                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${fullStackMode ? 'left-7' : 'left-1'
                                                                    }`}
                                                            />
                                                        </button>
                                                    </label>
                                                    {fullStackMode && (
                                                        <p className="mt-2 text-xs text-accent-green flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">database</span>
                                                            Stories will be saved to Supabase
                                                        </p>
                                                    )}
                                                </div>
                                            </Card>

                                            <Button
                                                variant="primary"
                                                size="lg"
                                                fullWidth
                                                onClick={() => setStep('voice')}
                                                className="h-14 rounded-2xl text-lg font-semibold"
                                            >
                                                Continue →
                                            </Button>

                                            <div className="flex justify-center gap-4 pt-4">
                                                <a
                                                    href="https://youtu.be/a-Hg3m4Mzv8"
                                                    target="_blank"
                                                    rel="noopener"
                                                    className="text-sm text-white/50 hover:text-white/80 transition-colors"
                                                >
                                                    Watch Demo Video
                                                </a>
                                                <a
                                                    href={`${getApiOrigin() || ''}/api/docs`}
                                                    target="_blank"
                                                    rel="noopener"
                                                    className="text-sm text-white/50 hover:text-white/80 transition-colors"
                                                >
                                                    API Docs
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* ========== STEP 2: VOICE SELECTION ========== */}
                                    {step === 'voice' && (
                                        <div className="space-y-6">
                                            <div className="text-center mb-8">
                                                <h1 className="text-2xl font-bold font-serif mb-2">Choose Your Storyteller</h1>
                                                <p className="text-white/60">Select a voice for bedtime stories</p>
                                            </div>

                                            <div className="space-y-3">
                                                {PERSONAS.map(persona => (
                                                    <Card
                                                        key={persona.id}
                                                        variant={selectedVoice === persona.id || (persona.id === 'en-GB-Neural2-A' && selectedVoice === customVoice?.id) ? 'solid' : 'interactive'}
                                                        padding="md"
                                                        onClick={() => {
                                                            if (persona.id === 'en-GB-Neural2-A') {
                                                                if (customVoice) {
                                                                    setSelectedVoice(customVoice.id)
                                                                } else {
                                                                    setIsRecorderOpen(true)
                                                                }
                                                            } else {
                                                                setSelectedVoice(persona.id)
                                                            }
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`h-14 w-14 rounded-full flex items-center justify-center ${persona.color}`}>
                                                                <span className="material-symbols-outlined text-2xl">{persona.icon}</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-white text-lg">
                                                                    {persona.id === 'en-GB-Neural2-A' && customVoice ? customVoice.name : persona.name}
                                                                </p>
                                                                <p className="text-sm text-text-subtle">
                                                                    {persona.id === 'en-GB-Neural2-A' && !customVoice ? 'Tap to record your voice' : persona.desc}
                                                                </p>
                                                            </div>
                                                            {selectedVoice === persona.id && (
                                                                <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                                                            )}
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>

                                            <div className="flex gap-3 pt-4">
                                                <Button
                                                    variant="secondary"
                                                    size="lg"
                                                    onClick={() => setStep('welcome')}
                                                    className="flex-1"
                                                >
                                                    Back
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="lg"
                                                    onClick={handleStartJourney}
                                                    disabled={!selectedVoice || loading}
                                                    className="flex-[2]"
                                                >
                                                    {loading ? 'Loading...' : 'Start Story ✨'}
                                                </Button>
                                            </div>

                                            {/* Recorder Modal */}
                                            {isRecorderOpen && (
                                                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                                                    <VoiceRecorder
                                                        onRecordingComplete={handleVoiceUpload}
                                                        onCancel={() => setIsRecorderOpen(false)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ========== STEP 3: GENERATING ========== */}
                                    {step === 'generating' && (
                                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                                            <div className="relative">
                                                <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-6xl text-primary animate-pulse">
                                                        auto_awesome
                                                    </span>
                                                </div>
                                                <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold font-serif mb-2">Creating Your Story</h2>
                                                <p className="text-white/60">Gemini 3 Flash is crafting a magical tale for {childName}...</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* ========== STEP 4: STORY + NARRATION ========== */}
                                    {step === 'story' && storyData && (
                                        <div className="space-y-6">
                                            {/* Hero Image */}
                                            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl">
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                                                    style={{ backgroundImage: `url('${heroImage}')` }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-background-dark/90 via-transparent to-transparent" />

                                                {/* Badges row */}
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    {/* Persistence Badge (full-stack mode) */}
                                                    {storyData.persistence?.storySaved && (
                                                        <div className="flex items-center gap-1.5 bg-accent-green/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-accent-green/30">
                                                            <span className="material-symbols-outlined text-accent-green text-lg">cloud_done</span>
                                                            <span className="text-accent-green font-bold text-xs">Saved</span>
                                                        </div>
                                                    )}
                                                    {/* Sleep Score Badge */}
                                                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                                        <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bedtime</span>
                                                        <span className="text-primary font-bold text-sm">{(storyData.sleepScore || 8) * 10}%</span>
                                                    </div>
                                                </div>

                                                {/* Title overlay */}
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <h1 className="text-2xl font-bold font-serif text-white drop-shadow-lg">{storyData.title}</h1>
                                                    <p className="text-white/70 text-sm mt-1">A bedtime story for {childName}</p>
                                                </div>
                                            </div>

                                            {/* Story Content */}
                                            <Card variant="solid" padding="lg">
                                                <div className="text-white/90 leading-relaxed space-y-4">
                                                    {storyData.paragraphs?.map((p, i) => (
                                                        <p key={i}>{p}</p>
                                                    ))}
                                                </div>
                                            </Card>

                                            {/* Audio Player */}
                                            {narrationData?.hasAudio && narrationData.audioUrl ? (
                                                <Card variant="interactive" padding="md">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={isPlaying ? handlePauseAudio : handlePlayAudio}
                                                            className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shrink-0 hover:bg-primary/80 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-2xl text-white">
                                                                {isPlaying ? 'pause' : 'play_arrow'}
                                                            </span>
                                                        </button>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between text-sm mb-2">
                                                                <span className="text-white/70">🎧 Audio Narration</span>
                                                                <span className="text-white/50">{narrationData.durationSeconds}s</span>
                                                            </div>
                                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary transition-all duration-200"
                                                                    style={{ width: `${audioProgress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ) : (
                                                <Card variant="solid" padding="md" className="text-center">
                                                    <p className="text-white/50 text-sm">
                                                        📖 Text story generated • Audio requires GOOGLE_TTS_API_KEY
                                                    </p>
                                                </Card>
                                            )}

                                            <Button
                                                variant="primary"
                                                size="lg"
                                                fullWidth
                                                onClick={() => setStep('sleep')}
                                                className="h-14 rounded-2xl"
                                            >
                                                <span className="material-symbols-outlined mr-2">nights_stay</span>
                                                Simulate Sleep Mode
                                            </Button>
                                        </div>
                                    )}

                                    {/* ========== STEP 5: SLEEP MODE ========== */}
                                    {step === 'sleep' && (
                                        <div className="fixed inset-0 bg-background-dark/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 animate-fade-in">
                                            <div className="text-center space-y-8 max-w-sm">
                                                <div className="relative">
                                                    <span className="material-symbols-outlined text-8xl text-primary/50 animate-pulse">
                                                        nights_stay
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-white/40 text-sm uppercase tracking-widest mb-2">Sleep Mode Active</p>
                                                    <h2 className="text-2xl font-bold font-serif text-white/60">
                                                        Sweet dreams, {childName}...
                                                    </h2>
                                                </div>

                                                {/* Sleep Progress */}
                                                <div className="space-y-2">
                                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary/50 transition-all duration-700"
                                                            style={{ width: `${sleepProgress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-white/30 text-xs">Detecting sleep patterns...</p>
                                                </div>

                                                <div className="flex flex-col items-center gap-2 text-white/20 text-xs">
                                                    <span>Volume: 50%</span>
                                                    <span>Brightness: Dimmed</span>
                                                    <span>Sleep Score: {Math.min(10, 7 + Math.floor(sleepProgress / 30))}/10</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ========== STEP 6: COMPLETE ========== */}
                                    {step === 'complete' && (
                                        <div className="space-y-6 text-center">
                                            <div className="py-8">
                                                <div className="h-24 w-24 mx-auto rounded-full bg-accent-green/20 flex items-center justify-center mb-6">
                                                    <span className="material-symbols-outlined text-5xl text-accent-green">
                                                        favorite
                                                    </span>
                                                </div>
                                                <h1 className="text-3xl font-bold font-serif mb-2">Golden Moment Captured! ✨</h1>
                                                <p className="text-white/60">
                                                    {goldenMomentData?.moment || `${childName} drifted off to dreamland peacefully`}
                                                </p>
                                            </div>

                                            <Card variant="solid" padding="lg" className="text-left">
                                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">insights</span>
                                                    Session Summary
                                                </h3>
                                                <ul className="space-y-2 text-sm text-white/70">
                                                    <li>📖 Story: "{storyData?.title}"</li>
                                                    <li>🎯 Theme: {theme}</li>
                                                    <li>⏱️ Duration: {session?.session.summary.totalDurationMs ? Math.round(session.session.summary.totalDurationMs / 1000) : '?'}s API time</li>
                                                    <li>😴 Final Sleep Score: {session?.session.summary.finalSleepScore}/10</li>
                                                    <li>💫 Golden Moment: Captured!</li>
                                                </ul>
                                            </Card>

                                            <Card variant="interactive" padding="lg" className="border-primary/30">
                                                <h3 className="font-semibold mb-2">🚀 Ready for the full experience?</h3>
                                                <p className="text-sm text-white/60 mb-4">
                                                    Sign up to unlock Live Mode, voice cloning, memory vault, and more!
                                                </p>
                                                <Link to="/signup">
                                                    <Button variant="primary" size="lg" fullWidth>
                                                        Get Started Free
                                                    </Button>
                                                </Link>
                                            </Card>

                                            <Button
                                                variant="secondary"
                                                size="lg"
                                                fullWidth
                                                onClick={() => {
                                                    setStep('welcome')
                                                    setSession(null)
                                                    setSleepProgress(0)
                                                    setAudioProgress(0)
                                                }}
                                            >
                                                Try Again
                                            </Button>

                                            {/* Debug Info */}
                                            <div className="text-[10px] text-white/20 pt-4 space-y-1">
                                                <p>Request ID: {session?.requestId || '---'}</p>
                                                <p>Trace ID: {session?.traceId?.slice(0, 16) || '---'}</p>
                                            </div>
                                        </div>
                                    )}
                                </PageTransition>
                            </div>
                        )}
                    </div>
                </section>

                {/* FINAL VERDICT SECTION */}
                <section id="verdict" className="min-h-[50vh] py-24 px-4 flex flex-col items-center justify-center bg-black/40 relative z-10">
                    <div className="max-w-2xl w-full space-y-8 text-center animate-fade-in">
                        <div className="inline-block p-3 rounded-full bg-white/5 border border-white/10 mb-4">
                            <span className="text-4xl">👨‍⚖️</span>
                        </div>
                        <h2 className="text-4xl font-bold font-serif">The Verdict</h2>
                        <p className="text-white/60 text-lg">
                            You've examined the evidence. You've tested the engine.<br />
                            Is DreamWeaver the future of bedtime?
                        </p>

                        <div className="pt-8">
                            <JuryVerdict
                                onVerdict={async (verdict, message) => {
                                    try {
                                        await FeedbackService.submitJuryVerdict({
                                            verdict,
                                            message,
                                            context: { evidenceCollected }
                                        })
                                    } catch (e) {
                                        console.error('Verdict submission failed', e)
                                        throw e
                                    }
                                }}
                            />
                        </div>

                        {evidenceCollected.length < 4 && (
                            <p className="text-xs text-red-400 mt-4">
                                * Warning: You have not collected all evidence pieces yet.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
