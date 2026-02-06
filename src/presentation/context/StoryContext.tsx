/**
 * StoryContext - Dependency Injection for Story Generation
 * 
 * Provides story generation services via React context,
 * enabling proper DI and testability in components.
 */

import { createContext, useContext, type ReactNode } from 'react'
import { StoryService, type GenerateStoryParams, type GenerateStoryResponse } from '../../infrastructure/api/StoryService'
import { useAuth } from './AuthContext'

interface StoryContextType {
    generateStory: (theme: string, options?: Omit<GenerateStoryParams, 'theme'>) => Promise<GenerateStoryResponse>
    generateStoryStream: (theme: string, options?: Omit<GenerateStoryParams, 'theme'>) => AsyncGenerator<string, void, unknown>
}

const StoryContext = createContext<StoryContextType | undefined>(undefined)

interface StoryProviderProps {
    children: ReactNode
}

export function StoryProvider({ children }: StoryProviderProps) {
    const { session } = useAuth()

    const storyService: StoryContextType = {
        generateStory: async (theme, options) => {
            return StoryService.generateStory({
                theme,
                accessToken: session?.access_token,
                ...options
            })
        },
        generateStoryStream: (theme, options) => {
            return StoryService.generateStoryStream({
                theme,
                accessToken: session?.access_token,
                ...options
            })
        }
    }

    return (
        <StoryContext.Provider value={storyService}>
            {children}
        </StoryContext.Provider>
    )
}



// eslint-disable-next-line react-refresh/only-export-components
export function useStory() {
    const context = useContext(StoryContext)
    if (context === undefined) {
        throw new Error('useStory must be used within a StoryProvider')
    }
    return context
}
