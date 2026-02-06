import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class StoryCreatePage extends BasePage {
    readonly themeButtons: Locator;
    readonly generateButton: Locator;
    readonly themeSection: Locator;

    constructor(page: Page) {
        super(page);
        this.themeSection = page.locator('section').filter({ has: page.getByRole('heading', { name: /pick a theme/i }) }).first()
        this.themeButtons = this.themeSection.locator('span').filter({ hasText: /space|animals|fantasy|ocean|robots|nature/i })
        this.generateButton = page.getByRole('button', { name: /generate|create|start/i });
    }

    async goto() {
        await super.goto('/stories/new');
    }

    async selectTheme(themeName: string) {
        const themeLabel = this.themeSection.getByText(new RegExp(themeName, 'i')).first()
        await themeLabel.click()
    }

    async startGeneration() {
        await this.generateButton.click();
    }

    async expectThemeSelectionVisible() {
        await expect(this.page.getByRole('heading', { name: /pick a theme/i })).toBeVisible();
    }

    /**
     * Mocks the generation API response.
     */
    async mockGenerationResponse() {
        await this.page.route('**/api/v1/stories/generate', async route => {
            await route.fulfill({
                json: {
                    success: true,
                    data: {
                        id: 'story_mock_1',
                        title: 'Mock Story Title',
                        theme: 'adventure',
                        content: { paragraphs: ['Mock content...'], sleepScore: 0 },
                        estimatedReadingTime: 2,
                        createdAt: new Date().toISOString()
                    }
                }
            });
        });

        await this.page.route('**/api/v1/stories/generate/stream', async route => {
            await route.fulfill({
                status: 200,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                body: 'Mock streaming chunk\n'
            })
        })
    }
}
