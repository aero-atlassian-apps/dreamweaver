import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly signInButton: Locator;
    readonly signUpLink: Locator;
    readonly errorMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.emailInput = page.getByLabel(/email/i);
        this.passwordInput = page.getByLabel(/password/i);
        this.signInButton = page.getByRole('button', { name: /sign in/i });
        this.signUpLink = page.getByRole('link', { name: /sign up|create account|register/i });
        this.errorMessage = page.getByText(/invalid|error|failed/i);
    }

    async goto() {
        await super.goto('/login');
    }

    async login(email: string, pass: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(pass);
        await this.signInButton.click();
    }

    async expectErrorVisible() {
        await expect(this.errorMessage).toBeVisible();
    }

    /**
     * Mocks the auth token response for the login action itself.
     */
    async mockLoginResponse(success: boolean = true) {
        // [DEBUG] Broader pattern to ensure we catch the request
        await this.page.route('**/*token*', async route => {
            console.log('Intercepted request:', route.request().url());
            if (success) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        access_token: 'mock-access-token',
                        token_type: 'bearer',
                        expires_in: 3600,
                        refresh_token: 'mock-refresh-token',
                        user: {
                            id: 'user_123',
                            email: 'test@example.com',
                            app_metadata: { provider: 'email' },
                            user_metadata: { full_name: 'Test User' },
                            aud: 'authenticated',
                            created_at: new Date().toISOString()
                        }
                    })
                });
            } else {
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' })
                });
            }
        });
    }
}
