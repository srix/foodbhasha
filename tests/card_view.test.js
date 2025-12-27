const { test, expect } = require('@playwright/test');

test.describe('Card View Verification', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Ensure we are in card view (default)
        await expect(page.locator('#card-view')).toBeVisible();
    });

    test('Default Languages Displayed', async ({ page }) => {
        const seerCard = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();

        // Defaults: Tamil, Kannada, Telugu, Hindi
        await expect(seerCard.locator('.lang-label', { hasText: 'Tamil' })).toBeVisible();
        await expect(seerCard.locator('.lang-label', { hasText: 'Hindi' })).toBeVisible();

        // Malayalam is NOT in default card list (it is in table default)
        await expect(seerCard.locator('.lang-label', { hasText: 'Malayalam' })).toBeHidden();
    });

    test('Customize Card Languages & Persistence', async ({ page }) => {
        const seerCard = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();

        // Open Languages
        await page.getByRole('button', { name: '🌐 Languages' }).click();

        // Add Malayalam
        await page.locator('input[value="malayalam"]').check();

        // Remove Hindi
        await page.locator('input[value="hindi"]').uncheck();

        // Close dialog
        await page.locator('#btn-close-cols').click();

        // Verify Changes on Card
        await expect(seerCard.locator('.lang-label', { hasText: 'Malayalam' })).toBeVisible();
        await expect(seerCard.locator('.lang-label', { hasText: 'Hindi' })).toBeHidden();

        // Reload to test persistence
        await page.reload();
        await expect(page.locator('#card-view')).toBeVisible();

        // Verify Persistence
        const persistedCard = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();
        await expect(persistedCard.locator('.lang-label', { hasText: 'Malayalam' })).toBeVisible();
        await expect(persistedCard.locator('.lang-label', { hasText: 'Hindi' })).toBeHidden();
    });

    test('Show All Accordion', async ({ page }) => {
        const seerCard = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();
        const summary = seerCard.locator('summary');

        await expect(summary).toHaveText('Show all languages');
        await summary.click();

        // Verify a language usually hidden (e.g. Sanskrit) is visible
        await expect(seerCard.locator('.lang-label', { hasText: 'Sanskrit' })).toBeVisible();
    });
    test('Total Fish Count', async ({ page }) => {
        // Total fishes should be 33 (8 original + 25 new)
        const cards = page.locator('.fish-card');
        await expect(cards).toHaveCount(33);
    });

    test('New Fish Existence & Placeholder Image', async ({ page }) => {
        // Check for Silver Pomfret
        const silverPomfret = page.locator('.fish-card').filter({ has: page.locator('h2', { hasText: 'Silver Pomfret' }) }).first();
        await expect(silverPomfret).toBeVisible();
        await expect(silverPomfret.locator('img')).toHaveAttribute('src', 'img/placeholder.webp');

        // Check for Rohu
        const rohu = page.locator('.fish-card').filter({ hasText: 'Rohu' }).first();
        await expect(rohu).toBeVisible();
        await expect(rohu.locator('img')).toHaveAttribute('src', 'img/placeholder.webp');
    });

    test('Old Fish Preservation', async ({ page }) => {
        // Check for Seer Fish (should verify it is NOT using placeholder)
        const seerFish = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();
        await expect(seerFish).toBeVisible();
        await expect(seerFish.locator('img')).toHaveAttribute('src', 'img/seer-fish.webp');
    });

    test('Habitat Badges Displayed', async ({ page }) => {
        // Seer Fish should have "Sea" badge
        const seerCard = page.locator('.fish-card').filter({ hasText: 'Seer fish' }).first();
        await expect(seerCard.locator('.habitat-sea')).toBeVisible();
        await expect(seerCard.locator('.habitat-sea')).toContainText('Sea');

        // Rohu should have "Freshwater" badge
        const rohuCard = page.locator('.fish-card').filter({ hasText: 'Rohu' }).first();
        await expect(rohuCard.locator('.habitat-freshwater')).toBeVisible();
        await expect(rohuCard.locator('.habitat-freshwater')).toContainText('Freshwater');
    });
});
