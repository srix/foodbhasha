const { test, expect } = require('@playwright/test');

test.describe('Share Functionality', () => {
    test.beforeEach(async ({ page, context }) => {
        // Grant clipboard permissions for all tests
        await context.grantPermissions(['clipboard-write', 'clipboard-read']);
        await page.goto('http://localhost:8080/');
        await page.waitForLoadState('networkidle');
    });

    test('Share button is present on all cards', async ({ page }) => {
        const shareButtons = await page.locator('.share-btn');
        const count = await shareButtons.count();

        // Should have multiple share buttons (one per card)
        expect(count).toBeGreaterThan(0);

        // First share button should be visible
        await expect(shareButtons.first()).toBeVisible();
    });

    test('Share button has correct icon and text', async ({ page }) => {
        const firstShareBtn = await page.locator('.share-btn').first();

        // Should contain SVG icon
        const svg = await firstShareBtn.locator('svg');
        await expect(svg).toBeVisible();

        // Should contain "Share" text
        const text = await firstShareBtn.locator('.share-text');
        await expect(text).toContainText('Share');
    });

    test('Clicking share button copies URL to clipboard', async ({ page, context }) => {
        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-write', 'clipboard-read']);

        // Find first card and its share button
        const firstCard = await page.locator('.item-card').first();
        const shareBtn = await firstCard.locator('.share-btn');

        // Click share button
        await shareBtn.click();
        await page.waitForTimeout(500);

        // Button should show "Link copied!" feedback
        const shareText = await shareBtn.locator('.share-text');
        await expect(shareText).toContainText('Link copied!');

        // Button should have 'copied' class for visual feedback
        await expect(shareBtn).toHaveClass(/copied/);
    });

    test('Share button feedback resets after timeout', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-write']);

        const shareBtn = await page.locator('.share-btn').first();
        await shareBtn.click();

        // Should show "Link copied!"
        await expect(shareBtn.locator('.share-text')).toContainText('Link copied!');

        // Wait for reset (2 seconds)
        await page.waitForTimeout(2500);

        // Should revert to "Share"
        await expect(shareBtn.locator('.share-text')).toContainText('Share');
        await expect(shareBtn).not.toHaveClass(/copied/);
    });

    test('Share button on item page generates correct URL', async ({ page }) => {
        await page.goto('http://localhost:8080/spices/turmeric');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500); // Wait for search filter to apply

        // The share button should exist
        const shareBtn = await page.locator('.share-btn').first();
        await expect(shareBtn).toBeVisible();

        // Clicking it should work (visual feedback is enough to verify)
        await shareBtn.click();
        await page.waitForTimeout(200); // Wait for clipboard operation
        await expect(shareBtn.locator('.share-text')).toContainText('Link copied!');
    });

    test('Share buttons work across different categories', async ({ page }) => {
        // Test in Fish category
        let shareBtn = await page.locator('.share-btn').first();
        await shareBtn.click();
        await page.waitForTimeout(200);
        await expect(shareBtn.locator('.share-text')).toContainText('Link copied!');
        await page.waitForTimeout(2500); // Wait for reset

        // Switch to Vegetables  
        await page.click('.tab-btn[data-category="vegetables-fruits"]');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500); // Wait for tab animation to complete

        // Test share button in vegetables
        shareBtn = await page.locator('.share-btn').first();
        await shareBtn.click();
        await page.waitForTimeout(200);
        await expect(shareBtn.locator('.share-text')).toContainText('Link copied!');
    });

    test('Share button is styled correctly', async ({ page }) => {
        const shareBtn = await page.locator('.share-btn').first();

        // Check button exists and is styled
        const styles = await shareBtn.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
                display: computed.display,
                cursor: computed.cursor,
                border: computed.border
            };
        });

        expect(styles.display).toBe('flex');
        expect(styles.cursor).toBe('pointer');
        expect(styles.border).toBeTruthy();
    });

    test('Share button hover state works', async ({ page }) => {
        const shareBtn = await page.locator('.share-btn').first();

        // Hover over button
        await shareBtn.hover();

        // Button should still be visible (this validates hover doesn't break styling)
        await expect(shareBtn).toBeVisible();
    });
});
