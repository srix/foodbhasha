const { test, expect } = require('@playwright/test');

test.describe('Indian Food Guide Verification', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Ensure we are in card view
        await expect(page.locator('#card-view')).toBeVisible();
    });

    test('Page Title & Brand', async ({ page }) => {
        await expect(page).toHaveTitle(/Indian Food Guide/);
        await expect(page.locator('h1')).toHaveText('Indian Food Guide');
    });

    test('Category Navigation & Data Loading', async ({ page }) => {
        // Default is Fish
        const nav = page.locator('.category-tabs');
        await expect(nav.locator('.tab-btn.active')).toHaveText(/Fish & Seafood/);

        // Check for a Fish
        await expect(page.locator('.fish-card').filter({ hasText: 'Seer fish' })).toBeVisible();

        // Switch to Vegetables & Fruits
        await nav.locator('button[data-category="vegetables"]').click();
        await expect(nav.locator('button[data-category="vegetables"]')).toHaveClass(/active/);
        await expect(nav.locator('button[data-category="vegetables"]')).toHaveText(/Vegetables & Fruits/);

        // Check for a Vegetable (Potato)
        await expect(page.locator('.fish-card').filter({ hasText: 'Potato' })).toBeVisible();

        // Switch to Grains
        await nav.locator('button[data-category="grains"]').click();
        // Check for a Grain (Rice)
        await expect(page.locator('.fish-card').filter({ hasText: 'Rice' })).toBeVisible();
    });

    test('Filter Logic: Vegetables & Fruits (Active State)', async ({ page }) => {
        // Go to Veg
        await page.locator('button[data-category="vegetables"]').click();

        // Wait for chips
        const chips = page.locator('#filter-chips');
        await expect(chips.locator('button[data-filter="fruit"]')).toBeVisible();

        // Click Fruit Filter
        await chips.locator('button[data-filter="fruit"]').click();

        // Chip should be active
        await expect(chips.locator('button[data-filter="fruit"]')).toHaveClass(/active/);
    });

    test('Multi-Select Filter Logic (OR Logic)', async ({ page }) => {
        // Go to Veg
        await page.locator('button[data-category="vegetables"]').click();

        const chips = page.locator('#filter-chips');

        // Select Root
        await chips.locator('button[data-filter="root"]').click();
        // Select Leafy
        await chips.locator('button[data-filter="leafy"]').click();

        // Both Chips Active
        await expect(chips.locator('button[data-filter="root"]')).toHaveClass(/active/);
        await expect(chips.locator('button[data-filter="leafy"]')).toHaveClass(/active/);

        // Verify Content: Potato (Root) Visible, Spinach (Leafy) Visible
        await expect(page.locator('.fish-card').filter({ hasText: 'Potato' })).toBeVisible();
        await expect(page.locator('.fish-card').filter({ hasText: 'Spinach' })).toBeVisible();

        // Verify Negative: Mango (Fruit) Hidden
        await expect(page.locator('.fish-card').filter({ hasText: 'Mango' })).toBeHidden();

        // Logic: De-select Root
        await chips.locator('button[data-filter="root"]').click();
        await expect(chips.locator('button[data-filter="root"]')).not.toHaveClass(/active/);

        // Potato Hidden, Spinach Still Visible
        await expect(page.locator('.fish-card').filter({ hasText: 'Potato' })).toBeHidden();
        await expect(page.locator('.fish-card').filter({ hasText: 'Spinach' })).toBeVisible();

        // Reset All
        await chips.locator('button[data-filter="all"]').click();
        await expect(page.locator('.fish-card').filter({ hasText: 'Potato' })).toBeVisible();
        await expect(page.locator('.fish-card').filter({ hasText: 'Mango' })).toBeVisible();
    });

    test('Badge Whitelisting', async ({ page }) => {
        // Go to Veg
        await page.locator('button[data-category="vegetables"]').click();

        const potatoCard = page.locator('.fish-card').filter({ hasText: 'Potato' }).first();

        // Potato has "root" and "vegetable". "Root" is in whitelist.
        await expect(potatoCard.locator('.habitat-badge', { hasText: 'Root' })).toBeVisible();

        // Verify no "usage" badges like "Curry" or "Everyday" appear
        await page.locator('button[data-category="fish"]').click();
        const seerCard = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();

        await expect(seerCard.locator('.habitat-badge', { hasText: 'Sea' })).toBeVisible();
        await expect(seerCard.locator('.habitat-badge', { hasText: 'Fry' })).toBeHidden();
        await expect(seerCard.locator('.habitat-badge', { hasText: 'Popular' })).toBeHidden();
    });

    test('Sticky Header Structure', async ({ page }) => {
        // Verify the HTML structure contains the centering wrappers
        const header = page.locator('.app-header');
        await expect(header).toBeVisible();

        // Check for centered wrapper in top row
        await expect(header.locator('.header-top .header-centered')).toBeVisible();

        // Check for centered wrapper in tabs
        await expect(header.locator('.category-tabs .header-centered')).toBeVisible();
    });

    test('Dynamic Placeholders', async ({ page }) => {
        // Go to Veg
        await page.locator('button[data-category="vegetables"]').click();
        const mangoCard = page.locator('.fish-card').filter({ hasText: 'Mango' }).first();

        // Check that image is visible (src fallback handled by browser, test seeing element)
        await expect(mangoCard.locator('img')).toBeVisible();
    });
});
