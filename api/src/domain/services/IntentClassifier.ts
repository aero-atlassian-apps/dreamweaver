/**
 * IntentClassifier
 * 
 * Simple rule-based classifier to categorize child inputs during the bedtime story.
 * Used to provide semantic labels for the Traceability Matrix (Proof of "Intent Classification").
 */

export type ChildIntent = 'ASK_QUESTION' | 'INTERRUPT' | 'DIRECT' | 'AFFIRM' | 'DENY' | 'UNKNOWN'

export class IntentClassifier {
    classify(text: string): ChildIntent {
        const lower = text.toLowerCase()

        // 1. Directives ("Change the story", "I want...")
        if (lower.match(/^(i want|change|make|let's|can we|stop|go)/)) {
            return 'DIRECT'
        }

        // 2. Questions ("Why?", "Who is...?")
        if (lower.match(/^(why|who|what|where|when|how|\?)/)) {
            return 'ASK_QUESTION'
        }

        // 3. Affirmation ("Yes", "I like it")
        if (lower.match(/^(yes|yeah|sure|ok|good|cool|love|like)/)) {
            return 'AFFIRM'
        }

        // 4. Denial ("No", "Scary", "Don't")
        if (lower.match(/^(no|nah|hate|dislike|scary|bad|don't)/)) {
            return 'DENY'
        }

        // 5. Explicit Interrupts (often short bursts overlapping)
        // Hard to detect text-only without timing, but "Wait!" is a signal.
        if (lower.match(/^(wait|hold on|pause)/)) {
            return 'INTERRUPT'
        }

        return 'UNKNOWN'
    }
}
