import { createContext } from 'react'

export type VoiceCommand = 'stop' | 'play' | 'next' | 'back'

export interface VoiceContextType {
    isListening: boolean
    toggleListening: () => void
    lastCommand: VoiceCommand | null
}

export const VoiceContext = createContext<VoiceContextType | undefined>(undefined)
