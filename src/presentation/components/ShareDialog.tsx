import { useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../../infrastructure/api/apiClient'

interface ShareDialogProps {
    resourceId: string
    title: string
    type: 'STORY' | 'MOMENT'
    isOpen: boolean
    onClose: () => void
}

export function ShareDialog({ resourceId, title, type, isOpen, onClose }: ShareDialogProps) {
    const { session } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [shareUrl, setShareUrl] = useState<string | null>(null)
    const [grandmaEmail, setGrandmaEmail] = useState('')
    const [sentTo, setSentTo] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleGenerateLink = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await apiFetch('/api/v1/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify({
                    resourceId,
                    type,
                    expiresInDays: 2,
                    maxViews: 3
                })
            })

            const data = await res.json()
            if (data.success) {
                setShareUrl(data.data.url)
            } else {
                setError(data.error || 'Failed to generate link')
            }
        } catch {
            setError('Network error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendEmail = async () => {
        if (!grandmaEmail.trim()) return
        setIsLoading(true)
        setError(null)
        setSentTo(null)
        try {
            const res = await apiFetch('/api/v1/share/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify({
                    resourceId,
                    type,
                    grandmaEmail: grandmaEmail.trim(),
                    expiresInDays: 2,
                    maxViews: 3
                })
            })
            const data = await res.json()
            if (data.success) {
                setShareUrl(data.data.url)
                setSentTo(grandmaEmail.trim())
            } else {
                setError(data.error || 'Failed to send email')
            }
        } catch {
            setError('Network error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopy = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl)
            // Ideally show toast
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share this Memory">
            <div className="space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-primary">family_link</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Share "{title}"</h3>
                    <p className="text-text-subtle text-sm mt-1">
                        Create a secure, temporary link for family members (Grandma Mode).
                    </p>
                </div>

                {!shareUrl ? (
                    <div className="flex justify-center py-4">
                        <div className="bg-white/5 rounded-2xl p-4 w-full border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined text-pink-400">elderly_woman</span>
                                    Grandma Link
                                </span>
                                <div className="h-6 w-10 bg-primary/20 rounded-full flex items-center px-1">
                                    <div className="w-4 h-4 bg-primary rounded-full shadow-md" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-black/20 border border-white/10 rounded-xl p-3">
                                    <label className="text-xs text-text-subtle font-bold tracking-wider uppercase block mb-2">Send to</label>
                                    <input
                                        value={grandmaEmail}
                                        onChange={(e) => setGrandmaEmail(e.target.value)}
                                        placeholder="grandma@email.com"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                    />
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={handleSendEmail}
                                    disabled={isLoading || !grandmaEmail.trim()}
                                    isLoading={isLoading}
                                >
                                    Send to Grandma
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={handleGenerateLink}
                                    disabled={isLoading}
                                >
                                    Copy link instead
                                </Button>
                                <p className="text-xs text-text-subtle text-center">
                                    Link expires in 48 hours and is limited to 3 views
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 animate-fade-in">
                        <label className="text-xs text-green-400 uppercase font-bold tracking-wider mb-2 block">
                            {sentTo ? `Sent to ${sentTo}` : 'Link Ready'}
                        </label>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={shareUrl}
                                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono"
                            />
                            <Button variant="secondary" onClick={handleCopy}>
                                <span className="material-symbols-outlined">content_copy</span>
                            </Button>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg">
                        {error}
                    </p>
                )}
            </div>
        </Modal>
    )
}
