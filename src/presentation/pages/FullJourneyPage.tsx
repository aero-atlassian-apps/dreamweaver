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
            radius: 200, // base radius
            step: 80     // base step
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
            radius: 200,
            step: 80
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
            radius: 200,
            step: 80
        }
    ];

    const handleNavigation = (path: string) => {
        if (!user && path === '/dashboard') {
            navigate('/login?redirect=/dashboard');
        } else {
            navigate(path);
        }
    };

    return (
        <div className="min-h-screen bg-[#050510] text-white overflow-hidden relative font-sans flex items-center justify-center perspective-[1000px]">
            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-[#050510] to-[#050510]" />

            {/* Branding */}
            <div className="absolute top-8 md:top-12 left-0 w-full text-center z-20 pointer-events-none px-4">
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-2 drop-shadow-lg">
                    DreamWeaver
                </h1>
                <p className="text-indigo-200/50 uppercase tracking-[0.2em] text-xs md:text-sm">
                    The Demo Journey
                </p>
            </div>

            {/* The Core (Sun / Dashboard) */}
            <div className="relative z-10 text-center flex flex-col items-center">
                <motion.button
                    aria-label="Go to Dashboard"
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white shadow-[0_0_100px_rgba(255,255,255,0.2)] flex items-center justify-center relative mb-8 focus:outline-none focus:ring-2 focus:ring-white/50"
                    animate={shouldReduceMotion ? {} : {
                        boxShadow: [
                            '0 0 50px rgba(255,255,255,0.2)',
                            '0 0 100px rgba(255,255,255,0.4)',
                            '0 0 50px rgba(255,255,255,0.2)'
                        ],
                        scale: hoveredNode === 'dashboard' ? 1.1 : 1
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    onClick={() => handleNavigation('/dashboard')}
                    onMouseEnter={() => setHoveredNode('dashboard')}
                    onMouseLeave={() => setHoveredNode(null)}
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-indigo-100 opacity-80" />
                    <span className="material-symbols-outlined text-3xl md:text-4xl text-indigo-950 relative z-10">
                        rocket_launch
                    </span>
                    <div className="absolute -bottom-10 text-[10px] md:text-xs text-white/40 whitespace-nowrap uppercase tracking-widest">
                        Dashboard
                    </div>
                </motion.button>
            </div>

            {/* Orbiting Features */}
            {features.map((feature, i) => {
                // Responsive calculation: Orbits scale based on viewport, but have min/max
                const orbitBaseSize = 250; // base size for first orbit on desktop

                return (
                    <div
                        key={feature.id}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            animation: shouldReduceMotion ? 'none' : `spin ${feature.orbitDuration}s linear infinite`,
                            animationDelay: `-${feature.delay}s`
                        }}
                    >
                        {/* Orbit Ring */}
                        <div
                            className="absolute rounded-full border border-white/5 opacity-20"
                            style={{
                                width: `calc(${orbitBaseSize}px + ${i} * 20vw)`,
                                height: `calc(${orbitBaseSize}px + ${i} * 20vw)`,
                                maxWidth: `${400 + i * 160}px`,
                                maxHeight: `${400 + i * 160}px`,
                            }}
                        />

                        {/* The Planet */}
                        <motion.button
                            aria-label={feature.title}
                            className="absolute pointer-events-auto group z-30 focus:outline-none"
                            style={{
                                // Responsive Translation: Uses calc with vw + px base
                                transform: `translateX(calc(${orbitBaseSize / 2}px + ${i} * 10vw))`,
                                maxWidth: 'translateX(360px)', // Cap for huge screens
                                animation: shouldReduceMotion ? 'none' : `counter-spin ${feature.orbitDuration}s linear infinite`,
                                animationDelay: `-${feature.delay}s`,
                                // Ensure translation doesn't go too far on small screens
                                left: `calc(50% + min(0px, 0px))`
                            }}
                            // Wrapper style for responsive positioning
                            css-responsive-offset={i}
                            onClick={() => navigate(feature.path)}
                            onMouseEnter={() => setHoveredNode(feature.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            onFocus={() => setHoveredNode(feature.id)}
                            onBlur={() => setHoveredNode(null)}
                            whileHover={{ scale: 1.1 }}
                            whileFocus={{ scale: 1.1 }}
                        >
                            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${feature.color} shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center relative p-1 transition-transform group-hover:shadow-[0_0_50px_rgba(255,255,255,0.4)]`}>
                                <div className="absolute inset-0 rounded-full border border-white/20" />
                                <span className="material-symbols-outlined text-white text-xl md:text-2xl drop-shadow-md">
                                    {feature.icon}
                                </span>
                            </div>

                            {/* Label Tooltip - More visible on mobile via default opacity or simpler interaction */}
                            <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 w-40 md:w-48 text-center transition-all duration-300 ${hoveredNode === feature.id ? 'opacity-100 translate-y-0' : 'opacity-80 md:opacity-40 translate-y-1'
                                }`}>
                                <h3 className="text-[10px] md:text-sm font-bold text-white tracking-tight">{feature.title}</h3>
                                <p className="hidden md:block text-[10px] text-indigo-200 leading-tight mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {feature.description}
                                </p>
                                {/* Mobile-only hint */}
                                <div className="md:hidden h-1 w-4 bg-white/20 mx-auto mt-1 rounded-full" />
                            </div>
                        </motion.button>
                    </div>
                );
            })}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes counter-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }
                
                /* Responsive tweaks for very small screens */
                @media (max-width: 640px) {
                    [css-responsive-offset="0"] { transform: translateX(110px) !important; }
                    [css-responsive-offset="1"] { transform: translateX(160px) !important; }
                    [css-responsive-offset="2"] { transform: translateX(210px) !important; }
                }

                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
