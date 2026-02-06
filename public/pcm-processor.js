/**
 * PCMProcessor - AudioWorklet for raw 16-bit PCM streaming.
 * 
 * Handles buffering and feeding the Web Audio API without main thread jank.
 * Critical for Gemini Live "Zero-Latency" feel.
 */
class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.buffer = new Float32Array(0)
        this.port.onmessage = this.handleMessage.bind(this)
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0]
        const channel = output[0]

        if (!channel) return true

        if (this.buffer.length >= channel.length) {
            channel.set(this.buffer.subarray(0, channel.length))
            this.buffer = this.buffer.subarray(channel.length)

            // Send volume back to main thread for visualization
            let sum = 0
            for (let i = 0; i < channel.length; i++) {
                sum += channel[i] * channel[i]
            }
            const rms = Math.sqrt(sum / channel.length)
            this.port.postMessage({ type: 'volume', volume: rms })
        } else {
            // Underflow: fill with silence
            channel.fill(0)
            if (this.buffer.length > 0) {
                channel.set(this.buffer)
                this.buffer = new Float32Array(0)
            }
        }

        return true
    }

    /**
     * Receive raw PCM chunks (Float32) from the Main Thread
     */
    handleMessage(e) {
        const newData = e.data
        if (newData.type === 'flush') {
            this.buffer = new Float32Array(0)
            return
        }

        // newData is Float32Array
        const newBuffer = new Float32Array(this.buffer.length + newData.length)
        newBuffer.set(this.buffer)
        newBuffer.set(newData, this.buffer.length)
        this.buffer = newBuffer
    }
}

// Fixed the port.onmessage assignment outside constructor/methods if needed
// Actually in AudioWorkletProcessor, port.onmessage should be set in constructor or handled via port.on('message')

registerProcessor('pcm-processor', PCMProcessor)
