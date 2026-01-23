/**
 * AudioPlayer Component - Bedtime story audio playback with controls
 * 
 * Features:
 * - Play/Pause toggle
 * - Seek progress bar
 * - Current time / Duration display
 * - Sleep-friendly design with muted colors
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './Button'

interface AudioPlayerProps {
    audioUrl: string
    title?: string
    onComplete?: () => void
    autoPlay?: boolean
    className?: string
}

export function AudioPlayer({
    audioUrl,
    title,
    onComplete,
    onSkip,
    autoPlay = false,
    className = '',
}: AudioPlayerProps & { onSkip?: () => void }) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    // Format time as MM:SS
    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }, [])

    // Handle play/pause
    const togglePlayPause = useCallback(() => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }, [isPlaying])

    // Handle seek
    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return
        const time = parseFloat(e.target.value)
        audioRef.current.currentTime = time
        setCurrentTime(time)
    }, [])

    // Skip forward/backward
    const skip = useCallback((seconds: number) => {
        if (!audioRef.current) return
        audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }, [currentTime, duration])

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
        const handleLoadedMetadata = () => {
            setDuration(audio.duration)
            setIsLoading(false)
            if (autoPlay) {
                audio.play()
                setIsPlaying(true)
            }
        }
        const handleEnded = () => {
            setIsPlaying(false)
            onComplete?.()
        }
        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
        }
    }, [autoPlay, onComplete])

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className={`bg-card-dark/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4 ${className}`}>
            {/* Hidden audio element */}
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Title */}
            {title && (
                <p className="text-sm font-medium text-text-subtle mb-3 truncate">{title}</p>
            )}

            {/* Progress bar */}
            <div className="relative mb-3">
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    disabled={isLoading}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer 
                               [&::-webkit-slider-thumb]:appearance-none 
                               [&::-webkit-slider-thumb]:h-3 
                               [&::-webkit-slider-thumb]:w-3 
                               [&::-webkit-slider-thumb]:rounded-full 
                               [&::-webkit-slider-thumb]:bg-primary
                               [&::-webkit-slider-thumb]:shadow-lg"
                    style={{
                        background: `linear-gradient(to right, var(--color-primary) ${progress}%, rgba(255,255,255,0.1) ${progress}%)`,
                    }}
                />
            </div>

            {/* Time display */}
            <div className="flex justify-between text-xs text-text-subtle mb-4">
                <span>{formatTime(currentTime)}</span>
                <span>{isLoading ? '--:--' : formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                {/* Rewind 15s */}
                <Button
                    variant="icon"
                    className="h-10 w-10"
                    onClick={() => skip(-15)}
                    disabled={isLoading}
                >
                    <span className="material-symbols-outlined text-xl">replay_10</span>
                </Button>

                {/* Play/Pause */}
                <Button
                    variant="primary"
                    className="h-14 w-14 rounded-full"
                    onClick={togglePlayPause}
                    disabled={isLoading}
                >
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                </Button>

                {/* Forward 15s */}
                <Button
                    variant="icon"
                    className="h-10 w-10"
                    onClick={() => { skip(15); onSkip?.() }}
                    disabled={isLoading}
                >
                    <span className="material-symbols-outlined text-xl">forward_10</span>
                </Button>
            </div>
        </div>
    )
}
