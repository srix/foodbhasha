const { test, expect } = require('@playwright/test');

test.describe('SEO & Structural Integrity', () => {

    test('404 Page exists', async ({ page }) => {
        const response = await page.goto('/404.html');
        expect(response.status()).toBe(200);
        await expect(page).toHaveTitle(/Page Not Found/);
        await expect(page.locator('.error-code')).toHaveText('404');
    });

    test('ads.txt exists and has correct content type', async ({ page }) => {
        const response = await page.request.get('/ads.txt');
        expect(response.status()).toBe(200);
        // Should be plain text, not HTML
        const contentType = response.headers()['content-type'];
        // Implementation might serve text/plain or text/plain; charset=UTF-8 depending on server
        // server.js uses express.static which usually handles mime types correctly based on extension
        expect(contentType).toContain('text/plain');

        const content = await response.text();
        expect(content).toContain('google.com');
    });

});
