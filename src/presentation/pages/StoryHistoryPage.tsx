/**
 * StoryHistoryPage - Memory Vault / Story History
 * 
 * Per design_vFinal.md Section 6.1:
 * - Header: "← Home" back button + "Memory Vault" title
 * - Filter tabs: All | ? | ⭐ | 📅
 * - Search bar
 * - Grouped sections by date
 * - List of MemoryCards
 * - Bottom navigation
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PageTransition } from '../components/ui/PageTransition'
import { MemoryCard } from '../components/memory/MemoryCard'
import { ShareDialog } from '../components/ShareDialog'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../../infrastructure/api/apiClient'
import { BottomNavigation } from '../components/dashboard/BottomNavigation'

type FilterTab = 'all' | 'questions' | 'starred' | 'calendar'

// Normalized display story type
interface DisplayMoment {
    id: string
    storyId: string
    title: string
    quote?: string
    audioDuration?: string
    timestamp: string
    tags: string[]
    isStarred: boolean
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    if (diffDays === 0) {
        return `Tonight ${timeStr}`
    } else if (diffDays === 1) {
        return `Yesterday ${timeStr}`
    } else if (diffDays < 7) {
        return `${date.toLocaleDateString('en-US', { weekday: 'long' })} ${timeStr}`
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
}

interface FilterButtonProps {
    active: boolean
    onClick: () => void
    children: React.ReactNode
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${active
                ? 'bg-primary text-white'
                : 'bg-white/5 text-text-subtle hover:bg-white/10'
                }`}
        >
            {children}
        </button>
    )
}

export function StoryHistoryPage() {
    const navigate = useNavigate()
    const { session } = useAuth()
    const [apiMoments, setApiMoments] = useState<Array<{ id: string; storyId: string; description: string; createdAt: string }>>([])

    const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Sharing State
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [storyToShare, setStoryToShare] = useState<{ id: string, title: string } | null>(null)

    useEffect(() => {
        const run = async () => {
            if (!session?.access_token) return
            try {
                const res = await apiFetch('/api/v1/moments?limit=50', {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`
                    }
                })
                const json = await res.json()
                if (res.ok && json.success) {
                    setApiMoments((json.data.moments || []).map((m: any) => ({
                        id: m.id,
                        storyId: m.storyId,
                        description: m.description || 'A special moment',
                        createdAt: m.createdAt
                    })))
                }
            } catch { }
        }
        void run()
    }, [session?.access_token])

    // Transform API stories to display format
    const displayStories = useMemo(() => {
        if (apiMoments.length > 0) {
            return apiMoments.map((m) => ({
                id: m.id,
                storyId: m.storyId,
                title: m.description,
                quote: m.description.includes('"') ? m.description : undefined,
                audioDuration: undefined,
                timestamp: formatRelativeTime(new Date(m.createdAt)),
                tags: m.description.toLowerCase().includes('mars') ? ['astronomy'] : [],
                isStarred: false,
            }))
        }
        return [] as DisplayMoment[]
    }, [apiMoments])

    // Filter stories based on active tab and search
    const filteredStories = useMemo(() => {
        let stories = [...displayStories]

        // Apply filter
        if (activeFilter === 'starred') {
            stories = stories.filter(s => s.isStarred)
        } else if (activeFilter === 'questions') {
            stories = stories.filter(s => s.tags.includes('conversation') || s.quote)
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            stories = stories.filter(
                s =>
                    s.title.toLowerCase().includes(query) ||
                    s.quote?.toLowerCase().includes(query) ||
                    s.tags.some(t => t.includes(query))
            )
        }

        return stories
    }, [displayStories, activeFilter, searchQuery])

    // Group stories by relative date
    const groupedStories = useMemo(() => {
        const groups: Record<string, DisplayMoment[]> = {
            'This Week': [],
            'Last Week': [],
            'Older': [],
        }

        filteredStories.forEach(story => {
            if (story.timestamp.includes('Tonight') || story.timestamp.includes('Yesterday')) {
                groups['This Week'].push(story)
            } else if (story.timestamp.includes('Monday') || story.timestamp.includes('Tuesday')) {
                groups['This Week'].push(story)
            } else {
                groups['Older'].push(story)
            }
        })

        return Object.entries(groups).filter(([, stories]) => stories.length > 0)
    }, [filteredStories])

    return (
        <div className="min-h-screen bg-background-dark flex flex-col font-sans">
            {/* Header */}
            <header className="px-5 pt-6 pb-4 sticky top-0 z-10 bg-background-dark/95 backdrop-blur-lg">
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Home
                    </Button>
                </div>
                <h1 className="text-2xl font-bold text-white font-serif mb-4">Memory Vault</h1>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
                    <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
                        All
                    </FilterButton>
                    <FilterButton active={activeFilter === 'questions'} onClick={() => setActiveFilter('questions')}>
                        ❓
                    </FilterButton>
                    <FilterButton active={activeFilter === 'starred'} onClick={() => setActiveFilter('starred')}>
                        ⭐
                    </FilterButton>
                    <FilterButton active={activeFilter === 'calendar'} onClick={() => setActiveFilter('calendar')}>
                        📅
                    </FilterButton>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search memories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 px-5 pb-24">
                <PageTransition>
                    {groupedStories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <span className="material-symbols-outlined text-5xl text-text-subtle mb-4">
                                auto_stories
                            </span>
                            <p className="text-text-subtle">No memories found</p>
                        </div>
                    ) : (
                        groupedStories.map(([groupName, stories]) => (
                            <div key={groupName} className="mb-6">
                                <h2 className="text-sm font-semibold text-text-subtle mb-3">
                                    {groupName} ({stories.length} {stories.length === 1 ? 'memory' : 'memories'})
                                </h2>
                                <div className="space-y-3">
                                    {stories.map(story => (
                                        <MemoryCard
                                            key={story.id}
                                            id={story.id}
                                            title={story.title}
                                            quote={story.quote}
                                            isStarred={story.isStarred}
                                            audioDuration={story.audioDuration}
                                            timestamp={story.timestamp}
                                            tags={story.tags}
                                            onPlay={() => console.log('Play', story.id)}
                                            onShare={() => {
                                                setStoryToShare({ id: story.id, title: story.title })
                                                setIsShareOpen(true)
                                            }}
                                            onClick={() => navigate(`/stories/${story.storyId}`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </PageTransition>

                {/* Share Modal */}
                {storyToShare && (
                    <ShareDialog
                        isOpen={isShareOpen}
                        onClose={() => setIsShareOpen(false)}
                        resourceId={storyToShare.id}
                        title={storyToShare.title}
                        type="MOMENT"
                    />
                )}
            </main>

            <BottomNavigation
                activeItem="memory"
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
