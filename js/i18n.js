// js/i18n.js
const translations = {
  en: {
    "products": "Products",
    "about_us": "About Us",
    "contact": "Contact",
    "search_placeholder": "Search for products...",
    "view_details": "View Details",
    "in_stock": "In Stock",
    "limited_stock": "Limited Stock",
    "out_of_stock": "Out of Stock",
    "inquire_at_store": "Inquire at Store",
    "dashboard": "Dashboard",
    "inventory": "Inventory",
    "sales": "Sales",
    "pos_system": "POS System",
    "daily_sales": "Daily Sales",
    "top_selling_products": "Top Selling Products",
    "low_stock_alerts": "Low Stock Alerts"
  },
  km: {
    "products": "ផលិតផល",
    "about_us": "អំពី​យើង",
    "contact": "ទំនាក់ទំនង",
    "search_placeholder": "ស្វែងរកផលិតផល...",
    "view_details": "មើលលម្អិត",
    "in_stock": "មានក្នុងស្តុក",
    "limited_stock": "ស្តុកមានកំណត់",
    "out_of_stock": "អស់ពីស្តុក",
    "inquire_at_store": "សាកសួរនៅហាង",
    "dashboard": "ផ្ទាំងគ្រប់គ្រង",
    "inventory": "ស្តុកទំនិញ",
    "sales": "ការលក់",
    "pos_system": "ប្រព័ន្ធ POS",
    "daily_sales": "ការលក់ប្រចាំថ្ងៃ",
    "top_selling_products": "ផលិតផលលក់ដាច់បំផុត",
    "low_stock_alerts": "ការជូនเตือนស្តុកទាប"
  }
};

let currentLanguage = localStorage.getItem('language') || 'en';

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
  document.body.className = lang === 'km' ? 'lang-km' : '';

  // Update static text
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translations[lang][key] || key;
    } else {
        el.textContent = translations[lang][key] || key;
    }
  });

  // Update dynamic text (e.g., product names)
  document.querySelectorAll('[data-en], [data-km]').forEach(el => {
      el.textContent = el.getAttribute(`data-${lang}`);
  });

  // Update active button style
  document.querySelectorAll('.lang-switcher button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}