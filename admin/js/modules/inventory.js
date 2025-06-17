// frontend/admin/js/modules/inventory.js
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP & GLOBAL SELECTIONS ---
    
    const user = getUser();
    let productCache = [];
    let warehousesCache = []; // To store warehouse list for modals

    // Page Elements
    const tableBody = document.getElementById('inventory-table-body');
    const addProductBtn = document.getElementById('add-product-btn');

    // Product Modal Elements
    const productModal = document.getElementById('product-modal');
    const productModalTitle = document.getElementById('product-modal-title');
    const productForm = document.getElementById('product-form');
    const closeProductModalBtn = productModal.querySelector('.close-btn');

    // --- 2. INITIAL PAGE SETUP ---
    document.getElementById('user-name').textContent = user ? user.fullName : 'Guest';
    document.getElementById('logout-btn').addEventListener('click', logout);

    // --- 3. CORE DATA FETCHING ---
    async function fetchInitialData() {
        try {
            tableBody.innerHTML = `<tr><td colspan="6" class="loading-cell">Loading inventory...</td></tr>`;
            // Fetch products and warehouses in parallel for better performance
            const [products, warehouses] = await Promise.all([
                apiFetch('/products'),
                apiFetch('/warehouses') // Assumes a GET /api/warehouses endpoint exists
            ]);
            
            productCache = products || [];
            warehousesCache = warehouses || [];
            
            renderInventoryTable(productCache);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="error-cell">Error loading inventory: ${error.message}</td></tr>`;
        }
    }

    function getLocalizedProductName(product) {
        const lang = getCurrentLanguage(); // from i18n.js
        // If language is Khmer and name_km exists, use it. Otherwise, default to English.
        return lang === 'km' && product.name_km ? product.name_km : product.name_en;
    }
    
    // --- 4. RENDERING & MODAL LOGIC ---
    function renderInventoryTable(products) {
        tableBody.innerHTML = '';
        if (!products || products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="loading-cell">No products found. Add one to get started!</td></tr>`;
            return;
        }

        // Sort products alphabetically for easier viewing
        products.sort((a, b) => a.name_en.localeCompare(b.name_en));

        products.forEach(product => {
            const row = document.createElement('tr');
            const stock = product.total_stock;
            let stockClass = '';
            if (!product.is_active) stockClass = 'inactive';
            else if (stock <= 0) stockClass = 'out';
            else if (stock < product.reorder_point) stockClass = 'low';

            // Add a class to the row if the product is inactive
            if (!product.is_active) row.classList.add('inactive-row');

            const productName = getLocalizedProductName(product);

            row.innerHTML = `
                <td>${product.sku}</td>
                <td>${productName}</td>
                <td>${product.category}</td>
                <td>${formatPrice(product.selling_price, 'THB')}</td>
                <td><span class="stock-level ${stockClass}">${stock}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm edit-btn" data-id="${product.id}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${product.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- Product Modal Logic ---
    function openProductModal(product = null) {
        productForm.reset();
        document.getElementById('product-is-active').checked = true;

        if (product) { // Editing an existing product
            productModalTitle.textContent = 'Edit Product';
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name-en').value = product.name_en;
            document.getElementById('product-name-km').value = product.name_km || '';
            document.getElementById('product-sku').value = product.sku;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-selling-price').value = product.selling_price;
            document.getElementById('product-purchase-price').value = product.purchase_price || 0;
            document.getElementById('product-reorder-point').value = product.reorder_point || 10;
            document.getElementById('product-image-url').value = product.image_url || '';
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-is-active').checked = product.is_active;
        } else { // Adding a new product
            productModalTitle.textContent = 'Add New Product';
            document.getElementById('product-id').value = '';
        }
        productModal.style.display = 'block';
    }

    // --- Adjustment Modal Logic ---
    function openAdjustmentModal() {
        const productSelect = document.getElementById('adjustment-product');
        const warehouseSelect = document.getElementById('adjustment-warehouse');
        
        // Populate products dropdown
        productSelect.innerHTML = '<option value="" disabled selected>Select a product...</option>';
        productCache.forEach(p => {
            productSelect.innerHTML += `<option value="${p.id}">${p.name_en} (SKU: ${p.sku})</option>`;
        });

        // Populate warehouses dropdown
        warehouseSelect.innerHTML = '<option value="" disabled selected>Select a warehouse...</option>';
        warehousesCache.forEach(w => {
            warehouseSelect.innerHTML += `<option value="${w.id}">${w.name}</option>`;
        });

        adjustmentForm.reset();
        adjustmentModal.style.display = 'block';
    }

    // --- 5. EVENT HANDLERS (API Calls) ---
    
    // Handles submission for both Adding and Editing products
    async function handleProductFormSubmit(e) {
        e.preventDefault();
        const productId = document.getElementById('product-id').value;
        const productData = {
            name_en: document.getElementById('product-name-en').value,
            name_km: document.getElementById('product-name-km').value,
            sku: document.getElementById('product-sku').value,
            category: document.getElementById('product-category').value,
            selling_price: parseFloat(document.getElementById('product-selling-price').value),
            purchase_price: parseFloat(document.getElementById('product-purchase-price').value) || 0,
            reorder_point: parseInt(document.getElementById('product-reorder-point').value) || 10,
            image_url: document.getElementById('product-image-url').value,
            description: document.getElementById('product-description').value,
            is_active: document.getElementById('product-is-active').checked,
        };

        const method = productId ? 'PUT' : 'POST';
        const endpoint = productId ? `/products/${productId}` : '/products';

        try {
            await apiFetch(endpoint, {
                method: method,
                body: JSON.stringify(productData)
            });
            alert(`Product ${productId ? 'updated' : 'added'} successfully!`);
            productModal.style.display = 'none';
            fetchInitialData(); // Refresh the entire table
        } catch (error) {
            alert(`Error saving product: ${error.message}`);
        }
    }

    // Handles submission for stock adjustments
    async function handleStockAdjustment(e) {
        e.preventDefault();
        let quantity = parseInt(document.getElementById('adjustment-quantity').value);
        if (document.getElementById('adjustment-type').value.includes('out')) {
            quantity = -Math.abs(quantity); // Ensure quantity is negative for stock out
        }

        const adjustmentData = {
            product_id: document.getElementById('adjustment-product').value,
            warehouse_id: document.getElementById('adjustment-warehouse').value,
            adjustment_quantity: quantity,
            reason: document.getElementById('adjustment-type').value,
            notes: document.getElementById('adjustment-notes').value
        };
        
        try {
            await apiFetch('/transactions/stock', {
                method: 'POST',
                body: JSON.stringify(adjustmentData)
            });
            alert('Stock adjusted successfully!');
            adjustmentModal.style.display = 'none';
            fetchInitialData(); // Refresh the table
        } catch (error) {
            alert(`Failed to adjust stock: ${error.message}`);
        }
    }

    // --- 6. ATTACH EVENT LISTENERS ---

    // Main page buttons
    addProductBtn.addEventListener('click', () => openProductModal());

    // Modal close buttons
    closeProductModalBtn.addEventListener('click', () => productModal.style.display = 'none');
    
    // Form submission listeners
    productForm.addEventListener('submit', handleProductFormSubmit);
    
    // Event delegation for dynamically created Edit and Delete buttons
    tableBody.addEventListener('click', async (e) => {
        const target = e.target;
        const productId = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const productToEdit = productCache.find(p => p.id === productId);
            if (productToEdit) {
                openProductModal(productToEdit);
            }
        }

        if (target.classList.contains('delete-btn')) {
            const product = productCache.find(p => p.id === productId);
            if (confirm(`Are you sure you want to delete "${product.name_en}"? This action will deactivate the product.`)) {
                try {
                    await apiFetch(`/products/${productId}`, { method: 'DELETE' });
                    alert('Product deactivated successfully.');
                    fetchInitialData(); // Refresh table
                } catch (error) {
                    alert(`Failed to delete product: ${error.message}`);
                }
            }
        }
    });

    // --- 7. INITIAL DATA LOAD ---
    fetchInitialData();
});