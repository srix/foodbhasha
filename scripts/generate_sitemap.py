import json
from datetime import date

def generate_sitemap():
    today = str(date.today())
    
    # Start sitemap
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>']
    sitemap.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    # Add main pages
    sitemap.append('  <url>')
    sitemap.append('    <loc>https://foodbhasha.com/</loc>')
    sitemap.append(f'    <lastmod>{today}</lastmod>')
    sitemap.append('    <changefreq>weekly</changefreq>')
    sitemap.append('    <priority>1.0</priority>')
    sitemap.append('  </url>')

    # Category pages
    categories = ['fish', 'vegetables-fruits', 'grains', 'spices', 'flowers']
    for category in categories:
        sitemap.append('  <url>')
        sitemap.append(f'    <loc>https://foodbhasha.com/{category}/</loc>')
        sitemap.append(f'    <lastmod>{today}</lastmod>')
        sitemap.append('    <changefreq>weekly</changefreq>')
        sitemap.append('    <priority>0.8</priority>')
        sitemap.append('  </url>')
    
    # Load data files and generate item URLs
    data_files = [
        ('src/data/fish-seafood.json', 'fish'),
        ('src/data/vegetables-fruits.json', 'vegetables-fruits'),
        ('src/data/grains-pulses.json', 'grains'),
        ('src/data/spices.json', 'spices'),
        ('src/data/flowers.json', 'flowers')
    ]
    
    for file_path, category in data_files:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            for item in data:
                item_id = item['id']
                sitemap.append('  <url>')
                sitemap.append(f'    <loc>https://foodbhasha.com/{category}/{item_id}/</loc>')
                sitemap.append(f'    <lastmod>{today}</lastmod>')
                sitemap.append('    <changefreq>monthly</changefreq>')
                sitemap.append('    <priority>0.6</priority>')
                sitemap.append('  </url>')
        except FileNotFoundError:
            print(f"Warning: {file_path} not found, skipping")
    
    sitemap.append('</urlset>')

    # Write to src directory (will be copied to dist during build)
    with open('src/sitemap.xml', 'w') as f:
        f.write('\n'.join(sitemap))

    print(f"Sitemap generated successfully with {len([line for line in sitemap if '<loc>' in line])} URLs")

if __name__ == "__main__":
    generate_sitemap()
