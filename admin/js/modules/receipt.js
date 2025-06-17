// frontend/admin/js/receipt.js
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const saleId = urlParams.get('sale_id');
    if (!saleId) {
        showError('No Sale ID provided in the URL.');
        return;
    }
    async function fetchAndRenderReceipt() {
        try {
            const saleDetails = await apiFetch(`/transactions/sales/${saleId}`);
            if (!saleDetails) {
                showError('Could not find details for this sale.');
                return;
            }
            populateReceipt(saleDetails);
            setTimeout(() => { window.print(); }, 500);
        } catch (error) {
            console.error('Failed to fetch or render receipt:', error);
            showError(`Failed to fetch receipt data: ${error.message}`);
        }
    }
    fetchAndRenderReceipt();
});

function populateReceipt(sale) {
    const receiptNumber = sale.receipt_number || 0; 
    const formattedReceiptNumber = String(receiptNumber).padStart(5, '0');
    document.getElementById('receipt-no').textContent = formattedReceiptNumber;
    
    const saleDate = new Date(sale.transaction_time || sale.created_at);
    document.getElementById('receipt-day').textContent = saleDate.getDate();
    document.getElementById('receipt-month').textContent = saleDate.getMonth() + 1;
    document.getElementById('receipt-year').textContent = saleDate.getFullYear();

    const itemsBody = document.getElementById('receipt-items-body');
    itemsBody.innerHTML = '';
    let itemHtml = '';
    const totalRowsOnPage = 20;
    const itemsToRender = sale.sale_items || sale.items || [];
    itemsToRender.forEach((item, index) => {
        const itemPrice = item.price_at_sale;
        const itemName = item.name_en || (item.product ? item.product.name_en : 'N/A');
        const amount = item.quantity * itemPrice;
        itemHtml += `
            <tr>
                <td>${index + 1}</td>
                <td class="item-name">${itemName}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(itemPrice, 'THB')}</td>
                <td>${formatPrice(amount, 'THB')}</td>
            </tr>
        `;
    });
    for (let i = itemsToRender.length; i < totalRowsOnPage; i++) {
        itemHtml += `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td></tr>`;
    }
    itemsBody.innerHTML = itemHtml;
    document.getElementById('total-thb').textContent = formatPrice(sale.total_amount, 'THB');
    document.getElementById('total-usd').textContent = formatPrice(sale.total_amount, 'USD');
}

function showError(message) {
     document.body.innerHTML = `<div style="text-align: center; font-family: sans-serif;"><h1>Error</h1><p>${message}</p></div>`;
}