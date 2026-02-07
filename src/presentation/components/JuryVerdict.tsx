
import { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface JuryVerdictProps {
    onVerdict: (verdict: 'approved' | 'needs_work', comment?: string) => Promise<void>
}

export function JuryVerdict({ onVerdict }: JuryVerdictProps) {
    const [verdict, setVerdict] = useState<'approved' | 'needs_work' | null>(null)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async () => {
        if (!verdict) return
        setSubmitting(true)
        try {
            await onVerdict(verdict, comment)
            setSubmitted(true)
        } catch (error) {
            console.error('Failed to submit verdict:', error)
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <Card variant="solid" padding="lg" className="text-center animate-fade-in border-accent-green/30 bg-accent-green/5">
                <div className="h-16 w-16 mx-auto rounded-full bg-accent-green/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-accent-green">gavel</span>
                </div>
                <h3 className="text-xl font-bold font-serif mb-2 text-white">Verdict Recorded</h3>
                <p className="text-white/60">
                    Thank you, Juror. Your judgment has been filed in the DreamWeaver archives.
                </p>
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/50">
                    <p>"The future is built by those who judge it."</p>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-bold font-serif mb-2">The Final Verdict</h2>
                <p className="text-white/60">Based on the evidence presented, what is your judgment?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => setVerdict('approved')}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-4 group ${verdict === 'approved'
                        ? 'bg-accent-green/20 border-accent-green shadow-[0_0_30px_rgba(72,187,120,0.2)]'
                        : 'bg-white/5 border-white/10 hover:border-accent-green/50 hover:bg-white/10'
                        }`}
                >
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-colors ${verdict === 'approved' ? 'bg-accent-green text-white' : 'bg-white/10 text-white/30 group-hover:text-accent-green'
                        }`}>
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                    </div>
                    <div className="text-center">
                        <h3 className={`text-lg font-bold ${verdict === 'approved' ? 'text-accent-green' : 'text-white/70'}`}>Approved</h3>
                        <p className="text-sm text-white/40">Ready for the future</p>
                    </div>
                </button>

                <button
                    onClick={() => setVerdict('needs_work')}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-4 group ${verdict === 'needs_work'
                        ? 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(139,92,246,0.2)]'
                        : 'bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10'
                        }`}
                >
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-colors ${verdict === 'needs_work' ? 'bg-primary text-white' : 'bg-white/10 text-white/30 group-hover:text-primary'
                        }`}>
                        <span className="material-symbols-outlined text-3xl">build</span>
                    </div>
                    <div className="text-center">
                        <h3 className={`text-lg font-bold ${verdict === 'needs_work' ? 'text-primary' : 'text-white/70'}`}>Needs Work</h3>
                        <p className="text-sm text-white/40">Potential detected, but...</p>
                    </div>
                </button>
            </div>

            <div className={`space-y-4 overflow-hidden transition-all duration-500 ${verdict ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={verdict === 'approved' ? "Any specific highlights?" : "What's missing? (Optional)"}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none transition-colors"
                />

                <Button
                    variant={verdict === 'approved' ? 'primary' : 'secondary'}
                    size="lg"
                    fullWidth
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="h-14 text-lg font-bold"
                >
                    {submitting ? 'Filing Verdict...' : 'Submit Judgment'}
                </Button>
            </div>
        </div>
    )
}
