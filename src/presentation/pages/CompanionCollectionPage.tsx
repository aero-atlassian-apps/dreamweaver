import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { AVAILABLE_COMPANIONS, DreamCompanionProps } from '../../../api/src/domain/entities/DreamCompanion'

export function CompanionCollectionPage() {
    const navigate = useNavigate()
    // Mock user progress for display
    const userStoryCount = 4

    return (
        <div className="min-h-screen bg-background-dark p-6 pb-24">
            <header className="mb-8">
                <Button variant="ghost" className="mb-4" onClick={() => navigate('/dashboard')}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Dashboard
                </Button>
                <h1 className="text-3xl font-serif text-white mb-2">Dream Companions</h1>
                <p className="text-text-subtle">
                    Collect friends by telling more stories!
                    <br />
                    <span className="text-primary text-sm font-bold">Current Progress: {userStoryCount} stories</span>
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_COMPANIONS.map((comp: DreamCompanionProps) => {
                    // Primitive lock logic matching use case
                    const isUnlocked = userStoryCount >= comp.unlockThreshold

                    return (
                        <Card
                            key={comp.id}
                            variant={isUnlocked ? 'glass' : 'solid'}
                            className={`flex items-center gap-4 ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl
                                ${isUnlocked ? 'bg-primary/20 animate-pulse-slow' : 'bg-white/5'}
                            `}>
                                {comp.species === 'owl' && '🦉'}
                                {comp.species === 'fox' && '🦊'}
                                {comp.species === 'bear' && '🐻'}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {comp.name}
                                    {!isUnlocked && <span className="material-symbols-outlined text-sm">lock</span>}
                                </h3>
                                <p className="text-xs text-text-subtle mb-1">{comp.description}</p>
                                {!isUnlocked && (
                                    <p className="text-xs text-primary font-bold">
                                        Unlock at {comp.unlockThreshold} stories
                                    </p>
                                )}
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
