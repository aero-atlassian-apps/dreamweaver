import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { apiFetch } from '../../infrastructure/api/apiClient'
import { BottomNavigation } from '../components/dashboard/BottomNavigation'

type Preferences = {
    mic_enabled: boolean
    reminders_enabled: boolean
    weekly_digest_enabled: boolean
}

export function ProfilePage() {
    const navigate = useNavigate()
    const { user, session, signOut } = useAuth()
    const [prefs, setPrefs] = useState<Preferences | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!session?.access_token) return

        const fetchPreferences = async () => {
            try {
                setError(null)
                const res = await apiFetch('/api/v1/user/preferences', {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                })

                const json = await res.json()

                if (!res.ok || !json.success) {
                    throw new Error(json.error || 'Failed to load preferences')
                }

                setPrefs({
                    mic_enabled: Boolean(json.data.mic_enabled),
                    reminders_enabled: Boolean(json.data.reminders_enabled),
                    weekly_digest_enabled: Boolean(json.data.weekly_digest_enabled),
                })
            } catch (e) {
                console.error('[Profile] Fetch error:', e)
                setError(e instanceof Error ? e.message : 'Failed to load preferences')
            }
        }

        void fetchPreferences()
    }, [session?.access_token])

    const save = async (next: Preferences) => {
        if (!session?.access_token) return

        try {
            setSaving(true)
            setError(null)

            const res = await apiFetch('/api/v1/user/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify(next)
            })

            const json = await res.json()

            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Failed to save preferences')
            }

            setPrefs({
                mic_enabled: Boolean(json.data.mic_enabled),
                reminders_enabled: Boolean(json.data.reminders_enabled),
                weekly_digest_enabled: Boolean(json.data.weekly_digest_enabled),
            })
        } catch (e) {
            console.error('[Profile] Save error:', e)
            setError(e instanceof Error ? e.message : 'Failed to save preferences')
            // Revert optimistic update (implicit via not updating state if save fails, 
            // but we might want to reload or separate UI state from server state)
        } finally {
            setSaving(false)
        }
    }

    const toggle = (key: keyof Preferences) => {
        setPrefs(prev => {
            if (!prev) return null
            const next = { ...prev, [key]: !prev[key] }
            void save(next)
            return next
        })
    }

    const userName = user?.user_metadata?.['full_name'] || user?.email?.split('@')[0] || 'Parent'
    const childName = user?.user_metadata?.['child_name'] || 'Child'
    const childAge = user?.user_metadata?.['child_age']

    return (
        <div className="min-h-screen bg-background-dark font-sans text-white pb-24">
            <header className="flex items-center p-4 pt-6 pb-2 justify-between sticky top-0 z-10 bg-background-dark/90 backdrop-blur-md border-b border-white/5">
                <button
                    type="button"
                    className="text-white flex size-10 shrink-0 items-center justify-center rounded-full active:bg-white/10 transition-colors"
                    onClick={() => navigate('/dashboard')}
                    aria-label="Back"
                >
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </button>
                <h2 className="text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Settings</h2>
            </header>

            <main className="pb-24">
                {error && (
                    <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-4 rounded-xl">
                        {error}
                    </div>
                )}

                <section className="flex flex-col items-center pt-6 pb-8 px-4">
                    <div className="relative group cursor-pointer">
                        <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-primary via-purple-500 to-violet-300">
                            <div className="w-full h-full rounded-full bg-card-dark border-4 border-background-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    person
                                </span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 bg-primary text-background-dark rounded-full p-1.5 border-4 border-background-dark flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">{userName}</h1>
                        <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            <span className="text-sm font-medium text-primary">Premium Member</span>
                        </div>
                        <div className="mt-2 text-white/50 text-sm">{user?.email}</div>
                    </div>
                </section>

                <section className="flex flex-col gap-4 px-4 mb-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">My Dreamers</h3>
                        <button type="button" className="text-sm text-primary font-medium hover:opacity-80">
                            Manage
                        </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
                        <div className="flex flex-col items-center gap-2 min-w-[80px]">
                            <div className="w-16 h-16 rounded-full bg-primary/10 border border-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">child_care</span>
                            </div>
                            <span className="text-sm font-medium text-white/80">{childName}</span>
                            {typeof childAge === 'number' && (
                                <span className="text-[10px] text-white/40">{childAge}y</span>
                            )}
                        </div>
                        <button type="button" className="flex flex-col items-center gap-2 min-w-[80px] group">
                            <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center group-active:scale-95 transition-transform">
                                <span className="material-symbols-outlined text-white/50 text-2xl">add</span>
                            </div>
                            <span className="text-sm font-medium text-white/50">Add Child</span>
                        </button>
                    </div>
                </section>

                <section className="flex flex-col gap-4 px-4 mb-8">
                    <h3 className="text-lg font-bold">Voice Model</h3>
                    <Card variant="solid" className="border border-white/10 bg-card-dark/60">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-base font-semibold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">graphic_eq</span>
                                        {userName}&apos;s Voice
                                    </p>
                                    <p className="text-sm text-white/50 mt-1">Ready for storytelling</p>
                                </div>
                                <span className="px-2 py-1 rounded bg-green-500/10 text-green-300 text-xs font-bold uppercase tracking-wider">Active</span>
                            </div>
                            <div aria-hidden="true" className="h-12 w-full flex items-center justify-center gap-1 opacity-80">
                                {[4, 6, 8, 10, 6, 12, 7, 5, 8, 4, 3, 2].map((h, idx) => (
                                    <div key={idx} className="w-1.5 rounded-full bg-primary/70" style={{ height: `${h * 4}px`, opacity: 0.2 + (idx % 5) * 0.15 }} />
                                ))}
                                <div className="flex-1 border-b-2 border-dashed border-white/10 ml-2" />
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <p className="text-xs text-white/40">Last updated: recently</p>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/voice/onboarding')}
                                    leftIcon={<span className="material-symbols-outlined text-[18px]">mic</span>}
                                    className="rounded-lg"
                                >
                                    Re-record
                                </Button>
                            </div>
                        </div>
                    </Card>
                </section>

                <section className="flex flex-col gap-4 px-4 mb-4">
                    <h3 className="text-lg font-bold">General</h3>
                    <div className="flex flex-col bg-card-dark/60 rounded-xl overflow-hidden border border-white/10 divide-y divide-white/5">
                        <button
                            type="button"
                            className="flex items-center justify-between p-4 w-full hover:bg-white/5 transition-colors text-left"
                            onClick={() => toggle('mic_enabled')}
                            disabled={!prefs || saving}
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-[20px]">mic</span>
                                </div>
                                <div>
                                    <span className="font-medium">Microphone</span>
                                    <div className="text-xs text-white/50">So your child can interrupt stories</div>
                                </div>
                            </div>
                            <span className={`text-xs font-bold ${prefs?.mic_enabled ? 'text-green-300' : 'text-white/40'}`}>{prefs?.mic_enabled ? 'ON' : 'OFF'}</span>
                        </button>

                        <button
                            type="button"
                            className="flex items-center justify-between p-4 w-full hover:bg-white/5 transition-colors text-left"
                            onClick={() => toggle('reminders_enabled')}
                            disabled={!prefs || saving}
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                                </div>
                                <div>
                                    <span className="font-medium">Notifications</span>
                                    <div className="text-xs text-white/50">Bedtime reminders</div>
                                </div>
                            </div>
                            <span className={`text-xs font-bold ${prefs?.reminders_enabled ? 'text-green-300' : 'text-white/40'}`}>{prefs?.reminders_enabled ? 'ON' : 'OFF'}</span>
                        </button>

                        <button
                            type="button"
                            className="flex items-center justify-between p-4 w-full hover:bg-white/5 transition-colors text-left"
                            onClick={() => toggle('weekly_digest_enabled')}
                            disabled={!prefs || saving}
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                                <div>
                                    <span className="font-medium">Weekly Time Capsule</span>
                                    <div className="text-xs text-white/50">Sunday morning summary</div>
                                </div>
                            </div>
                            <span className={`text-xs font-bold ${prefs?.weekly_digest_enabled ? 'text-green-300' : 'text-white/40'}`}>{prefs?.weekly_digest_enabled ? 'ON' : 'OFF'}</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        className="mt-4 flex items-center justify-center gap-2 p-4 w-full rounded-xl text-red-300 hover:bg-red-500/10 font-medium transition-colors"
                        onClick={signOut}
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Log Out
                    </button>
                </section>
            </main>

            <BottomNavigation
                activeItem="settings"
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
