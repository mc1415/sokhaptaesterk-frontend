// This function will run on every single admin page
document.addEventListener('DOMContentLoaded', async () => {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'app-loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="app-loading-card">
            <div class="app-loading-spinner" aria-hidden="true"></div>
            <div class="app-loading-text">
                <span>សូមរងចាំបន្តិច</span>
            </div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);

    try {
        if (window.warmServer) {
            await window.warmServer();
        }
    } catch (error) {
        console.warn('Server warmup failed or timed out.', error);
    } finally {
        loadingOverlay.classList.add('hidden');
        setTimeout(() => loadingOverlay.remove(), 250);
    }

    // 1. Run initial synchronous setup first
    // These functions do not depend on any asynchronous data.
    checkAuth();
    initI18n(); 

    // 2. Await the GLOBAL currency promise.
    // This promise is created and started automatically when currencyHelper.js is loaded.
    // This line will PAUSE the execution of this script until the currency data has
    // been successfully fetched and window.AppCurrencies is populated.
    // It assumes currencyHelper.js is loaded BEFORE admin.js in your HTML.
    if (window.currencyInitializationPromise) {
        await window.currencyInitializationPromise;
    } else {
        console.error("Currency system promise not found. Make sure currencyHelper.js is loaded before admin.js.");
    }

    // 3. Populate User Info in the Sidebar Footer
    // This code runs only after the currency data is ready.
    const user = getUser(); // from auth.js
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const logoutBtn = document.getElementById('logout-btn');

    if (user) {
        if (userNameEl) userNameEl.textContent = user.fullName;
        if (userRoleEl) userRoleEl.textContent = user.role;
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // The 'appReady' event is no longer necessary with this pattern,
    // as subsequent scripts will also just await the same global promise.
    // You can remove this line if you update your other scripts.
    window.dispatchEvent(new CustomEvent('appReady'));

    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    
    // Create an overlay div dynamically
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('is-open');
            overlay.classList.toggle('is-active');
        });

        // Also close the menu if the user clicks the overlay
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('is-open');
            overlay.classList.remove('is-active');
        });
    }
});
