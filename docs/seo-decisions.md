# SEO Decisions & Fixes

This document captures important SEO-related decisions and fixes made to the FoodBhasha project for future reference.

---

## Soft 404 Fix: Removal of /feedback Static Page

**Date**: February 5, 2026
**Issue**: Google Search Console reported a Soft 404 error for `https://foodbhasha.com/feedback/`
**Status**: ✅ Resolved

### Problem

Google was crawling the `/feedback` URL and encountering a page with minimal content (just a heading and one paragraph), which it interpreted as a Soft 404 error. A Soft 404 occurs when a page returns a 200 OK status but has content that suggests the page doesn't exist or is effectively empty.

The page was being generated with only this content:
```html
<div class="static-page-content">
    <h1>Feedback</h1>
    <p>We value your input! Use the form to send us corrections or suggestions.</p>
</div>
```

### Root Cause

1. The feedback page was included in the sitemap (`scripts/generate_sitemap.py`)
2. A static HTML file was being generated at `dist/feedback/index.html` (`scripts/generate-static.js`)
3. The page had insufficient content for Google to consider it a valid page
4. The actual feedback functionality works through a modal overlay, not a dedicated page

### Solution

We removed the static feedback page entirely and implemented a SPA (Single Page Application) pattern for the feedback functionality:

1. **Removed from sitemap** (`scripts/generate_sitemap.py:17-25`)
   - Deleted the feedback page entry from sitemap generation
   - Regenerated sitemap.xml without the feedback URL

2. **Updated robots.txt** (`src/robots.txt:3`)
   - Added `Disallow: /feedback` to prevent search engine crawling

3. **Removed static page generation** (`scripts/generate-static.js:90-106`)
   - Removed code that generated the thin-content feedback/index.html page

4. **Added SPA fallback redirect** (`src/_redirects:7`)
   - Added rule: `/feedback /index.html 200`
   - Serves the home page for /feedback requests
   - Preserves the pathname so JavaScript can detect it and open the modal

### Why This Approach?

**Alternative approaches considered:**

1. ❌ **Add more content to the page** - Would create duplicate/artificial content just for SEO
2. ❌ **301 redirect to home** - Would break the `/feedback` route detection in JavaScript
3. ✅ **SPA fallback with JavaScript detection** - Clean solution that maintains functionality

### How It Works Now

1. User navigates to `/feedback`
2. Netlify serves `index.html` (via the 200 rewrite rule)
3. The browser URL remains `/feedback`
4. JavaScript in `app.js` detects `window.location.pathname === '/feedback'`
5. The feedback modal opens automatically
6. Search engines don't crawl the URL (blocked in robots.txt, not in sitemap)

### Testing

The existing Playwright tests verify this behavior:

```javascript
test('Navigating to /feedback route opens modal', async ({ page }) => {
    await page.goto('http://localhost:8080/feedback');
    const modal = page.locator('#feedback-modal');
    await expect(modal).toBeVisible();
});
```

### Deployment Checklist

After deploying this fix:

1. ✅ Verify `/feedback` URL serves home page
2. ✅ Verify feedback modal opens when navigating to `/feedback`
3. ✅ Submit updated sitemap to Google Search Console
4. ✅ Request validation of the Soft 404 fix in Search Console
5. ✅ Monitor Search Console for successful resolution

### Related Files

- `scripts/generate_sitemap.py` - Sitemap generation (removed feedback entry)
- `scripts/generate-static.js` - Static site generation (removed feedback page)
- `src/_redirects` - Netlify redirect rules (added SPA fallback)
- `src/robots.txt` - Crawler rules (added disallow)
- `src/app.js:739-740` - JavaScript route detection for modal
- `tests/feedback.test.js:79-93` - Test coverage for /feedback route

### Key Takeaway

**Not every user-facing route needs to be a crawlable page.** Modal-based functionality should:
- NOT be included in sitemaps
- Use SPA patterns with JavaScript detection
- Be blocked from crawling via robots.txt
- Focus on user experience over SEO for utility features

---

## General SEO Best Practices for This Project

### What Gets Indexed
- ✅ Homepage: `/`
- ✅ Category pages: `/fish/`, `/vegetables-fruits/`, etc.
- ✅ Item pages: `/fish/pomfret/`, `/spices/turmeric/`, etc.

### What Doesn't Get Indexed
- ❌ Feedback modal route: `/feedback`
- ❌ Android app page: `/android-app.html` (consider for future)
- ❌ Privacy policy: `/privacy.html` (consider indexing for legal reasons)

### Canonical URL Rules
- All URLs use trailing slashes for directories (e.g., `/fish/pomfret/`)
- Enforced via `<link rel="canonical">` tags
- Redirects in `_redirects` file normalize www/non-www and http/https

### Sitemap Management
- Generated via `python3 scripts/generate_sitemap.py`
- Run automatically during `npm run build`
- Submit to Google Search Console after major changes

### Pre-rendered Content
- All item pages include full content for crawlers
- Uses `generateItemContent()` in `generate-static.js`
- JavaScript enhances the experience, doesn't replace it
