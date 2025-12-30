const { test, expect } = require('@playwright/test');

test.describe('FoodBhasha Branding', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    // ...

    test('should have correct manifest name', async ({ page }) => {
        const manifestResponse = await page.request.get('/manifest.json');
        const manifest = await manifestResponse.json();

        expect(manifest.name).toContain('FoodBhasha');
        expect(manifest.short_name).toBe('FoodBhasha');
        expect(manifest.description).toContain('market translator');
    });

    test('should update page title when navigating categories', async ({ page }) => {
        // Navigate to vegetables
        await page.click('[data-category="vegetables-fruits"]');
        await page.waitForLoadState('networkidle');

        const title = await page.title();
        expect(title).toContain('Vegetables');
        expect(title).toContain('FoodBhasha');
    });

    test('should update page title when searching', async ({ page }) => {
        await page.fill('#search-input', 'pomfret');
        await page.waitForTimeout(600); // Wait for debounce

        const title = await page.title();
        expect(title).toContain('pomfret');
        expect(title).toContain('FoodBhasha');
    });

    test('should have friendly, non-academic tone in UI', async ({ page }) => {
        // Check that academic terms are not present
        const bodyText = await page.locator('body').textContent();

        expect(bodyText).not.toContain('Lexicon');
        expect(bodyText).not.toContain('Multilingual Identification');

        // Check friendly branding is present
        expect(bodyText).toContain('FoodBhasha');
        expect(bodyText).toContain('Your market translator');
    });

    test('should display logo correctly', async ({ page }) => {
        const logo = page.locator('.brand-icon-img');

        await expect(logo).toBeVisible();
        await expect(logo).toHaveAttribute('alt', 'FoodBhasha Logo');
        await expect(logo).toHaveAttribute('src', '/assets/graphics/logo.jpg');
    });

    test('should display dual-script language icon', async ({ page }) => {
        const dualScript = page.locator('.dual-script');
        await expect(dualScript).toBeVisible();

        // Check structural order and content
        await expect(dualScript.locator('.script-tam')).toHaveText('அ');
        await expect(dualScript.locator('.script-dev')).toHaveText('अ');
    });
});
