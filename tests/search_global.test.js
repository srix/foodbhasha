const { test, expect } = require('@playwright/test');

test.describe('Global Search', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('Searches across categories (Apple on Fish tab)', async ({ page }) => {
        // Ensure we are on Fish tab
        await page.click('.tab-btn[data-category="fish"]');

        // Search for "Apple" (which is in Fruits, not Fish)
        await page.fill('#search-input', 'apple');
        await page.waitForTimeout(600); // Wait for debounce and fetch

        // Verify "Custard Apple" or "Ice Apple" or similar appears
        const cardTitles = page.locator('.fish-title h3');
        await expect(cardTitles.first()).toContainText(/Apple/i);

        // Verify badge indicates it's a Fruit (by checking for fruit-specific placeholder or badge if possible, 
        // OR just checking we found something that definitely isn't a fish)
        const cards = page.locator('.item-card');
        await expect(cards).not.toHaveCount(0);
    });

    test('Clearing search restores category', async ({ page }) => {
        // Go to Spices
        await page.click('.tab-btn[data-category="spices"]');

        // Search for "Fish" (Global)
        await page.fill('#search-input', 'fish');
        await page.waitForTimeout(600);

        // Should see fish results
        await expect(page.locator('.item-card').first()).toBeVisible();

        // Clear search
        await page.click('#search-clear');

        // Should be back to Spices (check for Turmeric/Cardamom or just category count/title)
        // Check title or check a spice item
        await expect(page).toHaveTitle(/Spices/);
    });

    test('Filter intersection: Search respects local filters', async ({ page }) => {
        // Go to Fish tab
        await page.click('.tab-btn[data-category="fish"]');

        // Activate "Sea" filter
        await page.click('button[data-filter="sea"]');

        // Search for "Mango" (Fruit, definitely not Sea)
        await page.fill('#search-input', 'mango');
        await page.waitForTimeout(600);

        // Should show NO results (because Mango does not have 'sea' tag)
        const noResults = page.locator('#no-results');
        await expect(noResults).toBeVisible();

        // Now clear filter
        await page.click('button[data-filter="all"]');

        // Should show Mango now
        await expect(noResults).toBeHidden();
        await expect(page.locator('.fish-title h3').first()).toContainText(/Mango/i);
    });

    test('Clicking search input resets filters', async ({ page }) => {
        // Go to Fish tab
        await page.click('.tab-btn[data-category="fish"]');

        // Search "Fish"
        await page.fill('#search-input', 'fish');
        await page.waitForTimeout(600);

        // Apply "Brackish" filter (assuming some fish in results are NOT brackish)
        await page.click('button[data-filter="brackish"]');

        // Check finding something brackish
        // (Just ensure the filter is active)
        await expect(page.locator('button[data-filter="brackish"]')).toHaveClass(/active/);

        // Click search input
        await page.click('#search-input');

        // Filter should be gone
        await expect(page.locator('button[data-filter="brackish"]')).not.toHaveClass(/active/);
        await expect(page.locator('button[data-filter="all"]')).toHaveClass(/active/);
    });
});
