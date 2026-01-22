/**
 * Suggestion Entity
 * 
 * Represents a proactive suggestion made by the agent to the user.
 * Contains the content of the suggestion and the reasoning behind it (Transparency).
 */
export interface Suggestion {
    id: string
    title: string
    theme: string
    reasoning: string
    confidence: number // 0 to 1
}
