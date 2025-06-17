// In frontend/admin/js/modules/pos.js
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CHECK AUTH & GET USER ---
    
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
    const searchInput = document.getElementById('product-search');
    
    // Modal Elements
    const paymentModal = document.getElementById('payment-modal');
    const closeModalBtn = document.querySelector('#payment-modal .close-btn');
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');

    // Summary Elements
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTax = document.getElementById('summary-tax');
    const summaryTotal = document.getElementById('summary-total');
    const summaryTotalUsd = document.getElementById('summary-total-usd');
    const paymentTotalDue = document.getElementById('payment-total-due');
    const paymentTotalDueUsd = document.getElementById('payment-total-due-usd');

    // At the top, in the element selections area, add the new modal selectors
    const postSaleModal = document.getElementById('post-sale-modal');
    const printInvoiceBtn = document.getElementById('print-invoice-btn');
    const printReceiptBtn = document.getElementById('print-receipt-btn');
    const newSaleBtn = document.getElementById('new-sale-btn');
    const closePostSaleModalBtn = postSaleModal.querySelector('.close-btn');

    let lastCompletedSale = null; // Variable to hold the last sale's data

    // --- 4. INITIAL PAGE SETUP ---
    userNameSpan.textContent = user ? user.fullName : 'Guest';

    // --- 5. DEFINE ALL FUNCTIONS ---

    function toBase64(str) {
        // 1. encodeURIComponent to handle multi-byte chars
        // 2. unescape to convert %xx notation to single-byte chars
        // 3. btoa to convert single-byte chars to Base64
        return btoa(unescape(encodeURIComponent(str)));
    }

    function getLocalizedProductName(product) {
        const lang = getCurrentLanguage(); // from i18n.js
        // If language is Khmer and name_km exists, use it. Otherwise, default to English.
        return lang === 'km' && product.name_km ? product.name_km : product.name_en;
    }

    async function fetchAndRenderInitialData() {
        try {
            productGrid.innerHTML = `<p>Loading products...</p>`;
            const products = await apiFetch('/products');
            productCache = products || [];
            renderProducts();
        } catch (error) {
            productGrid.innerHTML = `<p style="color:red; text-align:center;">Could not load products. (${error.message})</p>`;
        }
    }

    function renderProducts() {
    productGrid.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();
    
    const filteredProducts = productCache.filter(p => 
        p.name_en.toLowerCase().includes(searchTerm) || 
        (p.sku && p.sku.toLowerCase().includes(searchTerm))
    );

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<p>No products available or match your search.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const productTile = document.createElement('div');
        productTile.className = 'product-tile';
        if (product.total_stock <= 0) {
            productTile.classList.add('out-of-stock');
        }
        productTile.dataset.id = product.id;

        // This logic correctly handles products with and without images
        const mainContent = product.image_url
            ? `<img class="product-tile-image" src="${product.image_url}" alt="${product.name_en}">`
            : `<div class="product-tile-name-placeholder">${product.name_en}</div>`;

        const productName = getLocalizedProductName(product);

        // The generated HTML structure works perfectly with the new list-view CSS
        productTile.innerHTML = `
            <div class="product-tile-image-container">
                <img class="product-tile-image" src="${product.image_url || 'https://via.placeholder.com/150'}" alt="${productName}">
            </div>
            <div class="product-tile-info">
                <p class="product-tile-name">${productName}</p>
                <p class="product-tile-price">${formatPrice(product.selling_price, 'THB')}</p>
            </div>
        `;
        
        productTile.addEventListener('click', () => {
            if (product.total_stock > 0) {
                addToCart(product.id);
            }
        });
        productGrid.appendChild(productTile);
    });
}

    function addToCart(productId) {
        const product = productCache.find(p => p.id === productId);
        if (!product) return;
        const cartItem = cart.find(item => item.id === productId);

        if (cartItem) {
            if (cartItem.quantity < product.total_stock) {
                cartItem.quantity++;
            } else {
                alert(`No more stock available for ${product.name_en}.`);
            }
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        renderCart();
    }

    function updateCartItemQuantity(productId, newQuantity) {
        const cartItem = cart.find(item => item.id === productId);
        if (!cartItem) return;

        const productInCache = productCache.find(p => p.id === productId);
        if (newQuantity > productInCache.total_stock) {
            alert(`Maximum stock (${productInCache.total_stock}) reached for ${productInCache.name_en}.`);
            return;
        }

        if (newQuantity <= 0) {
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

                const productName = getLocalizedProductName(item);

                // --- FIX: Restructured innerHTML to match the new 3-column grid in CSS for better alignment. ---
                cartItemElement.innerHTML = `
                    <div class="cart-item-details">
                        <span class="cart-item-name">${productName}</span>
                        <span class="cart-item-price">${formatPrice(item.selling_price, 'THB')}</span>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn decrease-btn" data-id="${item.id}">-</button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="quantity-btn increase-btn" data-id="${item.id}">+</button>
                    </div>
                    <span class="cart-item-total">${formatPrice(itemTotal, 'THB')}</span>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });
        }
        updateCartSummary();
    }

    function updateCartSummary() {
        const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
        const tax = subtotal * 0.00; // Assuming 0% tax as per the HTML
        const total = subtotal + tax;
        
        // This logic assumes a 'formatPrice' function exists in one of the included scripts (e.g., currencyHelper.js)
        // and that it can handle different currencies.
        summarySubtotal.textContent = formatPrice(subtotal, 'THB');
        summaryTax.textContent = formatPrice(tax, 'THB');
        summaryTotal.textContent = formatPrice(total, 'THB');
        summaryTotalUsd.textContent = formatPrice(total, 'USD'); 
        paymentTotalDue.textContent = formatPrice(total, 'THB');
        paymentTotalDueUsd.textContent = formatPrice(total, 'USD'); 
    }

    function clearSale() {
        cart = [];
        renderCart();
    }
    
    let overrideTimer = null;

async function processSale(paymentMethod) {
    if (cart.length === 0) return;

    // Use a different button for the loading state depending on the context
    const buttonToToggle = paymentMethod === 'cash' ? confirmPaymentBtn : null;
    if (buttonToToggle) toggleButtonLoading(buttonToToggle, true, 'Confirm Payment & New Sale');

    const totalAmount = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
    const saleItemsPayload = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_at_sale: item.selling_price
    }));

    try {
        const saleResult = await apiFetch('/transactions/sales', {
            method: 'POST',
            body: JSON.stringify({
                warehouse_id: 'c451f784-5f1d-4b86-823d-1e75660a6b6d',
                user_id: user.id,
                sale_items: saleItemsPayload,
                total_amount: totalAmount,
                payment_method: paymentMethod // This will be 'cash' or 'khqr'
            })
        });

        lastCompletedSale = saleResult.transactionData;
        
        // Hide all modals before showing the post-sale options
        document.getElementById('qr-code-modal').style.display = 'none';
        paymentModal.style.display = 'none';

        clearSale();
        fetchAndRenderInitialData();
        postSaleModal.style.display = 'block';

    } catch (error) {
        alert(`Sale failed: ${error.message}`);
    } finally {
        if (buttonToToggle) toggleButtonLoading(buttonToToggle, false, 'Confirm Payment & New Sale');
    }
}


// UPDATED completeSale FUNCTION
// This function now only decides which action to take based on the dropdown.
async function completeSale() {
    if (cart.length === 0) {
        return;
    }

    const paymentMethod = document.getElementById('payment-method').value;

    if (paymentMethod === 'khqr') {
        // If the user selected KHQR, we must wait for the QR code
        // modal to be handled. We add 'await' here to be explicit.
        await generateAndShowQrCode();
    } else {
        // For any other method ('cash', etc.), we process the sale immediately.
        await processSale(paymentMethod);
    }
}


// UPDATED generateAndShowQrCode FUNCTION
// This function now includes the slider logic and has no timer.
async function generateAndShowQrCode() {
    // 1. Get elements and show modal
    const qrModal = document.getElementById('qr-code-modal');
    const qrDisplayArea = document.getElementById('qr-display-area');
    const sliderContainer = document.getElementById('slide-to-pay-container');
    
    paymentModal.style.display = 'none'; // Hide the first modal
    qrDisplayArea.innerHTML = '<p>Generating secure QR Code...</p>';
    sliderContainer.style.display = 'none'; // Hide slider until QR is loaded
    qrModal.style.display = 'block'; // Show the QR modal

    // 2. Prepare data for QR generation (No changes here)
    const totalAmount = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
    const tran_id = `SALE-${Date.now()}`;
    const amountInUSD = (totalAmount * AppConfig.SUPPORTED_CURRENCIES.USD.rate).toFixed(2);
    const itemsArray = cart.map(item => ({
        name: item.name_en,
        quantity: parseInt(item.quantity),
        price: parseFloat((item.selling_price * AppConfig.SUPPORTED_CURRENCIES.USD.rate).toFixed(2))
    }));
    const itemsJsonString = JSON.stringify(itemsArray);
    const itemsBase64 = toBase64(itemsJsonString);

    const payload = { tran_id, amount: amountInUSD, items_base64: itemsBase64 };

    // 3. Call backend to get QR code
    try {
        const qrData = await apiFetch('/payments/aba-qr', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (qrData && qrData.qrImage) {
            qrDisplayArea.innerHTML = `<img src="${qrData.qrImage}" alt="Scan to Pay" style="max-width: 100%; height: auto;">`;
            sliderContainer.style.display = 'block'; // Show the slider
        } else {
            throw new Error(qrData.error || 'QR image not found in API response.');
        }

    } catch (error) {
        qrDisplayArea.innerHTML = `<p style="color:red; font-weight: bold;">Error: ${error.message}</p>`;
        sliderContainer.style.display = 'none'; // Keep slider hidden on error
    }

    // --- NEW SLIDER LOGIC ---
    const thumb = document.getElementById('slider-thumb');
    let isDown = false;
    let startX;
    let scrollLeft;

    thumb.addEventListener('mousedown', (e) => {
        isDown = true;
        thumb.style.transition = 'none'; // Remove transition for smooth sliding
        startX = e.pageX - thumb.offsetLeft;
    });

    document.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        const maxSlide = sliderContainer.offsetWidth - thumb.offsetWidth;
        thumb.style.transition = 'left 0.3s ease'; // Add back transition for snapping
        // If thumb is not at the end, snap it back
        if (thumb.offsetLeft < maxSlide - 5) { // -5 for a small tolerance
            thumb.style.left = '0px';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - sliderContainer.offsetLeft;
        const walk = x - startX;
        const maxSlide = sliderContainer.offsetWidth - thumb.offsetWidth;

        // Keep the thumb within the container bounds
        let newLeft = Math.max(0, Math.min(maxSlide, walk));
        thumb.style.left = `${newLeft}px`;

        // If the slider reaches the end, complete the sale
        if (newLeft >= maxSlide - 5) { // Use a small tolerance
            isDown = false;
            thumb.style.pointerEvents = 'none'; // Prevent further interaction
            processSale('khqr'); // Process the sale as a 'khqr' payment
        }
    });
} 

async function completeSale(paymentMethodOverride = null) {
    if (cart.length === 0) return;

    // --- MODIFICATION START: Use override or get from dropdown ---
    // If an override value is passed (like 'manual_qr_override'), use it.
    // Otherwise, get the value from the payment method dropdown.
    const paymentMethod = paymentMethodOverride || document.getElementById('payment-method').value;
    // --- MODIFICATION END ---

    // This check now correctly handles the initial click on the "Charge" button.
    // It will not be triggered by the manual override.
    if (paymentMethod === 'khqr') {
        generateAndShowQrCode(); // This triggers the QR flow
        return; 
    }
    
    toggleButtonLoading(confirmPaymentBtn, true, 'Confirm Payment & New Sale');

    const totalAmount = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
    const saleItemsPayload = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_at_sale: item.selling_price
    }));

    try {
        const saleResult = await apiFetch('/transactions/sales', {
            method: 'POST',
            body: JSON.stringify({
                warehouse_id: 'c451f784-5f1d-4b86-823d-1e75660a6b6d', // This should probably be dynamic
                user_id: user.id,
                sale_items: saleItemsPayload,
                total_amount: totalAmount,
                // --- MODIFICATION ---
                // This now sends the correct method: 'cash' or 'manual_qr_override'
                payment_method: paymentMethod
            })
        });

        lastCompletedSale = saleResult.transactionData;
        
        clearSale();
        paymentModal.style.display = 'none';
        fetchAndRenderInitialData(); 
        
        postSaleModal.style.display = 'block';

    } catch (error) {
        alert(`Sale failed: ${error.message}`);
    } finally {
        toggleButtonLoading(confirmPaymentBtn, false, 'Confirm Payment & New Sale');
    }
}


// This event listener needs to be updated to cancel the timer if the user closes the modal
document.querySelector('#qr-code-modal .close-btn').addEventListener('click', () => {
    // --- MODIFICATION START ---
    if (overrideTimer) {
        clearTimeout(overrideTimer); // Cancel the timer
    }
    // --- MODIFICATION END ---
    document.getElementById('qr-code-modal').style.display = 'none';
    // You should still implement logic here to cancel the pending transaction with PayWay if possible
});

// This is your existing function, included for completeness. No changes needed.
function toggleButtonLoading(button, isLoading, originalText) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner-sm"></span> Processing...`; // Example with a spinner
    } else {
        button.disabled = false;
        button.textContent = originalText;
    }
}   
    
    function openModal() {
        if (cart.length > 0) {
            paymentModal.style.display = 'block';
        }
    }

    function closeModal() {
        paymentModal.style.display = 'none';
    }


    // --- 6. SETUP EVENT LISTENERS ---
    searchInput.addEventListener('input', renderProducts);
    
    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.quantity-btn'); // More robust event delegation
        if (!target) return;
        
        const productId = target.dataset.id;
        const cartItem = cart.find(item => item.id === productId);
        if (!cartItem) return;

        if (target.classList.contains('increase-btn')) {
            updateCartItemQuantity(productId, cartItem.quantity + 1);
        } else if (target.classList.contains('decrease-btn')) {
            updateCartItemQuantity(productId, cartItem.quantity - 1);
        }
    });

    chargeBtn.addEventListener('click', openModal);
    cancelSaleBtn.addEventListener('click', clearSale);
    closeModalBtn.addEventListener('click', closeModal);
    confirmPaymentBtn.addEventListener('click', () => completeSale());
    
    closePostSaleModalBtn.addEventListener('click', () => postSaleModal.style.display = 'none');
    newSaleBtn.addEventListener('click', () => postSaleModal.style.display = 'none');

    printInvoiceBtn.addEventListener('click', () => {
        if (!lastCompletedSale || !lastCompletedSale.id) {
            alert('Error: No completed sale data found to print.');
            return;
        }

        // This line is now the fix. It adds the sale ID to the URL.
        const receiptUrl = `receipt.html?sale_id=${lastCompletedSale.id}`;
        
        // We can still save to localStorage in case the other receipt button uses it.
        localStorage.setItem('currentReceiptData', JSON.stringify(lastCompletedSale));
        
        window.open(receiptUrl, '_blank');
    });

    printReceiptBtn.addEventListener('click', () => {
        if (!lastCompletedSale) return;
        localStorage.setItem('currentReceiptData', JSON.stringify(lastCompletedSale));
        window.open('receipt-80mm.html', '_blank');
    });

    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === paymentModal) {
            closeModal();
        }
    });

    // --- 7. INITIAL DATA LOAD ---
    fetchAndRenderInitialData();
    renderCart();
});