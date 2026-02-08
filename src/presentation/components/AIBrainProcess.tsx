/**
 * AIBrainProcess Component
 * 
 * A premium, gamified visualization of the AI "backstage" process.
 * Shows "Atoms of Thought" (particles) and a scrolling Activity Feed of content-driven "Agent Events".
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIBrainProcessProps {
    childName: string;
    theme: string;
    childAge: number;
}

interface LogEntry {
    id: string;
    type: 'memory' | 'reasoning' | 'decision' | 'system' | 'safety';
    text: string;
    timestamp: string;
}

export const AIBrainProcess: React.FC<AIBrainProcessProps> = ({ childName, theme, childAge }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stageIndex, setStageIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const STAGES = [
        { id: 'memory', label: 'Retrieving Memories...', icon: 'database' },
        { id: 'reason', label: 'Reasoning Loop Active...', icon: 'psychology' },
        { id: 'craft', label: 'Crafting Narrative...', icon: 'auto_awesome' },
        { id: 'safety', label: 'Safety Validation...', icon: 'verified_user' },
    ];

    const CONTENT_EVENTS: Omit<LogEntry, 'id' | 'timestamp'>[] = [
        { type: 'system', text: 'Initializing DreamWeaver Bedtime Session...' },
        { type: 'memory', text: `Accessing Memory Vault for "${childName}"...` },
        { type: 'memory', text: `Memory found: ${childName} enjoys ${theme}-themed adventures.` },
        { type: 'reasoning', text: `Analyzing age demographic: ${childAge} years old.` },
        { type: 'reasoning', text: `Goal: Calming transition to sleep + ${theme} immersion.` },
        { type: 'decision', text: `Decision: Using 'Soothing' vocabulary profile for deep relaxation.` },
        { type: 'system', text: 'Connecting to Gemini 3 Flash Flash...' },
        { type: 'reasoning', text: 'ReAct Loop: Structuring 3-act narrative with personal hooks.' },
        { type: 'decision', text: `Including specific ${theme} elements: [dynamic_hook_applied].` },
        { type: 'safety', text: 'Safety Filter: Validating content for bedtime compliance...' },
        { type: 'safety', text: 'Filter Result: PASS (G-Rated, No Overstimulation).' },
        { type: 'system', text: 'Finalizing narrative tokens...' },
    ];

    // Add logs one by one
    useEffect(() => {
        let currentIdx = 0;
        const addNextLog = () => {
            if (currentIdx < CONTENT_EVENTS.length) {
                const event = CONTENT_EVENTS[currentIdx];
                setLogs(prev => [...prev, {
                    ...event,
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }]);
                currentIdx++;

                // Update stage index based on approximate progress
                if (currentIdx === 3) setStageIndex(1); // To Reason
                if (currentIdx === 6) setStageIndex(2); // To Craft
                if (currentIdx === 9) setStageIndex(3); // To Safety

                const nextDelay = 1200 + Math.random() * 800; // Varying delay for realism
                setTimeout(addNextLog, nextDelay);
            }
        };

        addNextLog();
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const currentStage = STAGES[stageIndex];

    return (
        <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-2xl mx-auto px-4">
            {/* Top Visualization Row */}
            <div className="flex flex-col md:flex-row items-center gap-12 w-full">

                {/* The "Atomic" Core (Left/Center) */}
                <div className="relative h-48 w-48 flex items-center justify-center shrink-0">
                    <motion.div
                        className="absolute inset-0 bg-primary/20 rounded-full blur-[40px]"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                    <motion.div
                        className="relative z-10 h-16 w-16 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(122,158,255,0.4)] border border-white/20"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <span className="material-symbols-outlined text-white text-3xl animate-pulse">
                            hub
                        </span>
                    </motion.div>

                    {/* Orbiting Atoms */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute h-1.5 w-1.5 rounded-full bg-primary/60"
                            animate={{
                                x: [Math.cos(i * 60) * 60, 0],
                                y: [Math.sin(i * 60) * 60, 0],
                                opacity: [0, 1, 0],
                                scale: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeIn"
                            }}
                        />
                    ))}
                </div>

                {/* Status and Active Stage (Right/Center) */}
                <div className="flex-1 text-left space-y-4">
                    <div className="space-y-1">
                        <div className="text-xs uppercase tracking-widest text-primary font-bold opacity-70">Internal State</div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStage.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center gap-3"
                            >
                                <span className="material-symbols-outlined text-primary text-3xl">
                                    {currentStage.icon}
                                </span>
                                <h3 className="text-2xl font-bold font-serif text-white">{currentStage.label}</h3>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary shadow-[0_0_10px_#7a9eff]"
                            initial={{ width: '0%' }}
                            animate={{ width: `${(stageIndex + 1) * 25}%` }}
                        />
                    </div>
                    <p className="text-white/40 text-sm">
                        DreamWeaver Engine v0.1.0-beta • Latency: 124ms
                    </p>
                </div>
            </div>

            {/* The Activity Log (The "Backstage" Feed) */}
            <div className="w-full bg-black/40 rounded-xl border border-white/10 overflow-hidden shadow-inner">
                <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-tighter">Live Agent Analytics</span>
                    </div>
                    <span className="text-[10px] font-mono text-primary/70">AGENT_01_REASONING</span>
                </div>

                <div
                    ref={scrollRef}
                    className="h-48 overflow-y-auto p-4 font-mono text-xs space-y-2 no-scrollbar scroll-smooth"
                >
                    <AnimatePresence initial={false}>
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-3 leading-tight"
                            >
                                <span className="text-white/30 shrink-0">[{log.timestamp}]</span>
                                <span className={`
                                    ${log.type === 'memory' ? 'text-blue-400' : ''}
                                    ${log.type === 'reasoning' ? 'text-purple-400' : ''}
                                    ${log.type === 'decision' ? 'text-yellow-400' : ''}
                                    ${log.type === 'safety' ? 'text-green-400' : ''}
                                    ${log.type === 'system' ? 'text-white/70 italic' : ''}
                                `}>
                                    <span className="opacity-50 mr-1">{log.type.toUpperCase()}:</span>
                                    {log.text}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {logs.length === 0 && (
                        <div className="text-white/20 animate-pulse italic">Scanning neural pathways...</div>
                    )}
                </div>
            </div>

            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
                Privacy Guaranteed • End-to-End Encrypted Generation
            </p>
        </div>
    );
};
