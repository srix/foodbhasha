const fs = require('fs');
const path = require('path');

const SUPPORTED_LANGUAGES = [
    "assamese", "bengali", "bodo", "dogri", "gujarati", "hindi", "kannada",
    "kashmiri", "konkani", "maithili", "malayalam", "manipuri", "marathi",
    "nepali", "odia", "punjabi", "sanskrit", "santali", "sindhi", "tamil",
    "telugu", "urdu"
];

const FILES = [
    'data/fish-seafood.json',
    'data/vegetables-fruits.json',
    'data/grains-pulses.json'
];

function normalizeData() {
    FILES.forEach(file => {
        const filePath = path.resolve(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return;
        }

        console.log(`Processing ${file}...`);
        let raw = fs.readFileSync(filePath, 'utf-8');
        let data = JSON.parse(raw);
        let modifiedCount = 0;

        data = data.map(item => {
            let itemModified = false;

            // Ensure names object exists
            if (!item.names) {
                item.names = {};
                itemModified = true;
            }

            SUPPORTED_LANGUAGES.forEach(lang => {
                // If key is missing, or is null, or is empty array
                if (!item.names[lang] || (Array.isArray(item.names[lang]) && item.names[lang].length === 0)) {
                    item.names[lang] = ["-"];
                    itemModified = true;
                }
            });

            if (itemModified) modifiedCount++;
            return item;
        });

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Updated ${modifiedCount} items in ${file}`);
    });
}

normalizeData();
