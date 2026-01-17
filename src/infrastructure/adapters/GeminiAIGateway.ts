/**
 * GeminiAIGateway - Implementation of AIServicePort using Google Gemini
 * 
 * This adapter implements the AIServicePort interface using the Gemini API.
 * It handles prompt construction, API calls, and response parsing.
 */

import type { AIServicePort, GenerateStoryInput, GeneratedStory } from '../../application/ports/AIServicePort'

// For MVP, we'll use a mock implementation
// Real Gemini integration will be added when env vars are configured
const MOCK_STORIES: Record<string, GeneratedStory> = {
    'space': {
        title: 'The Star Shepherd',
        content: `Once upon a time, in a galaxy far beyond our own, there lived a young star shepherd named Nova. Every night, Nova would float among the twinkling stars, making sure each one shone brightly for the children on Earth below.

One evening, Nova noticed a small star that was flickering sadly. "What's wrong, little star?" Nova asked gently.

"I feel too small to make a difference," the tiny star whispered. "The other stars are so much bigger and brighter than me."

Nova smiled warmly and wrapped the little star in a cosmic hug. "Every star matters," Nova said. "Even the smallest light can guide someone home."

That night, the little star shone with all its might. And far below on Earth, a lost kitten followed its gentle glow all the way back to its cozy home.

From that day on, the little star never felt small again. It had learned that even the tiniest light can make the biggest difference.

And as the stars twinkled softly overhead, Nova hummed a peaceful lullaby, watching over all the sleeping children below.

The end.`,
        sleepScore: 9,
    },
    'animals': {
        title: 'The Sleepy Forest Friends',
        content: `In a cozy corner of the Whispering Woods, the forest animals were preparing for bedtime. Owl hooted softly from her tree, "Time to sleep, everyone!"

Little Rabbit yawned widely, his fuzzy ears drooping with tiredness. Deer curled up beneath the old oak tree. And Bear found the softest patch of moss for his bed.

"Wait!" squeaked a tiny voice. It was Mouse, too excited to sleep. "I want just one more adventure!"

The wise old Owl flew down gently. "Even adventurers need rest," she said. "The best adventures come to those who dream deeply."

Mouse thought about this. "But what if I miss something wonderful?"

Owl smiled. "Close your eyes, and I'll tell you a secret. The most wonderful things happen in your dreams."

Mouse snuggled into her cozy nest and closed her eyes. Soon, soft snores filled the forest, a peaceful symphony of sleeping friends.

And in her dreams, Mouse had the most wonderful adventures of all.

Goodnight, little one.`,
        sleepScore: 10,
    },
    'fantasy': {
        title: 'The Magical Cloud Castle',
        content: `High above the mountains, where the clouds are softest and the air smells like vanilla, there stood a magical castle made entirely of dreams.

Princess Luna lived in this castle, and every night she had a very important job. She was the guardian of peaceful dreams.

Tonight, as the moon rose big and golden, Princess Luna prepared her special dream dust. It sparkled like tiny stars in her gentle hands.

She floated to her window and sprinkled the dust into the night sky. "Sweet dreams for all the children," she whispered.

The dream dust danced on the wind, finding its way to bedrooms everywhere. A little girl in the city dreamed of flying with butterflies. A boy by the sea dreamed of friendly dolphins.

Princess Luna smiled, watching the dreams float like bubbles across the world.

"My work here is done," she yawned, and climbed into her own bed made of the softest clouds.

As she drifted off to sleep, she dreamed the sweetest dream of all – a world full of happy, sleeping children.

Sleep well, dear dreamer.`,
        sleepScore: 9,
    },
    'default': {
        title: 'The Bedtime Garden',
        content: `In a hidden corner behind the moonflowers, there was a very special garden. This garden only bloomed at bedtime.

Every night, as children around the world closed their eyes, the Bedtime Garden came alive with magic.

Sleepy lavender flowers yawned open, releasing peaceful scents. Lullaby lilies swayed gently, singing soft songs only dreamers could hear.

The Garden Keeper, a gentle old toad named Theodore, tended to each plant with care. "Another beautiful night," he croaked contentedly.

Fireflies began their nightly dance, creating trails of soft light that spelled out sweet dreams in the air.

"Time for the dreamvines to bloom," Theodore said, and touched the special vine at the center of the garden.

The dreamvines unfurled, and from each flower floated a beautiful dream, ready to find a sleeping child who needed it most.

Theodore settled onto his lily pad and gazed at the stars. "Goodnight, garden. Goodnight, dreamers everywhere."

And the garden hummed its peaceful lullaby until morning light.

Sweet dreams.`,
        sleepScore: 9,
    }
}

export class GeminiAIGateway implements AIServicePort {
    private apiKey: string | null

    constructor(apiKey?: string) {
        this.apiKey = apiKey ?? import.meta.env?.VITE_GEMINI_API_KEY ?? null
    }

    async generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
        // For MVP without API key, use mock stories
        if (!this.apiKey) {
            return this.getMockStory(input.theme)
        }

        // Real Gemini implementation would go here
        // For now, fall back to mock to ensure app works
        try {
            return await this.callGeminiAPI(input)
        } catch (error) {
            console.warn('Gemini API call failed, using mock story:', error)
            return this.getMockStory(input.theme)
        }
    }

    private getMockStory(theme: string): GeneratedStory {
        const normalizedTheme = theme.toLowerCase()
        return MOCK_STORIES[normalizedTheme] ?? MOCK_STORIES['default']
    }

    private async callGeminiAPI(input: GenerateStoryInput): Promise<GeneratedStory> {
        // Placeholder for real Gemini API integration
        // This will be implemented when API key is available
        const prompt = this.buildPrompt(input)

        // TODO: Implement real Gemini API call
        // const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        // })

        console.log('Would call Gemini with prompt:', prompt.substring(0, 100) + '...')

        // Fall back to mock for now
        return this.getMockStory(input.theme)
    }

    private buildPrompt(input: GenerateStoryInput): string {
        const childContext = input.childName
            ? `for a child named ${input.childName}`
            : 'for a child'

        const ageContext = input.childAge
            ? `who is ${input.childAge} years old`
            : ''

        const lengthGuide = {
            'short': '300-400 words',
            'medium': '500-700 words',
            'long': '800-1000 words',
        }[input.duration ?? 'medium']

        return `You are DreamWeaver, a world-class children's bedtime storyteller.

Create a gentle, sleep-inducing ${input.theme} bedtime story ${childContext} ${ageContext}.

Requirements:
- Length: approximately ${lengthGuide}
- Tone: Calm, peaceful, and reassuring
- Ending: Must wind down to a sleepy, peaceful conclusion
- Content: Age-appropriate, no scary elements
- Structure: Clear beginning, middle, and gentle ending

The story should help the child relax and drift off to sleep.

Output the story in this format:
TITLE: [Story Title]
CONTENT: [Full story text with paragraph breaks]
SLEEP_SCORE: [1-10 rating of how sleep-inducing the story is]`
    }
}
