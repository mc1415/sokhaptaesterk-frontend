// public/admin/js/config.js

const AppConfig = {
  // Set the exchange rate. Example: 1 USD = 36.50 THB
  // This should be updated periodically or fetched from an API in a real-world scenario.
  USD_TO_THB_RATE: 36.50,
  
  // Define currency symbols
  CURRENCY_USD: {
    code: 'USD',
    symbol: '$',
    format: (value) => `$${parseFloat(value).toFixed(2)}`
  },
  CURRENCY_THB: {
    code: 'THB',
    symbol: '฿',
    format: (value) => `฿${Math.round(parseFloat(value)).toLocaleString()}` // Baht is often shown as a whole number
  },

  // The default warehouse ID for transactions. Get this from your Supabase 'warehouses' table.
  DEFAULT_WAREHOUSE_ID: 'c451f784-5f1d-4b86-823d-1e75660a6b6d', 
};