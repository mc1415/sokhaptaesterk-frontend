// frontend/admin/js/receipt-80mm.js
document.addEventListener('DOMContentLoaded', async () => {

    await window.currencyInitializationPromise;

    const saleDataString = localStorage.getItem('currentReceiptData');
    if (!saleDataString) {
        document.body.innerHTML = '<h1>Error: No receipt data found.</h1>';
        return;
    }

    try {
        const sale = JSON.parse(saleDataString);
        populateReceipt(sale);
        if (window.self === window.top) {
            setTimeout(() => window.print(), 500);
        }
    } catch (error) {
        console.error('Failed to render receipt:', error);
    }
});

function populateReceipt(sale) {
    document.getElementById('receipt-no').textContent = sale.receipt_number || 'N/A';
    document.getElementById('receipt-date').textContent = new Date(sale.transaction_time).toLocaleString();
    document.getElementById('receipt-cashier').textContent = sale.staff ? sale.staff.full_name : 'N/A';
    
    const itemsBody = document.getElementById('receipt-items');
    itemsBody.innerHTML = '';
    sale.sale_items.forEach(item => {
        const row = document.createElement('tr');
        const total = item.quantity * item.price_at_sale;
        row.innerHTML = `
            <td class="item-name">${item.name_en}</td>
            <td>${item.quantity}</td>
            <td>${formatPrice(item.price_at_sale, 'USD')}</td>
            <td>${formatPrice(total, 'USD')}</td>
        `;
        itemsBody.appendChild(row);
    });

    const subtotal = sale.total_amount; // Assuming total_amount is pre-tax
    document.getElementById('receipt-subtotal').textContent = formatPrice(subtotal, 'USD');
    document.getElementById('receipt-tax').textContent = formatPrice(0, 'USD'); // Assuming 0 tax
    document.getElementById('receipt-total-usd').textContent = formatPrice(sale.total_amount, 'USD');
    document.getElementById('receipt-total-khr').textContent = formatPrice(sale.total_amount, 'KHR');
}