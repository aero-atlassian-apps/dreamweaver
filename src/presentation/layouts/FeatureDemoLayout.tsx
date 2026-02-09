import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';

interface FeatureDemoLayoutProps {
    title: string;
    subtitle: string;
    introContent: React.ReactNode;
    demoContent: React.ReactNode;
    backstageContent?: React.ReactNode;
    outroContent?: React.ReactNode;
    onBack: () => void;
    // Optional: Auto-transition logic or flags
}

export const FeatureDemoLayout: React.FC<FeatureDemoLayoutProps> = ({
    title,
    subtitle,
    introContent,
    demoContent,
    backstageContent,
    outroContent,
    onBack
}) => {
    const [phase, setPhase] = useState<'intro' | 'demo' | 'outro'>('intro');
    const [stars, setStars] = useState<Array<React.CSSProperties>>([]);

    useEffect(() => {
        setStars([...Array(50)].map(() => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: Math.random() < 0.5 ? '1px' : '2px',
            height: Math.random() < 0.5 ? '1px' : '2px',
            opacity: Math.random() * 0.7 + 0.3,
            animationDuration: `${2 + Math.random() * 4}s`
        })));
    }, []);

    // Navigation handlers
    const startDemo = () => setPhase('demo');
    const finishDemo = () => setPhase('outro');

    return (
        <div className="min-h-screen bg-[#050510] text-white overflow-hidden relative font-sans selection:bg-indigo-500/30">

            {/* 1. Global Ambient Background (The "Universe") */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-[#050510] to-[#050510]" />
                {/* Dynamic Stars (Simple CSS implementation for performance) */}
                <div className="absolute inset-0 opacity-30">
                    {stars.map((style, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-white animate-pulse"
                            style={style}
                        />
                    ))}
                </div>
            </div>

            {/* 2. Header / Navigation */}
            <header className="fixed top-0 left-0 right-0 p-6 z-50 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="text-white/50 hover:text-white group transition-colors"
                        leftIcon={<span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>}
                    >
                        Return to Journey
                    </Button>
                </div>
                <div className="flex flex-col items-end">
                    <h1 className="text-xl font-serif font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white">
                        {title}
                    </h1>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                        {subtitle}
                    </span>
                </div>
            </header>

            {/* 3. Main Content Area (Z-Layered) */}
            <AnimatePresence mode="wait">

                {/* PHASE 1: INTRO ("The Real Life Moment") */}
                {phase === 'intro' && (
                    <motion.div
                        key="intro-phase"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="absolute inset-0 flex items-center justify-center z-10 p-6"
                    >
                        <div className="relative max-w-4xl w-full flex flex-col items-center text-center">
                            {/* Content Injection */}
                            {introContent}

                            {/* Standard "Start" Action (can be overridden by introContent internal buttons, but provided here as fallback/standard) */}
                            <div className="mt-12">
                                <button
                                    onClick={startDemo}
                                    className="group relative inline-flex items-center gap-4 px-10 py-5 bg-white text-[#050510] rounded-full font-bold text-lg tracking-wide hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300"
                                >
                                    <span>Experience the Solution</span>
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* PHASE 2: DEMO ("The Magic") */}
                {phase === 'demo' && (
                    <motion.div
                        key="demo-phase"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 z-20 flex flex-col"
                    >
                        {/* Demo Layout: Top (Action) / Bottom (Brain) or Side-by-Side */}
                        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">

                            {/* The Live Interactive Component */}
                            <div className="w-full max-w-5xl z-30">
                                {demoContent}
                            </div>

                            {/* Backstage / Brain Visualization (Always visible or toggleable) */}
                            {backstageContent && (
                                <div className="mt-8 w-full max-w-3xl animate-in slide-in-from-bottom-10 fade-in duration-700">
                                    {backstageContent}
                                </div>
                            )}

                        </div>

                        {/* Done Button (Optional, for demo flow control) */}
                        <div className="absolute bottom-6 right-6 z-50">
                            <Button
                                variant="ghost"
                                onClick={finishDemo}
                                className="border border-white/10 hover:bg-white/10 text-xs uppercase tracking-widest text-white/50 hover:text-white"
                            >
                                Next: The Value
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* PHASE 3: OUTRO ("The Value") */}
                {phase === 'outro' && (
                    <motion.div
                        key="outro-phase"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="absolute inset-0 flex items-center justify-center z-30 p-6 bg-black/80 backdrop-blur-md"
                    >
                        <div className="max-w-3xl text-center space-y-8">
                            <h2 className="text-4xl font-serif font-bold text-white mb-6">Why It Matters</h2>
                            {outroContent}

                            <div className="pt-12 flex justify-center gap-4">
                                <Button onClick={startDemo} variant="secondary">Replay Demo</Button>
                                <Button onClick={onBack} variant="primary">Continue Journey</Button>
                            </div>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};
