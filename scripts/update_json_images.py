import json
import os

def update_json_images():
    json_path = 'data/fish-seafood.json'
    
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    ids_to_update = [
        'silver-pomfret', 'rohu', 'catla', 'hilsa', 
        'red-snapper', 'pearl-spot', 'lady-fish', 'indian-salmon', 
        'grey-mullet', 'tilapia', 'barramundi', 'yellowfin-tuna', 
        'barracuda', 'trevally', 'sole-fish', 'milkfish', 
        'squid', 'murrel', 'catfish', 'bombay-duck', 
        'pink-perch', 'clams', 'mussels', 'common-carp', 
        'emperor-fish'
    ]
    
    updated_count = 0
    for fish in data:
        if fish['id'] in ids_to_update:
            new_path = f"img/{fish['id']}.webp"
            # Optional: Check if file exists before updating?
            # if os.path.exists(new_path):
            fish['photo'] = new_path
            updated_count += 1
            
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"Updated {updated_count} entries in {json_path}")

if __name__ == "__main__":
    update_json_images()
