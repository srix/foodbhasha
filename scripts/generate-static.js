const fs = require('fs');
const path = require('path');

// Configuration
const DIST_DIR = path.join(__dirname, '../dist');
const DATA_DIR = path.join(__dirname, '../src/data');
const TEMPLATE_PATH = path.join(__dirname, '../src/index.html');

const CATEGORIES = {
    'vegetables-fruits': 'vegetables-fruits.json',
    'grains': 'grains-pulses.json',
    'spices': 'spices.json',
    'fish': 'fish-seafood.json'
};

const CATEGORY_LABELS = {
    'fish': 'Fish & Seafood',
    'vegetables-fruits': 'Vegetables & Fruits',
    'grains': 'Grains & Pulses',
    'spices': 'Spices'
};

// Helper to ensure directory exists
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Helper to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Main Generator
async function generate() {
    console.log('🚀 Starting Static Site Generation...');

    // 1. Read Template
    let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

    // 2. Setup Dist
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
    ensureDir(DIST_DIR);

    // 3. Copy Assets
    console.log('📂 Copying static assets...');
    const copyRecursive = (src, dest) => {
        if (fs.statSync(src).isDirectory()) {
            ensureDir(dest);
            fs.readdirSync(src).forEach(child => {
                copyRecursive(path.join(src, child), path.join(dest, child));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    };

    // explicit list of what to copy to avoid copying node_modules if present in root (rare but possible) or .git
    ['assets', 'data', 'img', 'style.css', 'app.js', 'manifest.json', 'robots.txt', 'sitemap.xml', 'ads.txt', '404.html'].forEach(item => {
        const srcPath = path.join(__dirname, '../src', item);
        if (fs.existsSync(srcPath)) {
            copyRecursive(srcPath, path.join(DIST_DIR, item));
        }
    });

    // 4. Generate Home Page
    console.log('🏠 Generating Homepage...');
    // The default template is basically the homepage, but let's ensure canonical is right
    const homeHtml = injectSEO(template, {
        title: 'FoodBhasha - Indian Food Translator | Fish, Veg, Grains & Spices',
        description: 'Instantly identify and translate Indian food ingredients. Detailed glossary for Fish, Vegetables, Fruits, Grains, and Spices across 22 languages including Tamil, Hindi, Malayalam, and Kannada.',
        url: 'https://foodbhasha.com/',
        image: 'https://foodbhasha.com/assets/graphics/logo.webp',
        content: '' // Homepage loads generic content dynamically or we could pre-render a "Featured" list. Let's stick to base template for now.
    });
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homeHtml);


    // 5. Generate Category & Item Pages
    for (const [catKey, filename] of Object.entries(CATEGORIES)) {
        console.log(`📦 Processing Category: ${catKey}`);

        const dataPath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(dataPath)) {
            console.warn(`⚠️ Warning: Data file not found for ${catKey}: ${filename}`);
            continue;
        }

        const items = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        const catLabel = CATEGORY_LABELS[catKey];

        // Generate Category Index (e.g., /fish/index.html)
        const catDir = path.join(DIST_DIR, catKey);
        ensureDir(catDir);

        const catDesc = `Comprehensive ${catLabel.toLowerCase()} glossary in 22 Indian languages. Identify and translate names of Fish, Vegetables, Fruits, Grains, and Spices with photos.`;
        const catHtml = injectSEO(template, {
            title: `${catLabel} | Indian Ingredient Lexicon | FoodBhasha`,
            description: catDesc,
            url: `https://foodbhasha.com/${catKey}/`,
            image: 'https://foodbhasha.com/assets/graphics/logo.webp',
            // Pre-render list of items (simple text list for SEO)
            content: generateCategoryContent(catLabel, items, catKey)
        });
        fs.writeFileSync(path.join(catDir, 'index.html'), catHtml);

        // Generate Item Pages (e.g., /fish/pomfret/index.html)
        items.forEach(item => {
            const itemDir = path.join(catDir, item.id);
            ensureDir(itemDir);

            const englishName = item.names.english[0];
            const scientificName = item.scientificName || '';
            const regionalNames = [
                (item.names.tamil || [])[0],
                (item.names.hindi || [])[0],
                (item.names.malayalam || [])[0]
            ].filter(Boolean).join(', ');

            const itemTitle = `${englishName} | ${catLabel} | FoodBhasha`;
            const itemDesc = `${englishName} (${scientificName}). Regional names: ${regionalNames}. Multilingual ${catLabel} glossary in 22 Indian languages including Tamil, Hindi, Malayalam, and Kannada.`;

            // Generate rich pre-rendered content card
            const itemContent = generateItemContent(item, catKey);

            const itemHtml = injectSEO(template, {
                title: itemTitle,
                description: itemDesc,
                url: `https://foodbhasha.com/${catKey}/${item.id}`, // No trailing slash for items preferred, or consistent? Google prefers consistency. Let's use no trailing slash usually for files, but since it is a dir/index.html, it effectively has one. Let's normalize to no trailing slash in canonical if possible, or yes. Strict rules usually say: folders get trailing slashes.
                // Re-reading sitemap: https://foodbhasha.com/fish/milk-shark (no slash in some, slash in others from user request... wait.
                // User's Search Console report shows: https://foodbhasha.com/fish/milk-shark (no slash) AND https://foodbhasha.com/fish/milk-shark/ (with slash)
                // We should enforce ONE. Directory based hosting usually forces trailing slash. 
                // Let's stick to Trailing Slash for folders as it is standard behavior for "index.html" based static sites.
                // So canonical should be .../id/
                url: `https://foodbhasha.com/${catKey}/${item.id}/`,
                image: item.photo ? `https://foodbhasha.com${item.photo}` : 'https://foodbhasha.com/assets/graphics/logo.webp',
                content: itemContent,
                schema: generateItemSchema(item, catKey)
            });

            fs.writeFileSync(path.join(itemDir, 'index.html'), itemHtml);
        });
    }

    console.log('✅ Static Generation Complete!');
}

function injectSEO(html, metadata) {
    let output = html;

    // Replace Title
    output = output.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`);

    // Replace Description
    output = output.replace(/<meta name="description"[\s\S]*?>/, `<meta name="description" content="${escapeHtml(metadata.description)}">`);

    // Replace Canonical
    // If exists, replace, else inject (Template has one)
    // Actually template has <!-- Canonical & Favicon -->... let's regex generic
    if (output.includes('<link rel="canonical"')) {
        output = output.replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${metadata.url}">`);
    } else {
        output = output.replace('</head>', `<link rel="canonical" href="${metadata.url}">\n</head>`);
    }

    // Replace OG Tags
    output = output.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${escapeHtml(metadata.title)}">`);
    output = output.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${escapeHtml(metadata.description)}">`);
    output = output.replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${metadata.url}">`);
    output = output.replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${metadata.image}">`);

    // Replace Twitter Tags
    output = output.replace(/<meta property="twitter:title" content=".*?">/, `<meta property="twitter:title" content="${escapeHtml(metadata.title)}">`);
    output = output.replace(/<meta property="twitter:description" content=".*?">/, `<meta property="twitter:description" content="${escapeHtml(metadata.description)}">`);
    output = output.replace(/<meta property="twitter:url" content=".*?">/, `<meta property="twitter:url" content="${metadata.url}">`);
    output = output.replace(/<meta property="twitter:image" content=".*?">/, `<meta property="twitter:image" content="${metadata.image}">`);

    // Inject Schema if present
    if (metadata.schema) {
        output = output.replace('</head>', `<script type="application/ld+json">${JSON.stringify(metadata.schema)}</script>\n</head>`);
    }

    // Inject Content (into card-view or a special SEO container)
    // The template has: <div id="card-view" class="view-container">...</div>
    // We want to inject the pre-rendered content there so it is visible immediately without JS.
    // AND we also have <section class="seo-fallback"> which we should REMOVE or EMPTY, as we are now injecting real content.

    // 1. Remove old fallback (including the comment)
    output = output.replace(/<!-- SEO Fallback[\s\S]*?<\/section>/, '');

    // 2. Inject into Card View
    // This allows "Hydration" style behavior if we are careful, or at least "Content First".
    // Since app.js overwrites cardView on load, the user will see this, then JS takes over. Perfect.
    if (metadata.content) {
        output = output.replace('<div id="card-view" class="view-container">', `<div id="card-view" class="view-container">\n${metadata.content}`);
    }

    // 3. Update Footer Version
    const versionPath = path.join(__dirname, '../src/version.json');
    const packageJsonPath = path.join(__dirname, '../package.json');
    let version = '1.0';

    if (fs.existsSync(versionPath)) {
        version = require(versionPath).version;

        // Fix: Sync package.json immediately if it is stale
        // This ensures the NEXT 'npm run' shows the correct version.
        if (fs.existsSync(packageJsonPath)) {
            const pkg = require(packageJsonPath);
            if (pkg.version !== version) {
                pkg.version = version;
                fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
                console.log(`ℹ️  Synced package.json to ${version}`);
            }
        }
    }
    // Regex matches "v1.19" or "v1.0.0" etc in the footer
    output = output.replace(/v\d+\.\d+(\.\d+)?/, `v${version}`);

    return output;
}


