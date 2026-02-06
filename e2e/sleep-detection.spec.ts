import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';

/**
 * Sleep Detection E2E Test
 * 
 * Verifies that the app reacts to sleep detection events (dimming, overlays).
 * Covers [R3.2] Adaptive Pacing.
 */

test.describe('Sleep Detection Flow', () => {

    test.beforeEach(async ({ page }) => {
        const basePage = new BasePage(page);
        await basePage.mockAuthSession();

        // Mock a specific story for viewing
        await page.route('**/api/v1/stories/story_123', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        id: 'story_123',
                        title: 'Sleepy Time Story',
                        theme: 'nature',
                        content: {
                            paragraphs: ['Once upon a time...', 'The rabbit slept.'],
                            sleepScore: 8
                        },
                        estimatedReadingTime: 5,
                        createdAt: new Date().toISOString()
                    }
                })
            });
        });
    });

    test('activates sleep mode overlay on event cue', async ({ page }) => {
        // 1. Go to story view
        await page.goto('/stories/story_123');

        // Verify loaded
        await expect(page.getByRole('heading', { name: 'Sleepy Time Story' })).toBeVisible({ timeout: 10000 });

        // 2. Simulate Sleep Cue Event
        // This simulates the behavior of the AudioAnalysisService
        await page.evaluate(() => {
            window.dispatchEvent(new Event('dreamweaver:sleep_cue'));
        });

        // 3. Verify Overlay appears
        const overlay = page.getByText(/sleep mode active/i);
        await expect(overlay).toBeVisible({ timeout: 5000 });

        // Verify dimming/overlay styles (optional, but checking existence is key)
        const overlayContainer = page.locator('.fixed.inset-0.z-\\[100\\]');
        await expect(overlayContainer).toHaveClass(/bg-background-dark\/80/);
    });

    test('shows high sleep score indicator', async ({ page }) => {
        await page.goto('/stories/story_123');

        // Check for sleep score indicator (Sleep Score: 8/10)
        // Adjust locator based on implementation
        await expect(page.getByText(/Sleep Score: 8\/10/)).toBeVisible();
    });
});
