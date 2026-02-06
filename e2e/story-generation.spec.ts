import { test, expect } from '@playwright/test';
import { StoryCreatePage } from './pages/StoryCreatePage';

test.describe('Story Generation Flow (POM)', () => {

    test.beforeEach(async ({ page }) => {
        // Shared Mocking via BasePage logic (exposed via any page object)
        const createPage = new StoryCreatePage(page);
        await createPage.mockAuthSession();
    });

    test('can select theme and start generation', async ({ page }) => {
        const createPage = new StoryCreatePage(page);
        await createPage.mockGenerationResponse();

        await createPage.goto();
        await createPage.expectThemeSelectionVisible();
        await createPage.selectTheme('space');

        await createPage.startGeneration();

        await expect(page).toHaveURL(/stories\/story_mock_1/, { timeout: 10000 });
    });

    test('shows story content after generation', async ({ page }) => {
        const createPage = new StoryCreatePage(page);
        await createPage.mockGenerationResponse();

        await createPage.goto();
        await createPage.selectTheme('space');
        await createPage.startGeneration();

        await expect(page).toHaveURL(/stories\/story_mock_1/, { timeout: 10000 });
        await expect(page.getByText(/mock story title/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/mock content/i)).toBeVisible({ timeout: 10000 });
    });
});
