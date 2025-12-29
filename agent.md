# AGENTS.md  
Indian Ingredient Lexicon – Agent Instructions

This repository is used with coding agents (Codex Cloud / GitHub agents).
Follow this guide strictly to ensure high-quality, reviewable changes.

---

## Project Overview
This project is a static, web-based lexicon for Indian food ingredients (**foodbhasha.com**).
It helps users identify and translate names across multiple categories (Fish, Vegetables & Fruits, Grains & Pulses, Spices) and 22 Indian languages.

The app supports:
- **History API Routing** for SEO-friendly URLs (`/fish/pomfret`, `/spices/turmeric`)
- **Dynamic Meta Tags** for item-specific social sharing
- **Item-Level URLs** - Each of 319+ items has a unique shareable URL
- **Share Functionality** with Web Share API and clipboard fallback
- **Card View** for visual browsing with lazy loading
- **Multi-select Filtering** (e.g., Root + Leafy)
- **Search persistence** with query parameters

---

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Data**: JSON (`data/fish-seafood.json`, etc.)
- **Server**: Node.js + Express (for SPA fallback routing)
- **Testing**: Playwright (end-to-end)

**Note**: The app requires a server with SPA fallback routing for production deployment to support deep linking.

---

## Repository Structure

### Root
- `index.html`  
  Main entry point. Contains DOM structure for tabs and card view with absolute asset paths.

- `app.js`  
  Core application logic:
  - History API routing with item-level URL support
  - Data loading from absolute paths (`/data/*.json`)
  - Card rendering with share buttons
  - Search and filtering with URL persistence
  - Dynamic meta tag updates for SEO

- `style.css`  
  Global and responsive styles including highlight animations.

- `server.js`  
  Express server with SPA fallback routing:
  - Serves `index.html` for all routes
  - Enables deep linking support
  - Required for deployment

- `package.json`  
  Dependencies and scripts:
  - `npm start` - Runs Node.js server
  - `npm test` - Runs Playwright tests

- `playwright.config.js`  
  Playwright configuration.

- `sitemap.xml`  
  Comprehensive sitemap with 324 URLs (1 homepage + 4 categories + 319 items)

### Data (`data/`)
- `fish-seafood.json`, `vegetables-fruits.json`, `grains-pulses.json`, `spices.json`  
  Core datasets. Array of items with:
  - `id` - Unique slug for URL routing
  - `photo` - Image path (relative to `/img/`)
  - `scientificName`
  - `names` object with 23 language keys (English + 22 Indian languages)
  - `tags` - Array for filtering
  - `notes` - Optional usage notes
  - **Requirement**: Indian languages must have `[Native, Romanized]` format.

### Product (`product/`)
- `spec.md`  
  Product requirements and scope reference.

### Tests (`tests/`)
- `card_view.test.js` - Card View behavior tests
- `data_integrity.test.js` - Data validation tests
- `lazy_load.test.js` - Performance tests
- `routing.test.js` - History API routing tests (NEW)
- `seo.test.js` - SEO and meta tag tests (NEW)

### Scripts (`scripts/`)
- `generate-sitemap.js` - Generates sitemap.xml with all item URLs

---

## Development Setup

### Install dependencies
```bash
npm install
```

### Run locally
```bash
npm start  # Starts Node.js server on http://localhost:8080
```

### Run tests
```bash
npm test  # Runs all Playwright tests
```

### Generate sitemap
```bash
node scripts/generate-sitemap.js
```

---

## SEO Architecture

### Routing System
- **URL Format**: `/category/item-id` (e.g., `/fish/pomfret-black`)
- **Server**: Express serves `index.html` for all routes
- **Client**: JavaScript parses URL and loads appropriate content
- **Meta Tags**: Dynamically updated based on current route

### Item URLs
Every ingredient has a unique URL:
- `/fish/sardine`, `/fish/pomfret-black` (102 fish items)
- `/vegetables-fruits/brinjal`, `/vegetables-fruits/mango` (113 items)
- `/grains/basmati-rice`, `/grains/toor-dal` (66 items)
- `/spices/turmeric`, `/spices/cardamom` (38 items)

Total: 324 indexable URLs

### Share Functionality
Each card includes a share button that:
1. Uses Web Share API on mobile devices
2. Falls back to clipboard copy on desktop
3. Shows "Link copied!" visual feedback
4. Shares item-specific URL with proper title

---

## Deployment

### Supported Platforms
- **Netlify** (recommended) - Automatic SPA routing
- **Vercel** - Built-in SPA support
- **Cloudflare Pages** - SPA routing enabled
- **GitHub Pages** - Requires `404.html` workaround
- **Any platform with SPA fallback routing**

### Build Commands
No build step required. Deploy all files as-is.

### Important Files for Deployment
- `sitemap.xml` - Submit to Google Search Console
- `robots.txt` - Ensure correct domain
- `manifest.json` - PWA configuration
