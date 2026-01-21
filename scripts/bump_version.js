const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '../android/app/build.gradle');
const versionPath = path.join(__dirname, '../src/version.json');
const packageJsonPath = path.join(__dirname, '../package.json');

try {
    // 1. Read the Manual Version Source
    if (!fs.existsSync(versionPath)) {
        console.error('❌ src/version.json not found!');
        process.exit(1);
    }
    const versionData = require(versionPath);
    const targetVersionName = versionData.version;
    console.log(`ℹ️  Syncing version ${targetVersionName} from src/version.json...`);

    // 2. Update Android build.gradle
    let gradleContent = fs.readFileSync(gradlePath, 'utf8');

    // Auto-increment versionCode (Required for Play Store)
    const versionCodeRegex = /versionCode\s+(\d+)/;
    const match = gradleContent.match(versionCodeRegex);
    let newVersionCode = 1;

    if (match) {
        const currentVersionCode = parseInt(match[1], 10);
        newVersionCode = currentVersionCode + 1;
        gradleContent = gradleContent.replace(versionCodeRegex, `versionCode ${newVersionCode}`);
        console.log(`✅ Bumped Android versionCode to ${newVersionCode}`);
    }

    // Iterate versionName to match Manual Source
    const versionNameRegex = /versionName\s+"([^"]+)"/;
    gradleContent = gradleContent.replace(versionNameRegex, `versionName "${targetVersionName}"`);
    console.log(`✅ Synced Android versionName to ${targetVersionName}`);

    fs.writeFileSync(gradlePath, gradleContent, 'utf8');

    // 3. Update package.json (Keep it in sync mainly for reference)
    const packageJson = require(packageJsonPath);
    if (packageJson.version !== targetVersionName) {
        packageJson.version = targetVersionName;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`✅ Synced package.json version to ${targetVersionName}`);
    }

    // 4. Update index.html Footer (Source file)
    // This is optional since generate-static.js handles it for the BUILD, 
    // but useful for dev mode or raw file inspection.
    const indexHtmlPath = path.join(__dirname, '../src/index.html');
    let indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

    // Force 2026 as per request
    const newFooterText = `© 2026 FoodBhasha • v${targetVersionName}`;
    const footerRegex = /<footer class="app-footer">\s*<p>.*?<\/p>\s*<\/footer>/s;

    if (footerRegex.test(indexContent)) {
        const newFooterBlock = `<footer class="app-footer">\n        <p>${newFooterText}</p>\n    </footer>`;
        indexContent = indexContent.replace(footerRegex, newFooterBlock);
        fs.writeFileSync(indexHtmlPath, indexContent, 'utf8');
        console.log(`✅ Synced src/index.html footer to ${targetVersionName}`);
    }

    console.log('🎉 Version Sync Complete!');

} catch (err) {
    console.error('❌ Error syncing version:', err);
    process.exit(1);
}
