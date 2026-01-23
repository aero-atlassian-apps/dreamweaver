import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { AudioPlayer } from '../../components/ui/AudioPlayer'

interface SharedContent {
    type: 'STORY' | 'MOMENT'
    content: unknown
    isExpired: boolean
}

export function GrandmaViewerPage() {
    const { token } = useParams<{ token: string }>()
    const [data, setData] = useState<SharedContent | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await fetch(`/api/v1/share/${token}`)
                const json = await res.json()

                if (res.ok && json.success) {
                    setData(json.data)
                } else {
                    setError(json.error || 'Content unavailable')
                }
            } catch {
                setError('Failed to load shared memory')
            } finally {
                setLoading(false)
            }
        }

        if (token) fetchContent()
    }, [token])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-2xl font-serif text-slate-600 animate-pulse">Loading memory...</div>
            </div>
        )
    }

    if (error || (data && data.isExpired)) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
                <Card variant="solid" className="max-w-md w-full text-center p-8 bg-white shadow-xl border-none">
                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">sentiment_dissatisfied</span>
                    <h1 className="text-2xl font-serif text-slate-800 mb-2">Link Expired</h1>
                    <p className="text-slate-600">
                        This shared memory is no longer available. Please ask for a new link.
                    </p>
                </Card>
            </div>
        )
    }

    if (!data) return null

    // Type Narrowing (Assuming Story for now)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const story = data.content as any
    // Extract paragraphs. Ideally we use the same helper or just raw text if simple.
    // For Grandma mode, we want clean text.
    const paragraphs = story.content.paragraphs || story.content.split('\n\n')

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-serif">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 py-6 px-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
                            <span className="material-symbols-outlined">auto_stories</span>
                        </div>
                        <span className="font-sans font-bold text-slate-500 tracking-wider text-sm uppercase">DreamWeaver Memory</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-6 md:p-12 pb-32">
                <div className="text-center mb-12">
                    <span className="inline-block px-4 py-1 rounded-full bg-stone-100 text-stone-600 text-sm font-sans mb-4">
                        Shared with you
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                        {story.title}
                    </h1>
                    {story.theme && (
                        <p className="text-xl text-stone-500 italic">
                            A story about {story.theme}
                        </p>
                    )}
                </div>

                {/* Audio Player (Prominent) */}
                {story.audioUrl && (
                    <div className="mb-12 bg-white rounded-2xl p-6 shadow-lg border border-stone-100">
                        <h3 className="text-center font-sans font-bold text-slate-400 text-sm uppercase mb-4 tracking-widest">Listen Along</h3>
                        <AudioPlayer audioUrl={story.audioUrl} autoPlay={false} />
                    </div>
                )}

                {/* Content - Large Text */}
                <article className="prose prose-xl prose-stone mx-auto">
                    {paragraphs.map((para: string, i: number) => (
                        <p key={i} className="mb-6 leading-relaxed text-lg md:text-xl text-slate-800">
                            {para}
                        </p>
                    ))}
                </article>

                <div className="mt-16 pt-8 border-t border-stone-200 text-center text-stone-400 font-sans text-sm">
                    Generated by DreamWeaver
                </div>
            </main>
        </div>
    )
}
