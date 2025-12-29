const { test, expect } = require('@playwright/test');

test.describe('Lazy Loading & Infinite Scroll', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#card-view')).toBeVisible();
    });

    test('Initial Load Limit', async ({ page }) => {
        await expect(page.locator('.fish-card').first()).toBeVisible();
        const count = await page.locator('.fish-card').count();
        expect(count).toBe(20);
    });

    test('Loads More on Scroll', async ({ page }) => {
        await expect(page.locator('.fish-card').first()).toBeVisible();
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        const newCount = await page.locator('.fish-card').count();
        expect(newCount).toBeGreaterThan(20);
        expect(newCount).toBeLessThanOrEqual(40);
    });

    test('Reset on Filter', async ({ page }) => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        const chips = page.locator('#filter-chips');
        await chips.locator('button[data-filter="sea"]').click();

        // Wait for filter to apply and re-render
        await page.waitForTimeout(500);

        const filteredCount = await page.locator('.fish-card').count();
        expect(filteredCount).toBeLessThanOrEqual(20);
    });

    test('Reset on Tab Switch', async ({ page }) => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        // Switch to Vegetables & Fruits
        await page.locator('button[data-category="vegetables-fruits"]').click();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.fish-card').first()).toBeVisible();
        const vegCount = await page.locator('.fish-card').count();
        expect(vegCount).toBeLessThanOrEqual(20);

        // Switch BACK to Fish
        await page.locator('button[data-category="fish"]').click();
        await page.waitForLoadState('networkidle');

        // Verify Fish is reset to 20
        await expect(page.locator('.fish-card').first()).toBeVisible();

        // Wait specifically for potential re-render to complete if needed
        await page.waitForTimeout(300);

        const fishCountNew = await page.locator('.fish-card').count();
        expect(fishCountNew).toBe(20);
    });

    test('Reset on Search', async ({ page }) => {
        await page.fill('#search-input', 'Seer');
        await page.waitForTimeout(800); // Wait for debounce and render

        const cards = page.locator('.fish-card');
        await expect(cards).toHaveCount(1);

        // Clear search
        await page.fill('#search-input', '');
        await page.waitForTimeout(800); // Wait for debounce and render

        const count = await page.locator('.fish-card').count();
        expect(count).toBe(20);
    });
});
