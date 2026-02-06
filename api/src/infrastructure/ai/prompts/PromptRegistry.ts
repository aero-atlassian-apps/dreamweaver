/**
 * PromptRegistry - Centralized management for AI prompts.
 * 
 * Capabilities:
 * - Versioning (v1, v2...)
 * - A/B Testing (splitting traffic between prompt variants)
 * - Dynamic Template Interpolation
 */

export interface PromptTemplate {
    id: string
    version: number
    text: string
    variant?: string // 'A', 'B', 'control'
}

export class PromptRegistry {
    private prompts: Map<string, PromptTemplate> = new Map()

    constructor(initialPrompts: Record<string, PromptTemplate>) {
        Object.entries(initialPrompts).forEach(([logicalId, template]) => this.register(logicalId, template))
    }

    register(logicalId: string, prompt: PromptTemplate) {
        // In a real system, we might have multiple versions.
        // For now, we overwrite by ID to keep it simple, or store by ID+Version.
        this.prompts.set(logicalId, prompt)
    }

    /**
     * Get a prompt by ID.
     * Supports A/B testing logic here if needed.
     */
    get(id: string, variant?: string): PromptTemplate {
        // [A/B Testing Hook]
        // If variant is requested, look for ID+Variant?
        // For MVP, just return the registered prompt.
        const prompt = this.prompts.get(id)
        if (!prompt) {
            throw new Error(`Prompt not found: ${id}`)
        }
        return prompt
    }

    /**
     * Interpolate variables into the prompt text
     */
    interpolate(id: string, variables: Record<string, string | number | undefined>): string {
        const prompt = this.get(id)
        let text = prompt.text

        for (const [key, value] of Object.entries(variables)) {
            // Replace {{key}} with value
            // Using a simple regex for global replacement
            const safeValue = value === undefined || value === null ? '' : String(value)
            text = text.replace(new RegExp(`{{${key}}}`, 'g'), safeValue)
        }

        return text
    }
}
