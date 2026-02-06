import { Hono } from 'hono'
import { z } from 'zod'
import { container } from '../di/container.js'
import { authMiddleware } from '../middleware/auth.js'
import type { ApiEnv } from '../http/ApiEnv.js'

const app = new Hono<ApiEnv>()

const createShareLinkSchema = z.object({
    resourceId: z.string().min(1, "resourceId is required"),
    type: z.enum(['STORY', 'MOMENT']),
    expiresInDays: z.number().min(1).max(30).optional().default(2),
    maxViews: z.number().min(1).max(3).optional().default(3)
})

const tokenParamSchema = z.object({
    token: z.string().min(1)
})

// Protected: Create a share link
app.post('/', authMiddleware, async (c) => {
    let body;
    try {
        const json = await c.req.json();
        body = createShareLinkSchema.parse(json);
    } catch (e) {
        return c.json({ success: false, error: 'Validation Error' }, 400);
    }

    try {
        const user = c.get('user')!
        const result = await container.createShareLinkUseCase.execute({
            ownerId: user.id,
            resourceId: body.resourceId,
            type: body.type,
            expiresInDays: body.expiresInDays,
            maxViews: body.maxViews
        })

        return c.json({
            success: true,
            data: result
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create share link'
        const status = message === 'Not authorized to share this story' || message === 'Not authorized to share this moment'
            ? 403
            : 500
        return c.json({ success: false, error: message }, status)
    }
})

const shareEmailSchema = z.object({
    resourceId: z.string().min(1),
    type: z.enum(['STORY', 'MOMENT']),
    grandmaEmail: z.string().email(),
    expiresInDays: z.number().min(1).max(30).optional().default(2),
    maxViews: z.number().min(1).max(3).optional().default(3),
})

app.post('/email', authMiddleware, async (c) => {
    let body;
    try {
        const json = await c.req.json();
        body = shareEmailSchema.parse(json);
    } catch (e) {
        return c.json({ success: false, error: 'Validation Error' }, 400);
    }

    try {
        const user = c.get('user')!
        const { url, expiresAt } = await container.createShareLinkUseCase.execute({
            ownerId: user.id,
            resourceId: body.resourceId,
            type: body.type,
            expiresInDays: body.expiresInDays,
            maxViews: body.maxViews,
        })

        const subject = body.type === 'MOMENT'
            ? 'A bedtime moment was shared with you'
            : 'A bedtime story was shared with you'

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DreamWeaver Memory</title>
</head>
<body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#0A0E1A; color:#E8EDF4; padding:24px;">
  <div style="max-width:600px; margin:0 auto; background:#141B2E; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:24px;">
    <div style="font-size:14px; letter-spacing:0.12em; text-transform:uppercase; color:#A8B3C7;">DreamWeaver</div>
    <h1 style="margin:12px 0 8px; font-size:24px; line-height:1.2;">A memory was shared with you</h1>
    <p style="margin:0 0 20px; color:#A8B3C7;">This link expires on ${new Date(expiresAt).toLocaleString()} or after ${body.maxViews} views.</p>
    <div style="text-align:center; margin:24px 0;">
      <a href="${url}" style="display:inline-block; background:#7C9FFF; color:#0A0E1A; text-decoration:none; font-weight:700; padding:14px 20px; border-radius:999px;">Open Memory</a>
    </div>
    <p style="margin:0; font-size:12px; color:#6B7A93;">For privacy, this link is not meant to be shared on social media.</p>
  </div>
</body>
</html>
`

        const sent = await container.emailService.send(body.grandmaEmail, subject, html)

        return c.json({
            success: true,
            data: {
                sent,
                url,
                expiresAt
            }
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to send share email'
        const status = message === 'Not authorized to share this story' || message === 'Not authorized to share this moment'
            ? 403
            : 500
        return c.json({ success: false, error: message }, status)
    }
})

// Public: View shared content
app.get('/:token', async (c) => {
    let token;
    try {
        // Manually parse param
        token = tokenParamSchema.parse({ token: c.req.param('token') }).token
    } catch (e) {
        return c.json({ success: false, error: 'Invalid Token' }, 400);
    }

    try {
        const result = await container.getSharedContentUseCase.execute(token)

        if (!result) {
            return c.json({ success: false, error: 'Link not found' }, 404)
        }

        if (result.isExpired) {
            return c.json({ success: false, error: 'Link has expired' }, 410) // 410 Gone
        }

        return c.json({
            success: true,
            data: result
        })
    } catch (error: unknown) {
        container.logger.error('Share access error', error instanceof Error ? error : undefined)
        return c.json({ success: false, error: 'Failed to load content' }, 500)
    }
})

export { app as shareRoute }
