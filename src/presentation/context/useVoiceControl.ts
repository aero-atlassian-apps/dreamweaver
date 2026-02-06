import { useContext } from 'react'
import { VoiceContext } from './voiceControl'

export function useVoiceControl() {
    const context = useContext(VoiceContext)
    if (!context) throw new Error('useVoiceControl must be used within provider')
    return context
}
