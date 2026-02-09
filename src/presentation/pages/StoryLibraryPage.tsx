import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStoryHistory } from '../hooks/useStoryHistory'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { BottomNavigation } from '../components/dashboard/BottomNavigation'

export function StoryLibraryPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const userId = user?.id || 'guest'
    const { stories } = useStoryHistory(userId)
    const [query, setQuery] = useState('')

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return stories
        return stories.filter(s => s.title.toLowerCase().includes(q) || s.theme.toLowerCase().includes(q))
    }, [stories, query])

    const featured = filtered.slice(0, 3)
    const recent = filtered.slice(0, 20)

    return (
        <div className="min-h-screen bg-background-dark font-sans text-white pb-24">
            <header className="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-white/5">
                <div className="w-full max-w-5xl mx-auto">
                    <div className="flex items-center justify-between p-5 pb-3">
                        <h1 className="text-2xl font-bold tracking-tight">Story Library</h1>
                        <Button variant="icon" className="h-10 w-10 rounded-full" onClick={() => navigate('/profile')}>
                            <span className="material-symbols-outlined text-[22px]">person</span>
                        </Button>
                    </div>
                    <div className="px-5 pb-4">
                        <label className="flex flex-col h-12 w-full">
                            <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-black/30 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-primary transition-all">
                                <div className="text-text-secondary flex items-center justify-center pl-4 pr-2">
                                    <span className="material-symbols-outlined text-[24px]">search</span>
                                </div>
                                <input
                                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl bg-transparent text-white focus:outline-0 border-none h-full placeholder:text-text-secondary px-0 text-base font-normal leading-normal"
                                    placeholder="Find a dream..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                        </label>
                    </div>
                </div>
            </header>

            <main className="px-5 pt-6 space-y-8 w-full max-w-5xl mx-auto">
                <section className="space-y-4">
                    <h2 className="text-white tracking-tight text-[22px] font-bold leading-tight">Featured for Tonight</h2>
                    <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 snap-x snap-mandatory">
                        {featured.length === 0 ? (
                            <Card variant="solid" className="min-w-[280px] snap-center border border-white/10 p-6 text-text-subtle">
                                No stories yet. Create one tonight.
                            </Card>
                        ) : (
                            featured.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex flex-col gap-3 min-w-[280px] snap-center group cursor-pointer"
                                    onClick={() => navigate(`/stories/${s.id}`)}
                                >
                                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg shadow-black/20 bg-white/5 border border-white/10">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="h-12 w-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>play_arrow</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                            <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                                                {Math.max(1, s.getEstimatedReadingTime())} min
                                            </div>
                                            <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white capitalize">
                                                {s.theme}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-white text-lg font-semibold leading-tight mb-1">{s.title}</h3>
                                        <div className="flex items-center gap-2 text-text-subtle text-sm">
                                            <span className="material-symbols-outlined text-[16px] text-primary">record_voice_over</span>
                                            In your voice
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-white tracking-tight text-xl font-bold leading-tight">Explore Genres</h3>
                    <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
                        {['All', 'Cozy', 'Adventure', 'Space', 'Animals', 'Fantasy'].map((g) => (
                            <button
                                key={g}
                                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-slate-200 text-sm font-medium whitespace-nowrap hover:bg-white/10 transition-colors"
                                onClick={() => {
                                    if (g === 'All') setQuery('')
                                    else setQuery(g.toLowerCase())
                                }}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-white tracking-tight text-xl font-bold leading-tight">Recent</h3>
                        <Button variant="secondary" onClick={() => navigate('/stories/new')}>
                            Create
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {recent.map((s) => (
                            <Card
                                key={s.id}
                                variant="interactive"
                                padding="sm"
                                className="flex items-center justify-between gap-4 border border-white/10"
                                onClick={() => navigate(`/stories/${s.id}`)}
                            >
                                <div className="flex flex-col">
                                    <div className="text-white font-semibold">{s.title}</div>
                                    <div className="text-text-subtle text-sm capitalize">{s.theme}</div>
                                </div>
                                <span className="material-symbols-outlined text-white/40">chevron_right</span>
                            </Card>
                        ))}
                    </div>
                </section>
            </main>

            <BottomNavigation
                activeItem="library"
                onNavigate={(itemId) => {
                    if (itemId === 'home') navigate('/dashboard')
                    if (itemId === 'library') navigate('/stories/library')
                    if (itemId === 'memory') navigate('/memory')
                    if (itemId === 'settings') navigate('/profile')
                }}
            />
        </div>
    )
}
