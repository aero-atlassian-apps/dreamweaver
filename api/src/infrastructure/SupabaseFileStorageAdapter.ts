/**
 * SupabaseFileStorageAdapter - Backend implementation
 */

import type { FileStoragePort } from '../application/ports/FileStoragePort.js'
import { supabase } from './supabase.js'
import { supabaseAdmin } from './supabaseAdmin.js'

export class SupabaseFileStorageAdapter implements FileStoragePort {
    private readonly bucketName = 'voice-samples'

    async upload(fileData: ArrayBuffer | Uint8Array, path: string, contentType: string): Promise<string> {
        const client = supabaseAdmin || supabase
        if (!client) throw new Error('Supabase client not initialized')
        if (!supabaseAdmin && process.env['NODE_ENV'] === 'production') {
            throw new Error('Supabase service role is required for file uploads in production')
        }

        // Supabase JS on backend accepts different types.
        // ArrayBuffer or Buffer are generally fine.

        const { error } = await client.storage
            .from(this.bucketName)
            .upload(path, fileData, {
                contentType,
                upsert: true
            })

        if (error) {
            console.error('[SupabaseStorage] Upload Error Detail:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                raw: error
            })

            // Try to extract the real error from the response body if it's a 400
            const originalError = (error as any).originalError;
            if (originalError && originalError.json) {
                try {
                    // Note: We can't await here easily if the error object struct is weird, 
                    // but usually standard Response objects have .json()
                    // However, in Node environments, this might be a node-fetch Response.
                } catch (e) { /* ignore */ }
            }

            throw new Error(`Failed to upload file: ${error.message || JSON.stringify(error)}`)
        }

        const { data } = client.storage
            .from(this.bucketName)
            .getPublicUrl(path)

        return data.publicUrl
    }
}
