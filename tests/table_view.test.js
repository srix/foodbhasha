const { test, expect } = require('@playwright/test');

test.describe('Table View Verification', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.locator('#btn-table-view').click();
        await expect(page.locator('#table-view')).toBeVisible();
    });

    test('Default Columns Displayed', async ({ page }) => {
        // Defaults: Tamil, Kannada, Telugu, Hindi, Malayalam
        await expect(page.locator('th', { hasText: 'Tamil' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'Malayalam' })).toBeVisible();

        // Bengali is NOT in default
        await expect(page.locator('th', { hasText: 'Bengali' })).toBeHidden();
    });

    test('Customize Columns & Persistence', async ({ page }) => {
        // Open Languages
        await page.getByRole('button', { name: '🌐 Languages' }).click();

        // Add Bengali
        await page.locator('input[value="bengali"]').check();

        // Remove Tamil
        await page.locator('input[value="tamil"]').uncheck();

        // Close dialog
        await page.locator('#btn-close-cols').click();

        // Verify Changes
        await expect(page.locator('th', { hasText: 'Bengali' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'Tamil' })).toBeHidden();

        // Reload to test persistence
        await page.reload();
        await expect(page.locator('#table-view')).toBeVisible();

        // Verify Persistence
        await expect(page.locator('th', { hasText: 'Bengali' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'Tamil' })).toBeHidden();
    });

    test('Independent Persistence Check', async ({ page }) => {
        // We modified Table View to have Bengali but no Tamil.
        // Let's switch to Card View and ensure it STILL has Tamil (default) and NO Bengali (unless we added it there).
        // (Assuming clean state for each test file run in parallel context, but let's check basic independence logic).

        // This test suite runs independently, so we must set specific state to test separation if we want to be thorough.

        // 1. Modify Table: Add Bengali
        await page.getByRole('button', { name: '🌐 Languages' }).click();
        await page.locator('input[value="bengali"]').check();
        await page.locator('#btn-close-cols').click();
        await expect(page.locator('th', { hasText: 'Bengali' })).toBeVisible();

        // 2. Switch to Card
        await page.locator('#btn-card-view').click();

        // 3. Verify Card DOES NOT have Bengali in primary grid (default set doesn't have it)
        const seerCard = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();
        await expect(seerCard.locator('.lang-label', { hasText: 'Bengali' })).toBeHidden();

        // 4. Modify Card: Add Punjabi
        await page.getByRole('button', { name: '🌐 Languages' }).click();
        await page.locator('input[value="punjabi"]').check();
        await page.locator('#btn-close-cols').click();
        await expect(seerCard.locator('.lang-label', { hasText: 'Punjabi' })).toBeVisible();

        // 5. Switch back to Table
        await page.locator('#btn-table-view').click();

        // 6. Verify Table DOES NOT have Punjabi
        await expect(page.locator('th', { hasText: 'Punjabi' })).toBeHidden();
    });
    test('Habitat Info in Table', async ({ page }) => {
        // Seer Fish row should contain "Sea"
        const seerRow = page.locator('tr').filter({ hasText: 'Seer fish' });
        await expect(seerRow.locator('td').last()).toContainText('Sea');

        // Rohu row should contain "Freshwater"
        const rohuRow = page.locator('tr').filter({ hasText: 'Rohu' });
        await expect(rohuRow.locator('td').last()).toContainText('Freshwater');
    });
});
