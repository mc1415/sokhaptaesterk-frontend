// frontend/admin/js/modules/stock_levels.js
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP & SELECTIONS ---
    
    const user = getUser();
    let productsInventoryCache = []; // This will be our local state
    let warehousesCache = [];

    // Main Page Elements
    const tableHead = document.getElementById('stock-levels-head');
    const tableBody = document.getElementById('stock-levels-body');
    const searchInput = document.getElementById('stock-filter-input');

    // Purchase Modal Elements
    const purchaseInBtn = document.getElementById('purchase-in-btn');
    const purchaseModal = document.getElementById('purchase-modal');
    const purchaseForm = document.getElementById('purchase-form');
    const closePurchaseModalBtn = purchaseModal.querySelector('.close-btn');

    // --- 2. INITIAL SETUP ---
    document.getElementById('user-name').textContent = user ? user.fullName : 'Guest';
    document.getElementById('logout-btn').addEventListener('click', logout);

    // --- 3. DATA FETCHING & RENDERING ---
    async function fetchAndRenderData() {
        try {
            tableHead.innerHTML = `<tr><th>Loading...</th></tr>`;
            tableBody.innerHTML = ``;
            
            // This fetches FRESH data from the server every time it's called
            const [warehouses, productsInventory] = await Promise.all([
                apiFetch('/warehouses'),
                apiFetch('/products/detailed-inventory')
            ]);
            
            // THIS IS THE CRITICAL STEP: The old cache is completely replaced
            warehousesCache = warehouses || [];
            productsInventoryCache = productsInventory || [];

            // The master render function is called with the new data
            renderTable();
        } catch (error) {
            const colCount = (warehousesCache.length || 0) + 3;
            tableHead.innerHTML = `<tr><th>Error</th></tr>`;
            tableBody.innerHTML = `<tr><td colspan="${colCount}" class="error-cell">Error: ${error.message}</td></tr>`;
        }
    }

    function getLocalizedProductName(product) {
        const lang = getCurrentLanguage();
        return lang === 'km' && product.name_km ? product.name_km : product.name_en;
    }

    // Master render function that calls sub-renderers
    function renderTable() {
        renderHeader();
        renderBody();
    }

    function renderHeader() {
        tableHead.innerHTML = '';
        const headerRow = document.createElement('tr');
        
        // Use translated keys for static headers
        let headerHTML = `
            <th data-i18n-key="th_product_name_stock">Product Name</th>
            <th data-i18n-key="th_sku_stock">SKU</th>
        `;
        
        // Dynamically create a header for each warehouse
        warehousesCache.forEach(w => {
            // Use the translated prefix
            headerHTML += `<th>${i18n_translations.th_stock_prefix || 'Stock:'} ${w.name}</th>`;
        });
        
        // Add the final static header
        headerHTML += `<th data-i18n-key="th_total_stock">Total Stock</th>`;

        headerRow.innerHTML = headerHTML;
        tableHead.appendChild(headerRow);

        // CRITICAL: After adding the HTML, we must re-apply translations for the new static headers
        applyTranslations();
    }

    // This function now ONLY reads from the cache. It doesn't fetch.
    function renderBody() {
        tableBody.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();

        const filteredProducts = productsInventoryCache.filter(p => 
            p.name_en.toLowerCase().includes(searchTerm) || 
            (p.sku && p.sku.toLowerCase().includes(searchTerm))
        );

        if (filteredProducts.length === 0) {
            const colCount = warehousesCache.length + 3;
            tableBody.innerHTML = `<tr><td colspan="${colCount}" class="loading-cell">No products match your search.</td></tr>`;
            return;
        }

        filteredProducts.sort((a,b) => a.name_en.localeCompare(b.name_en));

        filteredProducts.forEach(product => {
            const row = document.createElement('tr');
            const productName = getLocalizedProductName(product);
            let rowHTML = `<td>${productName}</td><td>${product.sku || 'N/A'}</td>`;
            
            let totalStock = 0;
            const inventoryMap = new Map(product.inventory.map(inv => [inv.warehouse.id, inv.quantity]));

            warehousesCache.forEach(warehouse => {
                const quantity = inventoryMap.get(warehouse.id) || 0;
                rowHTML += `<td>${quantity}</td>`;
                totalStock += quantity;
            });

            rowHTML += `<td><strong>${totalStock}</strong></td>`;
            row.innerHTML = rowHTML;
            tableBody.appendChild(row);
        });
    }

    // --- 4. PURCHASE MODAL LOGIC ---
    function openPurchaseModal() {
        const productSelect = document.getElementById('purchase-product');
        const warehouseSelect = document.getElementById('purchase-warehouse');
        
        productSelect.innerHTML = '<option value="" disabled selected>Select a product...</option>';
        // Populate with the latest products from the cache
        productsInventoryCache.forEach(p => {
            productSelect.innerHTML += `<option value="${p.id}">${productName} (SKU: ${p.sku})</option>`;
        });

        warehouseSelect.innerHTML = '<option value="" disabled selected>Select receiving warehouse...</option>';
        warehousesCache.forEach(w => {
            warehouseSelect.innerHTML += `<option value="${w.id}">${w.name}</option>`;
        });

        purchaseForm.reset();
        purchaseModal.style.display = 'block';
    }

    async function handlePurchaseSubmit(e) {
        e.preventDefault();
        const purchaseData = {
            product_id: document.getElementById('purchase-product').value,
            warehouse_id: document.getElementById('purchase-warehouse').value,
            adjustment_quantity: parseInt(document.getElementById('purchase-quantity').value),
            reason: 'purchase_in',
            notes: document.getElementById('purchase-notes').value
        };

        if (!purchaseData.product_id || !purchaseData.warehouse_id || !purchaseData.adjustment_quantity || purchaseData.adjustment_quantity <= 0) {
            alert('Please select a product, warehouse, and enter a valid quantity.');
            return;
        }

        try {
            await apiFetch('/transactions/stock', {
                method: 'POST',
                body: JSON.stringify(purchaseData)
            });
            alert('Stock added successfully!');
            purchaseModal.style.display = 'none';
            // THIS IS THE FIX: Call the function that gets fresh data from the server
            fetchAndRenderData(); 
        } catch (error) {
            alert(`Failed to add stock: ${error.message}`);
        }
    }

    // --- 5. EVENT LISTENERS ---
    searchInput.addEventListener('input', renderBody); // Search filters the current cache, which is fast
    purchaseInBtn.addEventListener('click', openPurchaseModal);
    closePurchaseModalBtn.addEventListener('click', () => purchaseModal.style.display = 'none');
    purchaseForm.addEventListener('submit', handlePurchaseSubmit);

    // --- 6. INITIAL LOAD ---
    fetchAndRenderData();
});