/**
 * Mock Email Service
 * 
 * Simple adapter that logs emails to console/disk for development/demo.
 * NOTE: Real email delivery is effectively simulated in MVP via disk writing.
 * This aligns with PRD vFinal (Phase 1).
 */

import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

export class MockEmailService {
    async send(to: string, subject: string, html: string): Promise<boolean> {
        console.log(`[EmailService] Processing email to ${to}`)

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
-->
${html}`

            await writeFile(filepath, content, 'utf-8')
            console.log(`[EmailService] Email written to ${filepath}`)
            return true
        } catch (error) {
            console.error('[EmailService] Failed to write email to disk', error)
            // Fallback to console log so we don't break the flow
            console.log(`Subject: ${subject}`)
            return true
        }
    }
}
