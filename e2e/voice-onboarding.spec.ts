import { test, expect } from '@playwright/test';

test.describe('Voice Onboarding Flow', () => {

    test.beforeEach(async ({ context }) => {
        // Grant microphone permissions
        await context.grantPermissions(['microphone']);
    });

    test('captures and uploads a voice sample', async ({ page }) => {
        // 1. Mock API response for upload
        await page.route('/api/v1/voice/upload', async route => {
            await route.fulfill({
                json: {
                    success: true,
                    data: {
                        id: 'voice_123',
                        userId: 'user_123',
                        name: 'Dad Voice',
                        status: 'ready',
                        createdAt: new Date().toISOString()
                    }
                }
            });
        });

        // 2. Mock MediaRecorder in the browser
        await page.addInitScript(() => {
            // @ts-expect-error - Mocking global MediaRecorder for test
            window.MediaRecorder = class MockMediaRecorder {
                state = 'inactive';
                ondataavailable: ((e: { data: Blob }) => void) | null = null;
                onstop: (() => void) | null = null;

                start() {
                    this.state = 'recording';
                    // Trigger data available immediately for faster testing
                    setTimeout(() => {
                        if (this.ondataavailable) {
                            const blob = new Blob(['mock audio data'], { type: 'audio/webm' });
                            this.ondataavailable({ data: blob });
                        }
                    }, 100);
                }

                stop() {
                    this.state = 'inactive';
                    if (this.onstop) this.onstop();
                }
            };
        });

        // 3. Navigate to Voice Onboarding
        await page.goto('/voice/onboarding');

        // 4. Start Recording
        const recordButton = page.getByRole('button', { name: /Hold to Record/i });
        await expect(recordButton).toBeVisible();
        await recordButton.click();

        // 5. Verify recording state and stop
        await expect(page.getByText(/Recording.../i)).toBeVisible();
        const stopButton = page.getByRole('button', { name: /Stop Recording/i });
        await expect(stopButton).toBeVisible();
        await stopButton.click();

        // 6. Preview and Submit (Upload)
        await expect(page.getByText('Preview Recording')).toBeVisible();
        const submitButton = page.getByRole('button', { name: /Create My Voice/i });
        await expect(submitButton).toBeVisible();
        await submitButton.click();

        // 7. Verify Success
        await expect(page.getByText(/Voice Profile Ready/i)).toBeVisible();
    });

});
