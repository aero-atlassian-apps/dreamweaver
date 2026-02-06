/**
 * DemoAuthService - Hardcoded demo user for full-stack validation
 * 
 * Enables demo mode to test 95%+ of the stack including:
 * - Supabase persistence
 * - Vector embeddings
 * - Story history
 * - Memory vault
 */

export const DEMO_USER = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'demo@dreamweaver.ai',
    name: 'Demo User',
    role: 'demo',
} as const

export const DEMO_CHILD_PROFILE = {
    id: '00000000-0000-0000-0000-000000000002',
    userId: '00000000-0000-0000-0000-000000000001',
    name: 'Luna',
    age: 5,
    favoriteThemes: ['space', 'ocean', 'magic'],
} as const

/**
 * Check if request is in demo mode
 * Demo mode is triggered by:
 * - x-demo-mode: true header
 * - demoMode: true in request body
 */
export function isDemoMode(headers: { get(name: string): string | null | undefined }, body?: { demoMode?: boolean }): boolean {
    const headerValue = headers.get('x-demo-mode')
    if (headerValue === 'true') return true
    if (body?.demoMode === true) return true
    return false
}

/**
 * Get the demo user object for auth bypass
 */
export function getDemoUser() {
    return {
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: { role: 'demo' },
        user_metadata: { name: DEMO_USER.name },
    }
}

/**
 * Get demo child profile for story generation
 */
export function getDemoChildProfile() {
    return DEMO_CHILD_PROFILE
}

/**
 * Check if a user ID is the demo user
 */
export function isDemoUser(userId: string): boolean {
    return userId === DEMO_USER.id
}
