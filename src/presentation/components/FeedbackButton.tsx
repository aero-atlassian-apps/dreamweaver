import { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { FeedbackService } from '../../infrastructure/api/FeedbackService'
import { useAuth } from '../context/AuthContext'

interface FeedbackButtonProps {
    contentId: string
    contentType: 'story' | 'moment' | 'character' | 'conversation'
    className?: string
}

export function FeedbackButton({ contentId, contentType, className }: FeedbackButtonProps) {
    const { session } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    // Form State
    const [type, setType] = useState<'flag' | 'rating' | 'correction'>('flag')
    const [reason, setReason] = useState('')

    const handleSubmit = async () => {
        if (!session) return
        setIsSubmitting(true)
        try {
            await FeedbackService.submitFeedback({
                contentId,
                contentType,
                type,
                reason
            }, session.access_token)
            setSuccess(true)
            setTimeout(() => {
                setIsOpen(false)
                setSuccess(false)
                setReason('')
                setType('flag')
            }, 2000)
        } catch (error) {
            console.error('Feedback failed', error)
            // Ideally show toast
        } finally {
            setIsSubmitting(false)
        }
    }

    // Trigger Button
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`text-slate-400 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/5 ${className}`}
                title="Report or give feedback"
            >
                <span className="material-symbols-outlined text-lg">flag</span>
            </button>
        )
    }

    // Feedback Form Popover
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <Card variant="glass" className="w-full max-w-sm space-y-4 shadow-2xl border-white/10">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-400">report</span>
                        Feedback & Report
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {success ? (
                    <div className="py-8 text-center text-green-400 animate-pulse">
                        <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                        <p>Thank you for your feedback!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-text-subtle uppercase font-bold">Type</label>
                            <div className="flex gap-2">
                                {(['flag', 'rating', 'correction'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`
                                            flex-1 py-2 rounded-lg text-sm transition-all border
                                            ${type === t
                                                ? 'bg-primary/20 border-primary text-white shadow-[0_0_10px_rgba(var(--primary),0.3)]'
                                                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}
                                        `}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-text-subtle uppercase font-bold">Details (Optional)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full h-24 bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50 resize-none placeholder:text-slate-600"
                                placeholder="Tell us more about what you found..."
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                variant="primary"
                                className="w-full justify-center"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !session}
                            >
                                {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
