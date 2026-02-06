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
            throw new Error(`Failed to upload file: ${error.message}`)
        }

        const { data } = client.storage
            .from(this.bucketName)
            .getPublicUrl(path)

        return data.publicUrl
    }
}
