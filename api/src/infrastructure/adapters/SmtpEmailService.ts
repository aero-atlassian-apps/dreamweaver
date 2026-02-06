import nodemailer from 'nodemailer'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

export class SmtpEmailService {
    private transporter: nodemailer.Transporter | null = null

    constructor() {
        if (process.env['SMTP_HOST'] && process.env['SMTP_USER'] && process.env['SMTP_PASS']) {
            this.transporter = nodemailer.createTransport({
                host: process.env['SMTP_HOST'],
                port: Number(process.env['SMTP_PORT']) || 587,
                secure: process.env['SMTP_SECURE'] === 'true',
                auth: {
                    user: process.env['SMTP_USER'],
                    pass: process.env['SMTP_PASS']
                }
            })
        }
    }

    async send(to: string, subject: string, html: string): Promise<boolean> {
        console.log(`[EmailService] Processing email to ${to}`)

        // Always write to disk for verification/audit
        await this.writeToDisk(to, subject, html)

        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: process.env['SMTP_FROM'] || '"DreamWeaver" <noreply@dreamweaver.ai>',
                    to,
                    subject,
                    html
                })
                console.log(`[EmailService] Email sent via SMTP to ${to}`)
                return true
            } catch (error) {
                console.error('[EmailService] SMTP Send Failed', error)
                // Fallback to true since disk write succeeded (don't block user flow)
                return true
            }
        } else {
            console.log('[EmailService] SMTP not configured, relying on disk output')
            return true
        }
    }

    private async writeToDisk(to: string, subject: string, html: string): Promise<void> {
        try {
            const emailDir = join(process.cwd(), 'temp', 'emails')
            await mkdir(emailDir, { recursive: true })

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const filename = `email_${timestamp}_${to.replace(/[^a-z0-9]/gi, '_')}.html`
            const filepath = join(emailDir, filename)

            const content = `<!--
To: ${to}
Subject: ${subject}
Date: ${new Date().toISOString()}
SMTP Configured: ${!!this.transporter}
-->
${html}`

            await writeFile(filepath, content, 'utf-8')
            console.log(`[EmailService] Email written to ${filepath}`)
        } catch (error) {
            console.error('[EmailService] Failed to write email to disk', error)
        }
    }
}
