import json
import os

def find_missing():
    files = [
        'data/fish-seafood.json',
        'data/vegetables-fruits.json', 
        'data/grains-pulses.json'
    ]
    
    for json_path in files:
        if not os.path.exists(json_path):
            continue
            
        print(f"\nScanning {json_path}...")
        with open(json_path, 'r') as f:
            data = json.load(f)
            
        missing = []
        for item in data:
            photo_path = item.get('photo', '')
            # Check if placeholder or file missing
            if not photo_path or 'placeholder' in photo_path or not os.path.exists(photo_path):
                # Check if we already have a generated image in img/ that matches id
                if not os.path.exists(f"img/{item['id']}.webp"):
                     missing.append(item['id'])
                
        print(f"Found {len(missing)} items needing images in {json_path}:")
        # Print first 5 and count
        for m in missing[:5]:
            print(f"- {m}")
        if len(missing) > 5:
            print(f"... and {len(missing)-5} more")

if __name__ == "__main__":
    find_missing()
