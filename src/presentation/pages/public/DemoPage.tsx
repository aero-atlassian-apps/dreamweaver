import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { DemoService, type DemoTheme } from '../../../infrastructure/api/DemoService'
import { apiFetch, getApiOrigin } from '../../../infrastructure/api/apiClient'

type DemoResult = { title: string; content: string } | null

export function DemoPage() {
    const [theme, setTheme] = useState<DemoTheme>('space')
    const [childName, setChildName] = useState('')
    const [childAge, setChildAge] = useState<string>('5')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<DemoResult>(null)
    const [models, setModels] = useState<{ flashModel: string; proModel: string; liveModel: string; requestId?: string; traceId?: string } | null>(null)
    const [storyIds, setStoryIds] = useState<{ requestId?: string; traceId?: string } | null>(null)

    const themes = useMemo(() => ([
        { value: 'space', label: 'Space' },
        { value: 'ocean', label: 'Ocean' },
        { value: 'forest', label: 'Forest' },
        { value: 'dinosaurs', label: 'Dinosaurs' },
        { value: 'magic', label: 'Magic' },
        { value: 'friendship', label: 'Friendship' },
        { value: 'trains', label: 'Trains' },
        { value: 'animals', label: 'Animals' },
    ] as const), [])

    const onGenerate = async () => {
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const age = childAge.trim().length > 0 ? Number.parseInt(childAge, 10) : undefined
            const data = await DemoService.generateDemoStory({
                theme,
                childName: childName.trim().length > 0 ? childName.trim() : undefined,
                childAge: Number.isFinite(age as any) ? age : undefined,
            }) as any
            setResult(data)
            if (data?.requestId || data?.traceId) {
                setStoryIds({ requestId: data.requestId, traceId: data.traceId })
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Request failed')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let active = true
            ; (async () => {
                try {
                    const res = await apiFetch('/api/v1/meta/gemini-models', { method: 'GET' })
                    const json = await res.json()
                    if (res.ok && json?.success && json?.data && active) {
                        setModels({
                            flashModel: String(json.data.flashModel || ''),
                            proModel: String(json.data.proModel || ''),
                            liveModel: String(json.data.liveModel || ''),
                            requestId: json.requestId,
                            traceId: json.traceId,
                        })
                    }
                } catch {
                }
            })()
        return () => {
            active = false
        }
    }, [])

    return (
        <div className="min-h-screen bg-background-dark text-white px-6 py-10">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-extrabold font-serif">Try DreamWeaver (No Login Demo)</h1>
                    <p className="text-white/70 text-sm">
                        This demo generates a short bedtime story using Gemini 3 Flash. Live Mode uses Gemini 2.5 Flash Native Audio (Gemini 3 Live not yet available).
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <a
                        href="https://youtu.be/a-Hg3m4Mzv8"
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/90 text-sm"
                    >
                        Watch 3‑min demo
                    </a>
                    <a
                        href={`${getApiOrigin() || ''}/api/docs/`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/90 text-sm"
                    >
                        API Docs
                    </a>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-text-subtle uppercase tracking-wide ml-1 block">Theme</label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value as DemoTheme)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-white/10"
                            >
                                {themes.map(t => (
                                    <option key={t.value} value={t.value} className="bg-background-dark">
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Child Name (optional)"
                            value={childName}
                            onChange={(e) => setChildName(e.target.value)}
                            placeholder="Ava"
                        />

                        <Input
                            label="Child Age (optional)"
                            value={childAge}
                            onChange={(e) => setChildAge(e.target.value)}
                            inputMode="numeric"
                            placeholder="5"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                        <Button
                            variant="primary"
                            fullWidth
                            className="h-12 rounded-full"
                            onClick={onGenerate}
                            disabled={loading}
                        >
                            {loading ? 'Generating…' : 'Generate Story'}
                        </Button>
                        <Link to="/signup" className="w-full">
                            <Button
                                variant="icon"
                                size="lg"
                                fullWidth
                                className="h-12 rounded-full bg-transparent border border-white/10 hover:bg-white/5 text-white/90"
                            >
                                Unlock Live Mode
                            </Button>
                        </Link>
                    </div>

                    {error && (
                        <div className="text-sm text-red-300">{error}</div>
                    )}
                </div>

                {result && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold">{result.title}</h2>
                            <div className="text-white/60 text-xs">Short bedtime story</div>
                        </div>
                        <div className="space-y-4 text-white/90 leading-relaxed whitespace-pre-wrap">
                            {result.content}
                        </div>
                    </div>
                )}

                <div className="text-[10px] text-white/40 mt-4 pt-4 border-t border-white/5 space-y-1">
                    <div className="flex justify-between items-center">
                        <div className="uppercase tracking-wider font-semibold text-white/50">Model Proof</div>
                        <div className="flex gap-2 flex-wrap">
                            <span>Flash: {models?.flashModel || '...'}</span>
                            <span>Pro: {models?.proModel || '...'}</span>
                            <span>Live: {models?.liveModel || '...'}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-white/30">
                        <div>System ID: <code className="bg-white/5 px-1 rounded">{models?.requestId || '---'}</code></div>
                        <div>Trace: <code className="bg-white/5 px-1 rounded">{models?.traceId?.slice(0, 8) || '---'}</code></div>
                    </div>
                    {storyIds && (
                        <div className="flex justify-between items-center text-primary/40 animate-in fade-in slide-in-from-bottom-1 duration-500">
                            <div>Last Story Request: <code className="bg-primary/5 px-1 rounded text-primary/60">{storyIds.requestId}</code></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
