
---

# **Fish Name Lookup – Specification (spec.md)**

## **1. Overview**

A lightweight static website that helps users instantly identify a fish by photo and see what it is called across **all 22 official Indian languages** (plus English).
The site is designed for **mobile-first usage** (e.g., while ordering at restaurants) and is also accessible to the general public on the web.

---

## **2. Goals**

### **Primary**

* Provide a **visual reference** of common fishes served in restaurants.
* Show **names across 23 languages** (English + 22 Indian Languages).
* Database covers **30+ popular fishes** (Sea, Freshwater, Shellfish).
* Make it simple for users to **search** and quickly identify fish names.
* Support **native scripts** alongside Romanized names for accurate pronunciation and reading.

### **Secondary**

* Provide notes on **confusions and alternate names**.
* Offer two viewing modes: **Card View** and **Table View**.
* **Persist** user preferences (View mode, Table columns) across sessions.
* Enable easy maintenance by storing all fish info in **one JSON data file**.

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
/img/*.jpg or .png or .webp
```

No build system required.
Deployment: GitHub Pages, Cloudflare Pages, or Netlify.

---

## **5. Data Model**

All fish information lives inside `/data/fish.json`.

### **5.1 JSON Schema**

Each fish entry follows:

```json
{
  "id": "seer-fish",
  "photo": "img/seer-fish.png",
  "category": ["sea", "fry", "popular"],
  "scientificName": "Scomberomorus commerson",
  "names": {
    "english": ["Seer fish", "King fish"],
    "tamil": ["வஞ்சரம்", "Vanjaram"],
    "malayalam": ["നെയ്‌മീൻ", "Neymeen"],
    "hindi": ["सुरमई", "Surmai"],
    // ... 22 languages supported
  },
  "notes": "Often sold as King fish. Surmai in North/West India."
}
```

### **5.2 Required fields**

* `id` — unique slug
* `photo` — local image path
* `names` — object keys for each language, values are array: `["Native Script", "Romanized"]` or `["Romanized"]`

### **5.3 Optional fields**

* `scientificName`
* `category` (tags)
* `notes` (confusions, prep style, restaurant usage insights)

---

## **6. Features**

### **6.1 Card View (default)**

* Mobile-first vertical list.
* Each card includes:
  * Image (Left/Top)
  * English name and Scientific name.
  * **Habitat Badge**: Indicates if the fish is from Sea 🌊, Freshwater 💧, or Brackish 🌿 waters.
  * **Primary Grid**: Customizable set of languages (default: Tamil, Kannada, Telugu, Hindi). Users can select which languages to show here via the "Languages" button.
  * **"Show all languages"**: An expandable accordion at the **bottom** of the card (full width) to reveal the rest.
  * **Native Scripts**: Displayed alongside Romanized names.
  * Notes expandable on tap.

### **6.2 Table View**

* Vertical layout for Fish Name (Name on Top, Large 80px Thumbnail below).
* **Habitat Info**: Displayed in the "Details" column.
* **Column Selector**: A "🌐 Languages" button allows users to toggle visibility of any of the 22 language columns. Dropdown shows names in **"Native / English"** format. Default columns: Tamil, Kannada, Telugu, Hindi, Malayalam.
* **Sticky Header**: First column (Fish) and Headers are sticky.

### **6.3 Search**

* Single search bar in header.
* Searches across:
  * All name variants (English + all 22 languages)
  * English transliteration
  * Notes
  * Scientific names
* Results instantly filter both Card and Table views.

### **6.4 Persistence**

* Remembers **View Mode** (Card vs Table) using `localStorage`.
* Remembers **Selected Languages** independently for **Card View** and **Table View** using `localStorage`.

### **6.5 Responsive Design**

* Optimized for mobile (primary).
* Table view gracefully scrolls horizontally on small screens.
* Desktop/tablet gets wider grid layout for cards and full table visibility.

---

## **7. UI Layout**

### **7.1 Header**

* Title: “South Indian Fish Name Guide”
* Search bar (full width)
* View Toggles: `Card View` | `Table View`
* Table Controls: `🌐 Languages` (Visible only in Table View)

### **7.2 Body**

Contains two main containers:

```html
<div id="card-view"></div>
<div id="table-view" hidden></div>
```

Only one visible at a time.

---

## **8. Behavior**

### **8.1 Data Loading**

On page load:

* Fetch `/data/fish.json`
* Store in global array
* Restore saved view state and columns from `localStorage`
* Render appropriate view

### **8.2 Filtering**

On each keystroke:

* Normalize search term
* Filter fishData across all fields
* Re-render active view

---

## **9. Image Guidelines**

* Use `.png` or `.jpg` (AI generated images are .png).
* **AI Generated** watermark applied.
* Prefer whole-fish photos on white/neutral background.
* Filenames follow `id`: `img/seer-fish.png`.
* **Placeholders**: If a specific fish image is unavailable, use `img/placeholder.png` (a generic fish icon) until a specific image is generated.

---

## **10. Accessibility**

* Alt text for all images.
* High contrast text.
* Minimum 14–16px fonts for mobile readability.
* Interactive elements have clear labels (`aria-label`).

---

## **11. Future Enhancements (v2)**

* Filters: sea vs freshwater.
* Dish suggestions (best for fry, curry, grill).
* Offline access (service worker).
* "Buyers guide" (how to identify fresh fish).
