import { test, expect } from '@playwright/test';
import { BasePage } from './pages/BasePage';

/**
 * Agent Suggestion E2E Test
 * 
 * Tests the agent suggestion flow from dashboard to story generation.
 */

test.describe('Agent Suggestion Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Mock auth via localStorage (prevents redirect loop)
        const basePage = new BasePage(page);
        await basePage.mockAuthSession();

        // Also mock network call if app validates session
        await page.route('**/auth/v1/**', async route => {
            // ... (keep existing network mock or simplify)
            // If localStorage is present, app might skip network call or call getUser
            if (route.request().url().includes('session') || route.request().url().includes('user') || route.request().url().includes('token')) {
                await route.fulfill({ status: 200, json: { user: { id: 'user_123', email: 'parent@example.com' } } });
            } else {
                await route.continue();
            }
        });

        // Mock suggestions with dynamic response
        let suggestionCount = 0;
        await page.route('**/api/v1/suggestions*', async route => {
            suggestionCount++;
            await route.fulfill({
                json: {
                    success: true,
                    data: {
                        suggestions: [
                            {
                                id: `mock_sugg_${suggestionCount}`,
                                title: suggestionCount === 1 ? 'The E2E Adventure' : 'The E2E Sequel',
                                theme: 'space',
                                reasoning: 'Mocked for testing',
                                confidence: 0.9,
                                suggestedDuration: 10
                            }
                        ]
                    }
                }
            });
        });

        // Mock story generation
        await page.route('**/api/v1/stories/generate', async route => {
            await route.fulfill({
                json: {
                    success: true,
                    data: {
                        story: {
                            id: 'story_agent_123',
                            title: 'The Cosmic Adventure',
                            content: { paragraphs: ['In a galaxy...', 'The end.'] },
                            theme: 'space',
                            status: 'completed'
                        },
                        estimatedReadingTime: 8
                    }
                }
            });
        });
    });

    test('dashboard shows agent suggestion card', async ({ page }) => {
        await page.goto('/dashboard');

        // Should show AI suggestion badge
        await expect(page.getByText(/ai suggestion/i)).toBeVisible({ timeout: 5000 });
    });

    test('agent suggestion card shows dynamic title', async ({ page }) => {
        await page.goto('/dashboard');

        // Should show a story title (not hardcoded)
        await expect(page.locator('h2')).toBeVisible({ timeout: 5000 });
    });

    test('agent suggestion card has refresh button', async ({ page }) => {
        await page.goto('/dashboard');

        // Should have refresh button
        const refreshBtn = page.locator('[aria-label="Get new suggestion"]');
        await expect(refreshBtn).toBeVisible({ timeout: 5000 });
    });

    test('clicking refresh updates suggestion', async ({ page }) => {
        await page.goto('/dashboard');

        // Get initial title
        const titleElement = page.locator('.text-2xl.font-bold').first();
        const _initialTitle = await titleElement.textContent();

        // Click refresh
        const refreshBtn = page.locator('[aria-label="Get new suggestion"]');
        await refreshBtn.click();

        // Title might change (agent generates different suggestions)
        // Wait for title to update
        await expect(titleElement).toHaveText('The E2E Sequel', { timeout: 10000 });
        const newTitle = await titleElement.textContent();

        // At minimum, the element should still be visible
        expect(newTitle).toBeTruthy();
    });

    test('clicking start story navigates to generation', async ({ page }) => {
        await page.goto('/dashboard');

        // Click start story button
        const startBtn = page.getByRole('button', { name: /start this story/i });
        await startBtn.click();

        // Should navigate to story creation
        await expect(page).toHaveURL(/stories\/new/, { timeout: 5000 });
    });

    test('suggestion shows theme tag', async ({ page }) => {
        await page.goto('/dashboard');

        // Should show theme/category tag
        const themeBadge = page.locator('.rounded-lg').filter({ has: page.locator('[class*="material-symbols"]') });
        await expect(themeBadge.first()).toBeVisible({ timeout: 5000 });
    });

    test('suggestion shows estimated duration', async ({ page }) => {
        await page.goto('/dashboard');

        // Should show duration like "10 min"
        const suggestionCard = page.locator('main').locator('div').filter({ has: page.getByText(/ai suggestion/i) }).first()
        await expect(suggestionCard.getByText(/\d+ min/).first()).toBeVisible({ timeout: 5000 });
    });

    test('suggestion shows reasoning text', async ({ page }) => {
        await page.goto('/dashboard');

        // Should have reasoning paragraph - scoped to suggestion card to avoid ambiguity with Live Mode card
        const reasoningText = page.locator('div').filter({ has: page.getByText(/ai suggestion/i) }).locator('.line-clamp-2').first();
        await expect(reasoningText).toBeVisible({ timeout: 5000 });

        const text = await reasoningText.textContent();
        expect(text?.length).toBeGreaterThan(10);
    });
});
