// In frontend/js/currencyHelper.js

/**
 * Gets the currently selected currency from localStorage.
 * @returns {string} The currency code (e.g., 'THB', 'USD').
 */
function getCurrentCurrency() {
    return localStorage.getItem('userCurrency') || AppConfig.BASE_CURRENCY;
}

/**
 * Sets the new currency, saves it, and notifies the application of the change.
 * @param {string} currencyCode The new currency code to set.
 */
function setCurrency(currencyCode) {
    if (AppConfig.SUPPORTED_CURRENCIES[currencyCode]) {
        localStorage.setItem('userCurrency', currencyCode);
        // Dispatch a custom event that other parts of the app can listen for.
        window.dispatchEvent(new CustomEvent('currencyChanged'));
    }
}

/**
 * Formats a price from the base currency (THB) into the target currency.
 * @param {number} basePrice The price in the application's base currency (THB).
 * @param {string} targetCurrencyCode The currency to display the price in.
 * @returns {string} The formatted price string (e.g., "฿37", "$1.00").
 */
function formatPrice(basePrice, targetCurrencyCode) {
    const currencyInfo = AppConfig.SUPPORTED_CURRENCIES[targetCurrencyCode];
    if (!currencyInfo) {
        console.error(`Currency ${targetCurrencyCode} not supported.`);
        return `${basePrice}`; // Fallback
    }

    const convertedPrice = basePrice * currencyInfo.rate;
    const symbol = currencyInfo.symbol;

    if (targetCurrencyCode === 'THB') {
        const formattedNumber = convertedPrice.toLocaleString('en-US', { maximumFractionDigits: 0 });
        return `${symbol}${formattedNumber}`;
    }

    if (targetCurrencyCode === 'USD') {
        return `${symbol}${convertedPrice.toFixed(2)}`;
    }

    // Default formatting for any other currencies
    return `${symbol}${convertedPrice.toLocaleString()}`;
}


/**
 * Creates the button-based currency switcher UI and attaches event listeners.
 * @param {string} containerId The ID of the HTML element to build the switcher in.
 */
function createCurrencySwitcher(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create buttons for each supported currency
    let buttonsHtml = '';
    for (const code in AppConfig.SUPPORTED_CURRENCIES) {
        const currency = AppConfig.SUPPORTED_CURRENCIES[code];
        buttonsHtml += `<button class="currency-btn" data-currency="${code}">${currency.symbol} ${code}</button>`;
    }
    
    container.innerHTML = `<div class="currency-switcher">${buttonsHtml}</div>`;

    const updateActiveButton = () => {
        const current = getCurrentCurrency();
        container.querySelectorAll('.currency-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.currency === current);
        });
    };

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('currency-btn')) {
            const currency = e.target.dataset.currency;
            if (currency) {
                setCurrency(currency);
            }
        }
    });

    // When another part of the app changes the currency, update the buttons' active state.
    window.addEventListener('currencyChanged', updateActiveButton);
    
    // Set the initial active button state on page load.
    updateActiveButton();
}