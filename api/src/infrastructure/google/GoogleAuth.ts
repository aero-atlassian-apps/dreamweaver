import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';

export class GoogleCloudAuth {
    private auth: GoogleAuth;

    constructor() {
        // checks for GOOGLE_APPLICATION_CREDENTIALS automatically
        // but for Vercel, we often want to support GOOGLE_SERVICE_ACCOUNT_JSON content directly
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
    }

    /**
     * Gets an authenticated client or headers.
     * Uses GOOGLE_APPLICATION_CREDENTIALS file path if present.
     * Fallbacks to GOOGLE_SERVICE_ACCOUNT_JSON content if present (writes to temp file if needed by library, but library supports credentials object too).
     */
    async getAccessToken(): Promise<string> {
        // If GOOGLE_SERVICE_ACCOUNT_JSON is set and no file path is set, we can parse it
        const jsonContent = process.env['GOOGLE_SERVICE_ACCOUNT_JSON'];
        const filePath = process.env['GOOGLE_APPLICATION_CREDENTIALS'];

        if (!filePath && jsonContent) {
            // Determine if it's a file path or JSON content
            if (jsonContent.trim().startsWith('{')) {
                const credentials = JSON.parse(jsonContent);
                this.auth = new GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/cloud-platform']
                });
            }
        }

        const client = await this.auth.getClient();
        const token = await client.getAccessToken();
        return token.token || '';
    }

    getProjectId(): Promise<string> {
        return this.auth.getProjectId();
    }
}
