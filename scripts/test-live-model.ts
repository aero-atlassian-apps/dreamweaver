
import WebSocket from 'ws';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
}

const MODELS_TO_TEST = [
    'models/gemini-2.0-flash-exp', // Known working
    'models/gemini-3-flash-preview', // Target
    'models/gemini-3-pro-preview',   // Target
];

async function testModel(model: string) {
    const host = 'generativelanguage.googleapis.com';
    const path = `/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
    const url = `wss://${host}${path}`;

    console.log(`\n🧪 Testing Model: ${model}`);

    return new Promise<void>((resolve) => {
        const ws = new WebSocket(url);

        ws.on('open', () => {
            console.log('   ✅ WebSocket Connected');
            // Send setup message to request the specific model
            const setupMsg = {
                setup: {
                    model: model,
                    generation_config: {
                        response_modalities: ['AUDIO']
                    }
                }
            };
            ws.send(JSON.stringify(setupMsg));
            console.log('   Tyring to Init Session...');
        });

        ws.on('message', (data) => {
            const str = data.toString();
            console.log('   📩 Received:', str.substring(0, 100) + '...');
            if (str.includes('serverContent')) {
                console.log('   ✅ SUCCESS: Model accepted and ready!');
                ws.close();
                resolve();
            }
        });

        ws.on('error', (err) => {
            console.error('   ❌ Connection Error:', err.message);
            resolve();
        });

        ws.on('close', (code, reason) => {
            console.log(`   Expected Close: ${code} ${reason}`);
            resolve();
        });

        // Timeout
        setTimeout(() => {
            console.log('   ⚠️ Timeout waiting for response');
            ws.terminate();
            resolve();
        }, 5000);
    });
}

(async () => {
    console.log('🔍 Starting Model Compatibility Scan...');
    for (const model of MODELS_TO_TEST) {
        await testModel(model);
    }
})();
