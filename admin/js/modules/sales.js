// In frontend/admin/js/modules/sales.js
document.addEventListener('DOMContentLoaded', () => {
    

    // --- Global Selections & State ---
    const user = getUser();
    const tableBody = document.getElementById('sales-table-body');
    const modal = document.getElementById('sale-details-modal');
    const modalContent = document.getElementById('sale-details-content');
    const closeBtn = modal.querySelector('.close-btn');
    let salesCache = []; // Use a cache for real data instead of mock data

    // --- Initial Setup ---
    document.getElementById('user-name').textContent = user ? user.fullName : 'Guest';
    document.getElementById('logout-btn').addEventListener('click', logout);

    // --- NEW API-DRIVEN FUNCTION ---
    async function fetchAndRenderSales() {
        try {
            tableBody.innerHTML = `<tr><td colspan="6" class="loading-cell">Loading sales history...</td></tr>`;
            
            // Call the GET endpoint we created
            const salesData = await apiFetch('/transactions/sales');
            
            salesCache = salesData; // Store the fetched data
            renderSalesTable(salesCache); // Render the table with real data
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="error-cell">Error loading sales: ${error.message}</td></tr>`;
        }
    }

    // --- MODIFIED TABLE RENDERING ---
    // This function no longer fetches, it just renders what it's given
    function renderSalesTable(sales) {
        tableBody.innerHTML = '';
        if (!sales || sales.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="loading-cell">No sales found.</td></tr>`;
            return;
        }

        sales.forEach(sale => {
            const row = document.createElement('tr');
            // Use the data fields from our backend response
            const saleTime = new Date(sale.transaction_time).toLocaleString();

            row.innerHTML = `
                <td>#${sale.receipt_number || sale.id.substring(0, 8)}</td>
                <td>${saleTime}</td>
                <td>${sale.staff_name}</td>
                <td>${formatPrice(sale.total_amount, 'THB')}</td>
                <td>${sale.payment_method}</td>
                <td>
                    <button class="btn btn-secondary btn-sm view-details-btn" data-id="${sale.id}">View Details</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- MODAL & EVENT LISTENERS ---
closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

// In sales.js
tableBody.addEventListener('click', (e) => {
    // Find the button that was clicked
    const viewBtn = e.target.closest('.view-details-btn');
    if (viewBtn) {
        const saleId = viewBtn.dataset.id;
        
        // Simply open the receipt page and pass the sale ID in the URL
        if (saleId) {
            window.open(`receipt.html?saleId=${saleId}`, '_blank');
        }
    }
});

// --- NEW MODAL RENDER FUNCTION ---
function openDetailsModal(sale) {
    let itemsHtml = '<ul class="modal-item-list">';
    
    // The items are now in sale.sale_items, and the name is directly on the item
    sale.sale_items.forEach(item => {
            itemsHtml += `<li>${item.quantity} x ${item.name_en} (@ ${formatPrice(item.price_at_sale, 'THB')})</li>`;
        });
        itemsHtml += '</ul>';

    modalContent.innerHTML = `
        <div class="detail-row"><strong>Transaction ID:</strong> <span>${sale.receipt_number}</span></div>
        <div class="detail-row"><strong>Cashier:</strong> <span>${sale.staff.full_name}</span></div>
        <div class="detail-row"><strong>Total:</strong> <span>$${parseFloat(sale.total_amount).toFixed(2)}</span></div>
        <div class="detail-row"><strong>Payment:</strong> <span>${sale.payment_method}</span></div>
        <hr>
        <h4>Items Sold:</h4>
        ${itemsHtml}
    `;
}

    // --- INITIAL LOAD ---
    fetchAndRenderSales(); // Call the new API-driven function
});