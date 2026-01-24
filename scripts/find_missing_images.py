import json
import os

def find_missing():
    files = [
        'src/data/fish-seafood.json',
        'src/data/vegetables-fruits.json', 
        'src/data/grains-pulses.json',
        'src/data/spices.json',
        'src/data/flowers.json'
    ]
    
    total_missing = 0
    
    for json_path in files:
        if not os.path.exists(json_path):
            print(f"File not found: {json_path}")
            continue
            
        print(f"\nScanning {json_path}...")
        with open(json_path, 'r') as f:
            data = json.load(f)
            
        missing = []
        for item in data:
            photo_url = item.get('photo', '')
            
            # Skip if explicit placeholder or empty
            # But usually we want to find items that rely on placeholders too?
            # The user said "check all images exist", implying we want to find real images vs placeholders/missing
            
            if not photo_url:
                missing.append(f"{item['id']} (No photo property)")
                continue

            # Convert URL path to file path
            # /img/foo.webp -> src/img/foo.webp
            if photo_url.startswith('/img/'):
                file_path = os.path.join('src', photo_url.lstrip('/'))
            else:
                # Assuming relative or absolute path, usually starts with /
                file_path = os.path.join('src', photo_url.lstrip('/'))

            if not os.path.exists(file_path):
                 missing.append(f"{item['id']} (Missing: {file_path})")
                
        if missing:
            print(f"Found {len(missing)} items with missing/broken images in {json_path}:")
            for m in missing:
                print(f"- {m}")
            total_missing += len(missing)
        else:
            print(f"All images present for {json_path}")

    if total_missing == 0:
        print("\nSUCCESS: All images exist!")
    else:
        print(f"\nFAILURE: Found {total_missing} missing images total.")

if __name__ == "__main__":
    find_missing()
