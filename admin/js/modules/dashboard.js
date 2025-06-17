// frontend/admin/js/modules/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    

    // --- 1. SETUP & SELECTIONS ---
    const user = getUser();
    const salesTodayEl = document.getElementById('sales-today');
    const salesMonthEl = document.getElementById('sales-month');
    const lowStockCountEl = document.getElementById('low-stock-count');
    const lowStockListEl = document.getElementById('low-stock-list');
    const topProductsChartCanvas = document.getElementById('top-products-chart').getContext('2d');

    // --- 2. INITIAL SETUP ---
    document.getElementById('user-name').textContent = user ? user.fullName : 'Guest';
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('date-display').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // --- 3. DATA FETCHING ---
    async function fetchDashboardData() {
        try {
            // Set initial loading states
            salesTodayEl.textContent = '...';
            salesMonthEl.textContent = '...';
            lowStockCountEl.textContent = '...';
            lowStockListEl.innerHTML = '<li>Loading...</li>';
            
            // Fetch the consolidated summary data from the backend
            const summary = await apiFetch('/dashboard/summary');
            
            // Populate the UI with the fetched data
            populateWidgets(summary);
            renderTopProductsChart(summary.top_selling_products);

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Display an error message directly on the page
            document.querySelector('.main-content').innerHTML = `<div class="content-card"><p class="error-cell">Could not load dashboard data: ${error.message}</p></div>`;
        }
    }

    // --- 4. UI POPULATION ---
    function populateWidgets(data) {
        // Use the formatPrice helper for all currency values
        salesTodayEl.textContent = formatPrice(data.sales_today, 'THB');
        salesMonthEl.textContent = formatPrice(data.sales_this_month, 'THB');
        lowStockCountEl.textContent = data.low_stock_item_count;

        lowStockListEl.innerHTML = ''; // Clear loading message
        if (data.low_stock_items && data.low_stock_items.length > 0) {
            data.low_stock_items.forEach(item => {
                const li = document.createElement('li');
                // Use the column names from the 'inventory_view' query
                li.innerHTML = `${item.product_name} <span>(Only ${item.quantity} left)</span>`;
                lowStockListEl.appendChild(li);
            });
        } else {
            lowStockListEl.innerHTML = '<li>All stock levels are healthy!</li>';
        }
    }

    // --- 5. CHART RENDERING ---
    function renderTopProductsChart(products) {
        const chartContainer = document.querySelector('.chart-container');
        if (!products || products.length === 0) {
            // If there's no data, remove the canvas and show a message
            const canvas = document.getElementById('top-products-chart');
            if (canvas) canvas.style.display = 'none';
            chartContainer.innerHTML += '<p style="text-align:center; padding: 2rem;">No sales data available for the last 30 days.</p>';
            return;
        }

        // Use the column names from your SQL function's return TABLE
        const labels = products.map(p => p.product_name);
        const data = products.map(p => p.total_quantity_sold);

        new Chart(topProductsChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Units Sold',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bar chart is best for long product names
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0 // Show only whole numbers for units
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // --- 6. INITIAL LOAD ---
    fetchDashboardData();
});