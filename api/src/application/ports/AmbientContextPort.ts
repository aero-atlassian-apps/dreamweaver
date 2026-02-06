/**
 * AmbientContextPort - Domain/Application port for environmental awareness.
 */

export interface AmbientContext {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    weather: {
        condition: 'clear' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'unknown'
        temperature: number // Celsius
        humidity: number // Percentage
    }
    season: 'spring' | 'summer' | 'autumn' | 'winter'
    isWeekend: boolean
    suggestedMood: 'calm' | 'adventurous' | 'cozy' | 'magical'
}

export interface AmbientContextPort {
    getAmbientContext(latitude?: number, longitude?: number): Promise<AmbientContext>
}
