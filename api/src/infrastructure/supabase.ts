import { createClient } from '@supabase/supabase-js'
import { supabaseConfig, isConfigValid } from './supabaseConfig.js'

if (!isConfigValid) {
    console.warn('⚠️ Supabase credentials not found/invalid in environment variables')
}

export const supabase = isConfigValid
    ? createClient(supabaseConfig.SUPABASE_URL, supabaseConfig.SUPABASE_ANON_KEY)
    : null
