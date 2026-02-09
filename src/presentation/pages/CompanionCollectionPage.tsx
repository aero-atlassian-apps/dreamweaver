import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { BottomNavigation } from '../components/dashboard/BottomNavigation'
import { AVAILABLE_COMPANIONS } from '../../../api/src/domain/entities/DreamCompanion'
import { CompanionService } from '../../infrastructure/api/CompanionService'

export function CompanionCollectionPage() {
    const navigate = useNavigate()
    const { user, session } = useAuth()

    const childName = user?.user_metadata?.['child_name'] || 'Emma'
    const [storyCount, setStoryCount] = useState(0)
    const [unlockedCompanionIds, setUnlockedCompanionIds] = useState<string[]>([])
    const [loadingProgress, setLoadingProgress] = useState(true)

    const companionImage = useMemo(() => ({
        owl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDP9VR757GIgFJAYbs3OnvehouVwPLpLtR4B00HgRd8LmMT3ejWMGo-N0zzS_ie-Iwinqbl_CDHFNICQOpDPdZvalOfZ00mi3jGTkdO-555kNisIxxlEL-eNxgHx4fvAb153ojV1gTdOeapU35ffl65eCTGCUrfvKDbMT29gvKow3rmZUgec-gMPHKDmNd26JpfklvcWBSnFAfoEXzrGJbR7un4ObIxXgdBLk3uMTAXvqLmYqtpmaZ68z0tT7z8MPmgUgQVKW80cX5q',
        fox: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkWneKD-uP4lXUCjr0xQP6Iy9Fm27p02lu0hxnbuEfD_hGJ5DtEX8aXIsW-SKHWCmFg10mC58w0dIbPAKvEKz7raRrpJFSX8qrChimGx9yXmlyBMRR45k9Wr-f-YskIpI4flRrAbI72UN1QZO-2yIvBrjodi-HAWWU-K8Z0JHJTxF9xifssboPZYA8T6SqG7ZEjj2D6PC22AZ-sGMQzk-Edy36vXdHxLpDqRynaUqj30pK_TYhk8wAiUSZ93hLz0txg_dBIgzR_G_Z',
        dragon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxRCqwIgkICjyIZ9unIfvL3ZOdXjbgFe15Z8i0Rd_2hnmbgO5RhtC1hrHpnNlVJHRfSB0wWKZgqRVdDoFVoBU8wkhTreX0PDywrdqOwqzogDt6p0EJh9DCuiyeEHUlAAOaCH5s2vGuwNkDJetdBrWAQcvx1b8eJ_ys9WyqAeICD4i1iF6r-MhRLDjByWI39HiEf2UHmVXs8VUdTJrPoZkxRpZztqoYUx_rZQ2Og7jc3H75ipxcYocuXIKMw9hsFw5-rNrew-fNkuSc',
        cat: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6jEzFFQjHRdtl3eVGl_ktxSmseTL6cVc_8YHoeApgS_r91p9s1v3FeKU_g7gU13yG-xDEA68TKgBlLgE27i7mO1pgXk5j8PNPh0YgzMhOSoeOE0aBANmWb--X1LJl2cVERtLgFmdAGU9UDIq4pN0cgiQqj7Um6Vih-_q-qPx8Stzxmqkq-1HNmoVsXfRLZHTmAj2aQeFpezMZr8sBC1Wc1eso5FRrwzg_gsja99z3aOhla04fBJyyKdMpBuyZYytjOpbAFb_64CC1',
    } as Record<string, string>), [])

    useEffect(() => {
        let mounted = true
        const run = async () => {
            if (!session?.access_token) {
                if (mounted) setLoadingProgress(false)
                return
            }
            try {
                const progress = await CompanionService.getProgress(session.access_token)
                if (!mounted) return
                setStoryCount(progress.storyCount)
                setUnlockedCompanionIds(progress.unlockedCompanions.map((c) => c.id))
            } catch {
                if (!mounted) return
                setStoryCount(0)
                setUnlockedCompanionIds([])
            } finally {
                if (mounted) setLoadingProgress(false)
            }
        }
        run()
        return () => { mounted = false }
    }, [session?.access_token])

    const unlockedSet = useMemo(() => new Set(unlockedCompanionIds), [unlockedCompanionIds])
    const unlockedCompanions = useMemo(
        () => AVAILABLE_COMPANIONS.filter((c) => unlockedSet.has(c.id)),
        [unlockedSet]
    )
    const lockedCompanions = useMemo(
        () => AVAILABLE_COMPANIONS.filter((c) => !unlockedSet.has(c.id)),
        [unlockedSet]
    )

    return (
        <div className="min-h-screen bg-background-dark font-sans pb-28">
            <header className="sticky top-0 z-40 bg-background-dark/80 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center justify-between px-4 pb-2 pt-6 w-full max-w-5xl mx-auto">
                    <button
                        aria-label="Go back"
                        className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        onClick={() => navigate('/dashboard')}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-white">
                        {childName}&apos;s Dream Friends
                    </h2>
                    <button
                        aria-label="Help"
                        className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-primary"
                        onClick={() => navigate('/profile')}
                    >
                        <span className="material-symbols-outlined">help</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col pb-24 w-full max-w-5xl mx-auto">
                <div className="px-5 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold tracking-tight text-white">My Collection</h1>
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                            {loadingProgress ? '...' : `${unlockedCompanions.length} Unlocked`}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {unlockedCompanions.map((comp) => (
                            <Card
                                key={comp.id}
                                variant="interactive"
                                padding="sm"
                                className="flex flex-col gap-3 rounded-2xl"
                                onClick={() => navigate('/stories/new')}
                            >
                                <div className="w-full aspect-square rounded-xl overflow-hidden relative bg-slate-800">
                                    <img
                                        src={companionImage[comp.species] || companionImage['owl']}
                                        alt={comp.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                                </div>
                                <div className="text-center">
                                    <p className="text-white text-base font-bold leading-tight">{comp.name}</p>
                                    <p className="text-white/60 text-xs font-medium mt-1">{comp.description}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-white/5 w-full my-8" />

                <div className="px-5">
                    <h2 className="text-xl font-bold tracking-tight mb-4 text-white">Unlocking Soon</h2>
                    {lockedCompanions.map((comp) => (
                        <Card
                            key={comp.id}
                            variant="solid"
                            padding="none"
                            className="relative overflow-hidden rounded-3xl border border-white/10"
                        >
                            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                            <div className="p-5 flex flex-col gap-5">
                                <div className="flex items-start gap-4">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 w-fit border border-primary/20">
                                            <span className="material-symbols-outlined text-primary text-[16px]">lock_clock</span>
                                            <span className="text-primary text-xs font-bold uppercase tracking-wider">Next Reward</span>
                                        </div>
                                        <div>
                                            <p className="text-white text-lg font-bold leading-tight">{comp.name}</p>
                                            <p className="text-white/60 text-sm font-normal leading-normal mt-1">{comp.description}</p>
                                        </div>
                                    </div>
                                    <div className="w-20 h-20 shrink-0 rounded-2xl relative overflow-hidden ring-1 ring-white/10 bg-slate-800">
                                        <img
                                            src={companionImage[comp.species] || companionImage['owl']}
                                            alt={comp.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            loading="lazy"
                                            style={{ filter: 'grayscale(40%)' }}
                                        />
                                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white/80 drop-shadow-md">lock</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <p className="text-white/70 text-sm font-medium">Progress</p>
                                        <p className="text-primary text-sm font-bold">{storyCount}/{comp.unlockThreshold} Stories</p>
                                    </div>
                                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${Math.min(100, Math.round((storyCount / comp.unlockThreshold) * 100))}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-white/50 mt-1">
                                        {Math.max(0, comp.unlockThreshold - storyCount) <= 1
                                            ? `Listen to one more story to unlock ${comp.name}.`
                                            : `Listen to ${Math.max(0, comp.unlockThreshold - storyCount)} more stories to unlock ${comp.name}.`}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="px-6 py-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-3 text-primary border border-primary/20">
                        <span className="material-symbols-outlined">auto_stories</span>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                        Keep listening. Unlocked friends will appear as special guests in future bedtime adventures.
                    </p>
                </div>
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
