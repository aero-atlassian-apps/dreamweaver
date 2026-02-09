import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

// Illustrations
const ILLUS_VISION = '/illustrations/01_vision_sketchnote.png'
const ILLUS_PROBLEM = '/illustrations/02_problem_sketchnote.png'
const ILLUS_USERS = '/illustrations/03_target_users_sketchnote.png'
const ILLUS_FEATURES = '/illustrations/04_features_sketchnote.png'
const ILLUS_ARCH = '/illustrations/05_agentic_ai_architecture_sketchnote.png'
const ILLUS_ARCH_DIAGRAM = '/illustrations/06_agentic_ai_diagram_sketchnote.png'
const ILLUS_GEMINI = '/illustrations/07_gemini_3_integration_sketchnote.png'
const ILLUS_VOICE_ARCH = '/illustrations/08_voice_cloning_and_live_mode_ai_architecture_sketchnote.png'
const ILLUS_ARCH_OVERVIEW = '/illustrations/09_architecutre_overview_sketchnote.png'

export function VisionPage() {
    const navigate = useNavigate()
    const [expandedImage, setExpandedImage] = useState<string | null>(null)

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen bg-background-dark text-white font-sans">
            {/* Gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0" />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background-dark/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/journey')}>
                        <span className="text-2xl">🌙</span>
                        <span className="font-serif font-bold text-xl tracking-wide text-white">DreamWeaver</span>
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-accent-green/20 text-accent-green tracking-widest uppercase">
                            Vision
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/journey')}
                            className="text-white/60 hover:text-white"
                        >
                            Back to Hub
                        </Button>
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
                            Welcome. Discover the vision behind <strong className="text-white">DreamWeaver</strong>,
                            an Agentic AI system designed to reimagine how families connect.
                        </p>

                        <div className="pt-8">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => scrollToSection('problem')}
                                className="h-16 px-12 text-lg rounded-full shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] transition-all transform hover:-translate-y-1"
                            >
                                Explorer Vision ↓
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Exhibit A: The Problem */}
                <motion.section
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    id="problem"
                    className="min-h-screen py-24 px-4 flex flex-col items-center justify-center relative"
                >
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
                                onClick={() => scrollToSection('vision')}
                            >
                                Examine Solution ↓
                            </Button>
                        </div>
                        <div className="order-1 md:order-2 bg-white/5 p-4 rounded-3xl border border-white/10 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700 cursor-zoom-in" onClick={() => setExpandedImage(ILLUS_PROBLEM)}>
                            <img src={ILLUS_PROBLEM} alt="Problem Sketchnote" className="rounded-xl w-full" />
                        </div>
                    </div>
                </motion.section>

                {/* Exhibit B: The Vision */}
                <motion.section
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    id="vision"
                    className="min-h-screen py-24 px-4 flex flex-col items-center justify-center relative"
                >
                    <div className="absolute inset-0 bg-blue-500/5 skew-y-3 z-0 pointer-events-none" />
                    <div className="max-w-6xl w-full z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4">
                            <div className="bg-white/5 p-4 rounded-3xl border border-white/10 shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-700 cursor-zoom-in" onClick={() => setExpandedImage(ILLUS_VISION)}>
                                <img src={ILLUS_VISION} alt="Vision Sketchnote" className="rounded-xl w-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <img src={ILLUS_USERS} alt="Users Sketchnote" className="rounded-xl w-full opacity-90 border border-white/10 bg-white/5 p-2 cursor-zoom-in hover:opacity-100 transition-opacity" onClick={() => setExpandedImage(ILLUS_USERS)} />
                                <img src={ILLUS_FEATURES} alt="Features Sketchnote" className="rounded-xl w-full opacity-90 border border-white/10 bg-white/5 p-2 cursor-zoom-in hover:opacity-100 transition-opacity" onClick={() => setExpandedImage(ILLUS_FEATURES)} />
                            </div>
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
                                onClick={() => scrollToSection('tech')}
                            >
                                Inspect Architecture ↓
                            </Button>
                        </div>
                    </div>
                </motion.section>

                {/* Exhibit C: The Engine */}
                <motion.section
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    id="tech"
                    className="min-h-screen py-24 px-4 flex flex-col items-center justify-center relative"
                >
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
                            {/* High-level Overview */}
                            <div className="mt-8 relative group cursor-pointer" onClick={() => setExpandedImage(ILLUS_ARCH_OVERVIEW)}>
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <img src={ILLUS_ARCH_OVERVIEW} alt="Architecture Overview" className="relative rounded-xl border border-white/10 shadow-2xl w-full max-w-2xl mx-auto cursor-zoom-in" />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card variant="interactive" padding="none" className="overflow-hidden group" onClick={() => setExpandedImage(ILLUS_ARCH)}>
                                <img src={ILLUS_ARCH} alt="Agentic Core" className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in" />
                                <div className="p-4 bg-white/5 h-full">
                                    <h3 className="font-bold text-base mb-1">Agentic Core</h3>
                                    <p className="text-xs text-white/60">Clean Architecture & Multi-agent system</p>
                                </div>
                            </Card>
                            <Card variant="interactive" padding="none" className="overflow-hidden group" onClick={() => setExpandedImage(ILLUS_ARCH_DIAGRAM)}>
                                <img src={ILLUS_ARCH_DIAGRAM} alt="Agent Diagram" className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in" />
                                <div className="p-4 bg-white/5 h-full">
                                    <h3 className="font-bold text-base mb-1">Agent Flow</h3>
                                    <p className="text-xs text-white/60">State management & Event bus</p>
                                </div>
                            </Card>
                            <Card variant="interactive" padding="none" className="overflow-hidden group" onClick={() => setExpandedImage(ILLUS_GEMINI)}>
                                <img src={ILLUS_GEMINI} alt="Gemini Integration" className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in" />
                                <div className="p-4 bg-white/5 h-full">
                                    <h3 className="font-bold text-base mb-1">Gemini 3</h3>
                                    <p className="text-xs text-white/60">Native multimodal integration</p>
                                </div>
                            </Card>
                            <Card variant="interactive" padding="none" className="overflow-hidden group" onClick={() => setExpandedImage(ILLUS_VOICE_ARCH)}>
                                <img src={ILLUS_VOICE_ARCH} alt="Voice Architecture" className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in" />
                                <div className="p-4 bg-white/5 h-full">
                                    <h3 className="font-bold text-base mb-1">Live Mode</h3>
                                    <p className="text-xs text-white/60">Real-time WebSocket streaming</p>
                                </div>
                            </Card>
                        </div>

                        <div className="text-center pt-16">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => navigate('/journey')}
                                className="h-14 px-10 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                            >
                                Enter the DreamWorld →
                            </Button>
                        </div>
                    </div>
                </motion.section>
            </div>

            {/* Lightbox Modal */}
            {expandedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setExpandedImage(null)}
                >
                    <div className="relative max-w-7xl w-full max-h-[95vh] rounded-xl overflow-hidden shadow-2xl">
                        <button
                            onClick={() => setExpandedImage(null)}
                            className="absolute top-4 right-4 h-10 w-10 text-2xl rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                        >
                            &times;
                        </button>
                        <img
                            src={expandedImage}
                            alt="Detailed View"
                            className="w-full h-full object-contain max-h-[90vh]"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
