import { test, expect } from '@playwright/test';

/**
 * Auth E2E Tests
 * 
 * Tests the complete authentication flow:
 * - Signup (creates new account)
 * - Login (authenticates existing user)
 * - Protected route access (dashboard requires auth)
 */

test.describe('Authentication Flow', () => {

    test.describe('Login Page', () => {

        test('shows login form with email and password fields', async ({ page }) => {
            await page.goto('/login');

            // Verify form elements are present
            await expect(page.getByLabel(/email/i)).toBeVisible();
            await expect(page.getByLabel(/password/i)).toBeVisible();
            await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
        });

        test('shows link to signup page', async ({ page }) => {
            await page.goto('/login');

            const signupLink = page.getByRole('link', { name: /sign up|create account|register/i });
            await expect(signupLink).toBeVisible();
        });

        test('shows error for invalid credentials', async ({ page }) => {
            // Mock Supabase auth to return error
            await page.route('**/auth/v1/token*', async route => {
                await route.fulfill({
                    status: 400,
                    json: { error: 'Invalid login credentials' }
                });
            });

            await page.goto('/login');

            await page.getByLabel(/email/i).fill('invalid@example.com');
            await page.getByLabel(/password/i).fill('wrongpassword');
            await page.getByRole('button', { name: /sign in/i }).click();

            // Should show error message
            await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Signup Page', () => {

        test('shows signup form with required fields', async ({ page }) => {
            await page.goto('/signup');

            await expect(page.getByLabel(/email/i)).toBeVisible();
            await expect(page.getByLabel(/password/i)).toBeVisible();
            await expect(page.getByRole('button', { name: /sign up|create|register/i })).toBeVisible();
        });

        test('shows link to login page', async ({ page }) => {
            await page.goto('/signup');

            const loginLink = page.getByRole('link', { name: /sign in|log in|login/i });
            await expect(loginLink).toBeVisible();
        });
    });

    test.describe('Protected Routes', () => {

        test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
            // Go directly to dashboard without auth
            await page.goto('/dashboard');

            // Should redirect to login
            await expect(page).toHaveURL(/\/login/);
        });

        test('allows authenticated users to access dashboard', async ({ page }) => {
            // Mock successful auth session
            await page.route('**/auth/v1/session', async route => {
                await route.fulfill({
                    json: {
                        access_token: 'mock-token',
                        user: {
                            id: 'user_123',
                            email: 'test@example.com',
                            user_metadata: {
                                full_name: 'Test User'
                            }
                        }
                    }
                });
            });

            await page.route('**/auth/v1/user', async route => {
                await route.fulfill({
                    json: {
                        id: 'user_123',
                        email: 'test@example.com',
                        user_metadata: {
                            full_name: 'Test User'
                        }
                    }
                });
            });

            await page.goto('/dashboard');

            // Should show dashboard content (greeting)
            await expect(page.getByText(/good morning|good afternoon|good evening/i)).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Full Auth Flow', () => {

        test('user can login and reach dashboard', async ({ page }) => {
            // Mock successful login
            await page.route('**/auth/v1/token*', async route => {
                await route.fulfill({
                    json: {
                        access_token: 'mock-access-token',
                        refresh_token: 'mock-refresh-token',
                        user: {
                            id: 'user_123',
                            email: 'test@example.com',
                            user_metadata: { full_name: 'Test User' }
                        }
                    }
                });
            });

            await page.route('**/auth/v1/user', async route => {
                await route.fulfill({
                    json: {
                        id: 'user_123',
                        email: 'test@example.com',
                        user_metadata: { full_name: 'Test User' }
                    }
                });
            });

            // Start at login
            await page.goto('/login');

            // Fill credentials
            await page.getByLabel(/email/i).fill('test@example.com');
            await page.getByLabel(/password/i).fill('password123');

            // Submit
            await page.getByRole('button', { name: /sign in/i }).click();

            // Should be on dashboard
            await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
            await expect(page.getByText(/Test User|test@example/i)).toBeVisible();
        });
    });
});
