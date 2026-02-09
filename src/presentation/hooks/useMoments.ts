
import { useState, useEffect } from 'react'
import { supabase } from '../../infrastructure/supabase/client'

export interface Moment {
    id: string
    user_id: string
    story_id: string
    description: string
    media_url: string | null
    created_at: string
    status: string
}

export function useMoments(userId: string) {
    const [moments, setMoments] = useState<Moment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) return

        async function fetchMoments() {
            if (!supabase) {
                console.error('Supabase client not initialized')
                setLoading(false)
                return
            }
            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('golden_moments')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (error) throw error
                setMoments(data as Moment[])
            } catch (err: any) {
                console.error('Error fetching moments:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchMoments()
    }, [userId])

    return { moments, loading, error }
}
