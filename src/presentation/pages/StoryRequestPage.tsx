import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageTransition } from '../components/ui/PageTransition'
import { GenerateStoryUseCase } from '../../application/use-cases/GenerateStoryUseCase'
import { GeminiAIGateway } from '../../infrastructure/adapters/GeminiAIGateway'
import { Story } from '../../domain/entities/Story'

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

export function StoryRequestPage() {
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleGenerate = async () => {
        if (!selectedTheme) return

        setIsGenerating(true)
        setError(null)

        try {
            // Create use case with AI gateway
            const aiGateway = new GeminiAIGateway()
            const useCase = new GenerateStoryUseCase(aiGateway)

            // Execute story generation
            const result = await useCase.execute({
                theme: selectedTheme,
                duration: 'medium',
            })

            // Cache the story for viewing
            storyCache.set(result.story.id, result.story)

            // Navigate to story view
            navigate(`/stories/${result.story.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate story')
            setIsGenerating(false)
        }
    }

    return (
        <div className="min-h-screen bg-background-dark flex flex-col font-sans">
            {/* Header */}
            <header className="px-5 pt-6 pb-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="mb-4"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-white font-serif">Create a Story</h1>
                <p className="text-text-subtle mt-1">Choose a magical theme for tonight</p>
            </header>

            {/* Content */}
            <main className="flex-1 px-5 pb-8">
                <PageTransition className="space-y-8">
                    {/* Theme Selection */}
                    <section>
                        <h2 className="text-sm font-semibold text-text-subtle uppercase tracking-wide mb-4">
                            Pick a Theme
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {THEMES.map((theme) => (
                                <Card
                                    key={theme.id}
                                    variant={selectedTheme === theme.id ? 'outline' : 'interactive'}
                                    padding="md"
                                    className={`flex flex-col items-center gap-3 transition-all ${selectedTheme === theme.id
                                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                        : ''
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
                        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-4 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background-dark via-background-dark to-transparent pt-16">
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={!selectedTheme}
                            isLoading={isGenerating}
                            onClick={handleGenerate}
                            leftIcon={<span className="material-symbols-outlined">auto_awesome</span>}
                        >
                            {isGenerating ? 'Weaving Magic...' : 'Generate Story'}
                        </Button>
                    </div>
                </PageTransition>
            </main>
        </div>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export { storyCache }
