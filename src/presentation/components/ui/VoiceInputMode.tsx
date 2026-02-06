import { useState, useEffect, useCallback } from 'react'
import { Button } from './Button'

interface VoiceInputModeProps {
    onTranscript: (text: string) => void
    onCreateStory: () => void
    onBack?: () => void
    onToggleListening?: () => void
    keywords?: string[]
    isListening?: boolean
    transcript?: string
}

export function VoiceInputMode({
    onTranscript,
    onCreateStory,
    onBack,
    onToggleListening,
    keywords = [],
    isListening = true,
    transcript = ''
}: VoiceInputModeProps) {
    const [waveHeights, setWaveHeights] = useState<number[]>(Array(15).fill(20))
    const accentColor = '#e91e8c' // Magenta from mockup

    // Animate waveform when listening
    useEffect(() => {
        if (!isListening) return

        const interval = setInterval(() => {
            setWaveHeights(
                Array.from({ length: 15 }, () => 15 + Math.random() * 70)
            )
        }, 100)

        return () => clearInterval(interval)
    }, [isListening])

    useEffect(() => {
        onTranscript(transcript)
    }, [onTranscript, transcript])

    const escapeRegex = (str: string): string => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    const renderHighlightedTranscript = useCallback((): React.ReactNode => {
        if (!transcript) return null

        // Build a single regex pattern from all escaped keywords
        const escapedKeywords = keywords.map(escapeRegex).filter(k => k.length > 0)

        if (escapedKeywords.length === 0) {
            return (
                <>
                    &quot;{transcript}&quot;
                </>
            )
        }

        const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi')
        const parts = transcript.split(pattern)

        return (
            <>
                &quot;
                {parts.map((part, index) => {
                    const isKeyword = escapedKeywords.some(
                        kw => part.toLowerCase() === kw.toLowerCase().replace(/\\(.)/g, '$1')
                    )
                    if (isKeyword) {
                        return (
                            <span
                                key={index}
                                className="underline decoration-2"
                                style={{ textDecorationColor: accentColor, fontWeight: 600 }}
                            >
                                {part}
                            </span>
                        )
                    }
                    return <span key={index}>{part}</span>
                })}
                &quot;
            </>
        )
    }, [transcript, keywords, accentColor])

    return (
        <div className="min-h-screen bg-background-dark font-sans text-white overflow-hidden relative">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[100px] opacity-30 pointer-events-none" style={{ backgroundColor: `${accentColor}66` }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[120px] opacity-20 pointer-events-none bg-blue-600/40 mix-blend-screen" />

            <header className="flex items-center justify-between p-6 pb-2 relative z-10">
                <button
                    aria-label="Go back"
                    className="flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    onClick={onBack}
                >
                    <span className="material-symbols-outlined text-[28px]">arrow_back</span>
                </button>

                <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full backdrop-blur-md border"
                    style={{ backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}33` }}
                >
                    <div className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(233,30,140,0.8)]" style={{ backgroundColor: accentColor }} />
                    <span className="text-sm font-bold tracking-widest uppercase" style={{ color: accentColor }}>
                        {isListening ? 'Listening...' : 'Paused'}
                    </span>
                </div>
                <div className="size-12" />
            </header>

            <main className="flex-1 flex flex-col items-center px-6 pt-8 pb-8 relative w-full max-w-lg mx-auto z-10">
                <div className="w-full text-center mb-12">
                    <h1 className="text-[32px] md:text-[40px] font-bold leading-tight tracking-tight">
                        Describe your story
                    </h1>
                </div>

                <div aria-label="Audio waveform visualization" className="w-full h-40 flex items-center justify-center gap-2 mb-12">
                    {waveHeights.slice(0, 10).map((height, i) => (
                        <div
                            key={i}
                            className={`rounded-full transition-all duration-100 ${i >= 3 && i <= 6 ? 'w-3' : 'w-2.5'}`}
                            style={{
                                backgroundColor: accentColor,
                                height: `${Math.max(8, Math.round(height))}%`,
                                opacity: 0.4 + (i % 5) * 0.12,
                                boxShadow: i === 4 || i === 5 ? `0 0 20px rgba(233,30,140,0.55)` : undefined,
                            }}
                        />
                    ))}
                </div>

                <div className="text-center w-full px-2 mb-auto flex-1 flex items-start justify-center">
                    {transcript ? (
                        <div className="text-[28px] md:text-[32px] font-medium leading-snug text-white/70 max-w-md">
                            {renderHighlightedTranscript()}
                        </div>
                    ) : (
                        <p className="text-[22px] md:text-[26px] font-medium leading-snug text-white/40 max-w-md">
                            Start speaking…
                        </p>
                    )}
                </div>

                <div className="w-full flex flex-col items-center gap-8 mt-8">
                    <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={onToggleListening}>
                        <button
                            type="button"
                            className="size-16 rounded-full flex items-center justify-center transition-all duration-300 ring-1"
                            style={{
                                backgroundColor: isListening ? `${accentColor}1A` : 'rgba(255,255,255,0.06)',
                                color: isListening ? accentColor : 'rgba(255,255,255,0.9)',
                                borderColor: isListening ? `${accentColor}55` : 'rgba(255,255,255,0.08)',
                            }}
                        >
                            <span className="material-symbols-outlined text-[32px]">{isListening ? 'mic' : 'mic_off'}</span>
                        </button>
                        <span className="text-xs font-medium text-white/40 transition-colors" style={{ color: isListening ? accentColor : undefined }}>
                            Tap to {isListening ? 'pause' : 'resume'}
                        </span>
                    </div>

                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={onCreateStory}
                        disabled={!transcript}
                        className="h-14 rounded-full text-lg shadow-xl relative overflow-hidden group"
                        style={{ backgroundColor: transcript ? accentColor : undefined }}
                        rightIcon={<span className="material-symbols-outlined group-hover:rotate-12 transition-transform">auto_awesome</span>}
                    >
                        Create Story
                    </Button>
                </div>
            </main>
        </div>
    )
}
