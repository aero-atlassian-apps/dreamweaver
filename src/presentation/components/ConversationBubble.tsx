import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface ReasoningTrace {
    step: 'THOUGHT' | 'ACTION' | 'OBSERVATION' | 'CONCLUSION'
    content: string
}

interface ConversationBubbleProps {
    sessionId: string
}

interface Suggestion {
    id: string
    title: string
    reasoning: string
}

export function ConversationBubble({ sessionId }: ConversationBubbleProps) {
    // const { user } = useAuth() // Unused
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const [trace, setTrace] = useState<ReasoningTrace[]>([])
    const [history, setHistory] = useState<{ role: 'user' | 'agent', text: string }[]>([])
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen && history.length === 0) {
            // Fetch suggestions on open if empty
            fetchSuggestions()
        }
    }, [isOpen])

    const fetchSuggestions = async () => {
        // Mock API call for R8 prototype
        // In real app: fetch('/api/v1/suggestions')
        await new Promise(r => setTimeout(r, 500))
        setSuggestions([
            { id: '1', title: 'Story about Dragons', reasoning: 'You loved the last dragon story.' },
            { id: '2', title: 'Space Adventure', reasoning: 'Popular bedtime theme.' },
            { id: '3', title: 'Calm Ocean', reasoning: 'Good for relaxing.' }
        ])
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [history, trace])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage = input
        setInput('')
        setHistory(prev => [...prev, { role: 'user', text: userMessage }])
        setIsThinking(true)
        setTrace([]) // Clear previous trace

        try {
            // Simulate API Call (since we can't easily hit localhost:3000 in this env without setup)
            // In real app: const res = await fetch('/api/v1/conversations/turn', ...)

            // Mocking the delay and response for the "Show me" demo
            await new Promise(r => setTimeout(r, 1000))

            // Mock Response based on simple logic (mirroring backend ReAct)
            let reply = ''
            const mockTrace: ReasoningTrace[] = []

            mockTrace.push({ step: 'THOUGHT', content: `Identifying intent for "${userMessage}" in ${sessionId}...` })
            await new Promise(r => setTimeout(r, 500))

            mockTrace.push({ step: 'ACTION', content: 'Searching Episodic Memory...' })
            await new Promise(r => setTimeout(r, 500))

            if (userMessage.toLowerCase().includes('dragon')) {
                mockTrace.push({ step: 'OBSERVATION', content: 'Found memory: "User loves dragons"' })
                reply = "I remember you love dragons! Should we add one to the story?"
            } else {
                mockTrace.push({ step: 'OBSERVATION', content: 'No specific memory found.' })
                reply = "That sounds interesting! Tell me more."
            }

            mockTrace.push({ step: 'CONCLUSION', content: `Replying: "${reply}"` })

            setTrace(mockTrace)
            setHistory(prev => [...prev, { role: 'agent', text: reply }])

        } catch (error) {
            console.error(error)
        } finally {
            setIsThinking(false)
        }
    }

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    variant="primary"
                    className="rounded-full h-14 w-14 shadow-lg shadow-primary/25 animate-bounce-subtle"
                    onClick={() => setIsOpen(true)}
                >
                    <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                </Button>
            </div>
        )
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96">
            <Card variant="glass" padding="none" className="overflow-hidden flex flex-col shadow-2xl border-primary/20">
                {/* Header */}
                <div className="bg-primary/10 p-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="font-semibold text-white">Bedtime Conductor</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-text-subtle hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div
                    ref={scrollRef}
                    className="h-80 overflow-y-auto p-4 space-y-4 bg-background-dark/80"
                >
                    {history.length === 0 && (
                        <p className="text-center text-text-subtle text-sm mt-10">
                            Hi! I'm listening. Ask me anything about the story!
                        </p>
                    )}

                    {history.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed
                                ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-white/10 text-slate-200 rounded-bl-none'}
                            `}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {/* Reasoning Trace (Transparency) */}
                    {(isThinking || trace.length > 0) && (
                        <div className="border border-white/5 rounded-lg p-3 bg-black/20 text-xs font-mono space-y-1">
                            <div className="flex items-center gap-2 text-text-subtle mb-2">
                                <span className="material-symbols-outlined text-sm">psychology</span>
                                <span>Agent Reasoning</span>
                            </div>
                            {trace.map((t, i) => (
                                <div key={i} className="flex gap-2 animate-fade-in">
                                    <span className={`
                                        uppercase font-bold text-[10px] w-16 shrink-0
                                        ${t.step === 'THOUGHT' ? 'text-blue-400' : ''}
                                        ${t.step === 'ACTION' ? 'text-yellow-400' : ''}
                                        ${t.step === 'OBSERVATION' ? 'text-green-400' : ''}
                                        ${t.step === 'CONCLUSION' ? 'text-purple-400' : ''}
                                    `}>{t.step}</span>
                                    <span className="text-slate-400">{t.content}</span>
                                </div>
                            ))}
                            {isThinking && trace.length === 0 && (
                                <span className="text-slate-500 animate-pulse">Thinking...</span>
                            )}
                        </div>
                    )}

                    {/* Suggestion Chips */}
                    {history.length < 2 && suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {suggestions.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => { setInput(s.title); handleSend(); }}
                                    className="text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-full px-3 py-1 transition-colors text-left"
                                    title={s.reasoning} // Tooltip
                                >
                                    ✨ {s.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/5 bg-background-dark">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 placeholder:text-text-subtle"
                        />
                        <Button
                            variant="icon"
                            onClick={handleSend}
                            disabled={!input.trim() || isThinking}
                            className="bg-primary/20 hover:bg-primary/30 text-primary"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
