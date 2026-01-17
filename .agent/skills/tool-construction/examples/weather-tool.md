# Tool Example: Weather Tool

This example demonstrates the recommended pattern for building LLM-invokable tools.

## Input Request
"Create a weather tool that can fetch current weather for a location"

## Output Tool Definition

```typescript
// src/tools/weather.ts
import { z } from 'zod';

/**
 * Weather Tool
 * 
 * Fetches current weather data for a specified location.
 * The agent will call this tool when users ask about weather conditions.
 */
export const weatherTool = {
  name: 'getCurrentWeather',
  
  description: `
    Get the current weather conditions for a specific location.
    Use this when the user asks about weather, temperature, or conditions
    for a city or region. Returns temperature, conditions, and humidity.
  `,
  
  // Type-safe parameters with Zod
  parameters: z.object({
    location: z.string()
      .describe('The city and state/country, e.g., "San Francisco, CA" or "London, UK"'),
    unit: z.enum(['celsius', 'fahrenheit'])
      .default('celsius')
      .describe('Temperature unit preference'),
  }),
  
  // Executor function - returns string, doesn't throw
  execute: async ({ location, unit }: { location: string; unit: 'celsius' | 'fahrenheit' }) => {
    try {
      const response = await fetch(`https://api.weather.example/v1/current?q=${encodeURIComponent(location)}&units=${unit}`);
      
      if (!response.ok) {
        // Return error as string, don't throw!
        return `Error: Unable to fetch weather for "${location}". API returned ${response.status}.`;
      }
      
      const data = await response.json();
      
      return JSON.stringify({
        location: data.location.name,
        temperature: data.current.temp,
        unit: unit,
        conditions: data.current.condition.text,
        humidity: data.current.humidity,
      });
    } catch (error) {
      // Return error as string, don't throw!
      return `Error: Failed to fetch weather data. ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};
```

## Key Patterns Used

1. **Zod schema** - Type-safe parameter validation
2. **Descriptive `.describe()`** - Helps LLM understand parameter purpose
3. **Error handling** - Returns errors as strings, never throws
4. **Granular design** - Single responsibility (just weather)
5. **Clear docstring** - Explains when to use the tool
