// frontend/admin/js/apiService.js
const API_BASE_URL = 'https://sokhaptaesterk-backend.onrender.com/api'; 

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            cache: 'no-cache'
        });

        // First, check if the response is okay.
        if (!response.ok) {
            // If not okay, try to get a JSON error message from the server.
            const errorData = await response.json().catch(() => ({})); // Use catch to prevent crash on non-JSON error
            const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        // Handle successful responses that have no content (e.g., 204 from DELETE)
        if (response.status === 204) {
            return null;
        }

        // Only if the response is OK, parse the JSON body.
        return await response.json();

    } catch (error) {
        console.error(`API Fetch Error (${endpoint}):`, error.message);
        if (error.message.includes('Invalid Token') || error.message.includes('Unauthorized')) {
            alert('Your session has expired. Please log in again.');
            logout();
        }
        throw error;
    }
}