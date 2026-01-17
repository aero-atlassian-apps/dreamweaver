/**
 * StoryContext - Dependency Injection for Story Generation
 * 
 * Provides story generation services via React context,
 * enabling proper DI and testability in components.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { GenerateStoryUseCase } from '../../application/use-cases/GenerateStoryUseCase'
import { GeminiAIGateway } from '../../infrastructure/adapters/GeminiAIGateway'
import type { AIServicePort } from '../../application/ports/AIServicePort'
import { Story } from '../../domain/entities/Story'

interface StoryContextType {
    generateStory: (theme: string, options?: {
        childName?: string
        childAge?: number
        duration?: 'short' | 'medium' | 'long'
    }) => Promise<{
        story: Story
        estimatedReadingTime: number
    }>
}

const StoryContext = createContext<StoryContextType | undefined>(undefined)

interface StoryProviderProps {
    children: ReactNode
    aiService?: AIServicePort // Allow injection for testing
}

export function StoryProvider({ children, aiService }: StoryProviderProps) {
    // Create services once (memoized)
    const storyService = useMemo(() => {
        const ai = aiService ?? new GeminiAIGateway()
        const useCase = new GenerateStoryUseCase(ai)

        return {
            generateStory: async (theme: string, options?: {
                childName?: string
                childAge?: number
                duration?: 'short' | 'medium' | 'long'
            }) => {
                return useCase.execute({
                    theme,
                    ...options,
                })
            }
        }
    }, [aiService])

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
