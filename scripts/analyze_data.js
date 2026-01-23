const fs = require('fs');
const path = require('path');

const FILES = [
    'src/data/fish-seafood.json',
    'src/data/vegetables-fruits.json',
    'src/data/grains-pulses.json',
    'src/data/spices.json'
];

const LANGUAGES = [
    "assamese", "bengali", "bodo", "dogri", "gujarati", "hindi", "kannada",
    "kashmiri", "konkani", "maithili", "malayalam", "manipuri", "marathi",
    "nepali", "odia", "punjabi", "sanskrit", "santali", "sindhi", "tamil",
    "telugu", "urdu"
];

function analyze() {
    let totalItems = 0;
    let totalMissing = 0;
    const globalStats = {};
    LANGUAGES.forEach(l => globalStats[l] = { missing: 0, total: 0 });

    console.log('# Data Completeness Report\n');

    FILES.forEach(file => {
        const filePath = path.resolve(__dirname, '..', file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const category = path.basename(file, '.json');

        console.log(`## ${category} (${data.length} items)`);

        let fileMissingCount = 0;

        data.forEach(item => {
            totalItems++;
            const missingLangs = [];

            LANGUAGES.forEach(lang => {
                globalStats[lang].total++;
                // Check if key exists and has content (not just ["-", "-"])
                if (!item.names[lang] || item.names[lang].length === 0 || (item.names[lang].length === 1 && item.names[lang][0] === '-')) {
                    missingLangs.push(lang);
                    globalStats[lang].missing++;
                } else if (item.names[lang].length === 2 && item.names[lang][0] === '-' && item.names[lang][1] === '-') {
                    missingLangs.push(lang);
                    globalStats[lang].missing++;
                }
            });

            if (missingLangs.length > 0) {
                fileMissingCount++;
                // console.log(`- **${item.names.english[0]}** (${item.id}): Missing ${missingLangs.length} languages (${missingLangs.join(', ')})`);
            }
        });

        const coverage = ((data.length * LANGUAGES.length - data.reduce((acc, item) => {
            return acc + LANGUAGES.filter(lang => {
                if (!item.names[lang] || (item.names[lang].length === 1 && item.names[lang][0] === '-')) return true;
                if (item.names[lang].length === 2 && item.names[lang][0] === '-' && item.names[lang][1] === '-') return true;
                return false;
            }).length;
        }, 0)) / (data.length * LANGUAGES.length) * 100).toFixed(1);

        console.log(`**Coverage:** ${coverage}%`);
        console.log(`Items with at least one missing language: ${fileMissingCount}/${data.length}\n`);
    });

    console.log('## Language Coverage Stats');
    console.log('| Language | Missing Items | Coverage % |');
    console.log('| :--- | :--- | :--- |');

    // Sort by coverage ascending
    const sortedStats = Object.entries(globalStats).sort(([, a], [, b]) => {
        const covA = (a.total - a.missing) / a.total;
        const covB = (b.total - b.missing) / b.total;
        return covA - covB;
    });

    sortedStats.forEach(([lang, stats]) => {
        const percentage = ((stats.total - stats.missing) / stats.total * 100).toFixed(1);
        console.log(`| ${lang} | ${stats.missing}/${stats.total} | ${percentage}% |`);
    });
}

analyze();
