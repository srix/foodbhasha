const { test, expect } = require('@playwright/test');

test.describe('Indian Ingredient Lexicon Verification', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Ensure we are in card view and data is loaded
        await expect(page.locator('#card-view')).toBeVisible();
        await expect(page.locator('.item-card').first()).toBeVisible();
    });

    test('Page Title & Brand', async ({ page }) => {
        await expect(page).toHaveTitle(/FoodBhasha/);
        await expect(page.locator('h1')).toHaveText('FoodBhasha');
    });

    test('Category Navigation & Data Loading', async ({ page }) => {
        // Default is Vegetables & Fruits
        const nav = page.locator('.category-tabs');
        await expect(nav.locator('.tab-btn.active')).toHaveText(/Vegetables & Fruits/);

        // Check for a Vegetable (Potato)
        await expect(page.locator('.item-card').filter({ hasText: 'Potato' })).toBeVisible();

        // Switch to Fish
        await nav.locator('button[data-category="fish"]').click();
        await page.waitForLoadState('networkidle');
        await expect(nav.locator('button[data-category="fish"]')).toHaveClass(/active/);

        // Check for a Fish
        await expect(page.locator('.item-card').filter({ hasText: 'Seer fish' })).toBeVisible();

        // Switch to Grains
        await nav.locator('button[data-category="grains"]').click();
        await page.waitForLoadState('networkidle');
        // Check for a Grain (Rice)
        await expect(page.locator('.item-card').filter({ hasText: 'Rice' })).toBeVisible();

        // Switch to Spices
        await nav.locator('button[data-category="spices"]').click();
        await page.waitForLoadState('networkidle');
        await expect(nav.locator('button[data-category="spices"]')).toHaveClass(/active/);
        // Check for a Spice (Mustard Seeds)
        await expect(page.locator('.item-card').filter({ hasText: 'Mustard Seeds' })).toBeVisible();
    });

    test('Filter Logic: Spices (New Category)', async ({ page }) => {
        // Go to Spices
        await page.locator('button[data-category="spices"]').click();

        const chips = page.locator('#filter-chips');
        await expect(chips.locator('button[data-filter="seed"]')).toBeVisible();

        // Filter by Seed
        await chips.locator('button[data-filter="seed"]').click();
        await expect(chips.locator('button[data-filter="seed"]')).toHaveClass(/active/);

        // Verify Mustard Visible, Turmeric (Root) Hidden
        await expect(page.locator('.item-card').filter({ hasText: 'Mustard Seeds' })).toBeVisible();
        await expect(page.locator('.item-card').filter({ hasText: 'Turmeric' })).toBeHidden();
    });

    test('Filter Logic: Vegetables & Fruits (Active State)', async ({ page }) => {
        // Go to Veg
        await page.locator('button[data-category="vegetables-fruits"]').click();
        await page.waitForLoadState('networkidle');

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
        await page.locator('button[data-category="vegetables-fruits"]').click();
        await page.waitForLoadState('networkidle');

        // Wait for filter chips to be fully loaded
        const chips = page.locator('#filter-chips');
        await expect(chips.locator('button[data-filter="root"]')).toBeVisible();

        // Select Root - wait for DOM to reflect active state
        await chips.locator('button[data-filter="root"]').click();
        await expect(chips.locator('button[data-filter="root"]')).toHaveClass(/active/);

        // Select Leafy - wait for DOM to reflect active state
        await chips.locator('button[data-filter="leafy"]').click();
        await expect(chips.locator('button[data-filter="leafy"]')).toHaveClass(/active/);

        // Both Chips Active (already verified above)

        // Verify Content: Potato (Root) Visible, Spinach (Leafy) Visible
        await expect(page.locator('.item-card').filter({ has: page.getByRole('heading', { name: 'Potato', exact: true }) })).toBeVisible();
        await expect(page.locator('.item-card').filter({ hasText: 'Spinach' })).toBeVisible();

        // Verify Negative: Mango (Fruit) Hidden
        await expect(page.locator('.item-card').filter({ hasText: 'Mango' })).toBeHidden();

        // Logic: De-select Root
        await chips.locator('button[data-filter="root"]').click();
        await expect(chips.locator('button[data-filter="root"]')).not.toHaveClass(/active/);

        // Wait for Potato to actually be hidden after deselecting
        await expect(page.locator('.item-card').filter({ hasText: 'Potato' })).toBeHidden();
        await expect(page.locator('.item-card').filter({ hasText: 'Spinach' })).toBeVisible();

        // Reset All
        await chips.locator('button[data-filter="all"]').click();
        // Wait for cards to be visible again
        await expect(page.locator('.item-card').filter({ hasText: 'Potato' })).toBeVisible();
        await expect(page.locator('.item-card').filter({ hasText: 'Mango' })).toBeVisible();
    });

    test('Badge Whitelisting', async ({ page }) => {
        // Go to Veg
        await page.locator('button[data-category="vegetables-fruits"]').click();
        await page.waitForLoadState('networkidle');

        const potatoCard = page.locator('.item-card').filter({ hasText: 'Potato' }).first();

        // Potato has "root" and "vegetable". "Root" is in whitelist.
        await expect(potatoCard.locator('.habitat-badge', { hasText: 'Root' })).toBeVisible();

        // Verify no "usage" badges like "Curry" or "Everyday" appear
        await page.locator('button[data-category="fish"]').click();
        await page.waitForLoadState('networkidle');
        const seerCard = page.locator('.item-card').filter({ hasText: 'Seer fish' }).first();

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

        // Verify Logo is an Image (using absolute path now)
        const logoImg = header.locator('.brand .logo-circle img');
        await expect(logoImg).toBeVisible();
        await expect(logoImg).toHaveAttribute('src', '/assets/graphics/logo.webp');
    });

    test('Dynamic Placeholders', async ({ page }) => {
        // Go to Veg
        await page.locator('button[data-category="vegetables-fruits"]').click();
        await page.waitForLoadState('networkidle');
        const mangoCard = page.locator('.item-card').filter({ hasText: 'Mango' }).first();

        // Check that image is visible (src fallback handled by browser, test seeing element)
        await expect(mangoCard.locator('img')).toBeVisible();
    });

    test('Search Persistence Across Categories', async ({ page }) => {
        await page.locator('#search-input').fill('Spinach');
        await page.waitForTimeout(600);
        await page.locator('button[data-category="vegetables-fruits"]').click();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('#search-input')).toHaveValue('Spinach');
        await expect(page.locator('.item-card').filter({ hasText: 'Spinach' })).toBeVisible();
        await expect(page.locator('.item-card').filter({ hasText: 'Potato' })).toBeHidden();
    });

    test('Search Clear Button Functionality', async ({ page }) => {
        const input = page.locator('#search-input');
        const clearBtn = page.locator('#search-clear');

        // 1. Initially Hidden
        await expect(clearBtn).toBeHidden();

        // 2. Type text -> Visible
        await input.fill('Test');
        await expect(clearBtn).toBeVisible();

        // 3. Click -> Clear Input and Hide Button
        await clearBtn.click();
        await expect(input).toHaveValue('');
        await expect(clearBtn).toBeHidden();
    });

    test('Mobile View Layout', async ({ page }) => {
        // Set to mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Check for simplified result count in mobile
        await expect(page.locator('.filter-label')).toBeHidden(); // Should be gone entirely now
        const resultCount = page.locator('#result-count');
        await expect(resultCount).toBeVisible();
        await expect(resultCount).toHaveText(/^\d+\/\d+$/); // Format: 20/100

        // Verify Result Count is BEFORE the "All" chip (inline layout)
        const allChip = page.locator('.filter-chip[data-filter="all"]');
        const rcBox = await resultCount.boundingBox();
        const acBox = await allChip.boundingBox();
        expect(rcBox.x).toBeLessThan(acBox.x); // Should be to the left
        expect(Math.abs(rcBox.y - acBox.y)).toBeLessThan(10); // Should be on same line (approx)

        // Check Header Minimize Logic operates? (Requires scrolling)
        await page.evaluate(async () => {
            window.scrollTo(0, 0); // Start at top
            document.body.style.minHeight = "2000px";
            // Small pause
            await new Promise(r => setTimeout(r, 100));
            // Move down
            window.scrollTo(0, 500);
            window.dispatchEvent(new Event('scroll'));
        });

        // Header should have 'scrolled-down' class
        await expect(page.locator('.app-header')).toHaveClass(/scrolled-down/, { timeout: 5000 });

        // Final state: Header top should be effectively invisible
        const headerTop = page.locator('.header-top');
        await expect(headerTop).toHaveCSS('opacity', '0');
        await expect(headerTop).toHaveCSS('max-height', '0px');
    });
});
