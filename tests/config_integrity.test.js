const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Configuration Integrity', () => {

    test('Verify package.json build scripts', async () => {
        const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        // Verify android:build run version bump script AND generates both APK (assembleDebug) and AAB (bundleRelease)
        const androidBuildScript = packageJson.scripts['android:build'];
        expect(androidBuildScript, 'android:build script missing').toBeDefined();

        expect(androidBuildScript).toContain('node scripts/bump_version.js');
        expect(androidBuildScript).toContain('assembleDebug');
        expect(androidBuildScript).toContain('bundleRelease');
    });

    test('Verify Capacitor configuration', async () => {
        const configPath = path.resolve(__dirname, '..', 'capacitor.config.json');
        expect(fs.existsSync(configPath), 'capacitor.config.json missing').toBe(true);

        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        expect(config.appId).toBe('com.foodbhasha.app');
        expect(config.appName).toBe('FoodBhasha');
        expect(config.webDir).toBe('www');
    });

    test('Verify Android build.gradle integrity', async () => {
        const gradlePath = path.resolve(__dirname, '..', 'android/app/build.gradle');
        // It might not exist if user hasn't run 'npx cap add android' but in this project it should
        expect(fs.existsSync(gradlePath), 'android/app/build.gradle missing').toBe(true);

        const content = fs.readFileSync(gradlePath, 'utf-8');
        expect(content).toContain('com.foodbhasha.app');
        expect(content).toMatch(/versionCode\s+\d+/);
        expect(content).toMatch(/versionName\s+"[^"]+"/);
    });

    test('Verify version bump script exists', async () => {
        const scriptPath = path.resolve(__dirname, '..', 'scripts/bump_version.js');
        expect(fs.existsSync(scriptPath), 'scripts/bump_version.js missing').toBe(true);
    });

});
