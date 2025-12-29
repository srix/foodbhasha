
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cardView = document.getElementById('card-view');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
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
    let appData = [];
    let currentCategory = 'fish';
    let activeFilters = new Set();
    let currentFilteredData = [];
    let renderedCount = 0;
    let loadMoreObserver;
    let isLoading = false;

    // Config
    const SUPPORTED_LANGUAGES = [
        "assamese", "bengali", "bodo", "dogri", "gujarati", "hindi", "kannada",
        "kashmiri", "konkani", "maithili", "malayalam", "manipuri", "marathi",
        "nepali", "odia", "punjabi", "sanskrit", "santali", "sindhi", "tamil",
        "telugu", "urdu"
    ];

    const LANGUAGE_DISPLAY_NAMES = {
        "assamese": "অসমীয়া / Assamese", "bengali": "বাংলা / Bengali", "bodo": "बोडो / Bodo",
        "dogri": "डोगरी / Dogri", "gujarati": "ગુજરાતી / Gujarati", "hindi": "हिंदी / Hindi",
        "kannada": "ಕನ್ನಡ / Kannada", "kashmiri": "कॉशুর / Kashmiri", "konkani": "कोंकणी / Konkani",
        "maithili": "मैथिली / Maithili", "malayalam": "മലയാളം / Malayalam", "manipuri": "মৈতৈলোন্ / Manipuri",
        "marathi": "मराठी / Marathi", "nepali": "नेपाली / Nepali", "odia": "ଓଡ଼ିଆ / Odia",
        "punjabi": "ਪੰਜਾਬੀ / Punjabi", "sanskrit": "संस्कृत / Sanskrit", "santali": "ᱥᱟᱱᱛᱟᱲᱤ / Santali",
        "sindhi": "سنڌي / Sindhi", "tamil": "தமிழ் / Tamil", "telugu": "తెలుగు / Telugu", "urdu": "اردو / Urdu"
    };

    const DEFAULT_CARD_LANGUAGES = ["tamil", "kannada", "telugu", "hindi"];
    const CATEGORIES = {
        'fish': 'data/fish-seafood.json',
        'vegetables-fruits': 'data/vegetables-fruits.json',
        'grains': 'data/grains-pulses.json',
        'spices': 'data/spices.json'
    };

    const TAG_FILTERS = {
        'fish': ['sea', 'freshwater', 'brackish'],
        'vegetables-fruits': ['fruit', 'root', 'leafy', 'vegetable'],
        'grains': ['cereal', 'pulse', 'millet'],
        'spices': ['seed', 'aromatic', 'heat', 'root', 'acidic', 'resin', 'flower', 'dry-fruit']
    };

    const BATCH_SIZE = 20;
    let activeCardLanguages = JSON.parse(localStorage.getItem('fishCardLanguages')) || DEFAULT_CARD_LANGUAGES;

    // Initialize
    init();

    async function init() {
        // Hash Routing
        window.addEventListener('hashchange', handleRouteChange);

        // Initial load
        const hash = window.location.hash.slice(1);
        if (hash) {
            await handleRouteChange();
        } else {
            await loadCategory('fish');
        }

        // Tabs
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                const query = searchInput.value.trim();
                const newHash = query ? `${category}&search=${encodeURIComponent(query)}` : category;
                if (window.location.hash.slice(1) !== newHash) {
                    window.location.hash = newHash;
                } else if (category !== currentCategory) {
                    loadCategory(category);
                }
            });
        });

        // Search
        searchInput.addEventListener('input', handleSearch);
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                updateSearchUI();
                window.location.hash = currentCategory;
                handleSearch();
            });
        }

        // Language Selector
        btnCustomizeCols.addEventListener('click', () => {
            colDialog.hidden = !colDialog.hidden;
            if (!colDialog.hidden) renderColumnSelector();
        });
        btnCloseCols.addEventListener('click', () => colDialog.hidden = true);

        // Scroll Logic
        setupScrollListener();
    }

    async function handleRouteChange() {
        const hash = window.location.hash.slice(1);
        if (!hash) return;

        const parts = hash.split('&');
        const catPart = parts[0];
        const searchPart = parts.find(p => p.startsWith('search='));

        let targetCategory = CATEGORIES[catPart] ? catPart : currentCategory;
        let targetQuery = searchPart ? decodeURIComponent(searchPart.split('=')[1]) : '';

        // Check if anything actually changed globally
        const isNewCategory = targetCategory !== currentCategory || appData.length === 0;
        const isNewQuery = searchInput.value.trim() !== targetQuery;

        if (isNewCategory) {
            searchInput.value = targetQuery;
            updateSearchUI();
            await loadCategory(targetCategory);
            window.scrollTo(0, 0);
        } else if (isNewQuery) {
            searchInput.value = targetQuery;
            updateSearchUI();
            renderApp(applyFilters(appData, targetQuery, activeFilters));
            window.scrollTo(0, 0);
        }

        // Sync Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === targetCategory);
        });

        updateTitle(targetCategory, targetQuery);
    }

    async function loadCategory(category) {
        if (isLoading) return;
        isLoading = true;
        currentCategory = category;
        activeFilters.clear();
        cardView.innerHTML = '<p class="loading">Loading...</p>';
        if (filterChipsContainer) filterChipsContainer.innerHTML = '';

        try {
            const response = await fetch(`${CATEGORIES[category]}?v=${new Date().getTime()}`);
            appData = await response.json();
            isLoading = false;

            generateFilters(appData);
            renderApp(applyFilters(appData, searchInput.value.trim(), activeFilters));
        } catch (error) {
            console.error(`Failed to load ${category}:`, error);
            cardView.innerHTML = '<p class="error">Failed to load data.</p>';
            isLoading = false;
        }
    }

    function handleSearch() {
        const query = searchInput.value.trim();
        updateSearchUI();

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const newHash = query ? `${currentCategory}&search=${encodeURIComponent(query)}` : currentCategory;
            if (window.location.hash.slice(1) !== newHash) {
                window.location.hash = newHash;
            }
        }, 500);

        renderApp(applyFilters(appData, query, activeFilters));
    }

    function updateSearchUI() {
        if (searchClear) searchClear.hidden = searchInput.value.length === 0;
    }

    function applyFilters(data, query, filters) {
        const q = query.toLowerCase().trim();
        return data.filter(item => {
            if (filters.size > 0) {
                if (!item.tags || !item.tags.some(tag => filters.has(tag))) return false;
            }
            if (!q) return true;
            if (item.notes && item.notes.toLowerCase().includes(q)) return true;
            if (item.scientificName && item.scientificName.toLowerCase().includes(q)) return true;
            return Object.values(item.names).flat().some(n => n.toLowerCase().includes(q));
        });
    }

    function renderApp(data) {
        if (resultCount) resultCount.textContent = data.length;
        currentFilteredData = data;
        renderedCount = 0;
        cardView.innerHTML = '';
        if (loadMoreObserver) loadMoreObserver.disconnect();

        if (data.length === 0) {
            noResults.hidden = false;
        } else {
            noResults.hidden = true;
            renderNextBatch();
        }
    }

    function renderNextBatch() {
        const batch = currentFilteredData.slice(renderedCount, renderedCount + BATCH_SIZE);
        const fragment = document.createDocumentFragment();
        batch.forEach(item => fragment.appendChild(createCardElement(item)));
        cardView.appendChild(fragment);
        renderedCount += batch.length;
        if (renderedCount < currentFilteredData.length) setupObserver();
    }

    function setupObserver() {
        if (loadMoreObserver) loadMoreObserver.disconnect();
        const sentinel = document.createElement('div');
        sentinel.className = 'sentinel';
        cardView.appendChild(sentinel);

        loadMoreObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
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
                <span class="lang-label">${LANGUAGE_DISPLAY_NAMES[lang] || lang}</span>
                <span class="lang-value">${item.names[lang] ? item.names[lang].join(' / ') : '-'}</span>
            </div>`).join('');

        const getBadges = (tags) => {
            const allowed = TAG_FILTERS[currentCategory] || [];
            return (tags || []).filter(t => allowed.includes(t)).map(t => {
                const isHabitat = ['sea', 'freshwater', 'brackish'].includes(t);
                return `<span class="habitat-badge ${isHabitat ? 'habitat-' + t : ''}">${getTagLabel(t)}</span>`;
            }).join(' ');
        };

        card.innerHTML = `
            <div class="fish-header">
                <img src="${item.photo}" alt="${item.names.english[0]}" class="fish-thumbnail" loading="lazy" onerror="this.src='img/placeholder.webp'">
                <div class="fish-title">
                    <h2>${item.names.english.join(' / ')}</h2>
                    <div class="scientific-name">${item.scientificName || ''}</div>
                    <div class="badges">${getBadges(item.tags)}</div>
                </div>
            </div>
            <div class="fish-names-grid">${renderGrid(primaryLangs)}</div>
            ${otherLangs.length > 0 ? `<details class="more-langs"><summary>Show all languages</summary><div class="fish-names-grid dense">${renderGrid(otherLangs)}</div></details>` : ''}
            ${item.notes ? `<div class="fish-notes">💡 ${item.notes}</div>` : ''}`;
        return card;
    }

    function generateFilters(data) {
        const allowed = TAG_FILTERS[currentCategory] || [];
        const tags = new Set();
        data.forEach(item => (item.tags || []).forEach(t => { if (allowed.includes(t)) tags.add(t); }));

        const sorted = Array.from(tags).sort((a, b) => allowed.indexOf(a) - allowed.indexOf(b));
        let html = `<button class="filter-chip ${activeFilters.size === 0 ? 'active' : ''}" data-filter="all">All</button>`;
        sorted.forEach(t => html += `<button class="filter-chip ${activeFilters.has(t) ? 'active' : ''}" data-filter="${t}">${getTagLabel(t)}</button>`);

        if (filterChipsContainer) {
            filterChipsContainer.innerHTML = html;
            filterChipsContainer.querySelectorAll('.filter-chip').forEach(c => c.addEventListener('click', () => handleFilterClick(c.dataset.filter)));
        }
    }

    function handleFilterClick(filter) {
        if (filter === 'all') activeFilters.clear();
        else activeFilters.has(filter) ? activeFilters.delete(filter) : activeFilters.add(filter);

        document.querySelectorAll('.filter-chip').forEach(c => {
            const f = c.dataset.filter;
            c.classList.toggle('active', f === 'all' ? activeFilters.size === 0 : activeFilters.has(f));
        });

        renderApp(applyFilters(appData, searchInput.value.trim(), activeFilters));
    }

    function getTagLabel(tag) {
        const labels = {
            'sea': '🌊 Sea', 'freshwater': '💧 Freshwater', 'brackish': '🌿 Brackish', 'root': '🥔 Root', 'leafy': '🥬 Leafy',
            'vegetable': '🍆 Vegetable', 'fruit': '🍎 Fruit', 'cereal': '🌾 Cereal', 'pulse': '🫘 Pulse', 'millet': '🥣 Millet',
            'spice': '🌶️ Spice', 'seed': '🌿 Seed', 'aromatic': '🪵 Aromatic', 'heat': '🔥 Heat', 'acidic': '🍋 Acidic',
            'resin': '🥣 Resin', 'flower': '🌸 Flower', 'dry-fruit': '🥜 Dry Fruit'
        };
        return labels[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
    }

    function updateTitle(category, query) {
        const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
        document.title = query ? `${query} | Search in ${catLabel} | Indian Ingredient Lexicon` : `${catLabel} Identification Guide | Indian Ingredient Lexicon`;
    }

    function setupScrollListener() {
        let lastScrollY = window.scrollY;
        const header = document.querySelector('.app-header');
        window.addEventListener('scroll', () => {
            const current = window.scrollY;
            if (current > 100) {
                if (current > lastScrollY) header.classList.add('scrolled-down');
                else if (current < lastScrollY) header.classList.remove('scrolled-down');
            } else {
                header.classList.remove('scrolled-down');
            }
            lastScrollY = current;
        }, { passive: true });
    }

    function renderColumnSelector() {
        colCheckboxes.innerHTML = SUPPORTED_LANGUAGES.map(l => `
            <label class="col-option">
                <input type="checkbox" value="${l}" ${activeCardLanguages.includes(l) ? 'checked' : ''}>
                ${LANGUAGE_DISPLAY_NAMES[l] || l}
            </label>`).join('');
        colCheckboxes.querySelectorAll('input').forEach(cb => cb.addEventListener('change', (e) => {
            const l = e.target.value;
            e.target.checked ? activeCardLanguages.push(l) : activeCardLanguages = activeCardLanguages.filter(x => x !== l);
            localStorage.setItem('fishCardLanguages', JSON.stringify(activeCardLanguages));
            renderApp(applyFilters(appData, searchInput.value.trim(), activeFilters));
        }));
    }

    function trackEvent(name, params = {}) { if (typeof gtag === 'function') gtag('event', name, params); }
});
