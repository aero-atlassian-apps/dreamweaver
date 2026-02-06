---
name: audio-streaming
description: Best practices for implementing premium, real-time, "live-alike" audio experiences using Web Audio API, WebSockets/WebRTC, and React.
---

# Audio Streaming & Real-Time Live Experience

This skill outlines the industry standards and best practices for building premium, real-time audio applications in 2026. It focuses on achieving unrelated low latency, robust playback, and a highly responsive "live" feel.

## 1. Core Architecture Pattern

For "live-alike" AI interactions (e.g., voice chat, real-time storytelling), choose the right transport:

| Requirement | Recommended Technology | Why? |
| :--- | :--- | :--- |
| **Ultra-Low Latency (<300ms)** | **WebRTC** (or WebSocket + AudioWorklet) | Essential for precise implementations where interruption handling is key. |
| **Standard Streaming (<1s)** | **HLS / DASH** | Better for one-way broadcasting where slight delay is acceptable. |
| **AI Text-to-Speech (TTS)** | **WebSocket + ArrayBuffer** | Stream raw PCM/Opus chunks from the server immediately as they are generated. |

### Recommended Stack (DreamWeaver Context)
-   **Transport**: WebSocket (simpler than WebRTC for 1:1 server-client audio) or Server-Sent Events (SSE) for text + separate audio fetch if not strictly conversational.
-   **Format**: Opus (high fidelity, low bandwidth) or PCM (if processing raw audio).
-   **Client Audio Engine**: **Web Audio API** (AudioContext) + **AudioWorklet** (for glitch-free processing on a separate thread).

## 2. Frontend Implementation (React)

### The Audio Engine Hook
Encapsulate audio logic in a `useAudioEngine` hook. DO NOT put `AudioContext` logic directly in components.

```typescript
// Example: Core Audio Engine Logic
class AudioEngine {
  private context: AudioContext;
  private workletNode: AudioWorkletNode | null = null;
  private queue: Float32Array[] = [];
  
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 'interactive', // Critical for low latency
      sampleRate: 24000, // Match your AI model output
    });
  }

  // Use AudioWorklet for glitch-free streaming
  async init() {
    await this.context.audioWorklet.addModule('/audio-processor.js');
    this.workletNode = new AudioWorkletNode(this.context, 'stream-processor');
    this.workletNode.connect(this.context.destination);
  }

  scheduleChunk(chunk: Float32Array) {
    // Schedule chunks precisely using context.currentTime
    // maintain a small jitter buffer (e.g., 50-100ms)
  }
}
```

### Best Practices regarding "The Premium Feel"

1.  **Optimistic UI & Visualizers**:
    *   Never show a generic "loading" spinner for audio.
    *   Use a waveform or frequency visualizer that reacts *instantly* to local microphone input (if conversational) or server audio.
    *   animate the "Connecting" state with a heartbeat or breathing animation.

2.  **Latency Masking**:
    *   Play a subtle "start listening" chime locally immediately when the user taps "Speak".
    *   Display "Thinking..." or real-time text transcription streaming *before* the audio begins playing.

3.  **Interruption Handling (Barge-in)**:
    *   If the user starts speaking while the AI is talking, **immediately** fade out (200ms) the current audio buffer.
    *   Send a cancel signal to the server to stop generation to save tokens.

## 3. Resilience & Quality

-   **Handling Empty Buffers**: If the network lags and the buffer runs dry, strictly **fade out** to avoidance pops/clicks. Never hard-stop.
-   **Auto-Resume**: If the context enters 'suspended' state (common on mobile browsers), listen for the first user interaction (touchstart) to calling `context.resume()`.
-   **Background Audio**:
    *   Use the **Media Session API** (`navigator.mediaSession`) to allow lock-screen controls.
    *   For mobile web, ensure your PWA manifest has `display: standalone` and handle visibility change events to keep audio alive (or use a hacky strict `<audio>` element if AudioContext is throttled).

## 4. Testing & Validation

-   **Network Throttling**: Test with "Fast 3G" in DevTools to ensure your jitter buffer logic works.
-   **Device Sleep**: Verify audio continues when the phone screen turns off (critical for bedtime stories).
-   **Glitch Detection**: Monitor `AudioContext.state` and log any underruns (when the play head catches up to the buffer end).

## 5. Security Checklist
-   [ ] WSS (Secure WebSockets) only.
-   [ ] Validate audio file headers if decoding.
-   [ ] Do not log raw audio buffers.
