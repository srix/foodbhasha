const { test, expect } = require('@playwright/test');

test.describe('Data Integrity & New Fishes', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#card-view')).toBeVisible();
    });

    test('Total Fish Count', async ({ page }) => {
        // Total fishes should be 33 (8 original + 25 new)
        const cards = page.locator('.fish-card');
        await expect(cards).toHaveCount(33);
    });

    test('New Fish Existence & Placeholder Image', async ({ page }) => {
        // Check for Silver Pomfret
        const silverPomfret = page.locator('.fish-card').filter({ hasText: 'Silver Pomfret' }).first();
        await expect(silverPomfret).toBeVisible();
        await expect(silverPomfret.locator('img')).toHaveAttribute('src', 'img/placeholder.png');

        // Check for Rohu
        const rohu = page.locator('.fish-card').filter({ hasText: 'Rohu' }).first();
        await expect(rohu).toBeVisible();
        await expect(rohu.locator('img')).toHaveAttribute('src', 'img/placeholder.png');
    });

    test('Old Fish Preservation', async ({ page }) => {
        // Check for Seer Fish (should verify it is NOT using placeholder)
        const seerFish = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();
        await expect(seerFish).toBeVisible();
        await expect(seerFish.locator('img')).toHaveAttribute('src', 'img/seer-fish.png');
    });
});
