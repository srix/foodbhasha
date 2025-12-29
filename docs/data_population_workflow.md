# Data Population Technique & Workflow

This document captures the technique used to populate missing language translations for the defined categories (Vegetables, Fruits, Fish, Seafood).

## 1. The Core Philosophy
The process follows a **"Analyze -> Populate -> Verify"** loop to ensure 100% coverage without manual tedium for every single item.

**Key Rules:**
1. **Never overwrite**: Only populate *missing* fields (`-`) or empty fields.
2. **Major Language Focus**: Prioritize 11 major languages first (Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Urdu).
3. **Structured Format**: All entries must follow `["Native Script", "Romanization"]`.

---

## 2. The Workflow

### Step 1: Analysis
Create a script to scan the JSON dataset and identify gaps.

**Script Logic:**
- Iterate through every item in `.json`.
- Count missing translations per language (missing = value is `"-"` or header is missing).
- Calculate "Major Language Coverage" (percentage of items having all major languages).
- **Output**: A list of `ids` that are incomplete.

*Example Script Structure:*
```javascript
const data = require('./data/category.json');
const majorLangs = ['hindi', 'tamil', 'telugu', ...];

data.forEach(item => {
    let missing = majorLangs.filter(lang => !item.names[lang] || item.names[lang][0] === '-');
    if (missing.length > 0) console.log(item.id, missing);
});
```

### Step 2: Sourcing data
Once missing IDs are identified:
1. **Batch Generation**: Create a map of `{ id: { lang: ["Native", "Roman"] } }`.
2. **Transliteration fallback**: If a specific native term doesn't exist (e.g., "Kiwi" in Hindi), use the transliteration (e.g., `["कीवी", "Kiwi"]`).

### Step 3: Population
Create a script to merge the sourced data into the main dataset.

**Script Logic:**
- Load `original.json`.
- Load `translations_map`.
- Iterate through original data.
- If `translations_map` has an entry for `item.id`:
    - Iterate through languages in the map.
    - **Update ONLY IF**: The current value in `original.json` is missing or `["-", "-"]`.
- Save the file.

### Step 4: Verification
Run the **Analysis** script again.
- **Goal**: 0% missing for Major Languages.
- If gaps remain, repeat Step 2 & 3 for specific items.

---

## 3. Scripts Used (Reference)

### Analysis Script (`scripts/analyze_remaining.js`)
Used to print missing percentages and list incomplete IDs.

### Population Script template
```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/target.json'));

const updates = {
    "item-id": {
        "tamil": ["Native", "Roman"],
        "hindi": ["Native", "Roman"]
    }
};

data.forEach(item => {
    if (updates[item.id]) {
        Object.keys(updates[item.id]).forEach(lang => {
            // Safety check: Don't overwrite existing valid data
            if (!item.names[lang] || item.names[lang][0] === '-') {
                item.names[lang] = updates[item.id][lang];
            }
        });
    }
});

fs.writeFileSync('data/target.json', JSON.stringify(data, null, 2));
```
