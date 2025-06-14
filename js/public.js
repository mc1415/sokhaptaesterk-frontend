// frontend/js/public.js
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ELEMENT SELECTORS ---
    const promoGrid = document.getElementById('promotions-grid');
    const productGrid = document.getElementById('public-product-grid');
    const categoryFilters = document.getElementById('category-filters');
    const searchInput = document.getElementById('public-search');
    const cardTemplate = document.getElementById('product-card-template');

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNavContainer = document.createElement('div'); // Create a new container for the mobile menu
    mobileNavContainer.className = 'mobile-nav-container';
    document.body.appendChild(mobileNavContainer);

    // Get all links from both desktop navs
    const allNavLinks = document.querySelectorAll('.main-nav a, .desktop-nav a');
    
    // Clone links into the mobile container
    allNavLinks.forEach(link => {
        mobileNavContainer.appendChild(link.cloneNode(true));
    });

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            // Toggle the 'is-open' class on the container and the button itself
            mobileNavContainer.classList.toggle('is-open');
            mobileMenuBtn.classList.toggle('is-active');
        });
    }
    
    // --- 2. STATE & API CONFIG ---
    let productCache = []; // To store live data from the API
    let currentFilter = 'All';
    const API_URL = 'https://sokhaptaesterk-backend.onrender.com/api';

    // --- 3. CORE API FUNCTION ---
    async function fetchAndInitialize() {
        try {
            productGrid.innerHTML = '<p class="loading-message">Loading our finest products...</p>';
            
            const response = await fetch(`${API_URL}/products/public`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const products = await response.json();
            console.log('Products received from API:', products);
            
            productCache = products; // Save live data to our cache

            // Now that we have data, render everything
            renderCategories();
            renderAllProducts();
            // You can add promotion logic here if your API provides it
            // renderPromotions(); 

        } catch (error) {
            console.error("Failed to initialize product page:", error);
            productGrid.innerHTML = '<p class="error-message">Sorry, we could not load our products at this time. Please check back later.</p>';
        }
    }

    // --- 4. RENDER FUNCTIONS (using productCache) ---

    // Helper function to create a product card. This is great, no major changes needed.
    function createProductCard(product) {
        const card = cardTemplate.content.cloneNode(true);
        const link = card.querySelector('.product-card');
        const stockStatusEl = card.querySelector('.stock-status');
        const originalPriceEl = card.querySelector('.original-price');
        const currentPriceEl = card.querySelector('.current-price');
        
        // This will be for a future details page
        // link.href = `product.html?id=${product.id}`; 
        
        card.querySelector('.card-image').src = product.image_url || 'https://via.placeholder.com/300x300.png?text=No+Image';
        card.querySelector('.product-name').textContent = product.name_en;
        card.querySelector('.product-category').textContent = product.category;
        currentPriceEl.textContent = `$${parseFloat(product.selling_price).toFixed(2)}`;

        // Stock status logic using 'stock_level' from our API response
        if (product.stock_level <= 0) {
            stockStatusEl.textContent = 'Out of Stock'; stockStatusEl.className = 'stock-status out-of-stock';
        } else if (product.stock_level < 10) { // Example threshold
            stockStatusEl.textContent = 'Limited Stock'; stockStatusEl.className = 'stock-status limited';
        } else {
            stockStatusEl.textContent = 'In Stock'; stockStatusEl.className = 'stock-status in-stock';
        }

        // Sale logic - can be implemented if your API adds an 'is_on_sale' flag
        // if (product.isOnSale) {
        //     link.classList.add('on-sale');
        //     originalPriceEl.textContent = `$${product.original_price.toFixed(2)}`;
        // }
        
        return card;
    }

    // Renders the main product grid based on filters and search
    function renderAllProducts() {
        productGrid.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();

        const filteredProducts = productCache.filter(product => {
            const matchesCategory = currentFilter === 'All' || product.category === currentFilter;
            // Search by name only for simplicity, since SKU is not in the public API response
            const matchesSearch = product.name_en.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = '<p class="loading-message">No products match your search.</p>';
            return;
        }

        filteredProducts.forEach(product => {
            productGrid.appendChild(createProductCard(product));
        });
    }

    // Dynamically creates category buttons from the live data
    function renderCategories() {
        categoryFilters.innerHTML = ''; // Clear any old filters
        const categories = ['All', ...new Set(productCache.map(p => p.category).filter(Boolean))]; // Get unique categories
        
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = category;
            button.dataset.category = category;
            if (category === currentFilter) {
                button.classList.add('active');
            }
            
            button.addEventListener('click', () => {
                // Remove active class from the old button
                const currentActiveBtn = categoryFilters.querySelector('.filter-btn.active');
                if (currentActiveBtn) {
                    currentActiveBtn.classList.remove('active');
                }
                // Add active class to the clicked button
                button.classList.add('active');
                currentFilter = category;
                renderAllProducts(); // Re-render the product grid with the new filter
            });
            categoryFilters.appendChild(button);
        });
    }

    // --- 5. EVENT LISTENERS ---
    searchInput.addEventListener('input', renderAllProducts);

    // --- 6. INITIAL LOAD ---
    fetchAndInitialize();
});