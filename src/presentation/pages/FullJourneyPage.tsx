import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function FullJourneyPage() {
    const navigate = useNavigate();
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    const features = [
        {
            id: 'live',
            title: 'Live Bedtime Mode',
            description: 'Real-time, voice-interactive storyteller.',
            icon: 'mic',
            path: '/live',
            color: 'from-indigo-400 to-purple-500',
            orbitDuration: 20,
            delay: 0
        },
        {
            id: 'story',
            title: 'Story Generation',
            description: 'AI-crafted narratives with perfect structure.',
            icon: 'auto_stories',
            path: '/stories/new',
            color: 'from-blue-400 to-cyan-500',
            orbitDuration: 25,
            delay: 2
        },
        {
            id: 'voice',
            title: 'Voice Cloning',
            description: 'Preserve the comfort of familiar voices.',
            icon: 'record_voice_over',
            path: '/settings/voice',
            color: 'from-emerald-400 to-teal-500',
            orbitDuration: 30,
            delay: 4
        }
    ];

    return (
        <div className="min-h-screen bg-[#050510] text-white overflow-hidden relative font-sans flex items-center justify-center perspective-[1000px]">

            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-[#050510] to-[#050510]" />

            {/* Branding (Moved to Top) */}
            <div className="absolute top-12 left-0 w-full text-center z-20 pointer-events-none">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-2 drop-shadow-lg">
                    DreamWeaver
                </h1>
                <p className="text-indigo-200/50 uppercase tracking-[0.2em] text-sm">
                    The Demo Journey
                </p>
            </div>

            {/* The Core (Sun) */}
            <div className="relative z-10 text-center flex flex-col items-center">
                <motion.div
                    className="w-32 h-32 rounded-full bg-white shadow-[0_0_100px_rgba(255,255,255,0.2)] flex items-center justify-center relative mb-8 cursor-pointer hover:scale-110 transition-transform"
                    animate={{ boxShadow: ['0 0 50px rgba(255,255,255,0.2)', '0 0 100px rgba(255,255,255,0.4)', '0 0 50px rgba(255,255,255,0.2)'] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    onClick={() => navigate('/dashboard')}
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-indigo-100 opacity-80" />
                    <span className="material-symbols-outlined text-4xl text-indigo-950 relative z-10">
                        rocket_launch
                    </span>
                    <div className="absolute -bottom-8 text-xs text-white/40 whitespace-nowrap">
                        Go to Dashboard
                    </div>
                </motion.div>
            </div>

            {/* Orbiting Features */}
            {features.map((feature, i) => (
                <div
                    key={feature.id}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                        animation: `spin ${feature.orbitDuration}s linear infinite`,
                        animationDelay: `-${feature.delay}s`
                    }}
                >
                    {/* Orbit Ring (Optional visual guide) */}
                    <div
                        className="absolute rounded-full border border-white/5 opacity-20"
                        style={{
                            width: `${400 + i * 160}px`,
                            height: `${400 + i * 160}px`,
                        }}
                    />

                    {/* The Planet (Counter-rotated to stay upright) */}
                    <div
                        className="absolute pointer-events-auto cursor-pointer group z-30"
                        style={{
                            transform: `translateX(${200 + i * 80}px) rotate(-${(360 / feature.orbitDuration) * 0}deg)`, // Simplified rotation logic
                            animation: `counter-spin ${feature.orbitDuration}s linear infinite`,
                            animationDelay: `-${feature.delay}s`
                        }}
                        onClick={() => navigate(feature.path)}
                        onMouseEnter={() => setHoveredNode(feature.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                    >
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center relative p-1`}
                        >
                            <div className="absolute inset-0 rounded-full border border-white/20" />
                            <span className="material-symbols-outlined text-white text-2xl drop-shadow-md">
                                {feature.icon}
                            </span>
                        </motion.div>

                        {/* Label Tooltip (Always visible on hover) */}
                        <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 w-48 text-center transition-all duration-300 ${hoveredNode === feature.id ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-2'
                            }`}>
                            <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                            <p className="text-[10px] text-indigo-200 leading-tight mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                </div>
            ))}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes counter-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }
            `}</style>
        </div>
    );
}