function generateCategoryContent(label, items, catKey) {
    // Generate a simple list of links for the category page
    // This is great for crawlability
    return `
    <div class="static-category-list">
        <h1>${label}</h1>
        <ul class="seo-list">
            ${items.map(item => `
                <li>
                    <a href="/${catKey}/${item.id}/">
                        <strong>${escapeHtml(item.names.english.join(', '))}</strong>
                        ${renderNativeNamesSummary(item)}
                    </a>
                </li>
            `).join('')}
        </ul>
    </div>`;
}

function renderNativeNamesSummary(item) {
    const langs = ['tamil', 'hindi', 'malayalam', 'kannada'];
    const summary = [];
    langs.forEach(l => {
        if (item.names[l] && item.names[l].length) summary.push(`${l}: ${item.names[l][0]}`);
    });
    return summary.length ? `<span>(${escapeHtml(summary.join(' | '))})</span>` : '';
}

function generateItemContent(item, catKey) {
    // Replicate the Card HTML structure roughly so it looks decent without CSS/JS or at least provides raw data
    // We can use the existing CSS classes since we copied style.css

    // We need to support the partial rendering logic
    // Simplified version of app.js createCardElement

    const primaryLangs = ["tamil", "kannada", "telugu", "hindi"];
    const allLangs = Object.keys(item.names).filter(k => k !== 'english' && item.names[k] && item.names[k].length > 0);
    const otherLangs = allLangs.filter(l => !primaryLangs.includes(l)); // Filter out primary

    const renderGrid = (langs) => langs.map(lang => {
        if (!item.names[lang] || !item.names[lang].length) return '';
        const label = lang.charAt(0).toUpperCase() + lang.slice(1);
        return `
            <div class="lang-group">
                <span class="lang-label">${label}</span>
                <span class="lang-value">${item.names[lang].join(' / ')}</span>
            </div>`;
    }).join('');

    return `
    <div class="item-card static-card">
        <div class="item-header">
            ${item.photo ? `<img src="${item.photo}" alt="${escapeHtml(item.names.english[0])}" class="item-thumbnail" width="80" height="80">` : ''}
            <div class="item-title">
                <h3>${escapeHtml(item.names.english.join(' / '))}</h3>
                <div class="scientific-name">${escapeHtml(item.scientificName || '')}</div>
                <!-- Badges omitted for SSG simplicity or could be added if critical -->
            </div>
        </div>
        <div class="item-names-grid">
            ${renderGrid(allLangs.filter(l => primaryLangs.includes(l)))}
        </div>
        ${otherLangs.length > 0 ? `
        <details class="more-langs" open> <!-- Open by default for SEO crawler visibility, or closed? OPEN is safer for indexing content inside details -->
            <summary>Show all languages</summary>
            <div class="item-names-grid dense">
                ${renderGrid(otherLangs)}
            </div>
        </details>` : ''}
        ${item.notes ? `<div class="item-notes">💡 ${escapeHtml(item.notes)}</div>` : ''}
    </div>`;
}

function generateItemSchema(item, catKey) {
    return {
        "@context": "https://schema.org",
        "@type": "ItemPage",
        "name": item.names.english[0],
        "image": item.photo ? `https://foodbhasha.com${item.photo}` : undefined,
        "description": `Translation of ${item.names.english[0]} in Indian languages.`,
        "mainEntity": {
            "@type": "DefinedTerm",
            "name": item.names.english[0],
            "termCode": item.id,
            "inDefinedTermSet": `https://foodbhasha.com/${catKey}/`
        }
    };
}

generate();
