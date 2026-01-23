const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('New Items Verification', () => {

    test('Pomelo exists in vegetables-fruits.json', () => {
        const filePath = path.resolve(__dirname, '../src/data/vegetables-fruits.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const item = data.find(i => i.id === 'pomelo');

        expect(item).toBeDefined();
        expect(item.scientificName).toBe('Citrus maxima');
        expect(item.names.kannada).toContain('ಚಕ್ಕೋತ ಹಣ್ಣು');
    });

    test('Jaggery exists in spices.json and NOT in grains-pulses.json', () => {
        // Check Spices
        const spicesPath = path.resolve(__dirname, '../src/data/spices.json');
        const spicesData = JSON.parse(fs.readFileSync(spicesPath, 'utf-8'));
        const jaggeryInSpices = spicesData.find(i => i.id === 'jaggery');

        expect(jaggeryInSpices).toBeDefined();
        expect(jaggeryInSpices.tags).toContain('other');

        // Check Grains (Should be removed)
        const grainsPath = path.resolve(__dirname, '../src/data/grains-pulses.json');
        const grainsData = JSON.parse(fs.readFileSync(grainsPath, 'utf-8'));
        const jaggeryInGrains = grainsData.find(i => i.id === 'jaggery');

        expect(jaggeryInGrains).toBeUndefined();
    });

    test('Salt exists in spices.json', () => {
        const filePath = path.resolve(__dirname, '../src/data/spices.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const item = data.find(i => i.id === 'salt');

        expect(item).toBeDefined();
        expect(item.names.kannada).toContain('ಉಪ್ಪು');
    });

    test('Sugar exists in spices.json', () => {
        const filePath = path.resolve(__dirname, '../src/data/spices.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const item = data.find(i => i.id === 'sugar');

        expect(item).toBeDefined();
        expect(item.names.kannada).toContain('ಸಕ್ಕರೆ');
    });

});
