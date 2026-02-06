/**
 * AgentSuggestionCard - Dashboard component for AI suggestions
 * 
 * Per design_vFinal.md Section 1.4:
 * - Background: --bg-tertiary
 * - Border: 2px solid var(--agent-suggestion) (#34D399)
 * - Prefix: "✨ DreamWeaver suggests"
 * - Soft pulse animation
 */

import { Button } from '../ui/Button'

export interface AgentSuggestionCardProps {
    suggestion: {
        title: string
        theme: string
        reasoning: string
        suggestedDuration: number
    }
    onStartStory: () => void
    onDismiss?: () => void
    className?: string
}

export function AgentSuggestionCard({
    suggestion,
    onStartStory,
    onDismiss,
    className = '',
}: AgentSuggestionCardProps) {
    return (
        <div
            className={`agent-suggestion-card ${className}`}
            style={{
                // [PHASE-3] Full Glassmorphism per design_vFinal.md
                background: 'rgba(30, 41, 66, 0.65)',
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                animation: 'softPulse 3s ease-in-out infinite',
            }}
        >
            {/* Header with agent badge */}
            <div className="flex items-center justify-between mb-3">
                <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--agent-suggestion, #34D399)' }}
                >
                    ✨ DreamWeaver suggests
                </span>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-text-subtle hover:text-white transition-colors"
                        aria-label="Dismiss suggestion"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                )}
            </div>

            {/* Story title */}
            <h3 className="text-xl font-serif font-semibold text-white mb-2">
                {suggestion.title}
            </h3>

            {/* Theme badge */}
            <div className="flex items-center gap-2 mb-3">
                <span
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                        background: 'rgba(124, 159, 255, 0.15)',
                        color: 'var(--accent-primary, #7C9FFF)',
                    }}
                >
                    {suggestion.theme}
                </span>
                <span className="text-xs text-text-subtle">
                    ~{suggestion.suggestedDuration} min
                </span>
            </div>

            {/* Reasoning - the "why" explanation */}
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                {suggestion.reasoning}
            </p>

            {/* CTA Button */}
            <Button
                variant="primary"
                className="w-full"
                onClick={onStartStory}
            >
                <span className="material-symbols-outlined mr-2">play_arrow</span>
                Start This Story
            </Button>

            {/* Pulse animation keyframes */}
            <style>{`
                @keyframes softPulse {
                    0%, 100% { 
                        box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.2); 
                    }
                    50% { 
                        box-shadow: 0 0 20px 4px rgba(52, 211, 153, 0.3); 
                    }
                }
            `}</style>
        </div>
    )
}
