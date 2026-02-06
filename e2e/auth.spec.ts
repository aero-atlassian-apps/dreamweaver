import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication Flow (POM)', () => {

    test('shows login form with required fields', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.signInButton).toBeVisible();
        await expect(loginPage.signUpLink).toBeVisible();
    });

    test('shows error for invalid credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // Mock failure
        await loginPage.mockLoginResponse(false);

        await loginPage.goto();
        await loginPage.login('invalid@example.com', 'wrongpassword');

        await loginPage.expectErrorVisible();
    });

    test('user can login and reach dashboard', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // Mock success for both token and user profile
        await loginPage.mockLoginResponse(true);
        // Do NOT mock session beforehand, we want to test the LOGIN flow.

        await loginPage.goto();
        await loginPage.login('test@example.com', 'password123');

        // Should be on dashboard
        await expect(page).toHaveURL(/dashboard/);
    });
});
