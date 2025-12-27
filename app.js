
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cardView = document.getElementById('card-view');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');

    // Column Controls (repurposed for Card View languages)
    const btnCustomizeCols = document.getElementById('btn-customize-cols');
    const colDialog = document.getElementById('column-selector-dialog');
    const colCheckboxes = document.getElementById('column-checkboxes');
    const btnCloseCols = document.getElementById('btn-close-cols');

    let fishData = [];
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

    // State
    let activeCardLanguages = JSON.parse(localStorage.getItem('fishCardLanguages')) || DEFAULT_CARD_LANGUAGES;

    // Initialize
    init();

    async function init() {
        try {
            const response = await fetch('data/fish.json');
            fishData = await response.json();
            renderApp(fishData);
        } catch (error) {
            console.error('Failed to load fish data:', error);
            cardView.innerHTML = '<p class="error">Failed to load data. Please try again.</p>';
        }

        // Event Listeners
        searchInput.addEventListener('input', handleSearch);

        btnCustomizeCols.addEventListener('click', () => {
            colDialog.hidden = !colDialog.hidden;
            if (!colDialog.hidden) {
                renderColumnSelector();
            }
        });

        btnCloseCols.addEventListener('click', () => {
            colDialog.hidden = true;
        });
    }

    function renderApp(data) {
        renderCards(data);

        if (data.length === 0) {
            noResults.hidden = false;
        } else {
            noResults.hidden = true;
        }
    }

    function renderCards(data) {
        cardView.innerHTML = '';
        data.forEach(fish => {
            const card = document.createElement('div');
            card.className = 'fish-card';

            // Use activeCardLanguages for the main grid
            // Any language NOT in activeCardLanguages but present in data goes to "Show all"
            const primaryLangs = activeCardLanguages.filter(l => fish.names[l]);
            const otherLangs = SUPPORTED_LANGUAGES.filter(l => !activeCardLanguages.includes(l) && fish.names[l]);

            const renderGrid = (langs) => langs.map(lang => `
                <div class="lang-group">
                    <span class="lang-label">${lang}</span>
                    <span class="lang-value">${fish.names[lang] ? fish.names[lang].join(' / ') : '-'}</span>
                </div>
            `).join('');

            card.innerHTML = `
                <div class="fish-header">
                    <img src="${fish.photo}" alt="${fish.names.english[0]}" class="fish-thumbnail" loading="lazy" onerror="this.src='img/placeholder.webp'">
                    <div class="fish-title">
                        <h2>${fish.names.english.join(' / ')}</h2>
                        <div class="scientific-name">${fish.scientificName}</div>
                        ${(() => {
                    const cats = fish.category || [];
                    if (cats.includes('sea')) return '<span class="habitat-badge habitat-sea">🌊 Sea</span>';
                    if (cats.includes('freshwater')) return '<span class="habitat-badge habitat-freshwater">💧 Freshwater</span>';
                    if (cats.includes('brackish')) return '<span class="habitat-badge habitat-brackish">🌿 Brackish</span>';
                    return '';
                })()}
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

                ${fish.notes ? `<div class="fish-notes">💡 ${fish.notes}</div>` : ''}
            `;
            cardView.appendChild(card);
        });
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
                renderCards(fishData);
            });
        });
    }

    function handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();

        // Track search with debounce
        clearTimeout(searchTimeout);
        if (query) {
            searchTimeout = setTimeout(() => {
                trackEvent('search', { search_term: query });
            }, 1000);
        }

        const filtered = fishData.filter(fish => {
            if (fish.notes && fish.notes.toLowerCase().includes(query)) return true;
            if (fish.scientificName && fish.scientificName.toLowerCase().includes(query)) return true;

            for (const [lang, names] of Object.entries(fish.names)) {
                if (names.some(n => n.toLowerCase().includes(query))) return true;
            }

            return false;
        });

        renderApp(filtered);
    }
});
