const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const files = ['fish-seafood.json', 'grains-pulses.json', 'spices.json', 'vegetables-fruits.json'];
const targetLang = process.argv[2] || 'gujarati';

console.log(`Searching for missing '${targetLang}' entries...`);

let missingCount = 0;

files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        data.forEach(item => {
            let isMissing = true;
            if (item.names && item.names[targetLang]) {
                const names = item.names[targetLang];
                if (Array.isArray(names) && names.length > 0) {
                    const hasValidName = names.some(n => n && n.trim().length > 0 && n !== '-' && n !== '?');
                    if (hasValidName) {
                        isMissing = false;
                    }
                }
            }

            if (isMissing) {
                missingCount++;
                // Use English name or ID as identifier
                const identifier = (item.names && item.names.english && item.names.english[0]) || item.id;
                console.log(`[${file}] Missing: ${identifier} (${item.id})`);
            }
        });
    }
});

console.log(`\nTotal items missing ${targetLang}: ${missingCount}`);
