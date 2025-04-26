document.addEventListener('DOMContentLoaded', function () {
    var searchInput = document.getElementById('country-search');
    var searchButton = document.getElementById('search-button');
    var countriesGrid = document.getElementById('countries-grid');
    var loadingSpinner = document.getElementById('loading-spinner');
    var searchFeedback = document.getElementById('search-feedback');
    var modalOverlay = document.getElementById('modal-overlay');
    var countryDetailsContainer = document.getElementById('country-details-container');
    var modalCloseBtns = [document.getElementById('modal-close-btn'), document.getElementById('modal-close')];

    searchButton.addEventListener('click', searchCountries);
    searchInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') searchCountries(); });
    modalCloseBtns.forEach(btn => btn && btn.addEventListener('click', closeModal));
    window.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    fetchCountries('https://restcountries.com/v3.1/all?fields=name,flags,capital,population,cca2', function (countries) {
        displayCountries(shuffleArray(countries).slice(0, 9));
    });
    
    function fetchCountries(url, callback) {
        showLoading(true);
        fetch(url)
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch'))
            .then(callback)
            .catch(err => {
                console.error(err);
                showError('Error loading data.');
            })
            .finally(() => showLoading(false));
    }
    
    function searchCountries() {
        var query = searchInput.value.trim();
        if (!query) return (searchFeedback.textContent = 'Please enter a country name');
        fetchCountries(`https://restcountries.com/v3.1/name/${query}`, function (countries) {
            displayCountries(countries);
        });
    }

    function displayCountries(countries) {
        countriesGrid.innerHTML = '';
        if (!countries.length) return showNoResults();
        countries.forEach(function (c) {
            var card = document.createElement('div');
            card.className = 'country-card';
            card.innerHTML = `
                <img src="${c.flags.svg}" class="country-flag" alt="${c.name.common}">
                <div class="card-content">
                    <h3 class="card-title">${c.name.common}</h3>
                    <p class="card-text">
                        <i class="fas fa-city"></i> Capital: ${c.capital ? c.capital[0] : 'N/A'}<br>
                        <i class="fas fa-users"></i> Population: ${formatNumber(c.population)}
                    </p>
                    <button class="more-details-btn" data-code="${c.cca2}">
                        <i class="fas fa-info-circle"></i> More Details
                    </button>
                </div>
            `;
            card.querySelector('.more-details-btn').addEventListener('click', function () {
                fetchCountryDetails(this.dataset.code);
            });
            countriesGrid.appendChild(card);
        });
    }

    function fetchCountryDetails(code) {
        showLoading(true);
        fetch(`https://restcountries.com/v3.1/alpha/${code}`)
            .then(res => res.json())
            .then(function (data) {
                var country = data[0];
                if (!country.capitalInfo || !country.capitalInfo.latlng) {
                    displayDetails(country, null);
                    return;
                }
                var [lat, lon] = country.capitalInfo.latlng;
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
                    .then(res => res.ok ? res.json() : null)
                    .then(function (weatherData) {
                        displayDetails(country, weatherData ? weatherData.current_weather : null);
                    })
                    .catch(function () {
                        displayDetails(country, null);
                    });
            })
            .catch(function (err) {
                console.error(err);
                showError('Failed to load country details.');
            })
            .finally(function () {
                showLoading(false);
            });
    }

})