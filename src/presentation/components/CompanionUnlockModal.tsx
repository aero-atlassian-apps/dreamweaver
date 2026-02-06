import { Modal } from './ui/Modal'
import { Button } from './ui/Button'

export type UnlockedCompanion = {
    id: string
    name: string
    species: string
    description: string
}

interface CompanionUnlockModalProps {
    companion: UnlockedCompanion | null
    isOpen: boolean
    onClose: () => void
    onMeetTonight: () => void
}

export function CompanionUnlockModal({ companion, isOpen, onClose, onMeetTonight }: CompanionUnlockModalProps) {
    if (!companion) return null

    const emoji = companion.species === 'owl'
        ? '🦉'
        : companion.species === 'fox'
            ? '🦊'
            : companion.species === 'bear'
                ? '🐻'
                : companion.species === 'dragon'
                    ? '🐲'
                    : companion.species === 'cat'
                        ? '🐱'
                        : '✨'

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Dream Friend!">
            <div className="text-center space-y-5">
                <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-accent-secondary/30 to-primary/20 border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(167,139,250,0.25)]">
                    <div className="text-5xl">{emoji}</div>
                </div>

                <div>
                    <div className="text-white text-2xl font-bold">{companion.name}</div>
                    <div className="text-text-subtle text-sm mt-2">{companion.description}</div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button variant="primary" onClick={onMeetTonight}>
                        Meet {companion.name} Tonight
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Save for Later
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

