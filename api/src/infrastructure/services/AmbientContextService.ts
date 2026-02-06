/**
 * AmbientContextService - Environmental awareness for story suggestions
 * 
 * Provides weather, time-of-day, and location-based context to
 * enhance story personalization for the BedtimeConductorAgent.
 */

import { AmbientContext, AmbientContextPort } from '../../application/ports/AmbientContextPort.js'

interface OpenWeatherResponse {
    weather: Array<{ main: string; description: string }>
    main: { temp: number; humidity: number }
}

export class AmbientContextService implements AmbientContextPort {
    private apiKey: string | null
    private cachedContext: AmbientContext | null = null
    private cacheExpiry: Date | null = null

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env['OPENWEATHER_API_KEY'] || null
    }

    async getAmbientContext(latitude?: number, longitude?: number): Promise<AmbientContext> {
        // Check cache (5 minute TTL)
        if (this.cachedContext && this.cacheExpiry && new Date() < this.cacheExpiry) {
            return this.cachedContext
        }

        const now = new Date()
        const hour = now.getHours()
        const day = now.getDay()

        // Time of day
        let timeOfDay: AmbientContext['timeOfDay']
        if (hour >= 5 && hour < 12) timeOfDay = 'morning'
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
        else if (hour >= 17 && hour < 21) timeOfDay = 'evening'
        else timeOfDay = 'night'

        // Season (Northern Hemisphere approximation)
        const month = now.getMonth()
        let season: AmbientContext['season']
        if (month >= 2 && month <= 4) season = 'spring'
        else if (month >= 5 && month <= 7) season = 'summer'
        else if (month >= 8 && month <= 10) season = 'autumn'
        else season = 'winter'

        // Weekend check
        const isWeekend = day === 0 || day === 6

        // Weather data (from API or defaults)
        const weather = await this.fetchWeather(latitude, longitude)

        // Suggested mood based on conditions
        let suggestedMood: AmbientContext['suggestedMood']
        if (weather.condition === 'rainy' || weather.condition === 'stormy') {
            suggestedMood = 'cozy'
        } else if (weather.condition === 'snowy') {
            suggestedMood = 'magical'
        } else if (timeOfDay === 'night' || timeOfDay === 'evening') {
            suggestedMood = 'calm'
        } else {
            suggestedMood = 'adventurous'
        }

        const context: AmbientContext = {
            timeOfDay,
            weather,
            season,
            isWeekend,
            suggestedMood
        }

        // Cache for 5 minutes
        this.cachedContext = context
        this.cacheExpiry = new Date(Date.now() + 5 * 60 * 1000)

        return context
    }

    private async fetchWeather(lat?: number, lon?: number): Promise<AmbientContext['weather']> {
        if (!this.apiKey || !lat || !lon) {
            return this.getDefaultWeather()
        }

        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
            const response = await fetch(url)

            if (!response.ok) {
                console.warn('[AmbientContext] Weather API failed, using defaults')
                return this.getDefaultWeather()
            }

            const data = await response.json() as OpenWeatherResponse
            const mainWeather = data.weather[0]?.main?.toLowerCase() || 'unknown'

            let condition: AmbientContext['weather']['condition']
            if (mainWeather.includes('clear') || mainWeather.includes('sun')) {
                condition = 'clear'
            } else if (mainWeather.includes('cloud')) {
                condition = 'cloudy'
            } else if (mainWeather.includes('rain') || mainWeather.includes('drizzle')) {
                condition = 'rainy'
            } else if (mainWeather.includes('snow')) {
                condition = 'snowy'
            } else if (mainWeather.includes('thunder') || mainWeather.includes('storm')) {
                condition = 'stormy'
            } else {
                condition = 'unknown'
            }

            return {
                condition,
                temperature: Math.round(data.main.temp),
                humidity: data.main.humidity
            }
        } catch (error) {
            console.error('[AmbientContext] Weather fetch error:', error)
            return this.getDefaultWeather()
        }
    }

    private getDefaultWeather(): AmbientContext['weather'] {
        return {
            condition: 'clear',
            temperature: 20,
            humidity: 50
        }
    }

    /**
     * Get theme suggestions based on ambient context
     */
    suggestThemes(context: AmbientContext): string[] {
        const themes: string[] = []

        // Weather-based themes
        switch (context.weather.condition) {
            case 'rainy':
                themes.push('cozy-indoors', 'puddle-jumping', 'rainbow')
                break
            case 'snowy':
                themes.push('winter-wonderland', 'snowflakes', 'warm-cocoa')
                break
            case 'stormy':
                themes.push('brave-knight', 'safe-shelter', 'thunder-friends')
                break
            case 'clear':
                themes.push('stargazing', 'moonlit-adventure', 'fireflies')
                break
            default:
                themes.push('dream-clouds', 'imagination')
        }

        // Season-based additions
        if (context.season === 'autumn') {
            themes.push('falling-leaves', 'harvest', 'forest-animals')
        } else if (context.season === 'spring') {
            themes.push('butterflies', 'baby-animals', 'flowers')
        }

        // Time-based calming for bedtime
        if (context.timeOfDay === 'night') {
            themes.unshift('sleepy-stars', 'moon-lullaby')
        }

        return themes.slice(0, 5) // Return top 5
    }
}
