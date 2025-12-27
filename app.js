
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cardView = document.getElementById('card-view');
    const tableView = document.getElementById('table-view');
    const btnCardView = document.getElementById('btn-card-view');
    const btnTableView = document.getElementById('btn-table-view');
    const searchInput = document.getElementById('search-input');
    const fishTable = document.getElementById('fish-table');
    const fishTableHead = fishTable.querySelector('thead tr');
    const fishTableBody = document.getElementById('fish-table-body');
    const noResults = document.getElementById('no-results');

    // Column Controls
    const viewControls = document.getElementById('view-controls');
    const btnCustomizeCols = document.getElementById('btn-customize-cols');
    const colDialog = document.getElementById('column-selector-dialog');
    const colCheckboxes = document.getElementById('column-checkboxes');
    const btnCloseCols = document.getElementById('btn-close-cols');

    let fishData = [];

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

    const DEFAULT_LANGUAGES = ["hindi", "tamil", "malayalam", "kannada", "telugu"];

    // State
    let activeTableLanguages = JSON.parse(localStorage.getItem('fishTableLanguages')) || DEFAULT_LANGUAGES;
    let activeCardLanguages = JSON.parse(localStorage.getItem('fishCardLanguages')) || DEFAULT_LANGUAGES;
    let currentView = 'card';

    // Initialize
    init();

    async function init() {
        try {
            const response = await fetch('data/fish.json');
            fishData = await response.json();

            // Restore view state
            const savedView = localStorage.getItem('fishView') || 'card';
            renderApp(fishData);
            switchView(savedView); // Set correct view after render
        } catch (error) {
            console.error('Failed to load fish data:', error);
            cardView.innerHTML = '<p class="error">Failed to load data. Please try again.</p>';
        }

        // Event Listeners
        btnCardView.addEventListener('click', () => switchView('card'));
        btnTableView.addEventListener('click', () => switchView('table'));
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
        renderTable(data);

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
                    <img src="${fish.photo}" alt="${fish.names.english[0]}" class="fish-thumbnail" onerror="this.src='https://placehold.co/60x60?text=Fish'">
                    <div class="fish-title">
                        <h2>${fish.names.english.join(' / ')}</h2>
                        <div class="scientific-name">${fish.scientificName}</div>
                    </div>
                </div>
                
                <div class="fish-names-grid">
                    ${renderGrid(primaryLangs)}
                </div>
                
                ${otherLangs.length > 0 ? `
                    <details class="more-langs">
                        <summary>Show all 22 languages</summary>
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

    function renderTable(data) {
        // Render Header
        fishTableHead.innerHTML = `
            <th class="sticky-col">Fish</th>
            ${activeTableLanguages.map(lang => `<th>${lang.charAt(0).toUpperCase() + lang.slice(1)}</th>`).join('')}
            <th>Details</th>
        `;

        // Render Body
        fishTableBody.innerHTML = '';
        data.forEach(fish => {
            const row = document.createElement('tr');

            const cols = activeTableLanguages.map(lang => {
                const val = fish.names[lang] ? fish.names[lang].join('<br>') : '-';
                return `<td>${val}</td>`;
            }).join('');

            row.innerHTML = `
                <td class="sticky-col">
                    <div class="table-fish-name">
                        <span>${fish.names.english[0]}</span>
                        <img src="${fish.photo}" class="table-thumb" onerror="this.src='https://placehold.co/80x80?text=F'">
                    </div>
                </td>
                ${cols}
                <td>${fish.notes || '-'}</td>
            `;
            fishTableBody.appendChild(row);
        });
    }

    function renderColumnSelector() {
        const activeList = currentView === 'card' ? activeCardLanguages : activeTableLanguages;

        colCheckboxes.innerHTML = SUPPORTED_LANGUAGES.map(lang => `
            <label class="col-option">
                <input type="checkbox" value="${lang}" ${activeList.includes(lang) ? 'checked' : ''}>
                ${LANGUAGE_DISPLAY_NAMES[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)}
            </label>
        `).join('');

        colCheckboxes.querySelectorAll('input').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const lang = e.target.value;
                const isChecked = e.target.checked;

                if (currentView === 'card') {
                    if (isChecked) {
                        if (!activeCardLanguages.includes(lang)) activeCardLanguages.push(lang);
                    } else {
                        activeCardLanguages = activeCardLanguages.filter(l => l !== lang);
                    }
                    localStorage.setItem('fishCardLanguages', JSON.stringify(activeCardLanguages));
                    renderCards(fishData);
                } else {
                    if (isChecked) {
                        if (!activeTableLanguages.includes(lang)) activeTableLanguages.push(lang);
                    } else {
                        activeTableLanguages = activeTableLanguages.filter(l => l !== lang);
                    }
                    localStorage.setItem('fishTableLanguages', JSON.stringify(activeTableLanguages));
                    renderTable(fishData);
                }
            });
        });
    }

    function switchView(view) {
        currentView = view;
        localStorage.setItem('fishView', view);

        // Update View Controls Visibility - always visible now
        viewControls.hidden = false;

        // Close the dialog when switching views to avoid confusion
        colDialog.hidden = true;

        if (view === 'card') {
            cardView.hidden = false;
            tableView.hidden = true;
            btnCardView.classList.add('active');
            btnTableView.classList.remove('active');
        } else {
            cardView.hidden = true;
            tableView.hidden = false;
            btnCardView.classList.remove('active');
            btnTableView.classList.add('active');
        }
    }

    function handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();

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
