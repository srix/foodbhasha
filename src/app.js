
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
    let allData = []; // Cache for global search
    let currentCategory = 'vegetables-fruits';
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
        'vegetables-fruits': '/data/vegetables-fruits.json',
        'grains': '/data/grains-pulses.json',
        'spices': '/data/spices.json',
        'fish': '/data/fish-seafood.json',
        'flowers': '/data/flowers.json'
    };

    const TAG_FILTERS = {
        'fish': ['sea', 'freshwater', 'brackish'],
        'vegetables-fruits': ['fruit', 'root', 'leafy', 'vegetable'],
        'grains': ['cereal', 'pulse', 'millet'],
        'spices': ['seed', 'aromatic', 'heat', 'root', 'acidic', 'resin', 'flower', 'dry-fruit'],
        'flowers': ['flower', 'aromatic', 'decorative', 'religious', 'edible', 'aquatic', 'medicinal']
    };

    const BATCH_SIZE = 8;
    let activeCardLanguages = JSON.parse(localStorage.getItem('fishCardLanguages')) || DEFAULT_CARD_LANGUAGES;

    // Initialize
    init();

    async function init() {
        // Platform Detection
        if (window.Capacitor) {
            document.body.classList.add('platform-capacitor');
            if (window.Capacitor.getPlatform() === 'android') {
                document.body.classList.add('platform-android');

                // Force Status Bar Style
                try {
                    const StatusBar = window.Capacitor.Plugins.StatusBar;
                    if (StatusBar) {
                        // Style.Light means "Light Background" -> Dark Icons
                        await StatusBar.setStyle({ style: 'LIGHT' });
                        await StatusBar.setBackgroundColor({ color: '#F4F1E8' }); // Match header color
                        await StatusBar.setOverlaysWebView({ overlay: false }); // Disable overlay to stop blending issues?
                        // Actually user liked the "not overlapping" part from previous step.
                        // But if we set overlay: false, the webview shrinks, handling the safe area natively!
                        // This might be cleaner than my CSS hack.
                        // Let's stick to the user's request: "icons are white".
                        // So just setStyle('DARK') is critical.
                        // Note: setOverlaysWebView(true) makes it transparent/full screen.
                        // Let's re-enforce the style.
                    }
                } catch (e) {
                    console.error("StatusBar plugin error", e);
                }
            }
        }

        // History API Routing
        window.addEventListener('popstate', handleRouteChange);

        // Redirect old hash URLs to path-based URLs
        if (window.location.hash) {
            const hash = window.location.hash.slice(1);
            const parts = hash.split('&');
            const category = parts[0];
            const searchPart = parts.find(p => p.startsWith('search='));
            const newPath = searchPart ? `/${category}?search=${searchPart.split('=')[1]}` : `/${category}`;
            history.replaceState({}, '', newPath);
        }

        // --- Setup Listeners & UI Components BEFORE loading data ---

        // Tabs
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = btn.dataset.category;
                const query = searchInput.value.trim();
                const newPath = query ? `/${category}?search=${encodeURIComponent(query)}` : `/${category}`;
                if (window.location.pathname + window.location.search !== newPath) {
                    history.pushState({}, '', newPath);
                    handleRouteChange();
                }
            });
        });

        // Search
        searchInput.addEventListener('input', handleSearch);
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                updateSearchUI();
                const newPath = `/${currentCategory}`;
                history.pushState({}, '', newPath);
                handleSearch();
            });
        }

        // Reset filters on search click (User Request)
        searchInput.addEventListener('click', () => {
            if (searchInput.value.trim().length > 0 && activeFilters.size > 0) {
                activeFilters.clear();
                // Update UI chips
                document.querySelectorAll('.filter-chip').forEach(c => {
                    const f = c.dataset.filter;
                    c.classList.toggle('active', f === 'all');
                });

                // Re-run search immediately (skip debounce)
                const query = searchInput.value.trim();
                let dataToFilter = appData;
                if (query.length > 0 && allData.length > 0) {
                    dataToFilter = allData;
                }
                renderApp(applyFilters(dataToFilter, query, activeFilters));
            }
        });

        // Language Selector
        btnCustomizeCols.addEventListener('click', () => {
            colDialog.hidden = !colDialog.hidden;
            if (!colDialog.hidden) renderColumnSelector();
        });
        btnCloseCols.addEventListener('click', () => colDialog.hidden = true);

        // Feedback Form
        setupFeedbackForm();

        // Scroll Logic
        setupScrollListener();

        // Header Layout Logic (Fixed Positioning Support)
        updateBodyPadding();
        window.addEventListener('resize', updateBodyPadding);
        // Update again after a short delay to ensure fonts/images loaded
        setTimeout(updateBodyPadding, 100);
        setTimeout(updateBodyPadding, 500);

        // --- Initial Data Load ---
        await handleRouteChange();
    }

    async function handleRouteChange() {
        const pathname = window.location.pathname;
        const searchParams = new URLSearchParams(window.location.search);

        // Parse route: / or /category or /category/item-id
        const pathParts = pathname.split('/').filter(p => p);
        const catPart = pathParts[0] || 'vegetables-fruits';
        const itemId = pathParts[1] || null;
        const searchQuery = searchParams.get('search') || '';

        // Handle /feedback route
        let targetCategory = 'vegetables-fruits';
        if (catPart === 'feedback') {
            // Keep default or previous category, but we will open modal later
            targetCategory = 'vegetables-fruits';
        } else {
            targetCategory = CATEGORIES[catPart] ? catPart : 'vegetables-fruits';
        }
        let targetQuery = searchQuery;

        // Check if anything actually changed globally
        const isNewCategory = targetCategory !== currentCategory || appData.length === 0;
        const isNewQuery = searchInput.value.trim() !== targetQuery;

        if (isNewCategory) {
            searchInput.value = targetQuery;
            updateSearchUI();
            await loadCategory(targetCategory);

            // If itemId is present, search for that item
            if (itemId) {
                const item = appData.find(i => i.id === itemId);
                if (item) {
                    const itemName = item.names.english[0];
                    searchInput.value = itemName;
                    updateSearchUI();
                    renderApp(applyFilters(appData, itemName, activeFilters));
                    setTimeout(() => scrollToItem(itemId), 300);
                } else {
                    window.scrollTo(0, 0);
                }
            } else {
                window.scrollTo(0, 0);
            }
        } else if (isNewQuery) {
            searchInput.value = targetQuery;
            updateSearchUI();
            renderApp(applyFilters(appData, targetQuery, activeFilters));
            window.scrollTo(0, 0);
        } else if (itemId) {
            // Item-level navigation within same category
            const item = appData.find(i => i.id === itemId);
            if (item) {
                const itemName = item.names.english[0];
                searchInput.value = itemName;
                updateSearchUI();
                renderApp(applyFilters(appData, itemName, activeFilters));
                setTimeout(() => scrollToItem(itemId), 300);
            } else {
                scrollToItem(itemId);
            }
        }

        // Sync Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === targetCategory);
        });

        updateTitle(targetCategory, targetQuery, itemId);
        updateMetaTags(targetCategory, itemId);
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
            // Augment local data too for consistency
            appData.forEach(item => item.category = category);
            isLoading = false;

            generateFilters(appData);
            renderApp(applyFilters(appData, searchInput.value.trim(), activeFilters));
        } catch (error) {
            console.error(`Failed to load ${category}:`, error);
            cardView.innerHTML = '<p class="error">Failed to load data.</p>';
            isLoading = false;
        }
    }

    async function fetchAllData() {
        if (allData.length > 0) return; // Already cached
        try {
            const promises = Object.entries(CATEGORIES).map(async ([catKey, url]) => {
                const res = await fetch(`${url}?v=${new Date().getTime()}`);
                const data = await res.json();
                return data.map(item => ({ ...item, category: catKey }));
            });
            const results = await Promise.all(promises);
            allData = results.flat();
        } catch (e) {
            console.error("Failed to fetch all data for global search", e);
        }
    }

    function handleSearch() {
        const query = searchInput.value.trim();
        updateSearchUI();

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const newPath = query ? `/${currentCategory}?search=${encodeURIComponent(query)}` : `/${currentCategory}`;
            if (window.location.pathname + window.location.search !== newPath) {
                history.pushState({}, '', newPath);
                updateTitle(currentCategory, query, null);
            }

            // Global Search Logic
            let dataToFilter = appData;
            if (query.length > 0) {
                await fetchAllData();
                dataToFilter = allData;
            }

            renderApp(applyFilters(dataToFilter, query, activeFilters));

        }, 500);

        // Immediate UI update for cleared search or typing (using available data)
        // If typing, we wait for debounce to trigger global search, but we can filter current list instantly
        if (query.length === 0) {
            renderApp(applyFilters(appData, query, activeFilters));
        }
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
        if (resultCount) resultCount.textContent = `${data.length}/${appData.length}`;
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
        card.className = 'item-card';
        const itemCategory = item.category || currentCategory; // Use item category if global search, else current

        const primaryLangs = [...activeCardLanguages];
        const otherLangs = SUPPORTED_LANGUAGES.filter(l => !activeCardLanguages.includes(l));

        const renderGrid = (langs) => langs.map(lang => `
            <div class="lang-group">
                <span class="lang-label">${LANGUAGE_DISPLAY_NAMES[lang] || lang}</span>
                <span class="lang-value">${item.names[lang] ? item.names[lang].join(' / ') : '-'}</span>
            </div>`).join('');

        const getBadges = (tags) => {
            // Badges might need to support all categories if global search?
            // Current UX: show badges relevant to the item's category.
            // TAG_FILTERS is keyed by category.
            const allowed = TAG_FILTERS[itemCategory] || [];
            return (tags || []).filter(t => allowed.includes(t)).map(t => {
                const isHabitat = ['sea', 'freshwater', 'brackish'].includes(t);
                return `<span class="habitat-badge ${isHabitat ? 'habitat-' + t : ''}">${getTagLabel(t)}</span>`;
            }).join(' ');
        };

        const placeholderType = itemCategory === 'vegetables-fruits' ? 'veg' :
            (itemCategory === 'grains' ? 'grain' :
                (itemCategory === 'spices' ? 'spice' :
                    (itemCategory === 'flowers' ? 'flower' : 'fish')));

        card.innerHTML = `
            <div class="item-header">
                <img src="${item.photo.startsWith('/') ? '' : '/'}${item.photo}" alt="${item.names.english[0]}" class="item-thumbnail" width="80" height="80" loading="lazy" onerror="this.onerror=null; this.src='/assets/graphics/placeholder_${placeholderType}.webp'">
                <div class="item-title">
                    <h3>${item.names.english.join(' / ')}</h3>
                    <div class="scientific-name">${item.scientificName || ''}</div>
                    <div class="badges">${getBadges(item.tags)}</div>
                </div>
            </div>
            <div class="item-names-grid">${renderGrid(primaryLangs)}</div>
            ${otherLangs.length > 0 ? `<details class="more-langs"><summary>Show all languages</summary><div class="item-names-grid dense">${renderGrid(otherLangs)}</div></details>` : ''}
            ${item.notes ? `<div class="item-notes">💡 ${item.notes}</div>` : ''}
            <button class="share-btn" data-item-id="${item.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span class="share-text">Share</span>
            </button>`;

        // Add share event listener
        const shareBtn = card.querySelector('.share-btn');
        shareBtn.addEventListener('click', (event) => shareItem(item, event));

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

        const query = searchInput.value.trim();
        let dataToFilter = appData;
        if (query.length > 0 && allData.length > 0) {
            dataToFilter = allData;
        }

        renderApp(applyFilters(dataToFilter, query, activeFilters));
    }

    function getTagLabel(tag) {
        const labels = {
            'sea': '🌊 Sea', 'freshwater': '💧 Freshwater', 'brackish': '🌿 Brackish', 'root': '🥔 Root', 'leafy': '🥬 Leafy',
            'vegetable': '🍆 Vegetable', 'fruit': '🍎 Fruit', 'cereal': '🌾 Cereal', 'pulse': '🫘 Pulse', 'millet': '🥣 Millet',
            'spice': '🌶️ Spice', 'seed': '🌿 Seed', 'aromatic': '🪵 Aromatic', 'heat': '🔥 Heat', 'acidic': '🍋 Acidic',
            'resin': '🥣 Resin', 'flower': '🌸 Flower', 'dry-fruit': '🥜 Dry Fruit',
            'aquatic': '💧 Aquatic', 'medicinal': '💊 Medicinal', 'decorative': '🎋 Decorative', 'religious': '🙏 Religious', 'edible': '🍽️ Edible'
        };
        return labels[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
    }

    function updateTitle(category, query, itemId) {
        const catLabel = getCategoryLabel(category);
        let title;

        if (itemId) {
            const item = appData.find(i => i.id === itemId);
            if (item) {
                const englishName = item.names.english[0];
                title = `${englishName} | ${catLabel} | FoodBhasha`;
            } else {
                title = `${catLabel} | FoodBhasha`;
            }
        } else if (query) {
            title = `${query} | Search in ${catLabel} | FoodBhasha`;
        } else {
            title = `${catLabel} | FoodBhasha`;
        }

        document.title = title;
    }

    function getCategoryLabel(category) {
        const labels = {
            'fish': 'Fish & Seafood',
            'vegetables-fruits': 'Vegetables & Fruits',
            'grains': 'Grains & Pulses',
            'spices': 'Spices',
            'flowers': 'Flowers'
        };
        return labels[category] || category;
    }

    function updateMetaTags(category, itemId) {
        const catLabel = getCategoryLabel(category);
        let description, ogTitle, ogDescription, url;

        // Get current URL
        url = `https://foodbhasha.com${window.location.pathname}`;

        if (itemId) {
            const item = appData.find(i => i.id === itemId);
            if (item) {
                const englishName = item.names.english.join(', ');
                const scientificName = item.scientificName || '';
                const languageNames = [
                    item.names.tamil[0],
                    item.names.hindi[0],
                    item.names.kannada[0],
                    item.names.malayalam[0]
                ].filter(Boolean).join(', ');

                description = `${englishName} (${scientificName}). Regional names: ${languageNames}. Multilingual ${catLabel} glossary in 22 Indian languages including Tamil, Hindi, Malayalam, and Kannada.`;
                ogTitle = `${englishName} | ${catLabel} Names`;
                ogDescription = description;
            } else {
                description = `Comprehensive ${catLabel.toLowerCase()} glossary in 22 Indian languages. Identify and translate names of Fish, Vegetables, Fruits, Grains, and Spices with photos.`;
                ogTitle = catLabel;
                ogDescription = description;
            }
        } else {
            description = `Instantly identify and translate Indian food ingredients. Detailed glossary for Fish, Vegetables, Fruits, Grains, and Spices across 22 languages including Tamil, Hindi, Malayalam, and Kannada.`;
            ogTitle = `${catLabel} | Indian Ingredient Lexicon`;
            ogDescription = description;
        }

        // Update meta tags
        document.querySelector('meta[name="description"]')?.setAttribute('content', description);
        document.querySelector('meta[property="og:url"]')?.setAttribute('content', url);
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', ogTitle + ' | FoodBhasha');
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', ogDescription);
        document.querySelector('meta[property="og:image"]')?.setAttribute('content', 'https://foodbhasha.com/assets/graphics/logo.webp');
        document.querySelector('meta[property="twitter:url"]')?.setAttribute('content', url);
        document.querySelector('meta[property="twitter:title"]')?.setAttribute('content', ogTitle + ' | FoodBhasha');
        document.querySelector('meta[property="twitter:description"]')?.setAttribute('content', ogDescription);
        document.querySelector('meta[property="twitter:image"]')?.setAttribute('content', 'https://foodbhasha.com/assets/graphics/logo.webp');

        // Update canonical tag
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', url + (url.endsWith('/') ? '' : '/'));
    }

    function scrollToItem(itemId) {
        const cards = document.querySelectorAll('.item-card');
        for (const card of cards) {
            const cardData = currentFilteredData.find(item => {
                const cardTitle = card.querySelector('h3')?.textContent;
                return item.id === itemId || item.names.english.some(name => cardTitle?.includes(name));
            });

            if (cardData && cardData.id === itemId) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('highlight-item');
                setTimeout(() => card.classList.remove('highlight-item'), 2000);
                break;
            }
        }
    }

    async function shareItem(item, event) {
        const itemCategory = item.category || currentCategory;
        const url = `https://foodbhasha.com/${itemCategory}/${item.id}`;
        const title = `${item.names.english[0]} | ${getCategoryLabel(itemCategory)}`;
        const text = `Check out ${item.names.english[0]} in 22 Indian languages on Food Bhasha`;

        // ... (rest of shareItem remains same) ...
        // Try Web Share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch (err) {
                if (err.name !== 'AbortError') console.log('Share failed:', err);
            }
        }

        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(url);
            const btn = event.target.closest('.share-btn');
            const originalText = btn.querySelector('.share-text').textContent;
            btn.classList.add('copied');
            btn.querySelector('.share-text').textContent = 'Link copied!';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.querySelector('.share-text').textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
            alert(`Share this link:\n${url}`);
        }
    }

    function setupScrollListener() {
        let lastScrollY = window.scrollY;
        const header = document.querySelector('.app-header');
        const threshold = 20; // Minimum scroll amount to trigger change

        window.addEventListener('scroll', () => {
            const current = window.scrollY;

            // Ignore bounce/rubberbanding
            if (current < 0) return;

            const diff = Math.abs(current - lastScrollY);
            if (diff < threshold) return; // Ignore small scroll movements

            if (current > 100) {
                if (current > lastScrollY) {
                    // Scrolling Down -> Hide
                    header.classList.add('scrolled-down');
                } else {
                    // Scrolling Up -> Show
                    header.classList.remove('scrolled-down');
                }
            } else {
                // At top -> Show
                header.classList.remove('scrolled-down');
            }
            lastScrollY = current;
        }, { passive: true });
    }

    function updateBodyPadding() {
        const header = document.querySelector('.app-header');
        if (header) {
            document.body.style.paddingTop = header.offsetHeight + 'px';
        }
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

    function setupFeedbackForm() {
        const modal = document.getElementById('feedback-modal');
        const openBtn = document.getElementById('feedback-btn');
        const closeBtn = document.getElementById('close-modal');
        const closeSuccessBtn = document.getElementById('close-success-modal');
        const form = document.getElementById('feedback-form');
        const successMsg = document.getElementById('feedback-success');

        if (!modal || !openBtn) return;

        // Open Modal
        openBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Check if native Android
            if (window.Capacitor && window.Capacitor.getPlatform() === 'android') {
                try {
                    const { Browser } = window.Capacitor.Plugins; // Access auto-bridge or try importing if using module.
                    // But wait, standard usage is: import { Browser } from '@capacitor/browser';
                    // Since we don't have a bundler config we can easily change here (using vanilla JS module imports or standard Capacitor global if available).
                    // Capacitor 3+ usually exposes Plugins via window.Capacitor.Plugins if bundled or if using the script tag which we aren't...
                    // Actually, we are using a simple script include. The 'package.json' install implies we *might* need a build step if we use imports.
                    // IMPORTANT: 'app.js' is currently a raw script. We can't use 'import' syntax unless we user type="module" or a bundler.
                    // User's project seems to be "No build system required" for web.
                    // BUT for Android Capacitor, the plugins are available via window.Capacitor.Plugins? 
                    // No, typically you need a bundler for plugins. 
                    // HOWEVER: core Capacitor is injected.

                    // Let's assume standard Capacitor object usage or invoke simple browser redirect if plugins fail?
                    // Actually, we can just use window.open('...', '_system') on Cordova/Capacitor as a fallback!

                    // Let's try the cleanest implementation for a "no-bundler" setup.
                    // Often `window.Capacitor.Plugins.Browser` is available if the plugin is installed and valid.

                    if (window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
                        await window.Capacitor.Plugins.Browser.open({ url: 'https://foodbhasha.com/feedback' });
                    } else {
                        // Fallback: This usually opens system browser on mobile web/hybrid
                        window.open('https://foodbhasha.com/feedback', '_system');
                    }

                } catch (err) {
                    console.error('Error opening browser:', err);
                    // Fallback to modal if browser open fails
                    openModal();
                }
            } else {
                openModal();
            }
        });

        function openModal() {
            modal.hidden = false;
            modal.removeAttribute('aria-hidden');
            // Focus first input
            setTimeout(() => document.getElementById('feedback-name').focus(), 100);
        }

        // Check for /feedback route on load
        if (window.location.pathname === '/feedback') {
            openModal();
            // Optional: Rewrite history to remove /feedback so back button works nicely? 
            // Or keep it. Let's keep it so refreshing works and it feels like a real page.
        }

        // Close Modal
        const closeModal = () => {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            // Reset form if success message was shown
            if (!successMsg.hidden) {
                setTimeout(() => {
                    successMsg.hidden = true;
                    form.hidden = false;
                    form.reset();
                }, 300);
            }
        };

        closeBtn.addEventListener('click', closeModal);
        closeSuccessBtn.addEventListener('click', closeModal);

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Handle Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.hidden) closeModal();
        });

        // AJAX Form Submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('.submit-btn');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            const formData = new FormData(form);

            try {
                // Use absolute URL to support Android app (file:// origin)
                await fetch('https://foodbhasha.com/', {
                    method: 'POST',
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams(formData).toString()
                });

                // Show success
                form.hidden = true;
                successMsg.hidden = false;
                trackEvent('feedback_submitted');

            } catch (error) {
                console.error('Feedback submission error:', error);
                alert('Sorry, there was an error sending your feedback. Please try again.');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    function trackEvent(name, params = {}) { if (typeof gtag === 'function') gtag('event', name, params); }
});
