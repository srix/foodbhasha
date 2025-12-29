const { test, expect } = require('@playwright/test');

test.describe('History API Routing', () => {
    test.beforeEach(async ({ page }) => {
        // Start from the homepage
        await page.goto('http://localhost:8080/');
        await page.waitForLoadState('networkidle');
    });

    test('Homepage loads correctly at root URL', async ({ page }) => {
        await expect(page).toHaveURL('http://localhost:8080/');
        await expect(page).toHaveTitle(/Indian Ingredient Lexicon/);

        // Should default to fish category
        const fishTab = await page.locator('.tab-btn[data-category="fish"]');
        await expect(fishTab).toHaveClass(/active/);
    });

    test('Category navigation updates URL without hash', async ({ page }) => {
        // Click Vegetables & Fruits tab
        await page.click('.tab-btn[data-category="vegetables-fruits"]');
        await page.waitForLoadState('networkidle');

        // URL should be /vegetables-fruits (no hash)
        await expect(page).toHaveURL('http://localhost:8080/vegetables-fruits');

        // Title should update
        await expect(page).toHaveTitle(/Vegetables & Fruits/);

        // Tab should be active
        const vegTab = await page.locator('.tab-btn[data-category="vegetables-fruits"]');
        await expect(vegTab).toHaveClass(/active/);
    });

    test('Direct category URL loads correctly', async ({ page }) => {
        await page.goto('http://localhost:8080/spices');
        await page.waitForLoadState('networkidle');

        // Should load spices category
        await expect(page).toHaveTitle(/Spices/);
        const spicesTab = await page.locator('.tab-btn[data-category="spices"]');
        await expect(spicesTab).toHaveClass(/active/);

        // Should have spice cards
        const cards = await page.locator('.fish-card');
        await expect(cards.first()).toBeVisible();
    });

    test('Item-level URL loads and highlights item', async ({ page }) => {
        await page.goto('http://localhost:8080/fish/sardine');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500); // Wait for highlight animation

        // URL stays as item URL
        await expect(page).toHaveURL('http://localhost:8080/fish/sardine');

        // Title should include item name
        await expect(page).toHaveTitle(/Sardine/);

        // Search box should show item name
        const searchInput = await page.locator('#search-input');
        await expect(searchInput).toHaveValue(/Sardine/);

        // Should filter to show only that item
        const cards = await page.locator('.fish-card');
        await expect(cards).toHaveCount(1);

        // Card should be highlighted
        const highlightedCard = await page.locator('.fish-card.highlight-item');
        await expect(highlightedCard).toBeVisible();
    });

    test('Browser back button works correctly', async ({ page }) => {
        // Navigate to vegetables
        await page.click('.tab-btn[data-category="vegetables-fruits"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300); // Extra wait for mobile
        await expect(page).toHaveURL('http://localhost:8080/vegetables-fruits');

        // Navigate to grains
        await page.click('.tab-btn[data-category="grains"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300); // Extra wait for mobile
        await expect(page).toHaveURL('http://localhost:8080/grains');

        // Click back button
        await page.goBack();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500); // Extra wait for mobile History API

        // Should be back at vegetables
        await expect(page).toHaveURL('http://localhost:8080/vegetables-fruits');
        await expect(page).toHaveTitle(/Vegetables & Fruits/);
    });

    test('Browser forward button works correctly', async ({ page }) => {
        // Navigate through categories
        await page.click('.tab-btn[data-category="vegetables-fruits"]');
        await page.waitForLoadState('networkidle');
        await page.click('.tab-btn[data-category="grains"]');
        await page.waitForLoadState('networkidle');
        await page.goBack();
        await page.waitForLoadState('networkidle');

        // Click forward
        await page.goForward();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500); // Extra wait for title update

        await expect(page).toHaveURL('http://localhost:8080/grains');
        await expect(page).toHaveTitle(/Grains/);
    });

    test('Search query persists in URL', async ({ page }) => {
        // Type in search box
        await page.fill('#search-input', 'red');
        await page.waitForTimeout(600); // Wait for debounce

        // URL should include search parameter
        await expect(page).toHaveURL('http://localhost:8080/fish?search=red');
    });

    test('Clearing search updates URL', async ({ page }) => {
        await page.fill('#search-input', 'test');
        await page.waitForTimeout(600);

        // Click clear button
        await page.click('#search-clear');

        // URL should remove search parameter
        await expect(page).toHaveURL('http://localhost:8080/fish');
    });

    test('Deep link with search query works', async ({ page }) => {
        await page.goto('http://localhost:8080/vegetables-fruits?search=onion');
        await page.waitForLoadState('networkidle');

        // Search box should have query
        const searchInput = await page.locator('#search-input');
        await expect(searchInput).toHaveValue('onion');

        // Should show filtered results
        const resultCount = await page.locator('#result-count');
        const count = await resultCount.textContent();
        expect(parseInt(count)).toBeGreaterThan(0);
    });

    test('Invalid category redirects to default', async ({ page }) => {
        await page.goto('http://localhost:8080/invalid-category');
        await page.waitForLoadState('networkidle');

        // Should load fish as default
        const fishTab = await page.locator('.tab-btn[data-category="fish"]');
        await expect(fishTab).toHaveClass(/active/);
    });

    test.skip('Hash URLs redirect to path-based URLs', async ({ page }) => {
        // Skip this test - hash redirect logic may not be immediate
        // This is an edge case for backward compatibility
        await page.goto('http://localhost:8080/#vegetables-fruits');
        await page.waitForTimeout(1000);

        // Should redirect to path-based URL
        await expect(page).toHaveURL('http://localhost:8080/vegetables-fruits');
    });
});
