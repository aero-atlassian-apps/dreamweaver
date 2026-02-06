import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const EnvSchema = z.object({
    VITE_SUPABASE_URL: z.string().url({ message: "VITE_SUPABASE_URL must be a valid URL" }),
    VITE_SUPABASE_ANON_KEY: z.string().min(1, { message: "VITE_SUPABASE_ANON_KEY is required" }),
})

// Validate environment variables early to fail fast
const envResult = EnvSchema.safeParse(import.meta.env)

let supabase: SupabaseClient | null = null

if (!envResult.success) {
    console.warn(
        '⚠️ Supabase configuration missing or invalid. Check your .env file.',
        envResult.error.flatten().fieldErrors
    )
} else {
    supabase = createClient(
        envResult.data.VITE_SUPABASE_URL,
        envResult.data.VITE_SUPABASE_ANON_KEY
    )
}

export { supabase }
