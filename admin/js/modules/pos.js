// In frontend/admin/js/modules/pos.js
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CHECK AUTH & GET USER ---
    checkAuth();
    const user = getUser();

    // --- 2. DEFINE STATE VARIABLES ---
    let productCache = [];
    let cart = [];

    // --- 3. SELECT ALL HTML ELEMENTS AT THE TOP ---
    const productGrid = document.getElementById('product-grid');
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.querySelector('.empty-cart-message');
    const chargeBtn = document.getElementById('charge-btn');
    const cancelSaleBtn = document.getElementById('cancel-sale-btn');
    const userNameSpan = document.getElementById('user-name');
    
    // Modal Elements
    const paymentModal = document.getElementById('payment-modal');
    const closeModalBtn = document.querySelector('#payment-modal .close-btn');
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTax = document.getElementById('summary-tax');
    const summaryTotal = document.getElementById('summary-total');
    const paymentTotalDue = document.getElementById('payment-total-due');

    // --- 4. INITIAL PAGE SETUP ---
    userNameSpan.textContent = user ? user.fullName : 'Guest';

    // --- 5. DEFINE ALL FUNCTIONS ---

    async function fetchProductsAndRender() {
        try {
            productGrid.innerHTML = `<p>Loading products...</p>`;
            const products = await apiFetch('/products');
            productCache = products || []; // Ensure it's an array even if API returns null
            renderProducts(productCache);
        } catch (error) {
            productGrid.innerHTML = `<p style="color:red; text-align:center;">Could not load products. (${error.message})</p>`;
        }
    }

    function renderProducts(products) {
        productGrid.innerHTML = '';
        if (products.length === 0) {
            productGrid.innerHTML = '<p>No products available.</p>';
            return;
        }

        products.forEach(product => {
            const productTile = document.createElement('div');
            productTile.className = 'product-tile';
            productTile.dataset.productId = product.id; // Use data attribute
            productTile.innerHTML = `
                <img src="${product.image_url || '../assets/images/placeholder.png'}" alt="${product.name_en}">
                <div class="product-tile-name">${product.name_en}</div>
                <div class="product-tile-price">$${parseFloat(product.selling_price).toFixed(2)}</div>
            `;
            productTile.addEventListener('click', () => addToCart(product.id));
            productGrid.appendChild(productTile);
        });
    }

    function addToCart(productId) {
        const product = productCache.find(p => p.id === productId);
        if (!product) return;

        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        renderCart();
    }

    function updateCartItemQuantity(productId, newQuantity) {
        const cartItem = cart.find(item => item.id === productId);
        if (!cartItem) return;

        if (newQuantity <= 0) {
            // Remove item from cart if quantity is 0 or less
            cart = cart.filter(item => item.id !== productId);
        } else {
            cartItem.quantity = newQuantity;
        }
        renderCart();
    }

    function renderCart() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            emptyCartMessage.style.display = 'block';
            chargeBtn.disabled = true;
        } else {
            emptyCartMessage.style.display = 'none';
            chargeBtn.disabled = false;
            cartItemsContainer.innerHTML = '';

            cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
                const itemTotal = item.selling_price * item.quantity;

                cartItemElement.innerHTML = `
                    <div class="cart-item-details">
                        <span class="cart-item-name">${item.name_en}</span>
                        <span class="cart-item-price">$${parseFloat(item.selling_price).toFixed(2)}</span>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn decrease-btn" data-id="${item.id}">-</button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="quantity-btn increase-btn" data-id="${item.id}">+</button>
                    </div>
                    <span class="cart-item-total">$${itemTotal.toFixed(2)}</span>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });
        }
        updateCartSummary();
    }

    function updateCartSummary() {
        const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
        const tax = subtotal * 0.00;
        const total = subtotal + tax;

        summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
        summaryTax.textContent = `$${tax.toFixed(2)}`;
        summaryTotal.textContent = `$${total.toFixed(2)}`;
        paymentTotalDue.textContent = `$${total.toFixed(2)}`;
    }

    function clearSale() {
        cart = [];
        renderCart();
    }
    
    async function completeSale() {
        if (cart.length === 0) return;
        
        toggleButtonLoading(confirmPaymentBtn, true, 'Confirm Payment & New Sale');

        const totalAmount = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
        const saleItemsPayload = cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price_at_sale: item.selling_price
        }));

        try {
            await apiFetch('/transactions/sales', {
                method: 'POST',
                body: JSON.stringify({
                    warehouse_id: 'c451f784-5f1d-4b86-823d-1e75660a6b6d',
                    user_id: user.id,
                    sale_items: saleItemsPayload,
                    total_amount: totalAmount,
                    payment_method: document.getElementById('payment-method').value
                })
            });
            alert('Sale processed successfully!');
            clearSale();
            paymentModal.style.display = 'none';
            fetchProductsAndRender();
        } catch (error) {
            alert(`Sale failed: ${error.message}`);
        } finally {
            toggleButtonLoading(confirmPaymentBtn, false, 'Confirm Payment & New Sale');
        }
    }

    function toggleButtonLoading(button, isLoading, originalText) {
        if (isLoading) {
            button.disabled = true;
            button.textContent = 'Processing...';
        } else {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    // --- 6. SETUP EVENT LISTENERS ---

    // Listener for quantity buttons in the cart (using event delegation)
    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target;
        const productId = target.dataset.id;
        if (!productId) return;

        const cartItem = cart.find(item => item.id === productId);
        if (!cartItem) return;

        if (target.classList.contains('increase-btn')) {
            updateCartItemQuantity(productId, cartItem.quantity + 1);
        } else if (target.classList.contains('decrease-btn')) {
            updateCartItemQuantity(productId, cartItem.quantity - 1);
        }
    });

    // Listeners for main action buttons
    chargeBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            paymentModal.style.display = 'block';
        }
    });

    cancelSaleBtn.addEventListener('click', clearSale);

    // Listeners for the payment modal
    closeModalBtn.addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });

    confirmPaymentBtn.addEventListener('click', completeSale);


    // --- 7. INITIAL DATA LOAD ---
    fetchProductsAndRender();
    renderCart(); // Initial render to show "Cart is empty" message
});