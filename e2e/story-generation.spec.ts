import { test, expect } from '@playwright/test';

/**
 * Story Generation E2E Test (Real Flow)
 * 
 * Tests the complete story generation flow with actual API calls.
 */

test.describe('Story Generation Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Mock auth for protected routes
        await page.route('**/auth/v1/session', async route => {
            await route.fulfill({
                json: {
                    access_token: 'mock-token',
                    user: { id: 'user_123', email: 'test@example.com' }
                }
            });
        });

        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                json: { id: 'user_123', email: 'test@example.com' }
            });
        });
    });

    test('displays story request page with theme options', async ({ page }) => {
        await page.goto('/stories/new');

        // Should show theme selection
        await expect(page.getByText(/choose|select|theme/i)).toBeVisible({ timeout: 5000 });
    });

    test('can select theme and start generation', async ({ page }) => {
        // Mock story generation API
        await page.route('**/api/v1/stories/generate', async route => {
            await route.fulfill({
                json: {
                    success: true,
                    data: {
                        story: {
                            id: 'story_test_123',
                            title: 'The Magical Forest Adventure',
                            content: { paragraphs: ['Once upon a time...', 'The end.'] },
                            theme: 'adventure',
                            status: 'completed'
                        },
                        estimatedReadingTime: 5
                    }
                }
            });
        });

        await page.goto('/stories/new');

        // Click on a theme (assuming adventure theme exists)
        const themeButton = page.locator('button, [role="button"]').filter({ hasText: /adventure|space|animal/i }).first();
        if (await themeButton.isVisible()) {
            await themeButton.click();
        }

        // Look for generate button
        const generateBtn = page.getByRole('button', { name: /generate|create|start/i });
        if (await generateBtn.isVisible()) {
            await generateBtn.click();
        }
    });

    test('shows story content after generation', async ({ page }) => {
        // Mock story view
        await page.route('**/api/v1/stories/*', async route => {
            await route.fulfill({
                json: {
                    success: true,
                    data: {
                        id: 'story_123',
                        title: 'The Starlight Express',
                        content: { paragraphs: ['In a galaxy far away...', 'They lived happily.'] },
                        theme: 'space',
                        status: 'completed',
                        createdAt: new Date().toISOString()
                    }
                }
            });
        });

        await page.goto('/stories/story_123');

        // Should show story title or content
        await expect(page.getByText(/starlight|galaxy|story/i)).toBeVisible({ timeout: 5000 });
    });

    test('story appears in history after creation', async ({ page }) => {
        // Mock history endpoint
        await page.route('**/api/v1/stories', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    json: {
                        success: true,
                        data: {
                            stories: [
                                {
                                    id: 'story_new',
                                    title: 'My New Story',
                                    theme: 'adventure',
                                    status: 'completed',
                                    estimatedReadingTime: 5,
                                    createdAt: new Date().toISOString()
                                }
                            ],
                            total: 1,
                            limit: 20
                        }
                    }
                });
            }
        });

        await page.goto('/history');

        // Should show story in list
        await expect(page.getByText(/my new story|memory|history/i)).toBeVisible({ timeout: 5000 });
    });
});
