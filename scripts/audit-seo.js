const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const DIST_DIR = path.join(__dirname, '../dist');
const REPORT_PATH = path.join(__dirname, '../seo-audit-report.json');

async function audit() {
    console.log('🕵️  Starting SEO Audit on dist/ ...');

    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ dist/ directory not found. Run "npm run build" first.');
        process.exit(1);
    }

    const errors = [];
    const scanned = [];

    // Recursive file walker
    function walk(dir) {
        fs.readdirSync(dir).forEach(file => {
            const filepath = path.join(dir, file);
            if (fs.statSync(filepath).isDirectory()) {
                walk(filepath);
            } else if (file.endsWith('.html')) {
                checkFile(filepath);
            }
        });
    }

    function checkFile(filepath) {
        const relativePath = path.relative(DIST_DIR, filepath);
        // Skip 404 and specific files if needed
        if (relativePath === '404.html') return;

        const content = fs.readFileSync(filepath, 'utf-8');
        const dom = new JSDOM(content);
        const doc = dom.window.document;

        const title = doc.querySelector('title')?.textContent;
        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content');
        const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
        const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const h1 = doc.querySelector('h1')?.textContent;

        const fileResult = {
            file: relativePath,
            title: title || '[MISSING]',
            description: description ? '✅ Present' : '[MISSING]',
            canonical: canonical || '[MISSING]',
            h1: h1 ? '✅ Present' : '[MISSING]'
        };

        scanned.push(fileResult);

        // Validations
        if (!title || title.length < 5) {
            errors.push(`[${relativePath}] Title is missing or too short: "${title}"`);
        }
        if (!description || description.length < 10) {
            errors.push(`[${relativePath}] Meta Description is missing or too short.`);
        }
        if (!canonical) {
            errors.push(`[${relativePath}] Canonical tag is missing.`);
        } else if (!canonical.startsWith('https://foodbhasha.com/')) {
            errors.push(`[${relativePath}] Canonical URL seems invalid: "${canonical}"`);
        }

        // Check for specific template placeholders that shouldn't exist
        if (content.includes('SEO Fallback: Plain text content')) {
            errors.push(`[${relativePath}] Contains generic SEO fallback text instead of unique content.`);
        }
    }

    try {
        walk(DIST_DIR);
    } catch (e) {
        console.error('Error scanning files:', e);
        errors.push('Fatal error during scan: ' + e.message);
    }

    // Report
    console.log(`✅ Scanned ${scanned.length} HTML files.`);

    if (errors.length > 0) {
        console.error('\n❌ SEO Audit FAILED with the following errors:');
        errors.forEach(e => console.error(` - ${e}`));
        console.log('\nAudit Report saved to seo-audit-report.json');
        fs.writeFileSync(REPORT_PATH, JSON.stringify({ status: 'failed', errors, details: scanned }, null, 2));
        process.exit(1);
    } else {
        console.log('\n✨ SEO Audit PASSED! All pages have Titles, Descriptions, and Canonicals.');
        process.exit(0);
    }
}

audit();
