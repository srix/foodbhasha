const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const files = ['fish-seafood.json', 'grains-pulses.json', 'spices.json', 'vegetables-fruits.json'];

const languageCounts = {};
const totalItems = {};

files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        totalItems[file] = data.length;

        data.forEach(item => {
            if (item.names) {
                Object.keys(item.names).forEach(lang => {
                    if (!languageCounts[lang]) {
                        languageCounts[lang] = 0;
                    }
                    const names = item.names[lang];
                    // Check if names array exists and has at least one non-empty string, and isn't just a placeholder like "-" or "?"
                    if (Array.isArray(names) && names.length > 0) {
                        const hasValidName = names.some(n => n && n.trim().length > 0 && n !== '-' && n !== '?');
                        if (hasValidName) {
                            languageCounts[lang]++;
                        }
                    }
                });
            }
        });
    } else {
        console.warn(`File not found: ${filePath}`);
    }
});

console.log('Total Items per File:');
console.table(totalItems);

console.log('\nLanguage Availability Counts (across all files):');
// Convert to array for sorting
const sortedCounts = Object.entries(languageCounts)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

console.table(sortedCounts);

// Calculate total items across all files
const grandTotal = Object.values(totalItems).reduce((a, b) => a + b, 0);
console.log(`\nGrand Total Items: ${grandTotal}`);
