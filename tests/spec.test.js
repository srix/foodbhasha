// tests/spec.test.js
const { test, expect } = require('@playwright/test');

test.describe('Fish Name Lookup Spec Verification', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('M1: Core Visualization - Loads correctly', async ({ page }) => {
        await expect(page).toHaveTitle(/South Indian Fish Name Guide/);
        // Spec 6.1: Card View is default
        await expect(page.locator('#card-view')).toBeVisible();
        await expect(page.locator('#table-view')).toBeHidden();

        // Check for Seer Fish card
        const seerCard = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();
        await expect(seerCard).toBeVisible();
        await expect(seerCard.locator('img')).toBeVisible();
    });

    test('M2: Data & Language Expansion', async ({ page }) => {
        // Check for languages in default view (Hindi, Tamil etc)
        const seerCard = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();
        await expect(seerCard.locator('.lang-label', { hasText: 'Tamil' })).toBeVisible();

        // Expand Details (Spec 6.1)
        await seerCard.locator('summary').click();
        await expect(seerCard.locator('.lang-label', { hasText: 'Assamese' })).toBeVisible();
    });

    test('M3: Search Functionality (Spec 6.3)', async ({ page }) => {
        const search = page.locator('#search-input');

        // Search by Romanized
        await search.fill('Vanjaram');
        await expect(page.locator('.fish-card')).toHaveCount(1);
        await expect(page.locator('.fish-card')).toContainText('Seer fish');

        // Clear
        await search.fill('');
        await expect(page.locator('.fish-card').count()).resolves.toBeGreaterThan(1);

        // Search by Native Script (Hindi)
        await search.fill('सुरमई');
        await expect(page.locator('.fish-card')).toContainText('Seer fish');
    });

    test('M4: Table View & Columns (Spec 6.2)', async ({ page }) => {
        // Switch to Table View
        await page.locator('#btn-table-view').click();
        await expect(page.locator('#table-view')).toBeVisible();
        await expect(page.locator('#card-view')).toBeHidden();

        // Check sticky column
        await expect(page.locator('th.sticky-col')).toHaveText('Fish');

        // Verify Image size (Spec mentions 80px thumb in table)
        const thumb = page.locator('.table-thumb').first();
        const box = await thumb.boundingBox();
        expect(box.width).toBeCloseTo(80, 1);

        // Column Selector
        await page.getByRole('button', { name: '🌐 Languages' }).click();
        await expect(page.locator('#column-selector-dialog')).toBeVisible();

        // Toggle a column (e.g., Sanskrit) - assume it fits in view or is clickable
        // Default columns are Hindi, Tamil, Malayalam, Kannada, Telugu.
        // Let's add Urdu.

        // Find Urdu checkbox
        const urduCheckbox = page.locator('input[value="urdu"]');
        await urduCheckbox.check();
        await page.locator('#btn-close-cols').click();

        // Verify Table Header
        await expect(page.locator('th', { hasText: 'Urdu' })).toBeVisible();
    });

    test('M5: Persistence (Spec 8.3)', async ({ page }) => {
        // Switch to Table View
        await page.locator('#btn-table-view').click();

        // Reload page
        await page.reload();

        // Should still be in Table View
        await expect(page.locator('#table-view')).toBeVisible();

        // Switch back to Card for cleanup/next test implication
        await page.locator('#btn-card-view').click();
    });
});
