// In frontend/js/config.js

const AppConfig = {
    // 1. Change the BASE_CURRENCY to 'THB'
    BASE_CURRENCY: 'THB',
    
    SUPPORTED_CURRENCIES: {
        // 2. Define THB (Thai Baht) as the new base currency. Its rate is 1.0.
        'THB': {
            symbol: '฿', // Baht symbol
            name: 'Thai Baht',
            rate: 1.0 
        },
        // 3. Define USD relative to THB.
        // If 1 USD = 36.75 THB, then 1 THB = 1/36.75 USD.
        'USD': {
            symbol: '$',
            name: 'US Dollar',
            rate: 1 / 36.75 // ~0.0272. Let the computer do the math.
        },
        // 4. Define KHR relative to THB.
        // If 1 THB = 112 KHR (example), set the rate directly.
        'KHR': {
            symbol: '៛',
            name: 'Cambodian Riel',
            rate: 112.0 // Example rate: 1 THB = 112 KHR
        }
    }
};