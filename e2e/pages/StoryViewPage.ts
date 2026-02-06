import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class StoryViewPage extends BasePage {
    readonly title: Locator;
    readonly contentArea: Locator;

    constructor(page: Page) {
        super(page);
        // Assuming title is an h1 or prominent text
        this.title = page.locator('h1, h2').first();
        this.contentArea = page.locator('.story-content, p').first();
    }

    async goto(storyId: string) {
        await super.goto(`/stories/${storyId}`);
    }

    async expectStoryContent(text: string | RegExp) {
        await expect(this.page.getByText(text)).toBeVisible();
    }

    /**
     * Mocks fetching a single story.
     */
    async mockStoryFetch(storyId: string) {
        await this.page.route(`**/api/v1/stories/${storyId}`, async route => {
            await route.fulfill({
                json: {
                    success: true,
                    data: {
                        id: storyId,
                        title: 'Mocked Story Title',
                        content: { paragraphs: ['Mock content...'] },
                        theme: 'adventure',
                        status: 'completed',
                        createdAt: new Date().toISOString()
                    }
                }
            });
        });
    }
}
