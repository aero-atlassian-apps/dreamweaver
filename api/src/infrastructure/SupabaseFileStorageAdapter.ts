/**
 * SupabaseFileStorageAdapter - Backend implementation
 */

import type { FileStoragePort } from '../application/ports/FileStoragePort'
import { supabase } from './supabase'

export class SupabaseFileStorageAdapter implements FileStoragePort {
    private readonly bucketName = 'voice-samples'

    async upload(fileData: ArrayBuffer | Uint8Array, path: string, contentType: string): Promise<string> {
        if (!supabase) throw new Error('Supabase client not initialized')

        // Supabase JS on backend accepts different types.
        // ArrayBuffer or Buffer are generally fine.

        const { error } = await supabase.storage
            .from(this.bucketName)
            .upload(path, fileData, {
                contentType,
                upsert: true
            })

        if (error) {
            throw new Error(`Failed to upload file: ${error.message}`)
        }

        const { data } = supabase.storage
            .from(this.bucketName)
            .getPublicUrl(path)

        return data.publicUrl
    }
}
