/**
 * MCPAudioSensorAdapter - Client for simulating MCP Audio Tools.
 * 
 * In a production scenario, this would connect to a local MCP server (e.g., via stdio).
 * For R6 simulation, we mock the MCP environment inputs.
 */

import { AudioSensorPort } from '../../application/ports/AudioSensorPort'

export class MCPAudioSensorAdapter implements AudioSensorPort {
    // Hidden state to simulate environment changes during demos/tests
    private simulatedVolume = 0.5
    private simulatedBreathing: 'rhythmic' | 'chaotic' | 'none' = 'none'

    constructor() {
        console.log('[MCPAudioSensor] Initialized connection to Simulated Audio Tools')
    }

    /**
     * Simulates fetching volume from an external sensor tool.
     */
    async getAmbientVolume(): Promise<number> {
        // Simulating random fluctuations usually found in sensors
        const jitter = (Math.random() - 0.5) * 0.05
        return Math.max(0, Math.min(1, this.simulatedVolume + jitter))
    }

    /**
     * Simulates analyzing the spectral pattern of the audio stream.
     */
    async detectBreathingPattern(): Promise<'rhythmic' | 'chaotic' | 'none'> {
        return this.simulatedBreathing
    }

    // --- Simulation Controls (Test Harness Methods) ---

    setSimulatedState(volume: number, breathing: 'rhythmic' | 'chaotic' | 'none') {
        this.simulatedVolume = volume
        this.simulatedBreathing = breathing
        console.log(`[MCPAudioSensor] Environment Changed: Vol=${volume}, Breath=${breathing}`)
    }
}
