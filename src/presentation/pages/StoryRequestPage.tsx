import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageTransition } from '../components/ui/PageTransition'
import { VoiceInputMode } from '../components/ui/VoiceInputMode'
import { StoryGenerationProgress } from '../components/ui/StoryGenerationProgress'
// import { GenerateStoryUseCase } from '../../application/use-cases/GenerateStoryUseCase' // REMOVED
// import { GeminiAIGateway } from '../../infrastructure/adapters/GeminiAIGateway' // REMOVED
import { Story } from '../../domain/entities/Story'
import { useStory } from '../context/StoryContext'
import { mediaVault } from '../../infrastructure/cache/MediaVault'

const THEMES = [
    { id: 'space', label: 'Space', icon: 'rocket_launch', color: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'animals', label: 'Animals', icon: 'pets', color: 'bg-amber-500/20 text-amber-300' },
    { id: 'fantasy', label: 'Fantasy', icon: 'auto_fix_high', color: 'bg-purple-500/20 text-purple-300' },
    { id: 'ocean', label: 'Ocean', icon: 'sailing', color: 'bg-cyan-500/20 text-cyan-300' },
    { id: 'robots', label: 'Robots', icon: 'smart_toy', color: 'bg-slate-400/20 text-slate-300' },
    { id: 'nature', label: 'Nature', icon: 'forest', color: 'bg-green-500/20 text-green-300' },
]

// In-memory story storage for MVP (will be replaced with Supabase)
const storyCache = new Map<string, Story>()

type ViewMode = 'selection' | 'voice' | 'generating'

