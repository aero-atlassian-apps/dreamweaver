import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { LiveStorySession } from '../components/LiveStorySession'
import { useAuth } from '../context/AuthContext'
import { PageTransition } from '../components/ui/PageTransition'

export function LiveModePage() {
    const navigate = useNavigate()
    const { user } = useAuth()

    const childName = user?.user_metadata?.['child_name'] || 'Child'
    const childAge = user?.user_metadata?.['child_age'] || 5

    return (
        <div className="min-h-screen bg-background-dark font-sans text-white p-5 flex flex-col">
            <header className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="-ml-2 text-text-subtle"
                    leftIcon={<span className="material-symbols-outlined">arrow_back</span>}
                >
                    Dashboard
                </Button>
                <div className="mt-4">
                    <h1 className="text-3xl font-bold font-serif bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Bedtime Lab
                    </h1>
                    <p className="text-text-subtle mt-1">
                        Interactive, real-time storytelling experience.
                    </p>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center">
                <PageTransition className="w-full max-w-xl">
                    <LiveStorySession
                        childName={childName}
                        childAge={childAge}
                    />
                </PageTransition>

                <div className="mt-12 max-w-sm text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary text-xs font-bold mb-4">
                        <span className="material-symbols-outlined text-sm">info</span>
                        LOW LATENCY MODE
                    </div>
                    <p className="text-text-subtle text-sm leading-relaxed">
                        In Live Mode, the Bedtime Conductor listens and responds instantly.
                        Your child can ask questions, change the plot, or talk to characters.
                    </p>
                </div>
            </main>
        </div>
    )
}
