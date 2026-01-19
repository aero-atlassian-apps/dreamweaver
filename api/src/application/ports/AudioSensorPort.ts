/**
 * AudioSensorPort - Interface for environment sensing.
 * 
 * In R6, this is adapted to use the Model Context Protocol (MCP) to 
 * decouple the backend from specific sensor hardware.
 */

export interface AudioSensorPort {
    /**
     * Get the current ambient volume level (0.0 to 1.0)
     */
    getAmbientVolume(): Promise<number>

    /**
     * Detect specific breathing patterns from the audio stream
     */
    detectBreathingPattern(): Promise<'rhythmic' | 'chaotic' | 'none'>
}
