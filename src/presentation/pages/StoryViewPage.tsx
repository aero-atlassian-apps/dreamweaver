import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageTransition } from '../components/ui/PageTransition'
import { storyCache } from './StoryRequestPage'

export function StoryViewPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    // Get story from cache
    const story = id ? storyCache.get(id) : null

    if (!story) {
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

    const paragraphs = story.content.paragraphs

    return (
        <div className="min-h-screen bg-background-dark font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 px-5 pt-6 pb-4 bg-background-dark/95 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard')}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="icon" className="h-10 w-10">
                            <span className="material-symbols-outlined">bookmark_border</span>
                        </Button>
                        <Button variant="icon" className="h-10 w-10">
                            <span className="material-symbols-outlined">share</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Story Content */}
            <main className="px-5 pb-32">
                <PageTransition>
                    {/* Title Card */}
                    <Card variant="glass" padding="lg" className="mb-8">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-4">
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                {story.theme.charAt(0).toUpperCase() + story.theme.slice(1)} Story
                            </div>
                            <h1 className="text-2xl font-bold text-white font-serif leading-tight mb-3">
                                {story.title}
                            </h1>
                            <div className="flex items-center justify-center gap-4 text-text-subtle text-sm">
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">schedule</span>
                                    {story.getEstimatedReadingTime()} min read
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">bedtime</span>
                                    Sleep Score: {story.content.sleepScore}/10
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Story Text */}
                    <article className="prose prose-invert prose-lg max-w-none">
                        {paragraphs.map((paragraph, index) => (
                            <p
                                key={index}
                                className="text-slate-200 leading-relaxed mb-6 text-base"
                                style={{
                                    animationDelay: `${index * 0.1}s`,
                                }}
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
            </main>
        </div>
    )
}
