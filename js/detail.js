// public/js/product-detail.js
document.addEventListener('DOMContentLoaded', () => {
    const detailContainer = document.getElementById('product-detail-container');
    const detailTemplate = document.getElementById('product-detail-template');
    
    // Get product ID from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const product = mockProducts.find(p => p.id === productId);

    if (product) {
        detailContainer.innerHTML = ''; // Clear "loading" message
        const detailView = detailTemplate.content.cloneNode(true);

        const stockStatusEl = detailView.querySelector('#detail-stock');
        
        detailView.querySelector('#detail-image').src = product.image_url || 'https://via.placeholder.com/500';
        detailView.querySelector('#detail-name-en').textContent = product.name_en;
        detailView.querySelector('#detail-name-km').textContent = product.name_km;
        detailView.querySelector('#detail-category').textContent = product.category;
        detailView.querySelector('#detail-price').textContent = `$${product.selling_price.toFixed(2)}`;
        detailView.querySelector('#detail-description').textContent = product.description || 'No description available for this product.';

        document.title = `${product.name_en} - Sophea Phtes Nek`; // Update page title

        if (product.quantity <= 0) {
            stockStatusEl.textContent = 'Out of Stock';
            stockStatusEl.className = 'stock-tag out-of-stock';
        } else if (product.quantity < 100) {
            stockStatusEl.textContent = 'Limited Stock';
            stockStatusEl.className = 'stock-tag low-stock';
        } else {
            stockStatusEl.textContent = 'In Stock';
            stockStatusEl.className = 'stock-tag in-stock';
        }
        
        detailContainer.appendChild(detailView);
    } else {
        detailContainer.innerHTML = '<p class="loading-message">Product not found. It may have been removed.</p>';
    }

    if (product.isOnSale) {
            originalPriceEl.style.display = 'inline';
            originalPriceEl.textContent = `$${product.original_price.toFixed(2)}`;
            currentPriceEl.style.color = 'var(--danger)';
        } else {
            // If not on sale, ensure the detail price uses the standard accent color
            currentPriceEl.style.color = 'var(--accent)';
        }
});