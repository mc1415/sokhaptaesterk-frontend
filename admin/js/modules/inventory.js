// public/admin/js/modules/inventory.js
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // --- Global Selections & State ---
    const user = getUser();
    const tableBody = document.getElementById('inventory-table-body');
    // ... (keep all other modal and form element selections) ...
    const adjustmentModal = document.getElementById('adjustment-modal');
    const adjustStockBtn = document.getElementById('adjust-stock-btn');
    const adjustmentForm = document.getElementById('adjustment-form');
    let productCache = []; // To store fetched products

    // --- Initial Setup ---
    document.getElementById('user-name').textContent = user ? user.fullName : 'Guest';
    document.getElementById('logout-btn').addEventListener('click', logout);

    // --- API-Driven Functions ---
    async function fetchAndRenderInventory() {
        try {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">Loading inventory...</td></tr>`;
            
            // This is the real API call to your protected endpoint
            const products = await apiFetch('/products'); 
            
            productCache = products; // Save the data
            renderInventoryTable(products);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding: 2rem;">Error loading inventory: ${error.message}</td></tr>`;
        }
    }


    async function handleStockAdjustment(e) {
        e.preventDefault();
        const productId = document.getElementById('adjustment-product').value;
        const adjustmentType = document.getElementById('adjustment-type').value;
        let quantity = parseInt(document.getElementById('adjustment-quantity').value);
        const notes = document.getElementById('adjustment-notes').value;

        if (!productId || !quantity) {
            alert('Please fill out all fields.');
            return;
        }

        // The backend expects a positive or negative number based on the action
        if (adjustmentType === 'damage_spoilage') {
            quantity = -quantity;
        }
        
        try {
            await apiFetch('/transactions/stock', {
                method: 'POST',
                body: JSON.stringify({ 
                    product_id: productId, 
                    warehouse_id: 'YOUR_DEFAULT_WAREHOUSE_ID', // You need to have a default warehouse ID
                    adjustment_quantity: quantity, 
                    reason: adjustmentType, 
                    notes: notes 
                })
            });

            alert('Stock adjusted successfully!');
            adjustmentModal.style.display = 'none';
            fetchAndRenderInventory(); // Refresh the table
        } catch (error) {
            alert(`Failed to adjust stock: ${error.message}`);
        }
    }


    // --- Main Render Function (No major change, just what it's called with) ---
    function renderInventoryTable(products) {
        tableBody.innerHTML = '';
        if (!products || products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No products found in the database.</td></tr>`;
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            
            const stock = product.total_stock; // Use the field name from the API response
            let stockClass = '';
            if (stock <= 0) stockClass = 'out';
            else if (stock < 100) stockClass = 'low'; // Assuming 100 is the reorder point

            row.innerHTML = `
                <td>${product.sku}</td>
                <td>${product.name_en}</td>
                <td>${product.category}</td>
                <td>$${parseFloat(product.selling_price).toFixed(2)}</td>
                <td><span class="stock-level ${stockClass}">${stock}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm edit-btn" data-id="${product.id}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${product.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- Event Listeners ---
    // ... (keep all your modal opening/closing listeners) ...
    const openAdjustmentModal = () => { // Modified to use productCache
        const adjustmentProductSelect = document.getElementById('adjustment-product');
        adjustmentProductSelect.innerHTML = '<option value="" disabled selected>Select a product...</option>';
        productCache.sort((a, b) => a.name_en.localeCompare(b.name_en));
        productCache.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name_en} (SKU: ${product.sku})`;
            adjustmentProductSelect.appendChild(option);
        });
        adjustmentForm.reset();
        adjustmentModal.style.display = 'block';
    };
    adjustStockBtn.addEventListener('click', openAdjustmentModal);
    adjustmentForm.addEventListener('submit', handleStockAdjustment);


    // --- Initial Load ---
    fetchAndRenderInventory();
});