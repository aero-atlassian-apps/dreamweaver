/**
 * SessionPlanner - Goal-Oriented Autonomy [AI-01]
 * 
 * Generates a structured Agenda for the session, distinct from the State Machine.
 * This represents the "Plan" in "Plan-Execute".
 */

export interface AgendaItem {
    id: string
    phase: string
    goal: string
    estimatedDurationMinutes: number
    requiredProps?: string[] // e.g., "Ask for name"
}

export class SessionPlanner {
    static generateAgenda(duration: 'short' | 'medium' | 'long' = 'medium'): AgendaItem[] {
        const baseAgenda: AgendaItem[] = [
            { id: '1', phase: 'ONBOARDING', goal: 'Establish rapport and get preferences', estimatedDurationMinutes: 1 },
        ]

        if (duration === 'short') {
            baseAgenda.push(
                { id: '2', phase: 'STORYTELLING', goal: 'Tell a quick, engaging story', estimatedDurationMinutes: 3 },
                { id: '3', phase: 'WIND_DOWN', goal: 'Quick soothing close', estimatedDurationMinutes: 1 }
            )
        } else if (duration === 'long') {
            baseAgenda.push(
                { id: '2', phase: 'STORYTELLING', goal: 'Tell an immersive multi-chapter story', estimatedDurationMinutes: 8 },
                { id: '3', phase: 'REFLECTION', goal: 'Discuss the moral of the story', estimatedDurationMinutes: 2 },
                { id: '4', phase: 'WIND_DOWN', goal: 'Deep relaxation exercise', estimatedDurationMinutes: 3 }
            )
        } else {
            // Medium
            baseAgenda.push(
                { id: '2', phase: 'STORYTELLING', goal: 'Tell a balanced story', estimatedDurationMinutes: 5 },
                { id: '3', phase: 'WIND_DOWN', goal: 'Soothing close', estimatedDurationMinutes: 2 }
            )
        }

        return baseAgenda
    }
}
