import { useEffect, useState, type ReactNode } from 'react'
import { VoiceContext, type VoiceCommand, type VoiceContextType } from './voiceControl'

export const VoiceControlProvider = ({ children }: { children: ReactNode }) => {
    const [isListening, setIsListening] = useState(false)
    const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null)

    useEffect(() => {
        if (!isListening) return

        const commands: VoiceCommand[] = ['stop', 'play', 'next', 'back']

        // Mock listening loop
        const interval = setInterval(() => {
            const cmd = commands[Math.floor(Math.random() * commands.length)]
            setLastCommand(cmd)
        }, 1000)

        return () => clearInterval(interval)
    }, [isListening])

    const toggleListening = () => setIsListening(prev => !prev)

    return (
        <VoiceContext.Provider value={{ isListening, toggleListening, lastCommand } satisfies VoiceContextType}>
            {children}
            {/* Visual indicator for Accessibility "Status" */}
            <div
                className="sr-only"
                role="status"
                aria-live="polite"
            >
                {isListening ? "Voice control active" : "Voice control inactive"}
            </div>
        </VoiceContext.Provider>
    )
}
