import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageTransition } from '../components/ui/PageTransition'
import { useAgentSuggestion } from '../hooks/useAgentSuggestion'
import { useStoryHistory } from '../hooks/useStoryHistory'
import { useMoments } from '../hooks/useMoments'
import { supabase } from '../../infrastructure/supabase/client'
import { BottomNavigation } from '../components/dashboard/BottomNavigation'

export function DashboardPage() {
    const { user, session } = useAuth()
    const navigate = useNavigate()
    const [lastAgentEvent, setLastAgentEvent] = useState<string | null>(null)

    // Data fetching
    const userId = user?.id || ''
    const { suggestion, isLoading: suggestionLoading, refresh } = useAgentSuggestion({
        childName: user?.user_metadata?.['child_name'] || 'Emma',
        childAge: user?.user_metadata?.['child_age'] || 5,
    })
    const { stories } = useStoryHistory(userId)
    const { moments } = useMoments(userId)

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 17) return 'Good Afternoon'
        return 'Good Evening'
    }

    const userName = user?.user_metadata?.['full_name'] || user?.email?.split('@')[0] || 'Sarah'

    const handleStartStory = () => {
        if (suggestion) {
            navigate(`/stories/new?topic=${encodeURIComponent(suggestion.title)}&theme=${encodeURIComponent(suggestion.theme)}`)
        }
    }

    const handleQuickTheme = (themeId: string) => {
        navigate(`/stories/new?theme=${encodeURIComponent(themeId)}`)
    }

    const handleAgain = async () => {
        try {
            if (!session?.access_token) {
                navigate('/stories/new?againOf=last')
                return
            }
            // Use local stories if available to avoid API call lag
            if (stories.length > 0) {
                navigate(`/stories/new?againOf=${encodeURIComponent(stories[0].id)}`)
                return
            }

            navigate('/stories/new')
        } catch {
            navigate('/stories/new')
        }
    }

    useEffect(() => {
        const sb = supabase
        if (!sb) return
        if (!userId) return

        const channel = sb
            .channel(`dw:domain_events:${userId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'domain_events', filter: `user_id=eq.${userId}` }, (payload) => {
                const row = payload.new as Record<string, unknown>
                const type = row['type']
                if (typeof type === 'string') setLastAgentEvent(type)
            })
            .subscribe()

        return () => {
            sb.removeChannel(channel)
        }
    }, [userId])

    // Get recent moments (first 2)
    const recentMoments = moments.slice(0, 2)

    return (
        <div className="bg-background-dark font-sans text-white min-h-screen flex flex-col overflow-x-hidden selection:bg-primary/30">
            {/* Desktop Header (Branding) */}
            <header className="hidden md:block bg-background-dark/95 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="flex items-center justify-between px-8 py-5 w-full max-w-5xl mx-auto">
                    <Link to="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <img src="/logo-icon-backgroundless.png" alt="DreamWeaver" className="h-9 object-contain" />
                        <span className="text-xl font-serif font-bold text-white tracking-tight">DreamWeaver</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <nav className="flex gap-6 text-sm font-medium text-text-subtle">
                            <button onClick={() => navigate('/stories/library')} className="hover:text-white transition-colors">Stories</button>
                            <button onClick={() => navigate('/memory')} className="hover:text-white transition-colors">Memories</button>
                        </nav>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-white">{userName}</span>
                            <div
                                className="h-9 w-9 rounded-full bg-cover bg-center ring-2 ring-primary/20"
                                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAaAg4nzgiSBrh_IFtzG-5x16E1vkOIX1qSGlDE3--fWEaswVETihzqogLRaMcZTHO-ue_oAfHS0JHMUb7GRWm50EVP9vnmoZm2Lhil60T9lw8UwOjmv4-XOMXincbc_od3W_TxID9CUGqBOMMjh_fWnhBq58TY7aaSUxhSpfm72ZTDpF-JLcxloVlUdz0fNuA3SjfcHNryF74VVsUGGos-ghN5qt3yvdKE0_w1C7eUYAe1ApbCOiCPcfks8ab0BqkS1l5-iGtTKol')" }}
                            ></div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Header (User Centric) */}
            <header className="md:hidden sticky top-0 z-50 flex items-center justify-between px-5 pt-6 pb-4 bg-background-dark/95 backdrop-blur-xl border-b border-transparent border-white/5 transition-all">
                <div className="flex items-center gap-3.5">
                    <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
                        <div
                            className="h-10 w-10 rounded-full bg-cover bg-center ring-2 ring-primary/20 transition-all group-hover:ring-primary/50"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAaAg4nzgiSBrh_IFtzG-5x16E1vkOIX1qSGlDE3--fWEaswVETihzqogLRaMcZTHO-ue_oAfHS0JHMUb7GRWm50EVP9vnmoZm2Lhil60T9lw8UwOjmv4-XOMXincbc_od3W_TxID9CUGqBOMMjh_fWnhBq58TY7aaSUxhSpfm72ZTDpF-JLcxloVlUdz0fNuA3SjfcHNryF74VVsUGGos-ghN5qt3yvdKE0_w1C7eUYAe1ApbCOiCPcfks8ab0BqkS1l5-iGtTKol')" }}
                        ></div>
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background-dark"></div>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-xs text-text-subtle font-medium tracking-wide uppercase">{getGreeting()}</p>
                        <h1 className="text-lg font-bold leading-none tracking-tight">{userName} 🌙</h1>
                    </div>
                </div>
                <Button
                    variant="icon"
                    onClick={() => navigate('/settings/voice')}
                    className="rounded-xl h-10 w-10"
                >
                    <span className="material-symbols-outlined text-[22px]">settings</span>
                </Button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col gap-8 p-5 pb-32 md:pb-10 w-full max-w-5xl mx-auto">
                {lastAgentEvent && (
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-text-subtle">
                        Live agent event: <span className="text-white font-semibold">{lastAgentEvent}</span>
                    </div>
                )}
                {/* Hero: Agent Suggestion Card */}
                <PageTransition>
                    {suggestionLoading || !suggestion ? (
                        <div className="relative w-full overflow-hidden rounded-2xl bg-card-dark border border-white/10 p-8 text-center">
                            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">auto_awesome</span>
                            <p className="mt-3 text-text-subtle">Finding the perfect story...</p>
                        </div>
                    ) : (
                        <div className="relative w-full overflow-hidden rounded-2xl bg-card-dark border border-accent-green/40 animate-pulse-border shadow-2xl shadow-black/40 group cursor-pointer hover:border-accent-green/60 transition-colors">
                            {/* AI Badge */}
                            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-accent-green/10 px-3 py-1 backdrop-blur-md border border-accent-green/30 shadow-sm">
                                <span className="material-symbols-outlined text-accent-green text-[18px]">smart_toy</span>
                                <span className="text-xs font-bold text-accent-green tracking-wide">AI SUGGESTION</span>
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={refresh}
                                className="absolute top-4 right-4 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-white/5 border border-white/10 text-text-subtle hover:text-white hover:bg-white/10 transition-all"
                                aria-label="Get new suggestion"
                            >
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                            </button>

                            {/* Card Image */}
                            <div className="relative aspect-video w-full bg-slate-800">
                                <div
                                    className="absolute inset-0 bg-cover bg-center opacity-85 transition-transform duration-700 group-hover:scale-105"
                                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDnUzuLPgFUYEq1RIhN6HmRWfBCdKE5hMiAkG8EO3uWoLZUaxGO68KTqvyjSFg25MwAYkDjlb_TkHtZ_o5BifmhEqpqnw6_F2MDvGuZcjzKCy-mS_RYGqYu5nveXy9LT0W-tE5dLzeBCOF1dD1-b3ddAPAC7kWOTwk1P6r6Ut_6do6UNKvmtN0jcygBm91IOblR8k0pnNTg4iowKoF8_lgY2APX2VswjfeMoYMqu0v4f4PMKKctvUH7fCww1j1fO9gyJWjKpc4PBXT8')" }}
                                ></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-card-dark/60 to-transparent"></div>
                            </div>

                            {/* Card Content */}
                            <div className="relative -mt-16 flex flex-col gap-3 px-5 pb-5">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-2xl font-bold leading-tight text-white drop-shadow-lg">{suggestion.title}</h2>
                                    <p className="text-sm text-slate-300/90 font-medium line-clamp-2 leading-relaxed">{suggestion.reasoning}</p>
                                </div>

                                {/* Meta Tags */}
                                <div className="flex flex-wrap gap-2 py-1">
                                    <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 border border-white/5 backdrop-blur-sm">
                                        <span className="material-symbols-outlined text-primary text-[16px]">category</span>
                                        <span className="text-xs font-medium text-slate-200">{suggestion.theme}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 border border-white/5 backdrop-blur-sm">
                                        <span className="material-symbols-outlined text-text-subtle text-[16px]">schedule</span>
                                        <span className="text-xs font-medium text-slate-300">{suggestion.suggestedDuration} min</span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Button
                                    variant="primary"
                                    className="mt-2 w-full"
                                    onClick={handleStartStory}
                                    leftIcon={<span className="material-symbols-outlined group-hover:animate-pulse">play_circle</span>}
                                >
                                    Start This Story
                                </Button>
                            </div>
                        </div>
                    )}
                </PageTransition>

                {/* Live Mode Entry (Phase 13 Integration) */}
                <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                            Interactive Discovery
                            <span className="px-2 py-0.5 rounded-full bg-accent-secondary/10 border border-accent-secondary/20 text-[10px] text-accent-secondary font-bold">LIVE</span>
                        </h3>
                    </div>
                    <Card
                        variant="interactive"
                        padding="none"
                        className="group relative overflow-hidden aspect-[21/9] flex items-center border border-white/10"
                        onClick={() => navigate('/live')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-background-dark/40 to-transparent z-10" />
                        <div
                            className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCHXG298v6hTz-VdE-9Yf_79S_n8-M_6F-B9N997C9B-9F-9F-9F-9F-9F-9F-9F-9F-9F-9F-9F-9F-9F-9F-9F-9F')" }}
                        >
                            <div className="absolute inset-0 bg-accent-secondary/20 mix-blend-color" />
                        </div>

                        <div className="relative z-20 px-6 space-y-2">
                            <div className="flex items-center gap-2 text-accent-secondary">
                                <span className="material-symbols-outlined text-[20px] animate-pulse">waves</span>
                                <span className="text-xs font-bold tracking-widest uppercase">Live Voice Mode</span>
                            </div>
                            <h4 className="text-xl font-bold text-white leading-tight">Bedtime Lab</h4>
                            <p className="text-text-subtle text-xs pr-12 line-clamp-2">Talk directly to the Bedtime Conductor. No buttons, just voice.</p>
                            <div className="flex items-center gap-2 mt-2 text-primary text-xs font-bold transition-transform group-hover:translate-x-1">
                                Enter Lab
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Quick Ideas */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold tracking-tight text-white">Quick Ideas</h3>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
                        {/* Space */}
                        <Card variant="interactive" padding="sm" className="snap-start flex min-h-[3.25rem] shrink-0 items-center gap-2.5 px-4 pr-5 active:bg-white/5" onClick={() => handleQuickTheme('space')}>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                            </div>
                            <span className="text-sm font-medium text-slate-200">Space</span>
                        </Card>
                        {/* Robots */}
                        <Card variant="interactive" padding="sm" className="snap-start flex min-h-[3.25rem] shrink-0 items-center gap-2.5 px-4 pr-5 active:bg-white/5" onClick={() => handleQuickTheme('robots')}>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                            </div>
                            <span className="text-sm font-medium text-slate-200">Robots</span>
                        </Card>
                        {/* Fantasy */}
                        <Card variant="interactive" padding="sm" className="snap-start flex min-h-[3.25rem] shrink-0 items-center gap-2.5 px-4 pr-5 active:bg-white/5" onClick={() => handleQuickTheme('fantasy')}>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
                                <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                            </div>
                            <span className="text-sm font-medium text-slate-200">Fantasy</span>
                        </Card>
                        {/* Again */}
                        <Card variant="interactive" padding="sm" className="snap-start flex min-h-[3.25rem] shrink-0 items-center gap-2.5 px-4 pr-5 active:bg-white/5" onClick={handleAgain}>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-300">
                                <span className="material-symbols-outlined text-[18px]">replay</span>
                            </div>
                            <span className="text-sm font-medium text-slate-200">Again!</span>
                        </Card>
                    </div>
                </section>

                {/* This Week's Moments */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold tracking-tight text-white">This Week's Moments</h3>
                        <button
                            className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-primary/10"
                            onClick={() => navigate('/memory')}
                        >
                            View All
                        </button>
                    </div>
                    <div className="flex flex-col md:grid md:grid-cols-2 gap-3">
                        {recentMoments.length > 0 ? recentMoments.map((moment) => (
                            <Card
                                key={moment.id}
                                variant="interactive"
                                padding="sm"
                                className="flex items-center gap-4 pr-4"
                                onClick={() => navigate('/memory')}
                            >
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg shadow-md">
                                    <div
                                        className="h-full w-full bg-cover bg-center transition-transform group-hover:scale-110"
                                        style={{ backgroundImage: `url('${moment.media_url || 'https://placehold.co/200/indigo/white?text=Memory'}')` }}
                                    ></div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                        <span className="material-symbols-outlined text-white/90 text-xl drop-shadow-md">play_arrow</span>
                                    </div>
                                </div>
                                <div className="flex flex-1 flex-col justify-center gap-0.5">
                                    <h4 className="text-base font-bold text-white line-clamp-1">{moment.description.split(':')[0]}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-text-subtle font-medium">
                                            {new Date(moment.created_at).toLocaleDateString(undefined, { weekday: 'long' })}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs text-text-subtle font-medium">
                                            <span className="h-0.5 w-0.5 rounded-full bg-slate-600"></span>
                                            <span>Captured</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="icon" className="h-8 w-8 rounded-full">
                                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                </Button>
                            </Card>
                        )) : (
                            <div className="col-span-2 py-8 text-center text-text-subtle border border-white/5 rounded-xl bg-white/5">
                                <span className="material-symbols-outlined text-3xl mb-2 opacity-50">auto_stories</span>
                                <p>No magic moments yet.</p>
                                <Button variant="ghost" size="sm" onClick={handleStartStory}>Create your first story</Button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <BottomNavigation
                activeItem="home"
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
