/**
 * HeroSuggestionCard - AI-suggested story card for dashboard
 * 
 * Extracted from DashboardPage for Single Responsibility.
 */

import { Button } from '../ui/Button'

interface HeroSuggestionCardProps {
    title: string
    description: string
    imageUrl: string
    voiceLabel: string
    duration: string
    onStart: () => void
}

export function HeroSuggestionCard({
    title,
    description,
    imageUrl,
    voiceLabel,
    duration,
    onStart,
}: HeroSuggestionCardProps) {
    return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-card-dark border border-accent-green/40 animate-pulse-border shadow-2xl shadow-black/40 group cursor-pointer hover:border-accent-green/60 transition-colors">
            {/* AI Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-accent-green/10 px-3 py-1 backdrop-blur-md border border-accent-green/30 shadow-sm">
                <span className="material-symbols-outlined text-accent-green text-[18px]">smart_toy</span>
                <span className="text-xs font-bold text-accent-green tracking-wide">AI SUGGESTION</span>
            </div>

            {/* Card Image */}
            <div className="relative aspect-video w-full bg-slate-800">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-85 transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('${imageUrl}')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-card-dark/60 to-transparent"></div>
            </div>

            {/* Card Content */}
            <div className="relative -mt-16 flex flex-col gap-3 px-5 pb-5">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold leading-tight text-white drop-shadow-lg">{title}</h2>
                    <p className="text-sm text-slate-300/90 font-medium line-clamp-1 leading-relaxed">{description}</p>
                </div>

                {/* Meta Tags */}
                <div className="flex flex-wrap gap-2 py-1">
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 border border-white/5 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-primary text-[16px]">record_voice_over</span>
                        <span className="text-xs font-medium text-slate-200">{voiceLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 border border-white/5 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-text-subtle text-[16px]">schedule</span>
                        <span className="text-xs font-medium text-slate-300">{duration}</span>
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    variant="primary"
                    className="mt-2 w-full"
                    leftIcon={<span className="material-symbols-outlined group-hover:animate-pulse">play_circle</span>}
                    onClick={onStart}
                >
                    Start This Story
                </Button>
            </div>
        </div>
    )
}
