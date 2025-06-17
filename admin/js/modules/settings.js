// frontend/admin/js/modules/settings.js
document.addEventListener('DOMContentLoaded', () => {
    // The master admin.js script has already handled auth and translation.

    const languageSelect = document.getElementById('language-select');
    
    if (languageSelect) {
        languageSelect.value = getCurrentLanguage(); // from i18n.js
        languageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value); // from i18n.js
        });
    }
});