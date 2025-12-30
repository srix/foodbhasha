const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Configuration Integrity', () => {

    test('Verify package.json build scripts', async () => {
        const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        // Verify android:build generates both APK (assembleDebug) and AAB (bundleRelease)
        const androidBuildScript = packageJson.scripts['android:build'];
        expect(androidBuildScript, 'android:build script missing').toBeDefined();

        expect(androidBuildScript).toContain('assembleDebug');
        expect(androidBuildScript).toContain('bundleRelease');
    });

});
