// public/admin/js/modules/staff.js
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // --- Global Selections ---
    const user = getUser();
    const tableBody = document.getElementById('staff-table-body');
    const modal = document.getElementById('staff-modal');
    const addStaffBtn = document.getElementById('add-staff-btn');
    const closeBtn = modal.querySelector('.close-btn');

    // --- Initial Setup ---
    document.getElementById('user-name').textContent = user ? user.fullName : 'Guest';
    document.getElementById('logout-btn').addEventListener('click', logout);

    // --- Modal Control ---
    addStaffBtn.addEventListener('click', () => {
        // In a real app, we'd check if the logged-in user has 'admin' role
        if(user && user.role === 'admin') {
            modal.style.display = 'block';
        } else {
            alert('You do not have permission to add new staff.');
        }
    });
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // --- Main Render Function ---
    function renderStaffTable() {
        tableBody.innerHTML = '';
        mockStaff.forEach(staff => {
            const row = document.createElement('tr');
            const statusClass = staff.isActive ? 'success' : 'danger';
            const statusText = staff.isActive ? 'Active' : 'Inactive';
            
            row.innerHTML = `
                <td>${staff.fullName}</td>
                <td>${staff.email}</td>
                <td><span class="role-badge">${staff.role}</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" data-id="${staff.id}">Edit</button>
                    ${staff.isActive 
                        ? `<button class="btn btn-danger btn-sm" data-id="${staff.id}">Deactivate</button>`
                        : `<button class="btn btn-success btn-sm" data-id="${staff.id}">Activate</button>`
                    }
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- Form & Action Handling (Simplified) ---
    // In a full app, these would call data manipulation functions like in inventory.js
    const staffForm = document.getElementById('staff-form');
    staffForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Staff member saved! (Prototype)');
        modal.style.display = 'none';
        // Here you would add the new staff to mockStaff and re-render the table
    });

    // --- Initial Load ---
    renderStaffTable();
});