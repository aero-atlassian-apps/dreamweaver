import { test, expect } from '@playwright/test';

/**
 * Voice Onboarding E2E Test
 * 
 * Tests the voice recording and upload flow.
 */

test.describe('Voice Onboarding Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Mock auth
        await page.route('**/auth/v1/session', async route => {
            await route.fulfill({
                json: {
                    access_token: 'mock-token',
                    user: { id: 'user_123', email: 'test@example.com' }
                }
            });
        });

        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                json: { id: 'user_123', email: 'test@example.com' }
            });
        });

        // Mock voice upload
        await page.route('**/api/v1/voice/upload', async route => {
            await route.fulfill({
                json: {
                    success: true,
                    data: {
                        id: 'voice_123',
                        userId: 'user_123',
                        name: 'Parent Voice',
                        sampleUrl: 'https://example.com/voice.webm',
                        voiceModelId: 'model_123',
                        status: 'ready',
                        createdAt: new Date().toISOString()
                    }
                }
            });
        });
    });

    test('displays voice onboarding page', async ({ page }) => {
        await page.goto('/voice/onboarding');

        // Should show page title
        await expect(page.getByText(/voice|create|record/i)).toBeVisible({ timeout: 5000 });
    });

    test('shows sample text to read', async ({ page }) => {
        await page.goto('/voice/onboarding');

        // Should show sample passage
        await expect(page.getByText(/once upon a time/i)).toBeVisible({ timeout: 5000 });
    });

    test('shows recording button', async ({ page }) => {
        await page.goto('/voice/onboarding');

        // Should have record button
        const recordBtn = page.getByRole('button', { name: /record|mic/i });
        await expect(recordBtn).toBeVisible({ timeout: 5000 });
    });

    test('shows step indicator', async ({ page }) => {
        await page.goto('/voice/onboarding');

        // Should show step 1 of 3
        await expect(page.getByText(/step 1/i)).toBeVisible({ timeout: 5000 });
    });

    test('has skip option', async ({ page }) => {
        await page.goto('/voice/onboarding');

        // Should have skip button for generic voice
        const skipBtn = page.getByRole('button', { name: /skip/i });
        await expect(skipBtn).toBeVisible({ timeout: 5000 });
    });

    test('skip navigates to dashboard', async ({ page }) => {
        await page.goto('/voice/onboarding');

        const skipBtn = page.getByRole('button', { name: /skip/i });
        await skipBtn.click();

        // Should navigate to dashboard
        await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
    });

    test('simulates recording flow UI', async ({ page }) => {
        // Provide mock for MediaRecorder
        await page.addInitScript(() => {
            class MockMediaRecorder {
                state = 'inactive';
                ondataavailable: ((e: { data: Blob }) => void) | null = null;
                onstop: (() => void) | null = null;

                start() {
                    this.state = 'recording';
                }

                stop() {
                    this.state = 'inactive';
                    if (this.ondataavailable) {
                        this.ondataavailable({ data: new Blob(['mock'], { type: 'audio/webm' }) });
                    }
                    if (this.onstop) {
                        this.onstop();
                    }
                }
            }

            window.navigator.mediaDevices = {
                getUserMedia: async () => ({
                    getTracks: () => [{ stop: () => { } }]
                })
            } as unknown as MediaDevices;

            (window as unknown as { MediaRecorder: typeof MockMediaRecorder }).MediaRecorder = MockMediaRecorder;
        });

        await page.goto('/voice/onboarding');

        // Click record button
        const recordBtn = page.getByRole('button', { name: /record|mic/i });
        await recordBtn.click();

        // Should show recording state or waveform
        await expect(page.getByText(/recording|stop/i)).toBeVisible({ timeout: 5000 });
    });
});
