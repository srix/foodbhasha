#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CATEGORIES = {
    'fish': 'data/fish-seafood.json',
    'vegetables-fruits': 'data/vegetables-fruits.json',
    'grains': 'data/grains-pulses.json',
    'spices': 'data/spices.json'
};

function generateSitemap() {
    const baseUrl = 'https://foodbhasha.com';
    const today = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>\n`;

    // Add category URLs
    for (const [category, dataFile] of Object.entries(CATEGORIES)) {
        sitemap += `  <url>
    <loc>${baseUrl}/${category}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    }

    // Add individual item URLs
    for (const [category, dataFile] of Object.entries(CATEGORIES)) {
        try {
            const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            data.forEach(item => {
                sitemap += `  <url>
    <loc>${baseUrl}/${category}/${item.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
            });
        } catch (err) {
            console.error(`Error reading ${dataFile}:`, err.message);
        }
    }

    sitemap += '</urlset>\n';

    fs.writeFileSync('sitemap.xml', sitemap);
    console.log(`✅ Generated sitemap with ${sitemap.split('<url>').length - 1} URLs`);
}

generateSitemap();
