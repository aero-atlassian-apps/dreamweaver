/**
 * AtomOfThoughtEngine - Deterministic Arbitration for Agentic Decisions.
 * 
 * In 2026 standards, agents shouldn't just "guess" via prompts.
 * This engine enforces logical consistency, goal arbitration, and trade-off management.
 */

export interface Goal {
    id: string
    type: 'RELAXATION' | 'BONDING' | 'EDUCATION' | 'SAFETY'
    priority: number
    description: string
}

export type SessionPhase = 'IDLE' | 'ONBOARDING' | 'STORYTELLING' | 'REFLECTION' | 'WIND_DOWN' | 'ASLEEP'

export interface ArbitrationContext {
    timeOfDay: string
    childAge: number
    childMood: string
    activeGoals: Goal[]
    currentPhase: SessionPhase // [ARC-01] Phase Awareness
}

export interface ThoughtStep {
    goals_considered: string[]
    conflicts_identified: string | null
    trade_off_made: string | null
    thought: string
    action: string
    confidence: number
    parameters?: Record<string, any>
    resilience_meta?: {
        failure_encountered?: string
        correction_attempted?: boolean
        recovery_cost_usd?: number
    }
}

export class AtomOfThoughtEngine {

    /**
     * Arbitrates between conflicting goals based on deterministic rules and AI intent.
     */
    static arbitrate(proposed: ThoughtStep, context: ArbitrationContext): ThoughtStep {
        const validated = { ...proposed }

        // Rule 0: Phase-Based Action Constraints [ARC-01]
        if (context.currentPhase === 'WIND_DOWN') {
            if (validated.action.includes('ADVENTURE') || validated.parameters?.['energyLevel'] === 'high') {
                validated.conflicts_identified = 'High energy action conflicts with WIND_DOWN phase.'
                validated.trade_off_made = 'Forced low-energy adaptation.'
                validated.action = 'SOOTHING_TALK'
                validated.parameters = { ...validated.parameters, energyLevel: 'low' }
                validated.thought = 'Override: System in Wind Down. High energy actions blocked.'
            }
        }

        if (context.currentPhase === 'STORYTELLING') {
            // Ensure focus stays on story unless emergency
            if (!validated.goals_considered.includes('RELAXATION') && !validated.goals_considered.includes('EDUCATION')) {
                validated.goals_considered.push('RELAXATION')
            }
        }

        // Rule 1: Safety is ALWAYS the highest priority
        if (!validated.goals_considered.includes('SAFETY')) {
            validated.goals_considered.unshift('SAFETY')
        }

        // Rule 2: Bedtime proximity enforces RELAXATION
        if (context.timeOfDay.includes('Night') || context.timeOfDay.includes('Evening')) {
            if (validated.action === 'ADVENTURE_STORY' && validated.confidence > 0.5) {
                validated.conflicts_identified = 'Exciting adventure conflicts with bedtime relaxation needs.'
                validated.trade_off_made = 'Downgraded excitement level to "Calm Adventure" to ensure sleep quality.'
                validated.thought = `Detected late hour (${context.timeOfDay}). Overriding high-energy adventure with soothing relaxation beats.`
                validated.parameters = { ...validated.parameters, energyLevel: 'low', pacing: 'soothing' }
            }
        }

        // Rule 3: Goal Consistency
        if (validated.goals_considered.length === 0) {
            validated.goals_considered = context.activeGoals.map(g => g.type)
        }

        return validated
    }

    /**
     * Deterministic State Machine for Session Phases [ARC-01]
     */
    static transition(current: SessionPhase, signal: 'START' | 'STORY_START' | 'STORY_END' | 'SLEEP_DETECTED' | 'WAKE_UP'): SessionPhase {
        switch (current) {
            case 'IDLE':
                return signal === 'START' ? 'ONBOARDING' : 'IDLE';
            case 'ONBOARDING':
                return signal === 'STORY_START' ? 'STORYTELLING' : 'ONBOARDING';
            case 'STORYTELLING':
                if (signal === 'SLEEP_DETECTED') return 'ASLEEP';
                if (signal === 'STORY_END') return 'REFLECTION';
                return 'STORYTELLING';
            case 'REFLECTION':
                if (signal === 'SLEEP_DETECTED') return 'ASLEEP';
                // Auto-transition to Wind Down after reflection usually happens via agent logic, 
                // but for now let's say typically next step is Wind Down
                return 'WIND_DOWN';
            case 'WIND_DOWN':
                return signal === 'SLEEP_DETECTED' ? 'ASLEEP' : 'WIND_DOWN';
            case 'ASLEEP':
                return signal === 'WAKE_UP' ? 'IDLE' : 'ASLEEP';
            default:
                return current;
        }
    }

    /**
     * Generates a "Standard" set of goals for the Bedtime Conductor
     */
    static getStandardGoals(): Goal[] {
        return [
            { id: 'g1', type: 'RELAXATION', priority: 1, description: 'Ensure the child is calm and ready for sleep.' },
            { id: 'g2', type: 'BONDING', priority: 2, description: 'Strengthen the parent-child connection through shared ritual.' },
            { id: 'g3', type: 'EDUCATION', priority: 3, description: 'Introduce gentle, age-appropriate learning moments.' },
            { id: 'g4', type: 'SAFETY', priority: 0, description: 'Protect the child from inappropriate content or overstimulation.' }
        ]
    }
}
