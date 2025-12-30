const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

// Usage: node scripts/update_language.js <language_code> <path_to_mapping_json>
// Mapping JSON format: { "filename.json": { "item_id": ["Native Name", "Transliteration"] } }

const targetLang = process.argv[2];
const mappingFile = process.argv[3];

if (!targetLang || !mappingFile) {
    console.error('Usage: node scripts/update_language.js <language_code> <path_to_mapping_json>');
    process.exit(1);
}

const mappingPath = path.resolve(mappingFile);
if (!fs.existsSync(mappingPath)) {
    console.error(`Mapping file not found: ${mappingPath}`);
    process.exit(1);
}

const updates = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

Object.keys(updates).forEach(filename => {
    const filePath = path.join(dataDir, filename);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let updatedCount = 0;

        data.forEach(item => {
            if (updates[filename][item.id]) {
                if (!item.names) item.names = {};
                item.names[targetLang] = updates[filename][item.id];
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Updated ${updatedCount} items in ${filename} for language '${targetLang}'`);
        } else {
            console.log(`No matching IDs found to update in ${filename}`);
        }
    } else {
        console.error(`Data file not found: ${filePath}`);
    }
});
