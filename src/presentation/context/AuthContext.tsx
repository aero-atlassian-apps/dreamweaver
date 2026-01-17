import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../../infrastructure/supabase/client'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    isConfigured: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    const isConfigured = supabase !== null

    useEffect(() => {
        // Handle non-configured Supabase
        if (!supabase) {
            // Use queueMicrotask to avoid synchronous setState
            queueMicrotask(() => setLoading(false))
            return
        }

        let mounted = true

        // Get initial session
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (mounted) {
                setSession(s)
                setUser(s?.user ?? null)
                setLoading(false)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: string, s: Session | null) => {
                if (mounted) {
                    setSession(s)
                    setUser(s?.user ?? null)
                    setLoading(false)
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    const signIn = async (email: string, password: string) => {
        if (!supabase) {
            return { error: new Error('Supabase not configured') }
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error }
    }

    const signUp = async (email: string, password: string, name: string) => {
        if (!supabase) {
            return { error: new Error('Supabase not configured') }
        }
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
        })
        return { error }
    }

    const signOut = async () => {
        if (supabase) {
            await supabase.auth.signOut()
        }
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, isConfigured, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
