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

})