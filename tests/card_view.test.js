const { test, expect } = require('@playwright/test');

test.describe('Indian Food Guide Verification', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Ensure we are in card view and data is loaded
        await expect(page.locator('#card-view')).toBeVisible();
        await expect(page.locator('.fish-card').first()).toBeVisible();
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

        // Switch to Spices
        await nav.locator('button[data-category="spices"]').click();
        await expect(nav.locator('button[data-category="spices"]')).toHaveClass(/active/);
        // Check for a Spice (Mustard Seeds)
        await expect(page.locator('.fish-card').filter({ hasText: 'Mustard Seeds' })).toBeVisible();
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
        await expect(page.locator('.fish-card').filter({ hasText: 'Mustard Seeds' })).toBeVisible();
        await expect(page.locator('.fish-card').filter({ hasText: 'Turmeric' })).toBeHidden();
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

    test('Search Persistence Across Categories', async ({ page }) => {
        // 1. Type "Red" in Fish
        await page.locator('#search-input').fill('Red');
        // Expect Red Snapper
        await expect(page.locator('.fish-card').filter({ hasText: 'Red Snapper' })).toBeVisible();

        // 2. Switch to Vegetables
        await page.locator('button[data-category="vegetables"]').click();

        // 3. Verify Search Input still has "Red"
        await expect(page.locator('#search-input')).toHaveValue('Red');

        // 4. Verify "Red Amaranth" or similar shows up, and Potato (Root) is hidden
        // (Assuming "Red" matches "Red Spinach" or similar in data)
        // Let's check for something generic if Red isn't in Veg. 
        // "Spinach" might be better if we want to be safe, but "Red" is a good cross-category term.
        // If no "Red" veg exists, it should show No Results or empty list, but the Input must remain.

        // Let's use a known term if possible, or just verify the Input Value key behavior.
        // Actually, let's use "a" - very common.
        await page.locator('#search-input').fill('Spinach');
        await page.locator('button[data-category="vegetables"]').click();
        await expect(page.locator('#search-input')).toHaveValue('Spinach');
        await expect(page.locator('.fish-card').filter({ hasText: 'Spinach' })).toBeVisible();
        await expect(page.locator('.fish-card').filter({ hasText: 'Potato' })).toBeHidden();
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

        // 4. Verify Focus returned to input
        await expect(input).toBeFocused();
    });
});
