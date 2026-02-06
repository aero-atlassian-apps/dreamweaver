/**
 * SendWeeklyDigestUseCase - Weekly Time Capsule Email
 * 
 * Generates and sends a weekly summary of the child's bedtime moments
 * to parents, including stories read, moments captured, and insights.
 */

import { StoryRepositoryPort } from '../ports/StoryRepositoryPort.js'
import { MomentRepositoryPort } from '../ports/MomentRepositoryPort.js'
import { LoggerPort } from '../ports/LoggerPort.js'
import type { SharedLinkType } from '../../domain/entities/SharedLink.js'

export interface WeeklyDigestInput {
    userId: string
    email: string
    childName: string
}

export interface WeeklyDigestOutput {
    sent: boolean
    storiesCount: number
    highlightMoment?: string
}

interface EmailService {
    send(to: string, subject: string, html: string): Promise<boolean>
}

interface ShareLinkCreator {
    execute(request: { resourceId: string; type: SharedLinkType; maxViews?: number; expiresInDays?: number }): Promise<{ url: string; expiresAt: Date }>
}

export class SendWeeklyDigestUseCase {
    constructor(
        private readonly storyRepository: StoryRepositoryPort,
        private readonly momentRepository: MomentRepositoryPort,
        private readonly shareLinkCreator: ShareLinkCreator,
        private readonly emailService: EmailService,
        private readonly logger: LoggerPort
    ) { }

    async execute(input: WeeklyDigestInput): Promise<WeeklyDigestOutput> {
        this.logger.info('Generating weekly digest', { userId: input.userId })

        // Get stories from the last 7 days
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const stories = await this.storyRepository.findRecent(input.userId, 50)
        const weeklyStories = stories.filter(s => s.createdAt >= oneWeekAgo)

        if (weeklyStories.length === 0) {
            this.logger.info('No stories this week, skipping digest', { userId: input.userId })
            return { sent: false, storiesCount: 0 }
        }

        const moments = await this.momentRepository.findByUserId(input.userId)
        const weeklyMoments = moments
            .filter(m => m.createdAt >= oneWeekAgo)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        const highlightStory = weeklyStories[0]
        const highlightMoment = weeklyMoments[0]

        const highlightType: SharedLinkType = highlightMoment ? 'MOMENT' : 'STORY'
        const highlightResourceId = highlightMoment ? highlightMoment.id : highlightStory.id
        const highlightTitle = highlightMoment?.description || highlightStory?.title || 'A Magical Adventure'

        const shareLink = await this.shareLinkCreator.execute({
            resourceId: highlightResourceId,
            type: highlightType,
            expiresInDays: 2,
            maxViews: 3,
        })

        // Generate email content
        const emailHtml = this.generateEmailHtml(
            input.childName,
            weeklyStories.length,
            weeklyMoments.length,
            highlightTitle,
            weeklyStories.map(s => s.theme),
            shareLink.url
        )

        // Send email
        const sent = await this.emailService.send(
            input.email,
            `✨ ${input.childName}'s Weekly Dreamweaver Time Capsule`,
            emailHtml
        )

        this.logger.info('Weekly digest sent', {
            userId: input.userId,
            storiesCount: weeklyStories.length,
            sent
        })

        return {
            sent,
            storiesCount: weeklyStories.length,
            highlightMoment: highlightTitle
        }
    }

    private generateEmailHtml(
        childName: string,
        storiesCount: number,
        momentsCount: number,
        highlightTitle: string,
        themes: string[],
        highlightUrl: string
    ): string {
        const uniqueThemes = [...new Set(themes)].slice(0, 3)

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${childName}'s Weekly Time Capsule</title>
    <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background: #0A0E1A; color: #E8EDF4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #141B2E; border-radius: 20px; padding: 32px; border: 1px solid rgba(255,255,255,0.08); }
        h1 { color: #B8A1FF; text-align: center; font-size: 28px; margin: 6px 0 24px; }
        .badge { display:inline-block; background: rgba(124,159,255,0.12); border: 1px solid rgba(124,159,255,0.25); color: #7C9FFF; padding: 6px 10px; border-radius: 999px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
        .highlight { background: linear-gradient(135deg, rgba(167,139,250,0.35) 0%, rgba(124,159,255,0.25) 100%); padding: 20px; border-radius: 16px; margin: 18px 0; border: 1px solid rgba(255,255,255,0.08); }
        .stats { display:flex; gap: 12px; margin: 18px 0; }
        .stat { flex:1; text-align: center; padding: 14px; background: rgba(255,255,255,0.04); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); }
        .stat-number { font-size: 36px; font-weight: 800; color: #E8EDF4; }
        .stat-label { font-size: 12px; color: #A8B3C7; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 6px; }
        .themes { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 18px 0; }
        .theme-tag { background: rgba(167, 139, 250, 0.18); border: 1px solid rgba(167, 139, 250, 0.3); padding: 8px 14px; border-radius: 999px; font-size: 13px; color: #E8EDF4; }
        .cta { display:inline-block; background:#7C9FFF; color:#0A0E1A; text-decoration:none; font-weight:800; padding: 14px 18px; border-radius: 999px; }
        .footer { text-align: center; margin-top: 26px; color: #6B7A93; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div style="text-align:center;"><span class="badge">Weekly Time Capsule</span></div>
        <h1>✨ ${childName}'s Week in Moments</h1>

        <div class="stats">
            <div class="stat">
                <div class="stat-number">${storiesCount}</div>
                <div class="stat-label">Stories</div>
            </div>
            <div class="stat">
                <div class="stat-number">${momentsCount}</div>
                <div class="stat-label">Moments</div>
            </div>
        </div>

        <div class="highlight">
            <h3 style="margin:0 0 8px;">🌟 Moment of the Week</h3>
            <p style="font-size: 18px; margin:0 0 16px; color:#E8EDF4;">"${highlightTitle}"</p>
            <div style="text-align:center;">
                <a class="cta" href="${highlightUrl}">Open this moment</a>
            </div>
        </div>

        <h3 style="margin: 22px 0 10px;">Favorite Themes</h3>
        <div class="themes">
            ${uniqueThemes.map(t => `<span class="theme-tag">${t}</span>`).join('')}
        </div>

        <div class="footer">
            <p>DreamWeaver - Sweet Dreams, Every Night</p>
            <p>This link expires in 48 hours and is limited to 3 plays.</p>
        </div>
    </div>
</body>
</html>
`
    }
}
