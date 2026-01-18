/**
 * useAgentSuggestion - Hook to get story suggestions from BedtimeConductorAgent
 * 
 * Connects the Dashboard to the real agent logic instead of hardcoded data.
 */

import { useState, useCallback, useMemo } from 'react'
import { BedtimeConductorAgent, type StorySuggestion, type SessionContext, type ChildContext } from '../../domain/agents/BedtimeConductorAgent'

interface UseAgentSuggestionOptions {
    childName?: string
    childAge?: number
    favoriteThemes?: string[]
}

interface UseAgentSuggestionResult {
    suggestion: StorySuggestion | null
    isLoading: boolean
    refresh: () => void
}

// Generate suggestion outside of component to avoid hook issues
function createSuggestion(
    agent: BedtimeConductorAgent,
    childName: string,
    childAge: number,
    favoriteThemes: string[]
): StorySuggestion {
    const childContext: ChildContext = {
        name: childName,
        age: childAge,
        favoriteThemes,
        recentQuestions: [],
    }

    const sessionContext: SessionContext = {
        currentTime: new Date(),
        childContext,
        previousStories: [],
        currentMood: undefined,
    }

    return agent.generateSuggestion(sessionContext)
}

export function useAgentSuggestion(options: UseAgentSuggestionOptions = {}): UseAgentSuggestionResult {
    const childName = options.childName || 'Little One'
    const childAge = options.childAge || 5
    const favoriteThemes = options.favoriteThemes || ['space', 'animals', 'fantasy']

    // Create agent instance (memoized to avoid recreation)
    const agent = useMemo(() => new BedtimeConductorAgent(), [])

    // Initialize suggestion synchronously
    const [suggestion, setSuggestion] = useState<StorySuggestion>(() =>
        createSuggestion(agent, childName, childAge, favoriteThemes)
    )
    const [isLoading, setIsLoading] = useState(false)

    const refresh = useCallback(() => {
        setIsLoading(true)

        // Use setTimeout to ensure state update shows
        setTimeout(() => {
            const newSuggestion = createSuggestion(agent, childName, childAge, favoriteThemes)
            setSuggestion(newSuggestion)
            setIsLoading(false)
        }, 0)
    }, [agent, childName, childAge, favoriteThemes])

    return {
        suggestion,
        isLoading,
        refresh,
    }
}
