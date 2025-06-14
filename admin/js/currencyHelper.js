// public/admin/js/currencyHelper.js

let currentCurrency = localStorage.getItem('preferredCurrency') || 'USD';

function setCurrency(currencyCode) {
    if (currencyCode === 'USD' || currencyCode === 'THB') {
        currentCurrency = currencyCode;
        localStorage.setItem('preferredCurrency', currencyCode);
        // Dispatch a custom event so other parts of the app can react
        window.dispatchEvent(new CustomEvent('currencyChanged'));
    }
}

function formatPrice(valueInUsd) {
    if (currentCurrency === 'THB') {
        const valueInThb = valueInUsd * AppConfig.USD_TO_THB_RATE;
        return AppConfig.CURRENCY_THB.format(valueInThb);
    }
    // Default to USD
    return AppConfig.CURRENCY_USD.format(valueInUsd);
}

function createCurrencySwitcher(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    container.innerHTML = `
        <div class="currency-switcher">
            <button id="btn-usd" data-currency="USD">$ USD</button>
            <button id="btn-thb" data-currency="THB">฿ THB</button>
        </div>
    `;

    const updateActiveButton = () => {
        document.getElementById('btn-usd').classList.toggle('active', currentCurrency === 'USD');
        document.getElementById('btn-thb').classList.toggle('active', currentCurrency === 'THB');
    };

    container.addEventListener('click', (e) => {
        const currency = e.target.dataset.currency;
        if (currency) {
            setCurrency(currency);
        }
    });

    window.addEventListener('currencyChanged', updateActiveButton);
    updateActiveButton(); // Set initial state
}