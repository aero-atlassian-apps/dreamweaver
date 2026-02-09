import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export function FullJourneyPage() {
    const navigate = useNavigate();
    const { user, setDemoUser } = useAuth();

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
            color: 'from-indigo-500/20 to-purple-500/20',
            borderColor: 'border-indigo-500/30',
            iconColor: 'text-indigo-300',
            delay: 0.1,
        },
        {
            id: 'story',
            title: 'Story Generation',
            description: 'AI-crafted narratives with perfect structure.',
            icon: 'auto_stories',
            path: '/stories/new',
            color: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/30',
            iconColor: 'text-blue-300',
            delay: 0.2,
        },
        {
            id: 'voice',
            title: 'Voice Cloning',
            description: 'Preserve the comfort of familiar voices.',
            icon: 'record_voice_over',
            path: '/settings/voice',
            color: 'from-emerald-500/20 to-teal-500/20',
            borderColor: 'border-emerald-500/30',
            iconColor: 'text-emerald-300',
            delay: 0.3,
        }
    ];

    return (
        <div className="min-h-screen bg-[#050510] text-white font-sans flex flex-col items-center relative overflow-hidden">
            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-[#050510] to-[#050510]" />

            {/* Stars/Dust overlay */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

            <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen gap-12">
                {/* Branding */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center"
                >
                    <div onClick={() => navigate('/vision')} className="cursor-pointer group inline-block">
                        <h1 className="text-5xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-3 drop-shadow-2xl group-hover:to-indigo-200 transition-all">
                            DreamWeaver
                        </h1>
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-[1px] w-12 bg-indigo-500/50"></div>
                            <p className="text-indigo-300 uppercase tracking-[0.3em] text-xs font-bold">
                                The Immersive Hub
                            </p>
                            <div className="h-[1px] w-12 bg-indigo-500/50"></div>
                        </div>
                    </div>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {features.map((feature) => (
                        <motion.button
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: feature.delay, duration: 0.6 }}
                            onClick={() => navigate(feature.path)}
                            className={`group relative overflow-hidden rounded-3xl border ${feature.borderColor} bg-white/5 p-8 text-left transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10 flex flex-col h-full gap-5">
                                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                    <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-100 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                                        {feature.description}
                                    </p>
                                </div>

                                <div className="mt-auto pt-4 flex items-center text-sm font-bold tracking-wider uppercase text-white/40 group-hover:text-white transition-colors">
                                    <span>Explore</span>
                                    <span className="material-symbols-outlined text-lg ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Dashboard Entry */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mt-8"
                >
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-3 px-8 py-4 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-100 transition-all hover:scale-105 active:scale-95"
                    >
                        <span className="material-symbols-outlined">rocket_launch</span>
                        <span className="font-bold tracking-wide">Enter the DreamWorld Dashboard</span>
                    </button>
                </motion.div>
            </main>
        </div>
    );
}
