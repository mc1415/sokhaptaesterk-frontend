// frontend/admin/js/admin.js

// This function will run on every single admin page
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Authentication First
    // This function is defined in auth.js and redirects if not logged in.
    checkAuth();

    // 3. Initialize Internationalization (i18n)
    // This function is defined in i18n.js and translates the page.
    initI18n(); 

    // 4. Populate User Info in the Sidebar Footer
    // This is now done globally here instead of in every page-specific script.
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
});