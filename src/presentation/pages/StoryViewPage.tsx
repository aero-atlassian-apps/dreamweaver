import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageTransition } from '../components/ui/PageTransition'
import { AudioPlayer } from '../components/ui/AudioPlayer'
import { storyCache } from './StoryRequestPage'
import { ConversationBubble } from '../components/ConversationBubble'
import { mediaVault } from '../../infrastructure/cache/MediaVault'
import { Story } from '../../domain/entities/Story'
import { ShareDialog } from '../components/ShareDialog'
import { CompanionUnlockModal, type UnlockedCompanion } from '../components/CompanionUnlockModal'
import { apiFetch } from '../../infrastructure/api/apiClient'

export function StoryViewPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [isSleepMode, setIsSleepMode] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [unlocked, setUnlocked] = useState<UnlockedCompanion | null>(null)
    const [isUnlockOpen, setIsUnlockOpen] = useState(false)
    const [showFullText, setShowFullText] = useState(false)

    // Simulation: Listen for sleep cues (Mock EventBus behavior)
    useEffect(() => {
        const handleSleepCue = () => {
            console.log('[R3.2] Sleep Cue Detected - Entering Sleep Mode Dimming')
            setIsSleepMode(true)
        }

        window.addEventListener('dreamweaver:sleep_cue', handleSleepCue)
        return () => window.removeEventListener('dreamweaver:sleep_cue', handleSleepCue)
    }, [])

    // Get story from cache or recreate it
    // Note: In a real app we'd fetch from API if not in cache
    // Get story from cache or recreate it
    // Note: In a real app we'd fetch from API if not in cache
    const [story, setStory] = useState<Story | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadStory = async () => {
            if (!id) return

            // 1. Try Memory Cache
            const cached = storyCache.get(id)
            if (cached) {
                setStory(cached)
                setLoading(false)
                return
            }

            // 2. Try MediaVault (Offline)
            try {
                const offlineStory = await mediaVault.getStory(id)
                if (offlineStory) {
                    setStory(offlineStory as unknown as Story) // Cast assuming structure match
                    setLoading(false)
                    return
                }
            } catch (e) {
                console.error('[StoryView] Failed to load from MediaVault', e)
            }

            // 3. Fallback: Fetch from API
            try {
                const res = await apiFetch(`/api/v1/stories/${id}`)
                if (res.ok) {
                    const json = await res.json()
                    if (json.success && json.data) {
                        setStory(json.data)
                        setLoading(false)
                        return
                    }
                }
            } catch (e) {
                console.error('[StoryView] Failed to fetch from API', e)
            }

            setLoading(false)
        }
        loadStory()
    }, [id])

    useEffect(() => {
        if (!id) return
        const raw = sessionStorage.getItem('dw:newlyUnlocked')
        if (!raw) return
        try {
            const parsed = JSON.parse(raw) as { storyId?: unknown; companions?: unknown }
            if (parsed.storyId !== id) return
            if (!Array.isArray(parsed.companions) || parsed.companions.length === 0) return
            const first = parsed.companions[0] as UnlockedCompanion
            if (first && typeof first.id === 'string' && typeof first.name === 'string') {
                setUnlocked(first)
                setIsUnlockOpen(true)
                sessionStorage.removeItem('dw:newlyUnlocked')
            }
        } catch {
            sessionStorage.removeItem('dw:newlyUnlocked')
        }
    }, [id])

    const parseStoryContent = (raw: unknown): { paragraphs: string[]; sleepScore: number } | null => {
        if (!raw) return null
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw) as unknown
                if (!parsed || typeof parsed !== 'object') return null
                const p = parsed as { paragraphs?: unknown; sleepScore?: unknown }
                if (!Array.isArray(p.paragraphs)) return null
                if (typeof p.sleepScore !== 'number') return null
                return { paragraphs: p.paragraphs.filter((x): x is string => typeof x === 'string'), sleepScore: p.sleepScore }
            } catch {
                return null
            }
        }
        if (typeof raw === 'object') {
            const obj = raw as { paragraphs?: unknown; sleepScore?: unknown }
            if (!Array.isArray(obj.paragraphs)) return null
            const sleepScore = typeof obj.sleepScore === 'number' ? obj.sleepScore : 0
            return { paragraphs: obj.paragraphs.filter((x): x is string => typeof x === 'string'), sleepScore }
        }
        return null
    }

    const estimateReadingTime = (content: { paragraphs: string[] }): number => {
        const wordCount = content.paragraphs.join(' ').split(/\s+/).filter(Boolean).length
        return Math.max(1, Math.ceil(wordCount / 150))
    }

    const parsedContent = story ? parseStoryContent((story as any).content) : null
    const processedStory = story && parsedContent ? {
        ...story,
        content: parsedContent,
        getEstimatedReadingTime: () => estimateReadingTime(parsedContent),
    } : null

    // R8: Implicit Feedback
    const { session } = useAuth()
    const logFeedback = async (type: 'story_completed' | 'story_skipped') => {
        if (!processedStory || !session) return
        try {
            await apiFetch('/api/v1/suggestions/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ theme: processedStory.theme, type })
            })
            console.log(`[R8] Logged implicit feedback: ${type} for theme ${processedStory.theme}`) // Fixed variable reference
        } catch (e) {
            console.error('Failed to log feedback', e)
        }
    }

    if (loading) {
        return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white">Loading...</div>
    }

    if (!processedStory) {
        return (
            <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 font-sans">
                <PageTransition className="text-center">
                    <span className="material-symbols-outlined text-6xl text-text-subtle mb-4">search_off</span>
                    <h1 className="text-xl font-bold text-white mb-2">Story Not Found</h1>
                    <p className="text-text-subtle mb-6">This story may have expired or doesn't exist.</p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </PageTransition>
            </div>
        )
    }

    const paragraphs = processedStory.content.paragraphs
    const heroImage = (() => {
        const t = processedStory.theme?.toLowerCase?.() || ''
        if (t.includes('space')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDn-VmgV6N_f03Z6HZGoNAlGCg5TK3c8-J5JgglufeRp4w7Kwxhz5Tk9WYb3Q3ZRWuVSvNI7Rs3CR1WwasQHFgFSL3jTHosQOuRBqxakCxGTdVQ9vO1d3GVXthkIjKf9IctfODbg3BJ6kfLGoAE0IKaLgMaQFgAFDZpCmTL4PXh35yOY2wYDlFfIi0r7xBmFmw6FUcBIhkqZzHg3UMrvUvrXJbMRHGDnd7Al89eLh2g6nz7yNql2gmLGj_2ypUw6wAk0EdiGLMnZkgP'
        if (t.includes('ocean')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBDtrlMyOHRaZjJ753ASImy6KkrZ0ngrFv_TByhNLZhxFp_L-8XEPC03pXjXcnU7GULi2ABjxYfzDkQgW0aBSVTj084puRptRsThz7djGROVF1nZECyh9gH9ocHE8kQKiBPqLI7ndxlYDcq0j6jFssGwcbSMmwjcSd8HoKn-1g44CrHS1aHoytf0U503XTjf1a77OF7aQpbmBjbcNiHlfxZLyZ_UlzA3tdI6Tr2s1TpPojFN1z83LF5N1k_M20YxK3AXev8gFlhcO8'
        if (t.includes('forest') || t.includes('nature')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHBgOx2ziqlrNlppTR1oGWWwsW7IBjKTvZfPtoedNNsg398bm96EruVR7bvmugWJ66TNIfwBWxoFzGSKekMnKeweLosUFZ5WwCfD1ayrtj81XWPyyhUR4PQrVbVJUP6KJe5Gu5-SnSDFZ_rRqRaOSvun5n-PqEZK0-0uWZjoPW6Ok1lmV8cq22yRwQGxPV7yFNekg8EwoXjBCS1mb6ZGjQivPs9qnBIMsMbLRpgmQPqBmKo0DuXvhaiwJ6zLv2oX4Zd_ZMwOinXQRM'
        return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnUzuLPgFUYEq1RIhN6HmRWfBCdKE5hMiAkG8EO3uWoLZUaxGO68KTqvyjSFg25MwAYkDjlb_TkHtZ_o5BifmhEqpqnw6_F2MDvGuZcjzKCy-mS_RYGqYu5nveXy9LT0W-tE5dLzeBCOF1dD1-b3ddAPAC7kWOTwk1P6r6Ut_6do6UNKvmtN0jcygBm91IOblR8k0pnNTg4iowKoF8_lgY2APX2VswjfeMoYMqu0v4f4PMKKctvUH7fCww1j1fO9gyJWjKpc4PBXT8'
    })()

    return (
        <div className="min-h-screen bg-background-dark font-sans text-white relative">
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0"></div>

            <header className="relative z-10 flex items-center p-6 pb-2 justify-between">
                <button
                    type="button"
                    className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    onClick={() => navigate('/dashboard')}
                    aria-label="Go back"
                >
                    <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                </button>
                <h2 className="text-lg font-semibold leading-tight tracking-tight opacity-0">Story Time</h2>
                <div className="flex items-center justify-end gap-1.5 bg-white/5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                    <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bedtime</span>
                    <p className="text-primary text-sm font-bold leading-normal tracking-wide">
                        {Math.round(processedStory.content.sleepScore * 10)}%
                    </p>
                </div>
            </header>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-start px-6 pt-4 pb-0">
                <div className="w-full max-w-md">
                    <div className="w-full aspect-[4/5] max-h-[45vh] bg-slate-800 rounded-2xl overflow-hidden shadow-2xl relative mb-6 group border border-white/10">
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: `url('${heroImage}')` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent" />
                    </div>

                    <div className="flex flex-col items-center gap-1 mb-6 text-center w-full">
                        <h1 className="text-2xl font-bold leading-tight tracking-tight">{processedStory.title}</h1>
                        <p className="text-white/60 text-base font-medium">
                            {processedStory.audioUrl ? 'Read in your voice' : 'Text-only story'}
                        </p>
                    </div>

                    <div className="w-full mb-6">
                        <p className="text-lg font-normal leading-relaxed text-center">
                            <span className="text-white/70 transition-colors duration-300">{paragraphs[0] || ''}</span>
                        </p>
                    </div>

                    <div className="flex justify-center mb-6">
                        <button
                            type="button"
                            className="relative overflow-hidden rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10 active:scale-[0.99] border border-white/10 backdrop-blur-md w-full"
                            onClick={() => navigate(`/live?storyId=${encodeURIComponent(processedStory.id)}`)}
                        >
                            <div className="relative flex items-center justify-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                                    <span className="material-symbols-outlined text-[20px]">mic</span>
                                </div>
                                <span className="text-white text-base font-semibold">Child can interrupt anytime</span>
                            </div>
                        </button>
                    </div>

                    <div className="flex justify-center mb-10">
                        <Button
                            variant="secondary"
                            onClick={() => setShowFullText(prev => !prev)}
                            className="rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
                        >
                            {showFullText ? 'Hide full story' : 'Read full story'}
                        </Button>
                    </div>

                    {showFullText && (
                        <PageTransition>
                            <article className="prose prose-invert prose-lg max-w-none">
                                {paragraphs.map((paragraph: string, index: number) => (
                                    <p
                                        key={index}
                                        className="text-slate-200 leading-relaxed mb-6 text-base"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </article>

                    {/* End Card */}
                    <Card variant="solid" padding="lg" className="mt-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-primary mb-3">nights_stay</span>
                        <h3 className="text-lg font-bold text-white mb-2">The End</h3>
                        <p className="text-text-subtle text-sm mb-4">Sweet dreams, little dreamer</p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/stories/new')}
                                leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
                            >
                                New Story
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/dashboard')}
                            >
                                Done
                            </Button>
                        </div>
                    </Card>
                        </PageTransition>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex flex-col gap-4 p-6 pt-2 bg-gradient-to-t from-background-dark via-background-dark to-transparent">
                {processedStory.audioUrl && (
                    <AudioPlayer
                        audioUrl={processedStory.audioUrl}
                        title={processedStory.title}
                        autoPlay={false}
                        onComplete={() => logFeedback('story_completed')}
                        onSkip={() => logFeedback('story_skipped')}
                        className="shadow-xl"
                    />
                )}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/80"
                        onClick={() => setIsShareOpen(true)}
                        aria-label="Share story"
                    >
                        <span className="material-symbols-outlined text-[22px]">share</span>
                    </button>
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/80"
                        onClick={() => navigate('/stories/new')}
                        aria-label="Create new story"
                    >
                        <span className="material-symbols-outlined text-[22px]">add</span>
                    </button>
                </div>
            </div>

            {/* Conversational Agent */}
            {processedStory && <ConversationBubble sessionId={`session_${processedStory.id} `} />}

            {/* Sleep Mode Overlay (Closed-Loop feedback) */}
            {isSleepMode && (
                <div
                    className="fixed inset-0 z-[100] bg-background-dark/80 backdrop-blur-sm pointer-events-none transition-all duration-3000 ease-in-out flex items-center justify-center animate-fade-in"
                >
                    <div className="text-center opacity-40">
                        <span className="material-symbols-outlined text-6xl text-primary animate-pulse mb-2 block">
                            nights_stay
                        </span>
                        <p className="text-xs font-serif italic text-primary">Sleep mode active</p>
                    </div>
                </div>
            )}

            <ShareDialog
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                resourceId={processedStory.id}
                title={processedStory.title}
                type="STORY"
            />

            <CompanionUnlockModal
                isOpen={isUnlockOpen}
                onClose={() => setIsUnlockOpen(false)}
                companion={unlocked}
                onMeetTonight={() => {
                    setIsUnlockOpen(false)
                    navigate('/stories/new')
                }}
            />
        </div >
    )
}
