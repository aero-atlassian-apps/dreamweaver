import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export function FullJourneyPage() {
    const navigate = useNavigate();
    const { user, setDemoUser } = useAuth();
    const shouldReduceMotion = useReducedMotion();
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    useEffect(() => {
        // [DEMO] If guest, silently inject demo user to avoid auth redirects
        if (!user) {
            setDemoUser();
        }
    }, [user, setDemoUser]);

    const features = [
        {
            id: 'live',
            title: 'Live Bedtime Mode',
            description: 'Real-time, voice-interactive storyteller.',
            icon: 'mic',
            path: '/live',
            color: 'from-indigo-400 to-purple-500',
            orbitDuration: 20,
            delay: 0,
        },
        {
            id: 'story',
            title: 'Story Generation',
            description: 'AI-crafted narratives with perfect structure.',
            icon: 'auto_stories',
            path: '/stories/new',
            color: 'from-blue-400 to-cyan-500',
            orbitDuration: 25,
            delay: 2,
        },
        {
            id: 'voice',
            title: 'Voice Cloning',
            description: 'Preserve the comfort of familiar voices.',
            icon: 'record_voice_over',
            path: '/settings/voice',
            color: 'from-emerald-400 to-teal-500',
            orbitDuration: 30,
            delay: 4,
        }
    ];

    return (
        <div className="min-h-screen bg-[#050510] text-white overflow-hidden relative font-sans flex flex-col items-center justify-center perspective-[1000px]">
            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-[#050510] to-[#050510]" />

            {/* Branding - Positioned at top to avoid orbit overlap */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-12 left-0 w-full text-center z-20 px-4"
            >
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-2 drop-shadow-2xl">
                    DreamWeaver
                </h1>
                <p className="text-indigo-400 uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold">
                    The Immersive Hub
                </p>
            </motion.div>

            {/* The Core (Main Interaction Point) */}
            <div className="relative z-10 flex flex-col items-center">
                <motion.button
                    aria-label="Enter the DreamWorld"
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white shadow-[0_0_100px_rgba(255,255,255,0.2)] flex items-center justify-center relative focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
                    animate={shouldReduceMotion ? {} : {
                        boxShadow: [
                            '0 0 50px rgba(255,255,255,0.2)',
                            '0 0 100px rgba(255,255,255,0.4)',
                            '0 0 50px rgba(255,255,255,0.2)'
                        ],
                        scale: hoveredNode === 'dashboard' ? 1.05 : 1
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    onClick={() => navigate('/dashboard')}
                    onMouseEnter={() => setHoveredNode('dashboard')}
                    onMouseLeave={() => setHoveredNode(null)}
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-indigo-100 opacity-90" />
                    <span className="material-symbols-outlined text-3xl md:text-4xl text-indigo-950 relative z-10">
                        rocket_launch
                    </span>
                    <div className="absolute -bottom-8 text-[10px] text-white/60 whitespace-nowrap uppercase tracking-widest font-bold">
                        Enter the DreamWorld
                    </div>
                </motion.button>
            </div>

            {/* Orbiting Features - Container ensures they orbit the CORE specifically */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
                {features.map((feature, i) => {
                    // Logic: Base radius + scaling per index
                    // Clamp to ensure it doesn't get too big or too small
                    const radiusClass = i === 0 ? 'w-[280px] h-[280px] md:w-[350px] md:h-[350px]' :
                        i === 1 ? 'w-[440px] h-[440px] md:w-[550px] md:h-[550px]' :
                            'w-[600px] h-[600px] md:w-[750px] md:h-[750px]';

                    return (
                        <div
                            key={feature.id}
                            className={`absolute flex items-center justify-center pointer-events-none transition-all duration-700 ${radiusClass}`}
                            style={{
                                animation: shouldReduceMotion ? 'none' : `spin ${feature.orbitDuration}s linear infinite`,
                                animationDelay: `-${feature.delay}s`
                            }}
                        >
                            {/* Orbit Ring */}
                            <div className="absolute inset-0 rounded-full border border-white/5 opacity-20" />

                            {/* The Planet - Positioned absolute on the ring */}
                            <motion.button
                                aria-label={feature.title}
                                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto group z-30 focus:outline-none"
                                style={{
                                    animation: shouldReduceMotion ? 'none' : `counter-spin ${feature.orbitDuration}s linear infinite`,
                                    animationDelay: `-${feature.delay}s`,
                                }}
                                onClick={() => navigate(feature.path)}
                                onMouseEnter={() => setHoveredNode(feature.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                onFocus={() => setHoveredNode(feature.id)}
                                onBlur={() => setHoveredNode(null)}
                                whileHover={{ scale: 1.15 }}
                                whileFocus={{ scale: 1.15 }}
                            >
                                <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${feature.color} shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center relative p-1 transition-all group-hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] border border-white/20`}>
                                    <span className="material-symbols-outlined text-white text-2xl md:text-3xl drop-shadow-md">
                                        {feature.icon}
                                    </span>
                                </div>

                                {/* Label Tooltip - Centered relative to planet */}
                                <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 text-center transition-all duration-300 ${hoveredNode === feature.id ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
                                    }`}>
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-2xl">
                                        <h3 className="text-xs md:text-sm font-bold text-white tracking-tight mb-1">{feature.title}</h3>
                                        <p className="text-[9px] md:text-[10px] text-indigo-100/80 leading-tight">
                                            {feature.description}
                                        </p>
                                    </div>
                                    {/* Link indicator */}
                                    <div className="mt-2 text-[8px] text-indigo-400 font-bold tracking-[0.2em] uppercase">Explore</div>
                                </div>
                            </motion.button>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Utility Link */}
            <div className="absolute bottom-12 w-full text-center z-20">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-white/30 hover:text-white/60 transition-colors text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto group"
                >
                    <span>Skip to Main Dashboard</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
