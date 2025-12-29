import json
import os

DATA_DIR = 'data'

# Map ID -> Note
NOTES_MAP = {
    # Grains & Pulses
    "wheat": "Staple grain used to make Roti, Chapati, and Bread.",
    "maize": "Used for Corn flour, Popcorn, and Makki di Roti.",
    "barley": "Rich in fiber, used in soups, stews, and beverages.",
    "jowar": "Gluten-free grain, used for Roti and porridge.",
    "bajra": "Pearl millet, vital for winters, used for Roti.",
    "masoor-dal": "Red lentils, cooks quickly into a soft dal.",
    "moong-dal": "Split yellow gram, light and easy to digest.",
    "chana-dal": "Split chickpeas, used in curries and snacks.",
    "chickpeas": "Kabuli Chana, used for Chole and Hummus.",
    "black-chickpeas": "Kala Chana, rich in protein, used in curries.",
    "kidney-beans": "Rajma, popular in North Indian curries.",
    "black-eyed-peas": "Lobia, soft texture, used in curries.",
    "dried-green-peas": "Used in curries like Matar Paneer.",
    "soybeans": "High protein legume, used for chunks and milk.",
    "horse-gram": "Hardy legume, used for soup (Ras) and curries.",
    "flax-seeds": "Rich in Omega-3, used in chutneys and powders.",
    "sesame-seeds": "Used in sweets (Til-Gud) and seasonings.",
    "groundnut": "Peanuts, used in Chutneys and snacks.",
    "mustard-seeds": "Essential tempering spice, pungent flavor.",
    "cumin-seeds": "Jeera, key spice for tempering and digestion.",
    "coriander-seeds": "Dhania, dried seeds used in spice blends.",
    "fennel-seeds": "Saunf, digestive and mouth freshener.",
    "fenugreek-seeds": "Methi seeds, bitter earthy flavor.",
    "black-pepper": "King of spices, adds heat and aroma.",
    "cardamom": "Green Cardamom, sweet aromatic spice.",
    "cloves": "Strong, pungent spice used in Garam Masala.",
    "cinnamon": "Sweet woody spice, used in desserts and curries.",
    "turmeric": "Haldi, essential for color and antiseptic properties.",
    "dry-red-chili": "Adds heat and color to dishes.",
    "cashew": "Creamy nut used in rich gravies and sweets.",
    "almond": "Nutrient-rich nut, used in desserts and badam milk.",
    "pistachio": "Used in garnishing sweets and desserts.",
    "walnut": "Brain food, rich in Omega-3.",
    "raisins": "Dried grapes, used in Kheer and desserts.",
    "dates": "Natural sweetener, rich in energy.",
    "sago": "Sabudana, used for Khichdi and Vada.",
    "fox-nuts": "Makhana, puffed lotus seeds, healthy snack.",
    "poha": "Flattened rice, popular breakfast dish.",
    "semolina": "Rava or Sooji, used for Upma and Halwa.",
    "vermicelli": "Semiya, used for Upma and Payasam.",
    "jaggery": "Unrefined cane sugar, traditional sweetener.",
    "tamarind": "Sour pulp used in Sambar and Rasam.",
    "kokum": "Sour fruit rind used in coastal curries.",
    "asafetida": "Hing, strong aroma, digestive aid.",
    "chia-seeds": "Superfood rich in fiber and antioxidants.",
    "sunflower-seeds": "Healthy snack seeds.",
    "pumpkin-seeds": "Rich in magnesium and zinc.",
    "quinoa": "Complete protein grain, gluten-free.",
    "oats": "High fiber cereal, good for breakfast porridge.",
    "buckwheat": "Kuttu, consumed during fasting (Vrat).",
    "brown-rice": "Whole grain rice with bran layer intact.",
    "basmati-rice": "Aromatic long-grain rice for Biryani.",
    "jasmine-rice": "Slightly sticky aromatic rice.",
    "sona-masoori": "Medium-grain rice, popular in South India.",
    "parboiled-rice": "Partially boiled in husk, nutritious.",
    "red-rice": "Rich in antioxidants, staple in Kerala/Konkan.",
    "black-rice": "Forbidden rice, high in anthocyanins.",
    "glutinous-rice": "Sticky rice used in Asian desserts.",
    "puffed-rice": "Murmura, used for Bhel Puri.",
    "idli-rice": "Parboiled rice specifically for Idli batter.",
    "matta-rice": "Kerala red rice, robust flavor.",
    "whole-wheat": "Used for making Atta flour.",
    "broken-wheat": "Dalia, used for porridge and Upma.",
    "maida": "Refined wheat flour for Naan and pastries.",
    "corn-flour": "Starch thickening agent.",
    "rice-flour": "Ground rice for Appam, Idiyappam, and batters.",
    "besan": "Chickpea flour, used for Pakoras and Kadhi.",
    "ragi-flour": "Finger millet flour for Ragi Mudde.",
    "bajra-flour": "Pearl millet flour for Rotla.",
    "jowar-flour": "Sorghum flour, gluten-free option.",
    "sabudana": "Sago pearls, fasting food staple.",
    "soy-chunks": "Meal maker, vegetable meat substitute.",
    "green-gram": "Whole Moong, sprouted or cooked.",
    "black-gram": "Whole Urad, used for Dal Makhani.",
    "moth-bean": "Matki, used in Misal Pav.",
    "lima-beans": "Butter beans, creamy texture.",
    "field-beans": "Avarekai, popular in Karnataka.",
    "double-beans": "Broad beans, used in curries.",
    "pinto-beans": "Speckled beans, creamy when cooked.",
    "white-peas": "Safed Vatana, used for Ragda Patties.",
    "roasted-gram": "Fried gram, used in Chutneys.",
    "poppy-seeds": "Khus Khus, thickens gravies.",
    "carom-seeds": "Ajwain, good for digestion.",
    "nigella-seeds": "Kalonji, onion seeds for flavor.",
    "basil-seeds": "Sabja, cooling seeds for drinks.",
    "melon-seeds": "Magaz, thickens rich gravies.",
    "saffron": "Kesar, most expensive spice, for color/aroma.",
    "nutmeg": "Jaiphal, warm sweet spice.",
    "mace": "Javitri, outer covering of Nutmeg.",
    "star-anise": "Flower-shaped spice with licorice flavor.",
    "bay-leaf": "Tej Patta, aromatic leaf for tempering.",
    "dry-ginger": "Sonth, used in powders and tea.",
    "black-cardamom": "Badi Elaichi, smoky flavor for curries.",
    "white-pepper": "Milder than black pepper, for white sauces.",
    "long-pepper": "Pippali, distinct spicy flavor.",
    "stone-flower": "Kalpasi, lichen used in Chettinad spice.",
    "marathi-moggu": "Kapok buds, used in Bisi Bele Bath.",
    "kabab-chin": "Cubeb pepper/Allspice, aromatic.",
    "galangal": "Thai ginger, citrusy flavor.",
    "arrowroot-flour": "Digestible starch for thickening.",

    # Vegetables (common ones I recall)
    "raw-mango": "Unripe mango, sour, used for pickles.",
    "sundakkai": "Turkey Berry, bitter, good for health.",
    "chayote": "Chow-Chow, mild squash used in Kootu.",
    "chow-chow": "Chayote squash, water-rich vegetable.",
    "knol-khol": "Kohlrabi, turnip-like stem vegetable.",
    "snake-gourd": "Long gourd used in Kootu and Poriyal.",
    "ridge-gourd": "Peerkangai, fiber-rich gourd.",
    "bottle-gourd": "Lauki, cooling water-rich vegetable.",
    "bitter-gourd": "Karela, bitter but medicinal.",
    "ash-gourd": "Winter melon, used in Petha and curries.",
    "ivy-gourd": "Tindora, crunchy vegetable.",
    "drumstick": "Moringa, rich in minerals, used in Sambar.",
    "cluster-beans": "Gavar, distinct flavor bean.",
    "french-beans": "Green beans, common in stir-fries.",
    "broad-beans": "Avarakkai, flat beans with seeds.",
    "yardlong-beans": "Karamani, very long beans.",
    "carrot": "Orange root veg, rich in Vitamin A.",
    "beetroot": "Red root veg, earthy sweet flavor.",
    "radish": "Mooli, pungent root for Parathas.",
    "turnip": "Root vegetable, mild flavor.",
    "sweet-potato": "Shakarkandi, sweet starchy root.",
    "tapioca": "Cassava, starchy tuber.",
    "yam": "Elephant foot yam, starch-rich.",
    "colocasia": "Arbi, taro root, slimy if not cooked well.",
    "ginger": "Root spice, essential base for curries.",
    "garlic": "Pungent bulb, key flavor enhancer.",
    "mint": "Pudina, cooling aromatic herb.",
    "coriander-leaves": "Cilantro, fresh garnish herb.",
    "curry-leaves": "Kadi Patta, essential tempering herb.",
    "fenugreek-leaves": "Methi leaves, bitter-sweet leafy veg.",
    "mustard-greens": "Sarson, spicy leafy green.",
    "amaranth": "Thotakura/Cheera, nutritious spinach.",
    "red-amaranth": "Red leafy vegetable, rich in iron.",
    "cabbage": "Leafy head vegetable, used in stir-fries.",
    "cauliflower": "Gobi, popular flower vegetable.",
    "broccoli": "Green flower veg, rich in vitamins.",
    "capsicum": "Bell pepper, mild spicy crunch.",
    "green-chili": "Fresh chili, provides heat.",
    "cucumber": "Cooling salad vegetable.",
    "pumpkin": "Sweet flesh squash, used in curries.",
    "raw-banana": "Plantain, starchy cooking banana.",
    "banana-flower": "Vazhaipoo, complex to clean, tasty.",
    "banana-stem": "Vazhaithandu, fiber-rich stem.",
    "mushroom": "Edible fungus, umami flavor.",
    "baby-corn": "Young corn, crunchy and sweet.",
    "lettuce": "Salad leaf.",
    "celery": "Aromatic stalk veg.",
    "leek": "Mild onion-like stalk.",
    "zucchini": "Summer squash.",
    "green-peas": "Fresh peas, sweet and tender.",
    "corn": "Sweet corn kernels.",
    "lotus-stem": "Kamal Kakdi, crunchy stem.",
    "water-chestnut": "Singhara, crunchy aquatic vegetable.",
    "bamboo-shoot": "Young bamboo, distinct fermented flavor.",
    "gooseberry": "Amla, very rich in Vitamin C.",
    "lemon": "Acidic citrus, adds sourness.",
    "coconut": "Essential nut/fruit in South Indian cuisine."
}

def update_files():
    files = ['data/fish-seafood.json', 'data/vegetables-fruits.json', 'data/grains-pulses.json']
    updated_count = 0
    
    for filename in files:
        if not os.path.exists(filename): continue
        
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        file_modified = False
        for item in data:
            if item.get('notes') == 'Description to be added.':
                # Try to find a note
                new_note = NOTES_MAP.get(item['id'])
                if not new_note:
                    # fallback to mapping by english name lowercased?
                    eng = item['names']['english'][0].lower().replace(' ', '-')
                    new_note = NOTES_MAP.get(eng)
                
                if new_note:
                    item['notes'] = new_note
                    file_modified = True
                    updated_count += 1
                else:
                    # Generic fallback
                    item['notes'] = f"Common ingredient used in Indian cuisine."
                    file_modified = True
                    updated_count += 1
        
        if file_modified:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                
    print(f"Update Complete. Updated {updated_count} notes.")

if __name__ == "__main__":
    update_files()
