import { useState, useEffect } from 'react'
import { GetStoryHistoryUseCase } from '../../application/use-cases/GetStoryHistoryUseCase'
import { ApiStoryRepository } from '../../infrastructure/persistence/ApiStoryRepository'
import { Story } from '../../domain/entities/Story'

// Singleton or Context usually preferred, but instantiation here for MVP
const repository = new ApiStoryRepository()
const getStoryHistory = new GetStoryHistoryUseCase(repository)

export function useStoryHistory(userId: string) {
    const [stories, setStories] = useState<Story[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) return

        async function fetchStories() {
            try {
                setLoading(true)
                const { stories } = await getStoryHistory.execute({
                    userId,
                    limit: 50,
                    filter: 'all'
                })
                setStories(stories)
            } catch (err) {
                console.error(err)
                setError('Failed to load stories')
            } finally {
                setLoading(false)
            }
        }

        fetchStories()
    }, [userId])

    return { stories, loading, error }
}
