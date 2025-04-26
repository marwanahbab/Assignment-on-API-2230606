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

    function displayDetails(c, w) {
        var details = `
            <div class="modal-row">
                <div class="modal-col">
                    <img src="${c.flags.svg}" class="modal-flag" alt="${c.name.common}">
                    <h3>${c.name.common}</h3>
                    <p><strong>Official Name:</strong> ${c.name.official}</p>
                    <div><span class="badge badge-primary">${c.region}</span>${c.subregion ? `<span class="badge badge-secondary">${c.subregion}</span>` : ''}</div>
                    <p><strong>Capital:</strong> ${c.capital ? c.capital[0] : 'N/A'}</p>
                    <p><strong>Population:</strong> ${formatNumber(c.population)}</p>
                    <p><strong>Area:</strong> ${formatNumber(c.area)} km²</p>
                </div>
                <div class="modal-col">
                    <h4 class="country-info-title"><i class="fas fa-info-circle"></i> Info</h4>
                    <ul class="info-list">
                        <li><strong>Currencies:</strong> ${c.currencies ? Object.values(c.currencies).map(x => `${x.name} (${x.symbol})`).join(', ') : 'N/A'}</li>
                        <li><strong>Languages:</strong> ${c.languages ? Object.values(c.languages).join(', ') : 'N/A'}</li>
                        <li><strong>Borders:</strong> ${c.borders ? c.borders.join(', ') : 'None'}</li>
                        <li><strong>Continent:</strong> ${c.continents.join(', ')}</li>
                        <li><strong>UN Member:</strong> ${c.unMember ? 'Yes' : 'No'}</li>
                        <li><strong>Timezones:</strong> ${c.timezones.map(tz => tz.replace('UTC', 'GMT')).join(', ')}</li>
                    </ul>
                </div>
            </div>
        `;
        if (w) {
            details += `
                <div class="modal-row">
                    <div class="modal-col">
                        <h4 class="country-info-title"><i class="fas fa-cloud-sun"></i> Weather</h4>
                        <div class="weather-container">
                            <div class="weather-header">
                                <div>
                                    <span class="weather-temp">${Math.round(w.temperature)}°C</span>
                                    <p class="weather-desc">Windspeed: ${w.windspeed} km/h</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        if (c.latlng) {
            var [lat, lon] = c.latlng;
            details += `
                <div class="modal-row">
                    <div class="modal-col" style="flex:100%;">
                        <h4 class="country-info-title"><i class="fas fa-map-marker-alt"></i> Location</h4>
                        <div class="map-container">
                            <iframe width="100%" height="100%" src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-10},${lat-10},${lon+10},${lat+10}&layer=mapnik&marker=${lat},${lon}" frameborder="0" scrolling="no" allowfullscreen></iframe>
                        </div>
                    </div>
                </div>
            `;
        }
        countryDetailsContainer.innerHTML = details;
        document.getElementById('countryModalLabel').textContent = c.name.common;
        openModal();
    }

    function shuffleArray(arr) {
        return arr.slice().sort(() => Math.random() - 0.5);
    }

    function showLoading(show) {
        loadingSpinner.classList.toggle('hidden', !show);
    }

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function showNoResults() {
        countriesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Results Found</h3>
                <p>No countries match your search.</p>
            </div>
        `;
    }

    function showError(msg) {
        searchFeedback.textContent = msg;
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
    }

    function openModal() {
        modalOverlay.classList.remove('hidden');
    }
});
