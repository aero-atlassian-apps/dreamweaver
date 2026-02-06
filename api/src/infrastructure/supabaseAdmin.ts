import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL']
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase Service Role credentials not found. RLS bypass will not work.')
}

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null
