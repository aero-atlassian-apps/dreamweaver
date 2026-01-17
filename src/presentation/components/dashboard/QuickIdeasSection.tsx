/**
 * QuickIdeasSection - Quick theme selection chips
 * 
 * Extracted from DashboardPage for Single Responsibility.
 */

import { Card } from '../ui/Card'

interface QuickIdea {
    id: string
    label: string
    icon: string
    colorClass: string
}

interface QuickIdeasSectionProps {
    onSelectTheme: (themeId: string) => void
}

const QUICK_IDEAS: QuickIdea[] = [
    { id: 'space', label: 'Space', icon: 'rocket_launch', colorClass: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'robots', label: 'Robots', icon: 'smart_toy', colorClass: 'bg-cyan-500/20 text-cyan-300' },
    { id: 'fantasy', label: 'Fantasy', icon: 'auto_fix_high', colorClass: 'bg-purple-500/20 text-purple-300' },
    { id: 'replay', label: 'Again!', icon: 'replay', colorClass: 'bg-orange-500/20 text-orange-300' },
]

export function QuickIdeasSection({ onSelectTheme }: QuickIdeasSectionProps) {
    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold tracking-tight text-white">Quick Ideas</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
                {QUICK_IDEAS.map((idea) => (
                    <Card
                        key={idea.id}
                        variant="interactive"
                        padding="sm"
                        className="snap-start flex min-h-[3.25rem] shrink-0 items-center gap-2.5 px-4 pr-5 active:bg-white/5"
                        onClick={() => onSelectTheme(idea.id)}
                    >
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${idea.colorClass}`}>
                            <span className="material-symbols-outlined text-[18px]">{idea.icon}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-200">{idea.label}</span>
                    </Card>
                ))}
            </div>
        </section>
    )
}
