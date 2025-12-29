import json
import os

GRAINS_FILE = 'data/grains-pulses.json'
SPICES_FILE = 'data/spices.json'

SPICE_IDS = {
    'mustard-seeds', 'cumin-seeds', 'coriander-seeds', 'fennel-seeds', 
    'fenugreek-seeds', 'black-pepper', 'cardamom', 'cloves', 'cinnamon', 
    'turmeric', 'dry-red-chili', 'poppy-seeds', 'carom-seeds', 
    'nigella-seeds', 'basil-seeds', 'melon-seeds', 'saffron', 'nutmeg', 
    'mace', 'star-anise', 'bay-leaf', 'dry-ginger', 'black-cardamom', 
    'white-pepper', 'long-pepper', 'stone-flower', 'marathi-moggu', 
    'kabab-chin', 'galangal', 'tamarind', 'kokum', 'asafetida',
    'cashew', 'almond', 'pistachio', 'walnut', 'raisins', 'dates', # Nuts/Dry fruits -> Spices? Or maybe keep notes? Plan said Spices. 
    # Actually, nuts are often kept with spices in Indian context (Masala Dabba usually has spices, but pantry has nuts). 
    # But for "Spices" category, stick to actual spices + aromatics.
    # Plan listed: tamarind, kokum, asafetida.
}

# Extending list based on logic (Aromatics & Spices):
# Seeds that are spices: fenugreek, mustard, cumin, coriander, fennel, carom, nigella, poppy, basil, melon.
# Dry fruits/Nuts might stay in Grains/Pulses (as "seed" or "dry-fruit" tag?) or move? 
# Current 'grains-pulses.json' allowed tags: cereal, pulse, millet. 
# Nuts are currently tagged 'cereal' (mapped from 'grain/seed').
# The user asked for "Separarte category for Spice". I will stick to Spices.
# Nuts will remain in Grains-Pulses but their tag 'cereal' is wrong. 
# I should probably add 'nut' to Grains-Pulses whitelist or move them too?
# User prompt was specific: "separate category for spice". 
# I will move strict Spices.

def main():
    if not os.path.exists(GRAINS_FILE):
        print("Grains file not found")
        return

    with open(GRAINS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    spices = []
    grains = []

    for item in data:
        if item['id'] in SPICE_IDS:
            item['tags'] = ['spice']
            spices.append(item)
        else:
            grains.append(item)

    print(f"Split completed. Spices: {len(spices)}, Grains: {len(grains)}")

    with open(SPICES_FILE, 'w', encoding='utf-8') as f:
        json.dump(spices, f, indent=2, ensure_ascii=False)
    
    with open(GRAINS_FILE, 'w', encoding='utf-8') as f:
        json.dump(grains, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
