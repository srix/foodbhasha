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
        // Scroll to trigger lazy loading
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Wait for more cards to load (should be > 20)
        await expect(page.locator('.fish-card')).toHaveCount(40, { timeout: 2000 });

        const chips = page.locator('#filter-chips');
        await chips.locator('button[data-filter="sea"]').click();

        // Wait for filter to apply by checking card count reduces
        await page.waitForFunction(() => {
            const count = document.querySelectorAll('.fish-card').length;
            return count <= 20;
        }, { timeout: 5000 });

        const filteredCount = await page.locator('.fish-card').count();
        expect(filteredCount).toBeLessThanOrEqual(20);
    });

    test('Reset on Tab Switch', async ({ page }) => {
        // Scroll to trigger lazy loading
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Wait for more cards to load
        await expect(page.locator('.fish-card')).toHaveCount(40, { timeout: 2000 });

        // Switch to Vegetables & Fruits
        await page.locator('button[data-category="vegetables-fruits"]').click();
        await page.waitForLoadState('networkidle');

        // Wait for vegetables to load and verify count reset
        await expect(page.locator('.fish-card').first()).toBeVisible();
        const vegCount = await page.locator('.fish-card').count();
        expect(vegCount).toBeLessThanOrEqual(20);

        // Switch BACK to Fish
        await page.locator('button[data-category="fish"]').click();
        await page.waitForLoadState('networkidle');

        // Verify Fish is reset to 20 by waiting for first card and checking count
        await expect(page.locator('.fish-card').first()).toBeVisible();
        const fishCountNew = await page.locator('.fish-card').count();
        expect(fishCountNew).toBe(20);
    });

    test('Reset on Search', async ({ page }) => {
        const searchInput = page.locator('#search-input');

        // Type search and wait for results to filter
        await searchInput.fill('Seer');

        // Wait for search to filter by checking card count becomes 1
        await expect(page.locator('.fish-card')).toHaveCount(1, { timeout: 2000 });

        // Clear search and wait for results to reset
        await searchInput.fill('');

        // Wait for all cards to come back
        await expect(page.locator('.fish-card')).toHaveCount(20, { timeout: 2000 });
    });
});
