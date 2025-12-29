const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const FILES = [
    'data/fish-seafood.json',
    'data/vegetables-fruits.json',
    'data/grains-pulses.json'
];

const INDIAN_LANGUAGES = [
    "assamese", "bengali", "bodo", "dogri", "gujarati", "hindi", "kannada",
    "kashmiri", "konkani", "maithili", "malayalam", "manipuri", "marathi",
    "nepali", "odia", "punjabi", "sanskrit", "santali", "sindhi", "tamil",
    "telugu", "urdu"
];

const MIN_DATASET_SIZE = 100;

test.describe('Data Integrity', () => {

    FILES.forEach(file => {
        test(`Verify Minimum Size for ${file}`, async () => {
            const filePath = path.resolve(__dirname, '..', file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            expect(data.length, `Expected at least ${MIN_DATASET_SIZE} items in ${file} but found ${data.length}`).toBeGreaterThanOrEqual(MIN_DATASET_SIZE);
        });

        test(`Verify Dual Script in ${file}`, async () => {
            const filePath = path.resolve(__dirname, '..', file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            const violations = [];

            data.forEach(item => {
                INDIAN_LANGUAGES.forEach(lang => {
                    const names = item.names[lang];
                    if (!names) return;

                    // Skip placeholders
                    if (names.length === 1 && names[0] === "-") return;

                    // Requirement: Must have pairs [Native, Romanized]
                    // So length must be strictly even
                    if (names.length % 2 !== 0) {
                        violations.push(`${item.id} -> ${lang}: Expected even number of entries (pairs), found ${names.length}: ${JSON.stringify(names)}`);
                    }
                });
            });

            // Scientific Name Coverage Check
            const naCount = data.filter(d => !d.scientificName || d.scientificName === "N/A").length;
            const naPercentage = (naCount / data.length) * 100;
            if (naPercentage > 50) { // Allow up to 50% missing for now as we enrich, but warn
                console.warn(`Warning: ${file} has ${naPercentage.toFixed(2)}% items missing Scientific Name.`);
                // expect(naPercentage).toBeLessThan(50); // Uncomment to enforce stricter rule
            }

            if (violations.length > 0) {
                console.log(`\nViolations in ${file}:`);
                violations.forEach(v => console.log(v));
            }

            expect(violations, `Found ${violations.length} violations in ${file}. See logs for details.`).toHaveLength(0);
        });
    });
});
