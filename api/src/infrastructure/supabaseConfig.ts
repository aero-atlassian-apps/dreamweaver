import { z } from 'zod';

const SupabaseEnvSchema = z.object({
    // URL is required
    SUPABASE_URL: z.string().url(),

    // Keys: Support both standard names and VITE_ prefixed (for shared monorepo config)
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

// Helper to normalize env vars
function getEnv() {
    return {
        SUPABASE_URL: process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'],
        SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY'] || process.env['VITE_SUPABASE_ANON_KEY'],
        SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY'],
    };
}

const env = getEnv();
const result = SupabaseEnvSchema.safeParse(env);

if (!result.success) {
    console.error('❌ Invalid Supabase Configuration:', result.error.flatten().fieldErrors);
    // We prefer to fail hard on startup for critical infrastructure
    // However, for development flexibility, we might just warn if strictly not production
    if (process.env['NODE_ENV'] === 'production') {
        throw new Error('Invalid Supabase Configuration');
    }
}

export const supabaseConfig = result.data || {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: undefined
};

export const isConfigValid = result.success;
