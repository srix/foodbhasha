
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cardView = document.getElementById('card-view');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    const resultCount = document.getElementById('result-count');
    const filterChipsContainer = document.getElementById('filter-chips');

    // Language Controls
    const btnCustomizeCols = document.getElementById('btn-customize-cols');
    const colDialog = document.getElementById('column-selector-dialog');
    const colCheckboxes = document.getElementById('column-checkboxes');
    const btnCloseCols = document.getElementById('btn-close-cols');

    // State
    let searchTimeout;

    // Analytics Helper
    function trackEvent(eventName, params = {}) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
    }

    // Config
    const SUPPORTED_LANGUAGES = [
        "assamese", "bengali", "bodo", "dogri", "gujarati", "hindi", "kannada",
        "kashmiri", "konkani", "maithili", "malayalam", "manipuri", "marathi",
        "nepali", "odia", "punjabi", "sanskrit", "santali", "sindhi", "tamil",
        "telugu", "urdu"
    ];

    const LANGUAGE_DISPLAY_NAMES = {
        "assamese": "অসমীয়া / Assamese",
        "bengali": "বাংলা / Bengali",
        "bodo": "बोडो / Bodo",
        "dogri": "डोगरी / Dogri",
        "gujarati": "ગુજરાતી / Gujarati",
        "hindi": "हिंदी / Hindi",
        "kannada": "ಕನ್ನಡ / Kannada",
        "kashmiri": "कॉशुर / Kashmiri",
        "konkani": "कोंकणी / Konkani",
        "maithili": "मैथिली / Maithili",
        "malayalam": "മലയാളം / Malayalam",
        "manipuri": "মৈতৈলোন্ / Manipuri",
        "marathi": "मराठी / Marathi",
        "nepali": "नेपाली / Nepali",
        "odia": "ଓଡ଼ିଆ / Odia",
        "punjabi": "ਪੰਜਾਬੀ / Punjabi",
        "sanskrit": "संस्कृत / Sanskrit",
        "santali": "ᱥᱟᱱᱛᱟᱲᱤ / Santali",
        "sindhi": "سنڌي / Sindhi",
        "tamil": "தமிழ் / Tamil",
        "telugu": "తెలుగు / Telugu",
        "urdu": "اردو / Urdu"
    };

    const DEFAULT_CARD_LANGUAGES = ["tamil", "kannada", "telugu", "hindi"];

    // Category Config
    const CATEGORIES = {
        'fish': 'data/fish.json',
        'vegetables': 'data/vegetables.json',
        'grains': 'data/grains.json'
    };

    // State
    let activeCardLanguages = JSON.parse(localStorage.getItem('fishCardLanguages')) || DEFAULT_CARD_LANGUAGES;
    let currentCategory = 'fish';
    let appData = [];
    let activeFilters = new Set();

    // Lazy Load State
    const BATCH_SIZE = 20;
    let currentFilteredData = [];
    let renderedCount = 0;
    let loadMoreObserver;

    // Initialize
    init();

    async function init() {
        // Load initial category
        await loadCategory(currentCategory);

        // Category Navigation (Tabs)
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                if (category !== currentCategory) {
                    // Update UI
                    tabButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Reset Filter
                    activeFilters.clear();

                    // Load Data
                    loadCategory(category);
                }
            });
        });

        // Event Listeners
        searchInput.addEventListener('input', handleSearch);

        btnCustomizeCols.addEventListener('click', () => {
            colDialog.hidden = !colDialog.hidden;
            btnCustomizeCols.setAttribute('aria-expanded', String(!colDialog.hidden));
            if (!colDialog.hidden) {
                renderColumnSelector();
            }
        });

        btnCloseCols.addEventListener('click', () => {
            colDialog.hidden = true;
            btnCustomizeCols.setAttribute('aria-expanded', 'false');
        });
    }

    async function loadCategory(category) {
        currentCategory = category;
        cardView.innerHTML = '<p class="loading">Loading...</p>';

        try {
            const response = await fetch(CATEGORIES[category]);
            appData = await response.json();

            generateFilters(appData);
            renderApp(appData);

            trackEvent('view_category', { category: category });
        } catch (error) {
            console.error(`Failed to load ${category} data:`, error);
            cardView.innerHTML = '<p class="error">Failed to load data. Please try again.</p>';
        }
    }

    // Filter Whitelist per Category
    const CATEGORY_FILTERS = {
        'fish': ['sea', 'freshwater', 'brackish'],
        'vegetables': ['fruit', 'root', 'leafy', 'fruit-veg', 'gourd'],
        'grains': ['cereal', 'pulse', 'millet']
    };

    function generateFilters(data) {
        // Get allowed filters for current category
        const allowedTags = CATEGORY_FILTERS[currentCategory] || [];

        // Extract unique categories from data that are in the allowed list
        const tags = new Set();
        data.forEach(item => {
            if (item.category && Array.isArray(item.category)) {
                item.category.forEach(tag => {
                    if (allowedTags.includes(tag)) {
                        tags.add(tag);
                    }
                });
            }
        });

        // Create Filter Chips
        const isAllActive = activeFilters.size === 0;
        let html = `<button class="filter-chip ${isAllActive ? 'active' : ''}" data-filter="all">All</button>`;

        // Sort based on the defined order in CATEGORY_FILTERS
        const sortedTags = Array.from(tags).sort((a, b) => {
            return allowedTags.indexOf(a) - allowedTags.indexOf(b);
        });

        sortedTags.forEach(tag => {
            const isActive = activeFilters.has(tag);
            html += `<button class="filter-chip ${isActive ? 'active' : ''}" data-filter="${tag}">${getCategoryLabel(tag)}</button>`;
        });

        if (filterChipsContainer) {
            filterChipsContainer.innerHTML = html;

            // Add Listeners
            filterChipsContainer.querySelectorAll('.filter-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const filter = chip.dataset.filter;
                    handleFilterClick(filter);
                });
            });
        }
    }

    function handleFilterClick(filter) {
        if (filter === 'all') {
            activeFilters.clear();
        } else {
            if (activeFilters.has(filter)) {
                activeFilters.delete(filter);
            } else {
                activeFilters.add(filter);
            }
        }

        // Update Active State visually
        const chips = document.querySelectorAll('.filter-chip');
        chips.forEach(c => {
            const f = c.dataset.filter;
            if (f === 'all') {
                if (activeFilters.size === 0) c.classList.add('active');
                else c.classList.remove('active');
            } else {
                if (activeFilters.has(f)) c.classList.add('active');
                else c.classList.remove('active');
            }
        });

        // Re-render
        const filtered = applyFilters(appData, searchInput.value.toLowerCase().trim(), activeFilters);
        renderApp(filtered);
        trackEvent('filter', { filter: Array.from(activeFilters).join(',') || 'all' });
    }

    function applyFilters(data, query, filters) {
        return data.filter(item => {
            // 1. Tag Filter (OR logic)
            if (filters.size > 0) {
                if (!item.category) return false;
                // Check if item has AT LEAST ONE of the active filters
                const hasMatch = item.category.some(cat => filters.has(cat));
                if (!hasMatch) return false;
            }

            // 2. Search Filter
            if (!query) return true;

            if (item.notes && item.notes.toLowerCase().includes(query)) return true;
            if (item.scientificName && item.scientificName.toLowerCase().includes(query)) return true;

            for (const [lang, names] of Object.entries(item.names)) {
                if (names.some(n => n.toLowerCase().includes(query))) return true;
            }

            return false;
        });
    }

    function renderApp(data) {
        // Update Count
        if (resultCount) resultCount.textContent = data.length;

        // Reset Lazy Load State
        currentFilteredData = data;
        renderedCount = 0;
        window.scrollTo(0, 0); // Reset scroll position
        cardView.innerHTML = '';

        if (loadMoreObserver) {
            loadMoreObserver.disconnect();
            loadMoreObserver = null;
        }

        if (data.length === 0) {
            noResults.hidden = false;
        } else {
            noResults.hidden = true;
            renderNextBatch();
        }
    }

    function renderNextBatch() {
        const batch = currentFilteredData.slice(renderedCount, renderedCount + BATCH_SIZE);
        if (batch.length === 0) return;

        const fragment = document.createDocumentFragment();
        batch.forEach(item => {
            fragment.appendChild(createCardElement(item));
        });
        cardView.appendChild(fragment);

        renderedCount += batch.length;

        if (renderedCount < currentFilteredData.length) {
            setupObserver();
        }
    }

    function setupObserver() {
        if (loadMoreObserver) loadMoreObserver.disconnect();

        const sentinel = document.createElement('div');
        sentinel.className = 'sentinel';
        cardView.appendChild(sentinel);

        loadMoreObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreObserver.disconnect();
                sentinel.remove();
                renderNextBatch();
            }
        }, { rootMargin: '200px' });

        loadMoreObserver.observe(sentinel);
    }

    function createCardElement(item) {
        const card = document.createElement('div');
        card.className = 'fish-card';

        const primaryLangs = [...activeCardLanguages];
        const otherLangs = SUPPORTED_LANGUAGES.filter(l => !activeCardLanguages.includes(l));

        const renderGrid = (langs) => langs.map(lang => `
            <div class="lang-group">
                <span class="lang-label">${LANGUAGE_DISPLAY_NAMES[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)}</span>
                <span class="lang-value">${item.names[lang] ? item.names[lang].join(' / ') : '-'}</span>
            </div>
        `).join('');

        // Simplified Badges
        const getBadges = (cats) => {
            if (!cats) return '';

            // Get allowed filters for current category
            const allowedTags = CATEGORY_FILTERS[currentCategory] || [];

            return cats
                .filter(cat => allowedTags.includes(cat)) // Filter against whitelist
                .map(cat => {
                    let className = 'habitat-badge';
                    if (['sea', 'freshwater', 'brackish'].includes(cat)) {
                        return `<span class="${className} habitat-${cat}">${getCategoryLabel(cat)}</span>`;
                    }
                    return `<span class="${className}" style="background:#e9ecef; color:#495057;">${getCategoryLabel(cat)}</span>`;
                }).join(' ');
        };

        const placeholderImg = `img/placeholder.webp`;

        card.innerHTML = `
            <div class="fish-header">
                <img src="${item.photo}" alt="${item.names.english[0]}" class="fish-thumbnail" loading="lazy" onerror="this.src='${placeholderImg}'">
                <div class="fish-title">
                    <h2>${item.names.english.join(' / ')}</h2>
                    <div class="scientific-name">${item.scientificName}</div>
                    <div class="badges">
                        ${getBadges(item.category)}
                    </div>
                </div>
            </div>
            
            <div class="fish-names-grid">
                ${renderGrid(primaryLangs)}
            </div>
            
            ${otherLangs.length > 0 ? `
                <details class="more-langs">
                    <summary>Show all languages</summary>
                    <div class="fish-names-grid dense">
                        ${renderGrid(otherLangs)}
                    </div>
                </details>
            ` : ''}

            ${item.notes ? `<div class="fish-notes">💡 ${item.notes}</div>` : ''}
        `;
        return card;
    }

    // Helper reused in renderCards and generateFilters
    function getCategoryLabel(cat) {
        const labels = {
            'sea': '🌊 Sea',
            'freshwater': '💧 Freshwater',
            'brackish': '🌿 Brackish',
            'root': '🥔 Root',
            'leafy': '🥬 Leafy',
            'fruit-veg': '🍆 Vegetable',
            'fruit': '🍎 Fruit',
            'gourd': '🥒 Gourd',
            'cereal': '🌾 Cereal',
            'pulse': '🫘 Pulse',
            'millet': '🌾 Millet',
            'fry': 'Frying',
            'curry': 'Curry',
            'dry': 'Dried',
            'puttu': 'Puttu'
        };
        return labels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
    }

    function renderColumnSelector() {
        colCheckboxes.innerHTML = SUPPORTED_LANGUAGES.map(lang => `
            <label class="col-option">
                <input type="checkbox" value="${lang}" ${activeCardLanguages.includes(lang) ? 'checked' : ''}>
                ${LANGUAGE_DISPLAY_NAMES[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)}
            </label>
        `).join('');

        colCheckboxes.querySelectorAll('input').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const lang = e.target.value;
                const isChecked = e.target.checked;

                if (isChecked) {
                    if (!activeCardLanguages.includes(lang)) activeCardLanguages.push(lang);
                    trackEvent('toggle_language', { language: lang, action: 'add' });
                } else {
                    activeCardLanguages = activeCardLanguages.filter(l => l !== lang);
                    trackEvent('toggle_language', { language: lang, action: 'remove' });
                }
                localStorage.setItem('fishCardLanguages', JSON.stringify(activeCardLanguages));

                // Re-render with current filters
                const filtered = applyFilters(appData, searchInput.value.toLowerCase().trim(), activeFilters);
                renderApp(filtered);
            });
        });
    }

    function handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();

        clearTimeout(searchTimeout);
        if (query) {
            searchTimeout = setTimeout(() => {
                trackEvent('search', { search_term: query });
            }, 1000);
        }

        const filtered = applyFilters(appData, query, activeFilters);
        renderApp(filtered);
    }
});
