# AGENTS.md  
FoodBhasha – Agent Instructions

**Your market translator** - Find food names in 23 Indian languages

This repository is used with coding agents (Codex Cloud / GitHub agents).
Follow this guide strictly to ensure high-quality, reviewable changes.

---

## Project Overview
**FoodBhasha** is your market translator for Indian food ingredients (**foodbhasha.com**).
It helps users identify and translate names across multiple categories (Fish, Vegetables & Fruits, Grains & Pulses, Spices) and 23 languages (English + 22 Indian languages).

**Available on:**
- Web (foodbhasha.com)
- Android App (via Capacitor, ~6MB, fully offline)

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

### Web App
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Data**: JSON (`data/fish-seafood.json`, etc.) - 300+ items
- **Server**: Node.js + Express (for SPA fallback routing)
- **Testing**: Playwright (end-to-end)

### Android App
- **Framework**: Capacitor 8.0 (WebView wrapper)
- **Code Reuse**: 95%+ from web app
- **Build**: Gradle with Android SDK
- **Package**: com.foodbhasha.app
- **Size**: ~6.2MB APK
- **Min SDK**: 23 (Android 6.0)
- **Target SDK**: 35 (Android 15)

**Note**: Web app requires a server with SPA fallback routing for production deployment to support deep linking.

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
  - **Design note**: Uses a "Vertical Stack" dual-script icon (Tamil 'அ' top, Devanagari 'अ' bottom) for the language button.

- `server.js`  
  Express server with SPA fallback routing:
  - Serves `index.html` for all routes
  - Enables deep linking support
  - Required for deployment

- `package.json`  
  Dependencies and scripts:
  - `npm start` - Runs Node.js server (web app)
  - `npm test` - Runs Playwright tests (web)
  - `npm run build:web` - Copies web files to www/
  - `npm run sync` - Syncs web files to Android
  - `npm run android:build` - Builds Android APK
  - `npm run android:open` - Opens Android Studio
  - `npm run android:run` - Runs on device/emulator

- `capacitor.config.json`  
  Capacitor configuration for Android app.

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
- `routing.test.js` - History API routing tests
- `seo.test.js` - SEO and meta tag tests
- `share.test.js` - Share functionality tests

### Scripts (`scripts/`)
- `generate_sitemap.py` - Generates sitemap.xml from JSON data files
- `process_grid.py` - Slices 2x2 image grids into individual images
- `update_json_images.py` - Links generated images to JSON data
- `find_missing_images.py` - Identifies items without images

> [!IMPORTANT]
> **Sitemap Update Rule**: Whenever you modify any JSON data files (adding/removing/renaming items), you MUST regenerate the sitemap by running:
> ```bash
> python3 scripts/generate_sitemap.py
> ```
> This ensures all item URLs remain in sync with the sitemap for SEO.

### Docs (`docs/`)
- `image-generation.md` - Complete guide for regenerating images with different styles/sizes

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

### Android App Development

#### Sync web changes to Android
```bash
npm run sync  # Copies www/ to Android assets
```

#### Build Android APK
```bash
npm run android:build  # Output: android/app/build/outputs/apk/debug/app-debug.apk
```

#### Test on emulator
```bash
# Start emulator
~/Android/Sdk/emulator/emulator -avd Pixel_8 &

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Launch app
adb shell am start -n com.foodbhasha.app/.MainActivity
```

#### View logs
```bash
adb logcat | grep -i capacitor
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
