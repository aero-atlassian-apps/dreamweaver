/**
 * DemoLiveSession Component
 * 
 * The UI wrapper for the Real-Time Agentic Experience in DEMO MODE.
 */

import React from 'react';
import { useDemoGeminiLive } from '../hooks/useDemoGeminiLive';
import { Button } from './ui/Button';

interface DemoLiveSessionProps {
    childName: string;
    childAge: number;
}

export const DemoLiveSession: React.FC<DemoLiveSessionProps> = ({ childName, childAge }) => {
    const { connect, disconnect, isConnected, isSpeaking, error } = useDemoGeminiLive();

    const handleToggleSession = () => {
        if (isConnected) {
            disconnect();
        } else {
            connect(childName, childAge);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl shadow-2xl border border-white/10 animate-fade-in">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Bedtime Conductor Live (Demo)</h2>
                <p className="text-slate-400 text-sm">Real-time, voice-interactive storytelling</p>
            </div>

            {/* Visualization Orb */}
            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${isConnected ? 'bg-indigo-900/40 shadow-[0_0_50px_rgba(79,70,229,0.3)]' : 'bg-slate-800'
                }`}>
                <div className={`w-32 h-32 rounded-full transition-all duration-300 ${isSpeaking
                    ? 'bg-indigo-400 scale-110 animate-pulse shadow-[0_0_80px_rgba(129,140,248,0.6)]'
                    : isConnected
                        ? 'bg-indigo-600 scale-100'
                        : 'bg-slate-600'
                    }`}>
                    {/* Status Icon */}
                    <div className="absolute inset-0 flex items-center justify-center text-white/90 text-4xl">
                        {isConnected ? (isSpeaking ? '🗣️' : '👂') : '😴'}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center space-y-4 w-full">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg text-sm">
                        Error: {error}
                    </div>
                )}

                <Button
                    onClick={handleToggleSession}
                    className={`w-full max-w-xs h-12 text-lg font-medium transition-all ${isConnected
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                >
                    {isConnected ? 'End Session' : 'Start Live Session'}
                </Button>

                {isConnected && (
                    <p className="text-xs text-slate-500 animate-pulse">
                        Listening to {childName}...
                    </p>
                )}

                <div className="text-xs text-slate-600 max-w-xs text-center">
                    Note: This is a demo session. Memories will be saved to the public Demo User account.
                </div>
            </div>
        </div>
    );
};
