
import WebSocket from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_KEY = "AIzaSyAKNtC2kwwqs9JrnqdcDYYEtvXNnSyGfxI"; // Hardcoded for verification

const MODELS_TO_TEST = [
    'models/gemini-2.0-flash-exp',
    'models/gemini-live-2.5-flash-native-audio',
    'models/gemini-3-flash-preview',
    'models/gemini-3-pro-preview'
];

async function testModel(model) {
    const host = 'generativelanguage.googleapis.com';
    const path = `/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
    const url = `wss://${host}${path}`;

    console.log(`\n----------------------------------------`);
    console.log(`🧪 Testing Model: ${model}`);
    console.log(`----------------------------------------`);

    return new Promise((resolve) => {
        const ws = new WebSocket(url);

        ws.on('open', () => {
            console.log('   ✅ WebSocket Handshake OK');
            const setupMsg = {
                setup: {
                    model: model,
                    generation_config: {
                        response_modalities: ['AUDIO']
                    }
                }
            };
            ws.send(JSON.stringify(setupMsg));
            console.log('   📤 Sent Setup Message...');
        });

        ws.on('message', (data) => {
            const str = data.toString();
            if (str.includes('serverContent')) {
                console.log('   ✅ SUCCESS: Server Content Received!');
                ws.close();
                resolve({ model, success: true });
            } else if (str.includes('error')) {
                console.log('   ❌ SERVER ERROR:', str);
            } else {
                console.log('   📩 Received:', str.substring(0, 100));
            }
        });

        ws.on('error', (err) => {
            console.error('   ❌ Connection Error:', err.message);
            resolve({ model, success: false });
        });

        ws.on('close', (code, reason) => {
            console.log(`   🛑 Closed: ${code} ${reason}`);
            resolve({ model, success: false });
        });

        setTimeout(() => {
            console.log('   ⚠️ Timeout (10s) - No response to setup');
            ws.terminate();
            resolve({ model, success: false });
        }, 10000);
    });
}

(async () => {
    console.log('🔍 Starting Model Compatibility Scan...');
    for (const model of MODELS_TO_TEST) {
        await testModel(model);
    }
})();
