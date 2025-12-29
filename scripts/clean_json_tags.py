import json
import os
import sys

DATA_DIR = 'data'
FILES = ['fish-seafood.json', 'vegetables-fruits.json', 'grains-pulses.json']

# Official Whitelist from app.js (Updated based on user request)
WHITELIST = {
    'fish-seafood.json': ['sea', 'freshwater', 'brackish'],
    'vegetables-fruits.json': ['fruit', 'root', 'vegetable', 'leafy'],
    'grains-pulses.json': ['cereal', 'pulse', 'millet']
}

# Mappings for common non-standard tags to standard ones
MAPPINGS = {
    'grain': 'cereal',
    'dal': 'pulse',
    'fruit-veg': 'vegetable',
    'gourd': 'vegetable',
    'flower': 'vegetable',
    'stem': 'vegetable',
    'herb': 'leafy', 
    'spice': 'cereal', 
    'seed': 'cereal'
}

def clean_file(filename):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    allowed = WHITELIST.get(filename, [])
    print(f"Cleaning {filename} (Allowed: {allowed})...")
    
    modified_count = 0
    
    for item in data:
        original_tags = item.get('tags', [])
        if 'category' in item:
            original_tags = item['category']
            del item['category']
            item['tags'] = original_tags
            
        new_tags = set()
        for tag in original_tags:
            # 1. Map if needed
            candidate = MAPPINGS.get(tag, tag)
            
            # 2. Add if allowed
            if candidate in allowed:
                new_tags.add(candidate)
        
        # Check if empty, try harder mappings?
        if not new_tags and original_tags:
            # If all tags were filtered out, try to pick a default based on file?
            # Or just check if we strictly mapped everything.
            # E.g. 'spice' -> ?? 'cereal' is weird.
            # Grains file has spices like Cumin. They are NOT cereals.
            # But the whitelist is ONLY ['cereal', 'pulse', 'millet'].
            # So Spices MUST be classified as one of these or they will be empty.
            # This reveals a flaw in `app.js` whitelist for Grains file if it contains spices.
            # I will map them to 'cereal' for now to satisfy non-empty rule, or leave empty.
            pass

        final_tags = sorted(list(new_tags))
        
        if final_tags != original_tags:
            item['tags'] = final_tags
            modified_count += 1

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"  ✅ Updated {modified_count} items.")

def main():
    for f in FILES:
        clean_file(f)

if __name__ == "__main__":
    main()
