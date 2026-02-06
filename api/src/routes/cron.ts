import { Hono } from 'hono'
import { container } from '../di/container.js'
import { supabaseAdmin } from '../infrastructure/supabaseAdmin.js'

export const cronRoute = new Hono()

/**
 * [SCALE-02] Batch size for parallel processing.
 * Prevents Vercel function timeouts by processing users in parallel batches.
 */
const BATCH_SIZE = 10

/**
 * Process a single user's weekly digest.
 */
async function processUserDigest(userId: string): Promise<{
    userId: string
    sent?: boolean
    storiesCount?: number
    skipped?: string
    error?: string
}> {
    if (!supabaseAdmin) {
        return { userId, error: 'No admin client' }
    }

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (error || !data?.user) {
        return { userId, error: 'Failed to load user profile' }
    }

    const user = data.user
    const email = user.email
    if (!email) {
        return { userId, error: 'Missing email' }
    }

    const childName = (user.user_metadata as any)?.child_name || 'Your child'

    const { data: prefs } = await supabaseAdmin
        .from('user_preferences')
        .select('weekly_digest_enabled')
        .eq('user_id', userId)
        .maybeSingle()

    if (prefs && prefs.weekly_digest_enabled === false) {
        return { userId, sent: false, storiesCount: 0, skipped: 'weekly_digest_disabled' }
    }

    const result = await container.sendWeeklyDigestUseCase.execute({
        userId,
        email,
        childName
    })

    return { userId, ...result }
}

cronRoute.get('/weekly-digest', async (c) => {
    const cronSecret = c.req.header('Authorization')
    const secret = process.env['CRON_SECRET']
    if (process.env['NODE_ENV'] === 'production' && (!cronSecret || cronSecret !== `Bearer ${secret}`)) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    container.logger.info('Starting Weekly Digest Cron Job')

    if (!supabaseAdmin) {
        return c.json({ success: false, error: 'Supabase service role is required for cron jobs' }, 500)
    }

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data: storyRows, error: storyError } = await supabaseAdmin
        .from('stories')
        .select('user_id, created_at')
        .gte('created_at', oneWeekAgo.toISOString())
        .limit(2000)

    if (storyError) {
        return c.json({ success: false, error: `Failed to fetch active users: ${storyError.message}` }, 500)
    }

    const userIds = Array.from(new Set((storyRows || []).map(r => r.user_id).filter(Boolean)))

    // [SCALE-02] Process in parallel batches to prevent timeout
    const results: Array<{
        userId: string
        sent?: boolean
        storiesCount?: number
        skipped?: string
        error?: string
    }> = []

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        const batch = userIds.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.allSettled(
            batch.map(userId => processUserDigest(userId))
        )

        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value)
            } else {
                const batchIndex = batchResults.indexOf(result)
                const failedUserId = batch[batchIndex]
                container.logger.error(`Failed to send digest for user ${failedUserId}`, result.reason)
                results.push({ userId: failedUserId, error: String(result.reason) })
            }
        }
    }

    return c.json({ success: true, results, processedCount: results.length })
})

