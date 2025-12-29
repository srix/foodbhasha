import json
import os
import sys

# Configuration
DATA_DIR = 'data'
IMG_DIR = 'img'
FILES_TO_CHECK = ['fish-seafood.json', 'vegetables-fruits.json', 'grains-pulses.json', 'spices.json']

SUPPORTED_LANGUAGES = [
    "assamese", "bengali", "bodo", "dogri", "gujarati", "hindi", "kannada",
    "kashmiri", "konkani", "maithili", "malayalam", "manipuri", "marathi",
    "nepali", "odia", "punjabi", "sanskrit", "santali", "sindhi", "tamil",
    "telugu", "urdu"
]

import argparse

# Valid Tags Config
VALID_TAGS = {
    'fish-seafood.json': {
        'primary': {'sea', 'freshwater', 'brackish'},
        'secondary': set() 
    },
    'vegetables-fruits.json': {
         'primary': {'fruit', 'root', 'vegetable', 'leafy'},
         'secondary': set()
    },
    'grains-pulses.json': {
        'primary': {'cereal', 'pulse', 'millet'},
        'secondary': set()
    },
    'spices.json': {
        'primary': {'spice'},
        'secondary': set()
    }
}

def check_file(filename, skip_images):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ JSON Decode Error in {filename}: {e}")
        return False

    print(f"Checking {filename} ({len(data)} entries)...")
    errors = 0
    warnings = 0
    seen_ids = set()
    
    # Get valid tags for this file
    file_tags = VALID_TAGS.get(filename, {})
    all_valid_tags = file_tags.get('primary', set()) | file_tags.get('secondary', set())

    for idx, item in enumerate(data):
        item_id = item.get('id', f'unknown_index_{idx}')
        
        # 1. ID Check
        if not item.get('id'):
            print(f"  ❌ [{idx}] Missing 'id'")
            errors += 1
        elif item['id'] in seen_ids:
            print(f"  ❌ [{item_id}] Duplicate ID")
            errors += 1
        else:
            seen_ids.add(item['id'])

        # 2. Photo Check
        if not skip_images:
            if not item.get('photo'):
                print(f"  ❌ [{item_id}] Missing 'photo' field")
                errors += 1
            else:
                photo_path = item['photo']
                if not os.path.exists(photo_path):
                     print(f"  ❌ [{item_id}] Image file not found: {photo_path}")
                     errors += 1

        # 3. Tags Check
        if 'category' in item:
            print(f"  ❌ [{item_id}] Found deprecated 'category' field. Rename to 'tags'.")
            errors += 1
        
        if 'tags' not in item:
            print(f"  ❌ [{item_id}] Missing 'tags' field")
            errors += 1
        elif not isinstance(item['tags'], list):
             print(f"  ❌ [{item_id}] 'tags' must be a list")
             errors += 1
        elif len(item['tags']) == 0:
             print(f"  ❌ [{item_id}] 'tags' list is empty")
             errors += 1
        else:
            # Validate Tag Values
            if all_valid_tags:
                for tag in item['tags']:
                    if tag not in all_valid_tags:
                        print(f"  ⚠️ [{item_id}] Unknown tag: '{tag}'")
                        warnings += 1

        # 4. Scientific Name Check
        if not item.get('scientificName'):
             print(f"  ❌ [{item_id}] Missing 'scientificName'")
             errors += 1

        # 5. Notes Check
        if 'notes' not in item:
            print(f"  ⚠️ [{item_id}] Missing 'notes' field")
            warnings += 1
        elif not item['notes'] or str(item['notes']).strip() == "":
             print(f"  ⚠️ [{item_id}] Empty 'notes' field")
             warnings += 1
        elif str(item['notes']).strip() == "Description to be added.":
             print(f"  ⚠️ [{item_id}] Placeholder note detected: 'Description to be added.'")
             warnings += 1

        # 6. Names Check
        names = item.get('names', {})
        if not names:
             print(f"  ❌ [{item_id}] Missing 'names' object")
             errors += 1
        else:
            # English check
            if 'english' not in names or not names['english'] or len(names['english']) == 0:
                print(f"  ❌ [{item_id}] Missing English name")
                errors += 1
            
            # Indian Languages Check
            for lang in SUPPORTED_LANGUAGES:
                if lang not in names:
                     print(f"  ⚠️ [{item_id}] Missing key for language: {lang}")
                     warnings += 1
                else:
                    lang_data = names[lang]
                    if not isinstance(lang_data, list):
                        print(f"  ❌ [{item_id}] {lang} names must be a list")
                        errors += 1
                    elif len(lang_data) % 2 != 0:
                         if len(lang_data) == 1 and lang_data[0] == "-":
                             pass # Placeholder
                         else:
                             print(f"  ⚠️ [{item_id}] {lang} has odd number of items ({len(lang_data)}). Expected pairs [Native, Romanized].")
                             warnings += 1

    print(f"Summary for {filename}: {errors} Errors, {warnings} Warnings")
    return errors == 0

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--skip-images', action='store_true', help='Skip check for missing image files')
    args = parser.parse_args()

    all_passed = True
    for filename in FILES_TO_CHECK:
        if not check_file(filename, args.skip_images):
            all_passed = False
    
    if all_passed:
        print("\n✅ All checks passed!")
        sys.exit(0)
    else:
        print("\n❌ Integrity checks failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
