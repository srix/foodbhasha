import json
import os

def update_json_images():
    files = [
        'data/fish-seafood.json',
        'data/vegetables-fruits.json', 
        'data/grains-pulses.json',
        'data/spices.json'
    ]
    
    for json_path in files:
        if not os.path.exists(json_path):
            continue
            
        print(f"Checking {json_path}...")
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        updated_count = 0
        for item in data:
            # Check if an image with the item's ID exists in img/
            image_name = f"{item['id']}.webp"
            image_path = f"img/{image_name}"
            
            if os.path.exists(image_path):
                # Only update if it's different
                if item.get('photo') != image_path:
                    item['photo'] = image_path
                    updated_count += 1
        
        if updated_count > 0:
            with open(json_path, 'w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Updated {updated_count} entries in {json_path}")
        else:
            print(f"No changes in {json_path}")

if __name__ == "__main__":
    update_json_images()
