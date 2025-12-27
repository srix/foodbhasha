
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cardView = document.getElementById('card-view');
    const tableView = document.getElementById('table-view');
    const btnCardView = document.getElementById('btn-card-view');
    const btnTableView = document.getElementById('btn-table-view');
    const searchInput = document.getElementById('search-input');
    const fishTableBody = document.getElementById('fish-table-body');
    const noResults = document.getElementById('no-results');

    let fishData = [];

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

            // Build names grid HTML
            const namesHtml = Object.entries(fish.names).map(([lang, names]) => {
                if (lang === 'english') return ''; // Skip English in grid as it's in header
                return `
                    <div class="lang-group">
                        <span class="lang-label">${lang}</span>
                        <span class="lang-value">${names.join(' / ')}</span>
                    </div>
                 `;
            }).join('');

            card.innerHTML = `
                <div class="fish-header">
                    <img src="${fish.photo}" alt="${fish.names.english[0]}" class="fish-thumbnail" onerror="this.src='https://placehold.co/60x60?text=Fish'">
                    <div class="fish-title">
                        <h2>${fish.names.english.join(' / ')}</h2>
                        <div class="scientific-name">${fish.scientificName}</div>
                    </div>
                </div>
                <div class="fish-names-grid">
                    ${namesHtml}
                </div>
                ${fish.notes ? `<div class="fish-notes">💡 ${fish.notes}</div>` : ''}
            `;
            cardView.appendChild(card);
        });
    }

    function renderTable(data) {
        fishTableBody.innerHTML = '';
        data.forEach(fish => {
            const row = document.createElement('tr');

            // Helper to get string
            const getNames = (lang) => fish.names[lang] ? fish.names[lang].join('<br>') : '-';

            row.innerHTML = `
                <td class="sticky-col">
                    <div class="table-fish-name">
                        <span>${fish.names.english[0]}</span>
                        <img src="${fish.photo}" class="table-thumb" onerror="this.src='https://placehold.co/80x80?text=F'">
                    </div>
                </td>
                <td>${getNames('tamil')}</td>
                <td>${getNames('malayalam')}</td>
                <td>${getNames('kannada')}</td>
                <td>${fish.notes || '-'}</td>
            `;
            fishTableBody.appendChild(row);
        });
    }

    function switchView(view) {
        localStorage.setItem('fishView', view);
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
            // Search in top-level fields
            if (fish.notes && fish.notes.toLowerCase().includes(query)) return true;
            if (fish.scientificName && fish.scientificName.toLowerCase().includes(query)) return true;

            // Search in names object
            for (const [lang, names] of Object.entries(fish.names)) {
                if (names.some(n => n.toLowerCase().includes(query))) return true;
            }

            return false;
        });

        renderApp(filtered);
    }
});
