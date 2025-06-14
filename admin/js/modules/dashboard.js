// public/admin/js/modules/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  checkAuth(); // Redirect to login if not authenticated

  const user = getUser();
  
  // --- Populate User Info ---
  document.getElementById('user-name').textContent = user ? user.fullName : 'Guest';
  document.getElementById('logout-btn').addEventListener('click', logout);

  // --- Populate Dashboard Widgets ---
  document.getElementById('daily-sales-value').textContent = `$${mockDashboardStats.dailySales.toFixed(2)}`;
  document.getElementById('low-stock-count').textContent = mockDashboardStats.lowStockItems;
  
  const topSellersList = document.getElementById('top-sellers-list');
  topSellersList.innerHTML = ''; // Clear any placeholders
  mockDashboardStats.topSellers.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name_en} - ${item.units} units`;
    topSellersList.appendChild(li);
  });
});