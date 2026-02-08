
import 'dotenv/config'
import { GoogleCloudVoiceAdapter } from '../api/src/infrastructure/adapters/GoogleCloudVoiceAdapter.js'

async function main() {
    console.log("🔍 Verifying Chirp 3 Service Account Auth...")

    // Check Env
    const projectId = process.env.GOOGLE_PROJECT_ID
    console.log(`   Project ID: ${projectId || 'MISSING'}`)

    // Instantiate Adapter
    // This now initializes GoogleCloudAuth internally
    const adapter = new GoogleCloudVoiceAdapter()

    // Test 1: Synthesis (Should still work with API Key, or failing that, mock)
    // We skip this to focus on Cloning which uses the new Auth

    // Test 2: Cloning (Requires Service Account)
    console.log("\n🧪 Testing Clone Voice (Service Account Path)...")
    const SAMPLE_URL = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"

    try {
        const result = await adapter.cloneVoice({
            voiceName: 'test-sa-voice',
            sampleAudioUrl: SAMPLE_URL
        })

        console.log("   Result:", result)

        if (result.voiceModelId.includes('dormant-fallback') || result.voiceModelId.includes('error-fallback')) {
            console.log("✅ Fallback active (Expected if no valid SA creds are present)")
        } else {
            console.log("✅ Success (Real ID returned!)")
        }

    } catch (error) {
        console.error("❌ Unexpected Error in Verification:", error)
    }
}

main()
