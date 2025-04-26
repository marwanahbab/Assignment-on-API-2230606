document.addEventListener('DOMContentLoaded', function () {
    var searchInput = document.getElementById('country-search');
    var searchButton = document.getElementById('search-button');
    var countriesGrid = document.getElementById('countries-grid');
    var loadingSpinner = document.getElementById('loading-spinner');
    var searchFeedback = document.getElementById('search-feedback');
    var modalOverlay = document.getElementById('modal-overlay');
    var countryDetailsContainer = document.getElementById('country-details-container');
    var modalCloseBtns = [document.getElementById('modal-close-btn'), document.getElementById('modal-close')];
