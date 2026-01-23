const { test, expect } = require('@playwright/test');

test.describe('Deep Link Image Loading', () => {
    test.beforeEach(async ({ page }) => {
        // Go to a deep link
        await page.goto('http://localhost:8080/spices/cardamom');
        await page.waitForLoadState('networkidle');
    });

    test('Image path is absolute on deep link', async ({ page }) => {
        // Locate the image for 'Cardamom' specifically to avoid ambiguity
        // "Cardamom" might match "Black Cardamom" so we use exact:true
        const img = page.getByRole('img', { name: 'Cardamom', exact: true });

        // Wait for it to be visible
        await expect(img).toBeVisible();

        // Get the src attribute
        const src = await img.getAttribute('src');

        // Verify it starts with /img/ (absolute path from root)
        // and NOT something like /spices/img/ (relative path resolved incorrectly)
        expect(src).toMatch(/^\/img\//);

        // Double check it does NOT contain the category in the path
        expect(src).not.toMatch(/^\/spices\/img\//);
    });

    test('Image loads successfully', async ({ page }) => {
        // JavaScript evaluation to check if image actually loaded
        const img = page.getByRole('img', { name: 'Cardamom', exact: true });

        const isLoaded = await img.evaluate((image) => {
            return image.complete && image.naturalWidth !== 0;
        });

        expect(isLoaded).toBe(true);
    });
});
