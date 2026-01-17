/**
 * MemoryCard Component - Display a story memory in the vault
 * 
 * Per design_vFinal.md Section 6.1:
 * - Illustration thumbnail
 * - Star icon for featured
 * - Title/quote text
 * - Audio indicator: 🎙️ 0:08 • Tonight 8:22 PM
 * - Tags as pills
 * - Actions: Play and Share
 */

import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

export interface MemoryCardProps {
    id: string
    title: string
    quote?: string
    thumbnailUrl?: string
    isStarred?: boolean
    audioDuration?: string
    timestamp: string
    tags: string[]
    onPlay?: () => void
    onShare?: () => void
    onClick?: () => void
}

export function MemoryCard({
    title,
    quote,
    thumbnailUrl,
    isStarred = false,
    audioDuration,
    timestamp,
    tags,
    onPlay,
    onShare,
    onClick,
}: MemoryCardProps) {
    return (
        <Card
            variant="interactive"
            padding="none"
            className="overflow-hidden"
            onClick={onClick}
        >
            <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br from-primary/30 to-accent-secondary/30 flex items-center justify-center overflow-hidden">
                    {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="material-symbols-outlined text-3xl text-white/50">auto_stories</span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title with star */}
                    <div className="flex items-start gap-2 mb-1">
                        {isStarred && (
                            <span className="text-yellow-400 text-sm">⭐</span>
                        )}
                        <h3 className="text-base font-semibold text-white truncate">{title}</h3>
                    </div>

                    {/* Quote */}
                    {quote && (
                        <p className="text-sm text-text-subtle line-clamp-2 mb-2 italic">
                            "{quote}"
                        </p>
                    )}

                    {/* Metadata row */}
                    <div className="flex items-center gap-2 text-xs text-text-subtle mb-2">
                        {audioDuration && (
                            <>
                                <span className="inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">mic</span>
                                    {audioDuration}
                                </span>
                                <span>•</span>
                            </>
                        )}
                        <span>{timestamp}</span>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {tags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-text-subtle"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                onPlay?.()
                            }}
                            leftIcon={<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>}
                        >
                            Play
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                onShare?.()
                            }}
                            leftIcon={<span className="material-symbols-outlined text-sm">share</span>}
                        >
                            Share
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}
