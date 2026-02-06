import { ActiveGoalProps } from '../../domain/entities/ActiveGoal.js'

export interface SessionState {
    sessionId: string
    userId: string
    phase: 'IDLE' | 'ONBOARDING' | 'STORYTELLING' | 'REFLECTION' | 'WIND_DOWN' | 'ASLEEP'
    activeIntent: 'LISTEN' | 'INTERRUPT' | 'IDLE'
    emotionalTone: number // 0.0 (Calm) - 1.0 (Excited)
    activeGoal?: ActiveGoalProps
    activeGoals?: ActiveGoalProps[]
    sessionStartTime?: Date
    lastSuggestedTheme?: string
    lastMomentTimestamp?: number
    context: Record<string, unknown>
    history?: SessionStateSnapshot[] // [2026] Time Travel
    updatedAt: Date
}

export type SessionStateSnapshot = Omit<SessionState, 'history'>

export type SessionStatePatch = Partial<Omit<SessionState, 'sessionId' | 'userId' | 'updatedAt' | 'history'>>

export interface SessionStatePort {
    /**
     * Retrieves the current state for a session.
     */
    get(sessionId: string): Promise<SessionState | null>

    /**
     * Creates or overwrites the state.
     * Implementations should automatically append the previous state to 'history' before overwriting.
     */
    set(sessionId: string, state: SessionState): Promise<void>

    /**
     * Updates specific fields in the state.
     */
    patch(sessionId: string, partial: SessionStatePatch): Promise<void>

    /**
     * Reverts the state back N steps.
     * @param steps Number of states to go back. Default 1.
     */
    rollback(sessionId: string, steps?: number): Promise<void>

    /**
     * Deletes the state (cleanup).
     */
    delete(sessionId: string): Promise<void>
}
