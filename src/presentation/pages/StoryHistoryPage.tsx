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

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PageTransition } from '../components/ui/PageTransition'
import { MemoryCard } from '../components/memory/MemoryCard'
import { useStoryHistory } from '../hooks/useStoryHistory'
import { useAuth } from '../context/AuthContext'

type FilterTab = 'all' | 'questions' | 'starred' | 'calendar'

// Normalized display story type
interface DisplayStory {
    id: string
    title: string
    quote?: string
    audioDuration?: string
    timestamp: string
    tags: string[]
    isStarred: boolean
}

// Mock data for MVP - will be replaced with real data from repository
const MOCK_STORIES: DisplayStory[] = [
    {
        id: '1',
        title: 'Emma asked about Mars',
        quote: "What's that big red star?",
        audioDuration: '0:08',
        timestamp: 'Tonight 8:22 PM',
        tags: ['astronomy', 'conversation'],
        isStarred: true,
    },
    {
        id: '2',
        title: 'First time saying "galaxy"',
        quote: undefined,
        audioDuration: undefined,
        timestamp: 'Yesterday 8:15 PM',
        tags: ['milestone', 'vocabulary'],
        isStarred: false,
    },
    {
        id: '3',
        title: 'The Umbrella Kingdom',
        quote: 'Luna loves the rainbow!',
        audioDuration: '12:15',
        timestamp: 'Monday 8:00 PM',
        tags: ['adventure', 'weather'],
        isStarred: false,
    },
]

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
    const { user } = useAuth()
    const userId = user?.id || 'guest'
    const { stories: apiStories } = useStoryHistory(userId)

    const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Transform API stories to display format, with fallback to mock data
    const displayStories = useMemo(() => {
        if (apiStories.length > 0) {
            return apiStories.map(story => ({
                id: story.id,
                title: story.title,
                quote: undefined,
                audioDuration: `${story.getEstimatedReadingTime()} min`,
                timestamp: formatRelativeTime(story.createdAt),
                tags: [story.theme.toLowerCase()],
                isStarred: false, // TODO: Store in DB
            }))
        }
        // Fallback to mock data if no stories from API
        return MOCK_STORIES
    }, [apiStories])

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
        const groups: Record<string, typeof MOCK_STORIES> = {
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
                                            onShare={() => console.log('Share', story.id)}
                                            onClick={() => navigate(`/stories/${story.id}`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </PageTransition>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-lg border-t border-white/10 px-6 py-3">
                <div className="flex justify-around items-center max-w-md mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex flex-col items-center gap-1 text-text-subtle hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">home</span>
                        <span className="text-xs">Home</span>
                    </button>
                    <button
                        onClick={() => navigate('/stories/new')}
                        className="flex flex-col items-center gap-1 text-text-subtle hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">auto_stories</span>
                        <span className="text-xs">Stories</span>
                    </button>
                    <button
                        className="flex flex-col items-center gap-1 text-primary"
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        <span className="text-xs">Memory</span>
                    </button>
                    <button
                        className="flex flex-col items-center gap-1 text-text-subtle hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-xs">Profile</span>
                    </button>
                </div>
            </nav>
        </div>
    )
}
