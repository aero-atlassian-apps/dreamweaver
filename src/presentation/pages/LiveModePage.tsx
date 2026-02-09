import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { LiveStorySession } from '../components/LiveStorySession'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export function LiveModePage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [started, setStarted] = useState(false)

    const childName = user?.user_metadata?.['child_name'] || 'Child'
    const childAge = user?.user_metadata?.['child_age'] || 5

    return (
        <div className="min-h-screen bg-[#050510] font-sans text-white overflow-hidden relative">

            {/* Ambient Background (Stars) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-900/20 to-transparent" />
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white opacity-20 animate-pulse"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3}px`,
                            height: `${Math.random() * 3}px`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            <header className="p-5 relative z-10 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="text-white/50 hover:text-white"
                    leftIcon={<span className="material-symbols-outlined">arrow_back</span>}
                >
                    Dashboard
                </Button>
                <div className="bg-white/5 px-3 py-1 rounded-full border border-white/5 text-[10px] uppercase tracking-widest text-white/40">
                    Live Demo Environment
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-[80vh]">
                <AnimatePresence mode="wait">
                    {!started ? (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-2xl text-center space-y-8 px-6"
                        >
                            <div className="inline-block p-4 rounded-full bg-indigo-500/10 mb-4 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                <span className="material-symbols-outlined text-4xl text-indigo-300">bedtime</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 leading-tight">
                                The Real Life Moment
                            </h1>

                            <div className="space-y-4 text-lg md:text-xl text-indigo-200/60 font-light leading-relaxed max-w-lg mx-auto">
                                <p>It's <span className="text-white font-medium">8:30 PM</span>. The house is quiet.</p>
                                <p>Lights are dimmed. You are tired.</p>
                                <p>{childName} is waiting for a story, but you have no energy left.</p>
                            </div>

                            <div className="pt-8">
                                <button
                                    onClick={() => setStarted(true)}
                                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-950 rounded-full font-bold text-lg tracking-wide hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                                >
                                    <span>Enter Bedtime Mode</span>
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </button>
                                <p className="mt-4 text-xs text-white/30 uppercase tracking-widest">
                                    Powered by Gemini 2.0 Flash (Low Latency)
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="live-session"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full max-w-4xl"
                        >
                            <LiveStorySession
                                childName={childName}
                                childAge={childAge}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
