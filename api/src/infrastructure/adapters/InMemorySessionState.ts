import { SessionState, SessionStatePort, SessionStatePatch } from '../../application/ports/SessionStatePort.js'

/**
 * InMemorySessionState - A volatile, high-performance state store.
 * 
 * Suitable for single-instance deployments or MVP.
 * Can be replaced by RedisSessionState for multi-instance scaling.
 */
export class InMemorySessionState implements SessionStatePort {
    private store: Map<string, SessionState> = new Map()

    async get(sessionId: string): Promise<SessionState | null> {
        return this.store.get(sessionId) || null
    }

    async set(sessionId: string, state: SessionState): Promise<void> {
        const previous = this.store.get(sessionId)
        const newItem = { ...state, updatedAt: new Date() }

        if (previous) {
            // Snapshot previous state (excluding history)
            // Use structuredClone if available, or JSON for MVP safeguard (handling Dates manually if needed)
            // Ideally we assume environment supports structuredClone (Node 17+)
            const snapshot = this.createSnapshot(previous)
            const history = previous.history || []

            // Limit history depth (optional, e.g. 10 steps)
            if (history.length >= 10) history.shift()

            newItem.history = [...history, snapshot]
        }

        this.store.set(sessionId, newItem)
    }

    async patch(sessionId: string, partial: SessionStatePatch): Promise<void> {
        const current = await this.get(sessionId)
        if (!current) {
            throw new Error(`Session ${sessionId} not found for patching`)
        }

        // Patch effectively calls set, so we get history preservation automatically?
        // No, we must construct the new state and call set to trigger history logic
        // OR manually handle it here to avoid double-cloning.
        // Let's call this.set to reuse logic.

        await this.set(sessionId, { ...current, ...partial })
    }

    async rollback(sessionId: string, steps: number = 1): Promise<void> {
        const current = this.store.get(sessionId)
        if (!current || !current.history || current.history.length === 0) {
            // Cannot rollback
            return
        }

        // Pop N steps
        const history = [...current.history]
        let targetSnapshot: any = null

        for (let i = 0; i < steps; i++) {
            targetSnapshot = history.pop()
            if (!targetSnapshot) break
        }

        if (targetSnapshot) {
            // Restore (keep remaining history)
            this.store.set(sessionId, {
                ...targetSnapshot,
                history: history,
                updatedAt: new Date()
            })
        }
    }

    async delete(sessionId: string): Promise<void> {
        this.store.delete(sessionId)
    }

    private createSnapshot(state: SessionState): any {
        // Deep clone omitting history
        const { history, ...rest } = state
        return structuredClone(rest)
    }
}
