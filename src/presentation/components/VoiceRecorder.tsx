/**
 * VoiceRecorder Component
 * 
 * Simple UI for recording voice samples (Demo Mode).
 * Uses MediaRecorder API to capture audio as a Blob.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';

interface VoiceRecorderProps {
    onRecordingComplete: (file: Blob, duration: number) => void;
    onCancel?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Microphone access denied. Please allow microphone access to record.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleReset = () => {
        setAudioBlob(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setRecordingTime(0);
    };

    const handleSave = () => {
        if (audioBlob) {
            onRecordingComplete(audioBlob, recordingTime);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-6 bg-slate-800/50 rounded-2xl border border-white/10 w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-white">Record Your Voice</h3>

            <div className="text-center space-y-2">
                <p className="text-white/60 text-sm">
                    Read this sentence clearly:
                </p>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-indigo-300 italic font-medium">
                    "Once upon a time, in a magical forest, lived a tiny dragon named Spark."
                </div>
            </div>

            {/* Timer */}
            <div className="text-4xl font-mono font-bold text-white tracking-wider">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </div>

            {/* Visualizer / Status */}
            <div className={`h-16 w-full rounded-xl flex items-center justify-center transition-colors ${isRecording ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5'
                }`}>
                {isRecording ? (
                    <div className="flex gap-1 h-8 items-center">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-1 bg-red-500 rounded-full animate-wave" style={{
                                height: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.1}s`
                            }} />
                        ))}
                    </div>
                ) : audioUrl ? (
                    <audio src={audioUrl} controls className="h-8 w-64" />
                ) : (
                    <span className="text-white/30 text-sm">Tap mic to start</span>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-4 w-full">
                {!audioBlob ? (
                    !isRecording ? (
                        <Button onClick={startRecording} variant="primary" fullWidth className="bg-red-500 hover:bg-red-600">
                            <span className="material-symbols-outlined mr-2">mic</span>
                            Start Recording
                        </Button>
                    ) : (
                        <Button onClick={stopRecording} variant="secondary" fullWidth className="bg-white/10 hover:bg-white/20">
                            <span className="material-symbols-outlined mr-2">stop</span>
                            Stop
                        </Button>
                    )
                ) : (
                    <div className="flex gap-2 w-full">
                        <Button onClick={handleReset} variant="ghost" className="flex-1">
                            Retake
                        </Button>
                        <Button onClick={handleSave} variant="primary" className="flex-[2]">
                            <span className="material-symbols-outlined mr-2">check</span>
                            Use This Voice
                        </Button>
                    </div>
                )}
            </div>

            {onCancel && (
                <button onClick={onCancel} className="text-xs text-white/40 hover:text-white transition-colors">
                    Cancel
                </button>
            )}
        </div>
    );
};
