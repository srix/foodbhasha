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
        // Mock the form submission
        await page.route('/', async route => {
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
});
