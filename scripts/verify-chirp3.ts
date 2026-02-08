
import { GoogleCloudVoiceAdapter } from '../api/src/infrastructure/adapters/GoogleCloudVoiceAdapter.js'
import dotenv from 'dotenv'
import path from 'path'

// Load root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function main() {
    console.log("🔍 Verifying Google Cloud TTS (Chirp 3 Implementation)...")

    // Check Env
    if (!process.env.GOOGLE_TTS_API_KEY) {
        console.error("❌ GOOGLE_TTS_API_KEY is missing from .env")
        process.exit(1)
    }
    console.log("✅ API Key found")

    if (!process.env.GOOGLE_PROJECT_ID) {
        console.warn("⚠️  GOOGLE_PROJECT_ID is missing. Custom Voice creation will return mock immediately.")
    } else {
        console.log(`✅ Project ID found: ${process.env.GOOGLE_PROJECT_ID}`)
    }

    const adapter = new GoogleCloudVoiceAdapter()

    // 1. List Voices (Basic Connectivity)
    console.log("\n📡 1. Listing voices (Connectivity Check)...")
    try {
        const voices = await adapter.listVoices()
        if (voices.length > 0) {
            console.log(`✅ Listed ${voices.length} voices. First: ${voices[0].name}`)
        } else {
            console.error("❌ Failed to list voices (or empty list)")
        }
    } catch (e) {
        console.error("❌ List voices failed:", e)
    }

    // 2. Test Synthesis (Standard)
    console.log("\n🗣️  2. Testing Synthesis (Standard Journey Voice)...")
    try {
        const result = await adapter.synthesize({
            text: "Hello, this is a test of the Google Cloud adapter.",
            voiceProfile: { voiceModelId: 'en-US-Journey-D' }
        })
        console.log(`✅ Synthesis successful! Generated ${result.audioBase64.length} bytes.`)
    } catch (e) {
        console.error("❌ Synthesis failed:", e)
    }

    // 3. Test Chirp 3 "Creation" (Clone)
    console.log("\n🧬 3. Testing Chirp 3 'Instant Custom Voice' Creation...")
    try {
        // Use a real public audio file to simulate a sample
        const SAMPLE_URL = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"

        console.log(`   Input Sample: ${SAMPLE_URL}`)
        const result = await adapter.cloneVoice({
            voiceName: 'test-voice',
            sampleAudioUrl: SAMPLE_URL
        })

        console.log("   Result:", result)

        if (result.voiceModelId.includes('dormant-fallback') || result.voiceModelId.includes('mock-ref')) {
            console.log("✅ Test Passed: Gracefully handled lack of allowlist/permission (Dormant Mode).")
        } else if (result.voiceModelId.startsWith('projects/')) {
            console.log("🎉 WOW! You have access! A real voice ID was returned:", result.voiceModelId)
        } else {
            console.log("⚠️  Unexpected result format.")
        }

    } catch (e: any) {
        console.error("❌ Clone failed with unexpected error:", e)
    }
}

main()
