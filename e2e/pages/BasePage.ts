import { type Page } from '@playwright/test';

/**
 * BasePage
 * 
 * Abstract base class for all Page Objects.
 * Contains shared logic for navigation, auth mocking, and common assertions.
 */
export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goto(path: string) {
        await this.page.goto(path);
    }

    /**
     * Mocks a successful authentication session.
     * Use this before navigation if the page requires login.
     */
    async mockAuthSession() {
        await this.page.addInitScript(() => {
            const session = {
                access_token: 'mock-token',
                token_type: 'bearer',
                expires_in: 3600,
                expires_at: 4102444800,
                refresh_token: 'mock-refresh-token',
                user: {
                    id: 'user_123',
                    email: 'test@example.com',
                    user_metadata: { full_name: 'Test User', child_name: 'Emma', child_age: 5 }
                }
            };
            localStorage.setItem('sb-localhost-auth-token', JSON.stringify(session));
        });
    }

    /**
     * Mock a failed auth request (e.g. 401 Unauthorized)
     */
    async mockAuthError() {
        await this.page.route('**/auth/v1/session', async route => {
            await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
        });
    }

    async pause() {
        await this.page.pause();
    }
}
