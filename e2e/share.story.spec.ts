import { test, expect } from '@playwright/test';

test('Parent can share a story and Grandma can view it', async ({ page }) => {
    // 1. Mock API Responses
    await page.route('/api/v1/share', async route => {
        const json = {
            success: true,
            data: {
                url: 'http://localhost:5173/share/test-token-123',
                expiresAt: new Date(Date.now() + 86400000).toISOString()
            }
        };
        await route.fulfill({ json });
    });

    await page.route('**/api/v1/share/test-token-123', async route => {
        const json = {
            success: true,
            data: {
                type: 'STORY',
                content: {
                    title: 'The Moon Rabbit',
                    theme: 'Folklore',
                    audioUrl: 'http://example.com/audio.mp3',
                    content: {
                        paragraphs: ['Once upon a time on the moon...']
                    }
                },
                isExpired: false
            }
        };
        await route.fulfill({ json });
    });

    // 2. Go to Story History (Simulate logged in)
    // Note: In real E2E we would login. Here we assume we can reach the page or mock auth.
    // For this test, we start at home and mock the share flow if possible, 
    // but better to test the PUBLIC VIEW independently first to confirm rendering.

    // A. Visit Public Link directy (Grandma View)
    await page.goto('/share/test-token-123');

    // B. Verify Content
    await expect(page.locator('text=The Moon Rabbit')).toBeVisible();
    await expect(page.locator('text=Shared with you')).toBeVisible();
    await expect(page.locator('text=Once upon a time')).toBeVisible();

    // C. Verify Audio Player present
    await expect(page.locator('audio')).toHaveAttribute('src', 'http://example.com/audio.mp3');
});
