const { test, expect } = require('@playwright/test');

test.describe('SEO and Meta Tags', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080/');
        await page.waitForLoadState('networkidle');
    });

    test('Homepage has correct meta tags', async ({ page }) => {
        // Title - app defaults to Fish category on load
        await expect(page).toHaveTitle(/Fish & Seafood.*FoodBhasha/);

        // Meta description
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toContain('Fish');
        expect(description).toContain('22');

        // Canonical URL
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical).toBe('https://foodbhasha.com/');

        // Open Graph tags
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
        expect(ogTitle).toContain('Fish');

        const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
        expect(ogUrl).toBeTruthy();
    });

    test('Category page updates meta tags dynamically', async ({ page }) => {
        // Navigate to spices category
        await page.click('.tab-btn[data-category="spices"]');
        await page.waitForTimeout(300);

        // Title should update
        await expect(page).toHaveTitle(/Spices.*FoodBhasha/);

        // Description should mention spices
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description.toLowerCase()).toContain('spices');

        // Open Graph URL should update
        const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
        expect(ogUrl).toBe('https://foodbhasha.com/spices');
    });

    test('Item page updates meta tags with item details', async ({ page }) => {
        await page.goto('http://localhost:8080/fish/sardine');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);

        // Title should include item name
        const title = await page.title();
        expect(title).toContain('Sardine');
        expect(title).toContain('Fish');

        // Description should include scientific name and regional names
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toContain('Sardine');
        expect(description).toContain('Fish');

        // Open Graph title
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
        expect(ogTitle).toContain('Sardine');
        expect(ogTitle).toContain('Fish');

        // Open Graph URL should be item-specific
        const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
        expect(ogUrl).toBe('https://foodbhasha.com/fish/sardine');
    });

    test('Search page updates title', async ({ page }) => {
        await page.fill('#search-input', 'pomfret');

        // Wait for title to actually update (debounce + rendering)
        await page.waitForFunction(
            () => document.title.toLowerCase().includes('pomfret'),
            { timeout: 3000 }
        );

        const title = await page.title();
        expect(title).toContain('pomfret');
        expect(title).toContain('Search');
    });

    test('Twitter Card meta tags are present', async ({ page }) => {
        const twitterCard = await page.locator('meta[property="twitter:card"]').getAttribute('content');
        expect(twitterCard).toBe('summary_large_image');

        const twitterTitle = await page.locator('meta[property="twitter:title"]').getAttribute('content');
        expect(twitterTitle).toBeTruthy();
    });

    test('Structured data (JSON-LD) is present', async ({ page }) => {
        const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
        expect(jsonLd).toBeTruthy();

        const data = JSON.parse(jsonLd);
        expect(data['@type']).toBe('WebApplication');
        expect(data.name).toContain('FoodBhasha');
        expect(data.url).toBe('https://foodbhasha.com/');
    });

    test('Manifest file is linked', async ({ page }) => {
        const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
        expect(manifest).toBe('/manifest.json');
    });

    test('Favicon is set', async ({ page }) => {
        const favicon = await page.locator('link[rel="icon"]').first().getAttribute('href');
        expect(favicon).toBeTruthy();
        expect(favicon).toContain('logo.webp');
    });

    test('Language attribute is set on HTML', async ({ page }) => {
        const lang = await page.locator('html').getAttribute('lang');
        expect(lang).toBe('en');
    });

    test('Meta viewport is correctly set for mobile', async ({ page }) => {
        const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(viewport).toContain('width=device-width');
        expect(viewport).toContain('initial-scale=1');
    });

    test('SEO fallback content is hidden but present', async ({ page }) => {
        // SEO fallback section should exist for crawlers
        const seoSection = await page.locator('.seo-fallback');
        await expect(seoSection).toBeAttached();

        // Should be hidden from users
        const isHidden = await seoSection.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display === 'none';
        });
        expect(isHidden).toBe(true);

        // Should contain keyword-rich content
        const content = await seoSection.textContent();
        expect(content).toContain('Fish');
        expect(content).toContain('Vegetables');
        expect(content).toContain('Tamil');
        expect(content).toContain('Malayalam');
    });
});
