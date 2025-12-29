# **Indian Ingredient Lexicon – Specification (spec.md)**

## **1. Overview**

A lightweight static website (foodbhasha.com) that helps users instantly identify food ingredients (Fish, Vegetables, Fruits, Grains, Spices) by photo and see what they are called across **all 22 official Indian languages** (plus English).
The site is designed for **mobile-first usage** (e.g., while shopping or ordering) and is also accessible to the general public on the web.

---

## **2. Goals**

### **Primary**

* Provide a **visual reference** of common Indian food ingredients.
* Show **names across 23 languages** (English + 22 Indian Languages).
* Database covers **Fish**, **Vegetables**, **Fruits**, **Grains**, and **Spices**.
* Make it simple for users to **search** and quickly identify types.
* Support **native scripts** alongside Romanized names for accurate pronunciation and reading.

### **Secondary**

* Provide notes on **culinary usage** (e.g., "Good for curry", "Starch").
* Offer a clean, mobile-first **Card View**.
* **Persist** user preferences (Selected Languages) across sessions.
* Enable easy maintenance by storing info in split JSON data files.

---

## **3. Supported Platforms**

* **Mobile browsers (primary)**
* Web browsers (desktop & tablet)
* Optional: Add-to-home-screen (PWA-lite) for faster access

---

## **4. Architecture**

The site is a **fully static HTML + JS** application.

```
/index.html
/style.css
/app.js
/data/fish-seafood.json
/data/vegetables-fruits.json
/data/grains-pulses.json
/data/spices.json
/img/*.jpg or .png or .webp
```

No build system required.
Deployment: GitHub Pages, Cloudflare Pages, or Netlify.

---

## **5. Data Model**

Data is split by category:
* `/data/fish-seafood.json`
* `/data/vegetables-fruits.json`
* `/data/grains-pulses.json`
* `/data/spices.json`

### **5.1 JSON Schema**

Each entry follows:

```json
{
  "id": "item-slug",
  "photo": "img/item.webp",
  "tags": ["sea", "freshwater"], // or ["root", "vegetable"], ["fruit"], ["seed", "aromatic"]
  "scientificName": "Scientific Name",
  "names": {
    "english": ["Name 1", "Name 2"],
    "tamil": ["Native", "Romanized"],
    // ... 22 languages supported
  },
  "notes": "Culinary notes or identification tips."
}
```

### **5.2 Required fields**

* `id` — unique slug
* `photo` — local image path
* `names` — object keys for each language
* `tags` — array of tags used for filtering (see 6.2)

### **5.3 Data Completeness**
* Ideally, all entries should have names in all 22 supported languages.
* **Dataset Size**: Major categories (Fish, Veg, Grains) maintain ~100 items. Spices maintain ~30+ items.
* **Scientific Name**: All valid biological items MUST include a `scientificName`. If not applicable (e.g., generic category), use "N/A" sparingly; aim for >90% coverage.
* **Dual Script**: For Indian languages, each entry MUST include both the **Native Script** and the **Romanized (English transliteration)** version (e.g., `["வஞ்சரம்", "Vanjaram"]`).
* **Fallback**: If a name is unavailable for a specific language, the UI will display a hyphen (`-`) instead. The application must treat missing keys or empty arrays as valid absences.

---

## **6. Features**

### **6.1 Card View (default)**

* Mobile-first vertical list.
* Each card includes:
  * Image (Left/Top)
  * English name and Scientific name.
  * **Category Badges**: Indicates specific type (e.g., Sea 🌊, Root 🥔, Fruit 🍎, Spice 🌶️).
    * *Note*: Badges are strictly filtered to show only primary classification tags.
  * **Primary Grid**: Customizable set of languages (default: Tamil, Kannada, Telugu, Hindi).
  * **"Show all languages"**: An expandable accordion at the bottom.
  * **Native Scripts**: Displayed alongside Romanized names.
  * Notes: Helpful context.

### **6.2 Filtering & Navigation**

* **Category Tabs**: Top-level navigation between:
  * Fish & Seafood 🐟
  * Vegetables 🥦
  * Grains & Pulses 🌾
  * Spices 🌶️
* **Sticky Filter Bar**: Located below tabs.
  * **Fish**: Sea, Freshwater, Brackish
  * **Vegetables**: Fruit, Root, Vegetable, Leafy
  * **Grains**: Cereal, Pulse, Millet
  * **Spices**: Seed, Aromatic, Heat, Root, Acidic, Resin, Flower, Dry Fruit
  * **Multi-Select**: Users can select multiple filters simultaneously.
  * **Logic**: OR-based filtering.
  * **Reset**: Toggling all filters off (or clicking "All") resets the view.

### **6.3 Search**

* Single search bar in the sticky header.
* **Persistent Search**: The search query is preserved when switching between categories (e.g., searching for "Red" in Fish, then clicking Vegetables will show "Red" vegetables).
* **Clear Button**: A dedicated "X" button appears when typing to instantly clear the query and reset results.
* Searches across:
  * All name variants
  * Notes
  * Scientific names
* Results instantly match the active category.

---

## **7. UI Layout**

### **7.1 Sticky Header**

A responsive sticky header that stays fixed at the top.

**Desktop**:
* Centered content max 1200px.
* Row 1: Brand + Search + Language Button + Tabs + Filters.

**Mobile**:
* **Stacked Layout** for clarity:
  1.  **Top Row**: Brand (Left) + Compact Language Icon 🌍 (Right).
  2.  **Search Row**: Full-width Search Bar.
* **Scroll Behavior**: On scroll down, the Top Row and Search Row slide up/vanish to maximize content space. They reappear instantly on scroll up.
* **Sticky Elements**: Tabs and Filters always remain visible pinned to the top.
  3.  **Nav Row**: Scrollable Category tabs (Scrollbar Hidden).
  4.  **Toolbar Row**: Scrollable Filter chips (Scrollbar Hidden).
      * **Mobile Optimization**: "FILTERS:" label and "Showing X results" text are hidden to conserve vertical space.

### **7.2 Brand Identity**

* **Logo**: Custom image (`img/logo.jpg`) displayed in a non-cropped square format.
* **Favicon**: Matches the branding logo.
* **Visuals**: Primary Blue (`#1B497E`) theme.

### **7.3 Performance: Lazy Loading**

* **Infinite Scroll**: The Card View implements an Intersection Observer pattern.
  * **Initial Load**: Only the first 20 items are rendered to ensure fast TTI (Time to Interactive).
  * **On Scroll**: As the user scrolls to the bottom, the next batch of 20 items is automatically rendered.
  * **Images**: Images are naturally lazy-loaded as their containers appear in the DOM.
  * **Reset**: Searching, filtering, or switching tabs resets the scroll position and the list to the initial batch size.

### **7.2 Body**

Contains the Cards container:

```html
<main class="app-body">
    <div id="card-view"></div>
</main>
```

---

## **9. Image Guidelines**

* Use `.webp` for efficiency.
* **Placeholders**: If a specific image is unavailable, use `img/placeholder.webp`.

---

## **10. Accessibility**

* Alt text for all images.
* High contrast text.
* Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<button>`).