export function StoryRequestPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('selection')
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
    const [customTheme, setCustomTheme] = useState<string | null>(null)
    const [voiceTranscript, setVoiceTranscript] = useState('')
    const [isListening, setIsListening] = useState(true)
    const [streamingContent, setStreamingContent] = useState('')
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { generateStory, generateStoryStream } = useStory()

    useEffect(() => {
        const topic = searchParams.get('topic')
        const theme = searchParams.get('theme')
        if (theme && THEMES.some(t => t.id === theme)) {
            setSelectedTheme(theme)
            setCustomTheme(null)
            return
        }
        if (theme) {
            setSelectedTheme(null)
            setCustomTheme(theme)
            return
        }
        if (topic) {
            setSelectedTheme(null)
            setCustomTheme(topic)
        }
    }, [searchParams])

    const handleGenerate = async () => {
        const againOf = searchParams.get('againOf')
        const requestedTheme = selectedTheme || customTheme || voiceTranscript || 'fantasy'

        setViewMode('generating')
        setError(null)
        setStreamingContent('')

        try {
            const requestId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `req_${Date.now()}`
            const options = {
                duration: 'medium' as const,
                previousStoryId: againOf && againOf !== 'last' ? againOf : undefined,
                requestId
            }

            // 1. Kick off streaming for real-time UI
            const stream = generateStoryStream(requestedTheme, options)

            // Consume the stream in parallel to show content 
            // (Hono stream text doesn't need to be fully awaited before finishing)
            const streamPromise = (async () => {
                for await (const chunk of stream) {
                    setStreamingContent(prev => prev + chunk)
                }
            })()

            // 2. Execute story generation via Context/Service to get the final Story object
            const result = await generateStory(requestedTheme, options)

            // Cache the story for viewing
            storyCache.set(result.story.id, result.story)
            if (Array.isArray((result as any).newlyUnlockedCompanions) && (result as any).newlyUnlockedCompanions.length > 0) {
                sessionStorage.setItem('dw:newlyUnlocked', JSON.stringify({
                    storyId: result.story.id,
                    companions: (result as any).newlyUnlockedCompanions
                }))
            }
            const offlineStory = {
                id: result.story.id,
                title: result.story.title,
                content: typeof result.story.content === 'string'
                    ? result.story.content
                    : JSON.stringify(result.story.content),
                theme: result.story.theme,
                createdAt: result.story.createdAt
            }
            await mediaVault.saveStory(offlineStory)

            // Wait for stream to finish (or just jump ahead)
            await streamPromise

            // Minimum wait time to show the nice animation (1.5s instead of 2.5s since streaming is active)
            setTimeout(() => {
                navigate(`/stories/${result.story.id}`)
            }, 1500)

        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Failed to generate story')
            setViewMode('selection')
        }
    }

    // Voice Input Mode
    if (viewMode === 'voice') {
        return (
            <VoiceInputMode
                onTranscript={setVoiceTranscript}
                onCreateStory={handleGenerate}
                onBack={() => setViewMode('selection')}
                onToggleListening={() => setIsListening(prev => !prev)}
                transcript={voiceTranscript}
                isListening={isListening}
                keywords={['scientist', 'space', 'dinosaurs', 'ice cream']} // Mock keywords for demo
            />
        )
    }

    // Generation Progress Mode
    if (viewMode === 'generating') {
        return (
            <StoryGenerationProgress
                onNotifyMe={() => console.log('Notification requested')}
                streamingText={streamingContent}
            />
        )
    }

    // Default: Theme Selection Mode
    return (
        <div className="min-h-screen bg-background-dark flex flex-col font-sans">
            {/* Header */}
            <header className="px-5 pt-6 pb-4 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/dashboard')}
                            className="-ml-2 text-text-subtle text-xs"
                            size="sm"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            App
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/journey')}
                            className="bg-indigo-500/10 text-indigo-300 text-xs px-3 hover:bg-indigo-500/20"
                            size="sm"
                        >
                            <span className="material-symbols-outlined text-sm mr-1">hub</span>
                            Back to Hub
                        </Button>
                    </div>
                    <h1 className="text-2xl font-bold text-white font-serif">Create a Story</h1>
                    <p className="text-text-subtle mt-1 text-sm">Choose a magical theme for tonight</p>
                </div>

                {/* Voice Mode Toggle */}
                <button
                    onClick={() => setViewMode('voice')}
                    className="flex flex-col items-center gap-1 text-accent-secondary hover:text-white transition-colors"
                >
                    <div className="w-10 h-10 rounded-full bg-accent-secondary/10 flex items-center justify-center border border-accent-secondary/20">
                        <span className="material-symbols-outlined">mic</span>
                    </div>
                    <span className="text-[10px] font-bold tracking-wide">VOICE</span>
                </button>
            </header >

            {/* Content */}
            < main className="flex-1 px-5 pb-8 relative" >
                <PageTransition className="space-y-8">
                    {/* Theme Selection */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-text-subtle uppercase tracking-wider">
                                Pick a Theme
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {THEMES.map((theme) => (
                                <Card
                                    key={theme.id}
                                    variant={selectedTheme === theme.id ? 'outline' : 'interactive'}
                                    padding="md"
                                    className={`flex flex-col items-center gap-3 transition-all ${selectedTheme === theme.id
                                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                        : 'hover:border-white/10'
                                        }`}
                                    onClick={() => setSelectedTheme(theme.id)}
                                >
                                    <div className={`h-12 w-12 rounded-2xl ${theme.color} flex items-center justify-center`}>
                                        <span className="material-symbols-outlined text-2xl">{theme.icon}</span>
                                    </div>
                                    <span className="text-sm font-medium text-white">{theme.label}</span>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-4 rounded-xl animate-fade-in-up">
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background-dark via-background-dark to-transparent pt-16">
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={!selectedTheme && !customTheme}
                            onClick={handleGenerate}
                            className="h-14 rounded-full text-lg shadow-xl shadow-primary/20 btn-shimmer relative overflow-hidden"
                            leftIcon={<span className="material-symbols-outlined">auto_awesome</span>}
                        >
                            Generate Story
                        </Button>
                    </div>
                </PageTransition>
            </main >
        </div >
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export { storyCache }
