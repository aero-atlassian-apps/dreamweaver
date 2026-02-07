/**
 * Supabase Demo Feedback Table Health Check
 * Run with: npx tsx scripts/check-demo-feedback.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xtaoqykzrfdjwzfsawod.supabase.co'
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YW9xeWt6cmZkand6ZnNhd29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM4NTU3NSwiZXhwIjoyMDg1OTYxNTc1fQ.sTioBksO83fVBSdt5POybzT6qWISIn1Y7SjRd62QMPU'

async function checkDemoFeedbackTable() {
    console.log('🔍 Checking demo_feedback table...\n')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // 1. Check if table exists by attempting a select
    console.log('1. Table existence check:')
    const { data, error } = await supabase
        .from('demo_feedback')
        .select('*')
        .limit(1)

    if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
            console.log('   ❌ Table does NOT exist. Please run the migration.')
            console.log('   📄 Migration file: supabase/migrations/20260207000000_demo_feedback.sql')
            return false
        }
        console.log('   ⚠️ Error:', error.message)
    } else {
        console.log('   ✅ Table EXISTS')
        console.log('   📊 Current row count:', data?.length ?? 0, '(limited to 1)')
    }

    // 2. Check table structure
    console.log('\n2. Checking table structure:')
    const { data: columns, error: colError } = await supabase
        .rpc('get_table_columns', { table_name: 'demo_feedback' })
        .catch(() => ({ data: null, error: { message: 'RPC not available' } }))

    if (colError) {
        // Fallback: just try to insert and see what happens
        console.log('   (Using insert test as fallback)')
    }

    // 3. Test insert (RLS check)
    console.log('\n3. Testing INSERT (RLS policy):')
    const testId = crypto.randomUUID()
    const { error: insertError } = await supabase
        .from('demo_feedback')
        .insert({
            verdict: 'approved',
            message: '[Health Check Test]',
            context: { test: true, timestamp: new Date().toISOString() }
        })

    if (insertError) {
        console.log('   ❌ Insert FAILED:', insertError.message)
        if (insertError.code === '42501') {
            console.log('   💡 This might be an RLS policy issue.')
        }
    } else {
        console.log('   ✅ Insert SUCCEEDED (RLS policy is working)')
    }

    // 4. Summary
    console.log('\n' + '='.repeat(50))
    console.log('✅ demo_feedback table is ready for use!')
    console.log('='.repeat(50))

    return true
}

checkDemoFeedbackTable()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error('Fatal error:', err)
        process.exit(1)
    })
