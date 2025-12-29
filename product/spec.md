
---

# **Indian Food Guide – Specification (spec.md)**

## **1. Overview**

A lightweight static website that helps users instantly identify food ingredients (Fish, Vegetables, Fruits, Grains) by photo and see what they are called across **all 22 official Indian languages** (plus English).
The site is designed for **mobile-first usage** (e.g., while shopping or ordering) and is also accessible to the general public on the web.

---

## **2. Goals**

### **Primary**

* Provide a **visual reference** of common Indian food ingredients.
* Show **names across 23 languages** (English + 22 Indian Languages).
* Database covers **Fish**, **Vegetables**, **Fruits**, and **Grains**.
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
/data/fish.json
/data/vegetables.json
/data/grains.json
/img/*.jpg or .png or .webp
```

No build system required.
Deployment: GitHub Pages, Cloudflare Pages, or Netlify.

---

## **5. Data Model**

Data is split by category:
* `/data/fish.json`
* `/data/vegetables.json`
* `/data/grains.json`

### **5.1 JSON Schema**

Each entry follows:

```json
{
  "id": "item-slug",
  "photo": "img/item.webp",
  "category": ["sea", "freshwater"], // or ["root", "vegetable"], ["fruit"]
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
* `category` — array of tags used for filtering (see 6.2)

---

## **6. Features**

### **6.1 Card View (default)**

* Mobile-first vertical list.
* Each card includes:
  * Image (Left/Top)
  * English name and Scientific name.
  * **Category Badges**: Indicates specific type (e.g., Sea 🌊, Root 🥔, Fruit 🍎).
    * *Note*: Badges are strictly filtered to show only primary classification tags. Usage tags like "Curry" are used for internal search but not displayed to reduce clutter.
  * **Primary Grid**: Customizable set of languages (default: Tamil, Kannada, Telugu, Hindi).
  * **"Show all languages"**: An expandable accordion at the bottom.
  * **Native Scripts**: Displayed alongside Romanized names.
  * Notes: Helpful context.

### **6.2 Filtering & Navigation**

* **Category Tabs**: Top-level navigation between:
  * Fish & Seafood 🐟
  * Vegetables & Fruits 🥦
  * Grains & Pulses 🌾
* **Sticky Filter Bar**: Located below tabs.
  * Categories have specific, strict filter lists (e.g. Fish: Sea/Freshwater/Brackish).
  * **Multi-Select**: Users can select multiple filters simultaneously (e.g., "Sea" AND "Brackish").
  * **Logic**: OR-based filtering (shows items matching *any* active filter).
  * **Reset**: Toggling all filters off (or clicking "All") resets the view to show everything.

### **6.3 Search**

* Single search bar in the sticky header.
* Searches across:
  * All name variants
  * Notes
  * Scientific names
* Results instantly match the active category.

---

## **7. UI Layout**

### **7.1 Sticky Header**

A 3-row sticky header that stays fixed at the top:
1.  **Top Row**: Brand ("Indian Food Guide"), Search Bar, "Languages" button.
2.  **Navigation Row**: Category tabs.
3.  **Toolbar Row**: Filter chips and Result count.

* **Alignment**: On wide screens (desktop), the header content is centered and capped at 1200px to align with the body content.

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
