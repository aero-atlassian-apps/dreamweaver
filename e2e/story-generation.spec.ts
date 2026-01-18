import { test, expect } from '@playwright/test';

test.describe('Story Generation Flow', () => {

    test('creates a new story and redirects to story view', async ({ page }) => {
        // 1. Mock the API response for story generation
        await page.route('/api/v1/stories', async route => {
            const json = {
                success: true,
                data: {
                    story: {
                        id: 'story_123',
                        title: 'The Brave Little Toaster',
                        content: {
                            paragraphs: ['Once upon a time there was a toaster.', 'It was very brave.'],
                            chapters: [],
                            sleepScore: 85
                        },
                        theme: 'Adventure',
                        status: 'completed',
                        ownerId: 'user_123',
                        createdAt: new Date().toISOString(),
                        generatedAt: new Date().toISOString(),
                    },
                    estimatedReadingTime: 5
                }
            };
            await route.fulfill({ json });
        }, { times: 1 });

        // 2. Mock GET request for the specific story (redirect destination)
        await page.route('/api/v1/stories/story_123', async route => {
            const json = {
                success: true,
                data: {
                    id: 'story_123',
                    title: 'The Brave Little Toaster',
                    content: {
                        paragraphs: ['Once upon a time there was a toaster.', 'It was very brave.'],
                        chapters: [],
                        sleepScore: 85
                    },
                    theme: 'Adventure',
                    status: 'completed',
                    ownerId: 'user_123',
                    createdAt: new Date().toISOString(),
                    generatedAt: new Date().toISOString(),
                }
            };
            await route.fulfill({ json });
        });

        // 3. Navigate to Story Request Page
        await page.goto('/stories/new');

        // 4. Fill form (Pick a theme)
        // Correcting selector to be more robust based on the UI structure
        // The THEMES array has Space, Animals, Fantasy, Ocean, Robots, Nature.
        // Selecting 'Space' (first one) to avoid mismatch.
        const themeCard = page.getByRole('heading', { name: /Pick a Theme/i }).locator('..').getByText('Space');
        await expect(themeCard).toBeVisible();
        await themeCard.click();

        // 5. Click Generate
        const generateButton = page.getByRole('button', { name: /Generate Story/i });
        await expect(generateButton).toBeVisible();
        await generateButton.click();

        // 6. Verify Navigation and Content
        await expect(page).toHaveURL(/\/stories\/story_123/);
        await expect(page.getByText('The Brave Little Toaster')).toBeVisible();
        await expect(page.getByText('Once upon a time there was a toaster.')).toBeVisible();
    });

});
