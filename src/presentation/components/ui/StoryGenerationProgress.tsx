import { useEffect, useState } from 'react'
import { Button } from './Button'

interface ProgressStep {
    id: string
    title: string
    subtitle: string
    completed: boolean
}

interface StoryGenerationProgressProps {
    steps?: ProgressStep[]
    currentPhase?: 'extracting' | 'mapping' | 'weaving' | 'synthesizing'
    onNotifyMe?: () => void
    estimatedSeconds?: number
    streamingText?: string
}

const DEFAULT_STEPS: ProgressStep[] = [
    { id: 'structure', title: 'Story structure extracted', subtitle: "Hero's journey framework applied", completed: false },
    { id: 'mapped', title: 'Space adventure mapped', subtitle: 'Galactic coordinates set', completed: false },
    { id: 'interests', title: "Emma's interests woven in", subtitle: 'Dinosaurs & ice cream added', completed: false },
]

/**
 * Premium story generation progress screen matching the Stitch mockup.
 * Features animated checklist, concentric ring animation, and glass morphism.
 */
export function StoryGenerationProgress({
    steps = DEFAULT_STEPS,
    onNotifyMe,
    estimatedSeconds = 30,
    streamingText
}: StoryGenerationProgressProps) {
    const [progressSteps, setProgressSteps] = useState(steps)
    const [ringScale, setRingScale] = useState([1, 1.2, 1.4])

    // Simulate step completion
    useEffect(() => {
        const timers: NodeJS.Timeout[] = []

        steps.forEach((step, index) => {
            if (!step.completed) {
                timers.push(
                    setTimeout(() => {
                        setProgressSteps((prev) =>
                            prev.map((s) => (s.id === step.id ? { ...s, completed: true } : s))
                        )
                    }, (index + 1) * 2000)
                )
            }
        })

        return () => timers.forEach(clearTimeout)
    }, [steps])

    // Animate concentric rings
    useEffect(() => {
        const interval = setInterval(() => {
            setRingScale((prev) => prev.map((s) => (s >= 1.8 ? 1 : s + 0.02)))
        }, 50)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-background-dark flex flex-col px-6 py-8 overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[60%] opacity-40" style={{ background: 'radial-gradient(circle at 50% -20%, #4c1d95 0%, transparent 60%)' }} />
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '30px 30px', backgroundPosition: '15px 15px' }} />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <button className="text-white/60 hover:text-white transition-colors" type="button">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-semibold text-white drop-shadow-md">Weaving Dream...</h1>
                <div className="w-6" />
            </div>

            {/* Progress Steps */}
            <div className="space-y-4 mb-8 relative z-10">
                {progressSteps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`relative pl-12 pb-6 transition-all duration-500 ${step.completed ? 'opacity-100' : 'opacity-40'}`}
                        style={{ animationDelay: `${index * 0.2}s` }}
                    >
                        {index < progressSteps.length - 1 && (
                            <div className="absolute left-[14px] top-8 h-[calc(100%-1.25rem)] w-[2px] bg-white/10" />
                        )}

                        <div
                            className={`absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 ${step.completed
                                ? 'bg-primary text-white shadow-[0_0_15px_rgba(140,43,238,0.5)]'
                                : 'bg-white/10 text-white/60'
                                }`}
                        >
                            {step.completed ? (
                                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                            ) : (
                                <span className="text-xs font-bold">{index + 1}</span>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <h3 className="text-white text-base font-medium leading-tight">{step.title}</h3>
                            <p className="text-white/40 text-xs mt-1">{step.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Synthesizing Animation */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                {/* Concentric Rings */}
                <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                    {ringScale.map((scale, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full border border-primary/30 transition-transform"
                            style={{
                                width: '100%',
                                height: '100%',
                                transform: `scale(${scale})`,
                                opacity: 2 - scale
                            }}
                        />
                    ))}

                    {/* Center Icon */}
                    <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-b from-primary/20 to-transparent border border-primary/40 backdrop-blur-sm flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-white animate-pulse">
                            graphic_eq
                        </span>
                    </div>
                </div>

                {/* Synthesizing Text */}
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-white mb-1">Synthesizing in</h2>
                    <p className="text-xl font-bold text-white">your voice...</p>
                </div>

                {/* Estimated Time */}
                <p className="text-text-subtle text-sm text-center mb-4">
                    This usually takes about {estimatedSeconds} seconds.
                </p>

                {/* Real-time Streaming Content */}
                {streamingText && (
                    <div className="w-full max-h-32 overflow-y-auto mb-4 p-4 rounded-xl bg-white/5 border border-white/10 glass-panel">
                        <p className="text-xs text-white/80 italic leading-relaxed">
                            {streamingText}
                            <span className="inline-block w-2 h-4 bg-primary/50 ml-1 animate-pulse"></span>
                        </p>
                    </div>
                )}
            </div>

            {/* Notify Me Button */}
            {onNotifyMe && (
                <div className="mt-auto pb-4 relative z-10">
                    <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        onClick={onNotifyMe}
                        leftIcon={<span className="material-symbols-outlined">notifications</span>}
                        className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                    >
                        Notify me when ready
                    </Button>
                </div>
            )}
        </div>
    )
}
