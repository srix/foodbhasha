const { test, expect } = require('@playwright/test');

test.describe('Feedback Form', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080/');
    });

    test('Feedback FAB should be visible', async ({ page }) => {
        const fab = page.locator('#feedback-btn');
        await expect(fab).toBeVisible();
        await expect(fab).toHaveCSS('position', 'fixed');
        // Check if it's in the bottom-right quadrant
        const box = await fab.boundingBox();
        const viewport = await page.viewportSize();
        if (viewport && box) {
            expect(box.x).toBeGreaterThan(viewport.width / 2);
            expect(box.y).toBeGreaterThan(viewport.height / 2);
        }
    });

    test('Clicking FAB opens modal', async ({ page }) => {
        await page.click('#feedback-btn');
        const modal = page.locator('#feedback-modal');
        await expect(modal).toBeVisible();

        // Focus should move to name input (based on app.js logic)
        await expect(page.locator('#feedback-name')).toBeFocused();
    });

    test('Modal can be closed', async ({ page }) => {
        await page.click('#feedback-btn');
        await expect(page.locator('#feedback-modal')).toBeVisible();

        // Close via button
        await page.click('#close-modal');
        await expect(page.locator('#feedback-modal')).toBeHidden();
    });

    test('Honeypot field should be hidden', async ({ page }) => {
        await page.click('#feedback-btn');
        // The paragraph containing the honeypot
        const honeypotContainer = page.locator('form[name="feedback"] p[hidden]');

        // It maintains presence in DOM but is hidden
        await expect(honeypotContainer).toBeHidden();

        // The label text "Don’t fill this out" should not be visible to user
        const honeypotText = page.getByText("Don’t fill this out if you’re human");
        await expect(honeypotText).toBeHidden();
    });

    test('Form submission flow (mocked)', async ({ page }) => {
        // Mock the form submission - needs to match the absolute URL in app.js
        await page.route('https://foodbhasha.com/', async route => {
            const request = route.request();
            if (request.method() === 'POST') {
                const postData = request.postData();
                if (postData && postData.includes('form-name=feedback')) {
                    await route.fulfill({ status: 200, body: 'Success' });
                    return;
                }
            }
            await route.continue();
        });

        await page.click('#feedback-btn');
        await page.fill('#feedback-message', 'Test Feedback Message');
        await page.click('button[type="submit"]');

        // Expect success message
        await expect(page.locator('#feedback-success')).toBeVisible();
        await expect(page.getByText('Thank You!')).toBeVisible();

        // Close success modal
        await page.click('#close-success-modal');
        await expect(page.locator('#feedback-modal')).toBeHidden();
    });

    test('Navigating to /feedback route opens modal', async ({ page }) => {
        // Mock routing behavior if needed, or just navigate
        // Since we are running on localhost:8080 which is SPA-fallback enabled via server.js? 
        // Playwright's webServer in config usually handles this.
        // Let's assume server.js handles it or we mimic hash routing if history API fails in test env.

        // We implemented history API check in app.js for pathname === '/feedback'

        // Navigate directly
        await page.goto('http://localhost:8080/feedback');

        // Modal should be visible automatically
        const modal = page.locator('#feedback-modal');
        await expect(modal).toBeVisible();
    });

    test('Footer shows version', async ({ page }) => {
        const footer = page.locator('footer.app-footer p');
        await expect(footer).toBeVisible();
        const text = await footer.textContent();
        // Allow for "v1.5" or similar format. 
        // Regex: © 2026 FoodBhasha • v\d+\.\d+
        expect(text).toMatch(/© 2026 FoodBhasha • v\d+\.\d+/);
    });

    test('Android: Clicking FAB opens System Browser (Simulated)', async ({ page }) => {
        // 1. Simulate Android Environment by injecting window.Capacitor
        await page.addInitScript(() => {
            window.Capacitor = {
                getPlatform: () => 'android',
                Plugins: {
                    Browser: {
                        open: async ({ url }) => {
                            window.__mockBrowserUrl = url; // Store for verification
                        }
                    }
                }
            };
        });

        // Reload to apply the init script
        await page.goto('http://localhost:8080/');

        // 2. Click the FAB
        await page.click('#feedback-btn');

        // 3. Verify Browser.open was called with correct URL
        const openedUrl = await page.evaluate(() => window.__mockBrowserUrl);
        expect(openedUrl).toBe('https://foodbhasha.com/feedback');

        // 4. Verify Modal did NOT open (native logic shouldn't trigger modal fallback unless error)
        // Note: Our code only falls back on error. Since our mock didn't throw, modal stays hidden.
        await expect(page.locator('#feedback-modal')).toBeHidden();
    });
});
