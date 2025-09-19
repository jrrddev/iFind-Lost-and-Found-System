const API_URL = '/Backend/api.php';

function openViewModal(itemId) {
    console.log('Opening modal for item:', itemId);
    if (!itemId) {
        console.error('No item ID provided to openViewModal');
        return;
    }
    fetchItemDetails(itemId);
    document.getElementById('viewModal').style.display = 'block';
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

function closeClaimModal() {
    document.getElementById('claimViewModal').style.display = 'none';
}

function openClaimModal(claimId) {
    console.log('Opening claim modal for:', claimId);
    fetchClaimDetails(claimId);
    document.getElementById('claimViewModal').style.display = 'block';
}

async function fetchClaimDetails(claimId) {
    try {
        const response = await fetch(`${API_URL}?endpoint=admin/claim&id=${claimId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const responseText = await response.text();
        console.log('Claim details response:', responseText);

        if (!response.ok) {
            throw new Error('Failed to fetch claim details');
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse claim details response:', parseError);
            throw new Error('Invalid response format');
        }

        if (data.status === 'success' && data.data) {
            displayClaimDetails(data.data);
        } else {
            throw new Error(data.message || 'Failed to load claim details');
        }
    } catch (error) {
        console.error('Error fetching claim details:', error);
        alert('Failed to load claim details: ' + error.message);
    }
}

async function fetchItemDetails(itemId) {
    try {
        console.log('Fetching details for item:', itemId);
        const response = await fetch(`${API_URL}?endpoint=admin/item&id=${itemId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch item details');
        }

        const data = await response.json();
        displayItemDetails(data);
    } catch (error) {
        console.error('Error fetching item details:', error);
        alert('Failed to load item details');
    }
}

function displayClaimDetails(data) {
    console.log('Displaying claim details:', data);
    try {
        // Check if we have the required DOM elements
        const requiredElements = [
            'modal-student-name',
            'modal-grade-section',
            'modal-claim-date',
            'modal-claim-description',
            'modal-claim-status',
            'modal-claim-item-image',
            'modal-claim-item-name',
            'modal-claim-item-category',
            'modal-claim-item-location'
        ];

        for (const elementId of requiredElements) {
            const element = document.getElementById(elementId);
            if (!element) {
                console.error(`Missing required element: ${elementId}`);
                throw new Error(`Missing required element: ${elementId}`);
            }
        }

        // Validate data object
        if (!data) {
            console.error('No data provided to displayClaimDetails');
            throw new Error('No data provided to displayClaimDetails');
        }

        // Display claim information
        document.getElementById('modal-student-name').textContent = data.student_name || 'N/A';
        document.getElementById('modal-grade-section').textContent = 
            `Grade ${data.grade_level || 'N/A'} - ${data.section || 'N/A'}`;
            
        // Handle date with validation
        let claimDate = 'N/A';
        if (data.date_claimed) {
            try {
                claimDate = new Date(data.date_claimed).toLocaleDateString();
            } catch (dateError) {
                console.error('Error formatting date:', dateError);
            }
        }
        document.getElementById('modal-claim-date').textContent = claimDate;
        
        document.getElementById('modal-claim-description').textContent = data.proof_message || 'N/A';

        // Handle claim status
        const statusEl = document.getElementById('modal-claim-status');
        statusEl.textContent = data.status || 'N/A';
        statusEl.className = `status-badge status-${data.status || 'pending'}`;

        // Display item information with validation
        const imgElement = document.getElementById('modal-claim-item-image');
        imgElement.src = data.item_image ? `Backend/uploads/${data.item_image}` : 'Frontend/images/bottle.png';
        imgElement.onerror = function() {
            this.src = 'Frontend/images/bottle.png';
        };

        // Display item details
        document.getElementById('modal-claim-item-name').textContent = data.item_name || 'N/A';
        document.getElementById('modal-claim-item-category').textContent = data.item_category || 'N/A';
        document.getElementById('modal-claim-item-location').textContent = data.item_location || 'N/A';

        // Handle action buttons
        const actionsDiv = document.getElementById('modal-claim-actions');
        actionsDiv.innerHTML = '';

        if (data.status === 'pending') {
            actionsDiv.innerHTML = `
                <button class="approve-btn" onclick="approveClaim(${data.id}); closeClaimModal(); return false;">
                    <i class="fas fa-check"></i> Approve Claim
                </button>
                <button class="cancel-btn" onclick="closeClaimModal(); return false;">
                    <i class="fas fa-times"></i> Cancel
                </button>
            `;
        } else {
            actionsDiv.innerHTML = `
                <button class="close-btn" onclick="closeClaimModal(); return false;">Close</button>
            `;
        }
    } catch (error) {
        console.error('Error displaying claim details:', error);
        alert('Error displaying claim details. Please try again.');
    }
}

function displayItemDetails(data) {
    console.log('Displaying item details:', data);
    try {
        const imgElement = document.getElementById('modal-item-image');
        imgElement.src = data.image_url ? 
            (data.image_url === 'bottle.png' ? 'Frontend/images/bottle.png' : `Backend/uploads/${data.image_url}`) :
            'Frontend/images/bottle.png';
        imgElement.onerror = function() {
            this.src = 'Frontend/images/bottle.png';
        };
        
        // Set text content for all fields
        document.getElementById('modal-item-name').textContent = data.name || 'N/A';
        document.getElementById('modal-item-category').textContent = data.category || 'N/A';
        document.getElementById('modal-item-location').textContent = data.location || 'N/A';
        document.getElementById('modal-item-date').textContent = data.date_found || 'N/A';
        document.getElementById('modal-item-description').textContent = data.description || 'N/A';
        
        // Display reporter details
        document.getElementById('modal-reporter-name').textContent = data.reporter_name || 'N/A';
        document.getElementById('modal-reporter-grade').textContent = data.reporter_grade || 'N/A';
        document.getElementById('modal-reporter-section').textContent = data.reporter_section || 'N/A';

        // Handle status display
        const statusEl = document.getElementById('modal-item-status');
        statusEl.textContent = data.status || 'N/A';
        statusEl.className = `status-badge status-${data.status}`;

        // Handle action buttons
        const actionsDiv = document.getElementById('modal-actions');
        actionsDiv.innerHTML = '';

        if (data.status === 'pending') {
            actionsDiv.innerHTML = `
                <div class="button-group">
                    <button class="approve-btn" onclick="approveItem(${data.id}); return false;">
                        <i class="fas fa-check"></i> Approve Item
                    </button>
                    <button class="reject-btn" onclick="rejectItem(${data.id}); return false;">
                        <i class="fas fa-times"></i> Reject Item
                    </button>
                </div>
            `;
        } else {
            actionsDiv.innerHTML = `
                <button class="close-btn" onclick="closeViewModal(); return false;">Close</button>
            `;
        }
    } catch (error) {
        console.error('Error displaying item details:', error);
        alert('Error displaying item details. Please try again.');
    }
}

async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        console.log('Attempting login...');
        console.log('API URL:', `${API_URL}?endpoint=admin/login`);
        
        const response = await fetch(`${API_URL}?endpoint=admin/login`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Failed to parse JSON:', jsonError);
            console.error('Response text:', responseText);
            throw new Error('Server returned invalid response. Check console for details.');
        }

        if (data.status === 'success') {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            await loadAdminData();
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

async function loadAdminData() {
    try {
        // Show loading state
        const elements = ['total-items', 'lost-items', 'found-items', 'pending-claims'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '...';
        });

        // Fetch items and claims in parallel
        const [itemsResponse, claimsResponse] = await Promise.all([
            fetch(`${API_URL}?endpoint=admin/items`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`${API_URL}?endpoint=admin/claims`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
        ]);

        // Parse JSON responses
        const [itemsData, claimsData] = await Promise.all([
            itemsResponse.json(),
            claimsResponse.json()
        ]);

        console.log('Claims response:', claimsData);

        // Validate responses
        if (!itemsResponse.ok || !itemsData || itemsData.status !== 'success') {
            throw new Error('Failed to fetch items: ' + (itemsData?.message || 'Unknown error'));
        }

        if (!claimsResponse.ok || !claimsData || claimsData.status !== 'success') {
            console.error('Claims fetch error:', claimsData);
            throw new Error('Failed to fetch claims: ' + (claimsData?.message || 'Unknown error'));
        }

        const items = itemsData.data || [];
        const claims = claimsData.data || [];

        console.log('Loaded items:', items.length, 'claims:', claims.length);

        updateStats(items, claims);
        displayItems(items);
        displayClaims(claims);
    } catch (error) {
        console.error('Error loading admin data:', error);
        alert('Error loading data: ' + error.message);
    }
}

function updateStats(items, claims) {
    try {
        const totalItems = items.length;
        const pendingItems = items.filter(item => item.status === 'pending').length;
        const activeItems = items.filter(item => item.status === 'lost' || item.status === 'processing').length;
        const completedItems = items.filter(item => item.status === 'returned' || item.status === 'rejected').length;
        const pendingClaims = claims.filter(claim => claim.status === 'pending').length;

        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('lost-items').textContent = pendingItems;
        document.getElementById('found-items').textContent = activeItems;
        document.getElementById('pending-claims').textContent = pendingClaims;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

function displayItems(items) {
    const tbody = document.getElementById('items-list');
    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.location}</td>
            <td class="status-${item.status}">${item.status}</td>
            <td>${item.claim_count || 0}</td>
            <td class="action-buttons">
                <button class="view-btn" onclick="openViewModal(${item.id}); return false;">
                    <i class="fas fa-eye"></i> View
                </button>
                ${item.status === 'pending' 
                    ? `<div class="button-group">
                        <button class="approve-btn" onclick="approveItem(${item.id}); return false;">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="reject-btn" onclick="rejectItem(${item.id}); return false;">
                            <i class="fas fa-times"></i> Reject
                        </button>
                       </div>`
                    : ''
                }
                <div class="button-group">
                    <button class="remove-btn" onclick="removeItem(${item.id}); return false;" title="Permanently delete this item">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function displayClaims(claims) {
    const tbody = document.getElementById('claims-list');
    
    if (!tbody) {
        console.error('Claims list table body not found');
        return;
    }
    
    console.log('Displaying claims:', claims.length);
    
    if (!claims || claims.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No claims found</td></tr>';
        return;
    }
    
    // Filter to prevent duplicates - only show unique claims
    const uniqueClaims = claims.filter((claim, index, self) => 
        index === self.findIndex((c) => c.id === claim.id)
    );
    
    console.log('Unique claims after filtering:', uniqueClaims.length);
    
    tbody.innerHTML = uniqueClaims.map(claim => `
        <tr>
            <td>${claim.id}</td>
            <td>${claim.item_name || 'Unknown Item'}</td>
            <td>${claim.student_name || ''}</td>
            <td>Grade ${claim.grade_level || ''} - ${claim.section || ''}</td>
            <td>${new Date(claim.date_claimed).toLocaleDateString()}</td>
            <td class="status-${claim.status}">
                <span style="padding: 4px 8px; border-radius: 4px; background: ${
                    claim.status === 'pending' ? '#ffeaa7' : 
                    claim.status === 'approved' ? '#55a3ff' : '#ff7675'
                }; color: ${claim.status === 'pending' ? '#2d3436' : 'white'};">
                    ${claim.status}
                </span>
            </td>
            <td class="action-buttons">
                <button class="view-btn" onclick="openClaimModal(${claim.id}); return false;" style="margin-right: 5px;">
                    <i class="fas fa-eye"></i> View
                </button>
                ${claim.status === 'pending'
                    ? `<button class="approve-btn" onclick="approveClaim(${claim.id}); return false;" style="margin-right: 5px;">
                        <i class="fas fa-check"></i> Approve
                       </button>`
                    : `<span style="color: #666; font-style: italic; margin-right: 10px;">
                        ${claim.status === 'approved' ? 'Approved' : 'Processed'}
                       </span>`}
                <button class="remove-btn" onclick="removeClaim(${claim.id}); return false;" style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </td>
        </tr>
    `).join('');
}

async function approveItem(itemId) {
    if (!confirm('Are you sure you want to approve this item?')) return;
    
    try {
        const response = await fetch(`${API_URL}?endpoint=admin/approve-item&id=${itemId}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Item approved successfully');
            await loadAdminData();
            closeViewModal();
        } else {
            const error = await response.json();
            alert('Failed to approve item: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error approving item');
    }
}

async function removeItem(itemId) {
    if (!confirm('Are you sure you want to remove this item? This action cannot be undone.')) {
        return;
    }
    
    try {
        console.log('Removing item:', itemId);
        const response = await fetch(`${API_URL}?endpoint=admin/remove-item&id=${itemId}`, {
            method: 'POST', // Change from DELETE to POST since some hosting providers block DELETE
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Include session cookies
            body: JSON.stringify({ action: 'delete' }) // Send delete action in body
        });

        console.log('Remove response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            alert('Item removed successfully');
            await loadAdminData();
        } else {
            const errorText = await response.text();
            console.error('Remove error response:', errorText);
            try {
                const error = JSON.parse(errorText);
                alert('Failed to remove item: ' + (error.message || 'Unknown error'));
            } catch (parseError) {
                alert('Failed to remove item: Server error');
            }
        }
    } catch (error) {
        console.error('Error removing item:', error);
        alert('Error removing item: ' + error.message);
    }
}

async function approveClaim(claimId) {
    if (!confirm('Are you sure you want to approve this claim?')) return;
    
    try {
        const response = await fetch(`${API_URL}?endpoint=admin/approve-claim&id=${claimId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const responseText = await response.text();
        console.log('Approve claim response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse approve claim response:', parseError);
            throw new Error('Invalid response format');
        }

        if (response.ok && data.status === 'success') {
            alert('Claim approved successfully');
            await loadAdminData();
            closeClaimModal();
        } else {
            throw new Error(data.message || 'Failed to approve claim');
        }
    } catch (error) {
        console.error('Error approving claim:', error);
        alert('Error approving claim: ' + error.message);
    }
}

async function removeClaim(claimId) {
    if (!confirm('Are you sure you want to remove this claim and its associated item? This will permanently delete both the claim and the item from the system. This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`${API_URL}?endpoint=admin/remove-claim&id=${claimId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const responseText = await response.text();
        console.log('Remove claim response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse remove claim response:', parseError);
            throw new Error('Invalid response format');
        }

        if (response.ok && data.status === 'success') {
            alert('Claim and associated item removed successfully');
            await loadAdminData();
            closeClaimModal(); // Close modal if open
        } else {
            throw new Error(data.message || 'Failed to remove claim');
        }
    } catch (error) {
        console.error('Error removing claim:', error);
        alert('Error removing claim: ' + error.message);
    }
}

async function rejectItem(itemId) {
    if (!confirm('Are you sure you want to reject this item? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?endpoint=admin/reject-item&id=${itemId}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Item rejected successfully');
            await loadAdminData();
            closeViewModal();
        } else {
            const error = await response.json();
            alert('Failed to reject item: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error rejecting item');
    }
}

function showTab(tabName) {
    document.getElementById('items-tab').style.display = 
        tabName === 'items' ? 'block' : 'none';
    document.getElementById('claims-tab').style.display = 
        tabName === 'claims' ? 'block' : 'none';

    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        }
    });
}

// Auto refresh every 5 seconds
setInterval(() => {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && window.getComputedStyle(adminPanel).display !== 'none') {
        loadAdminData();
    }
}, 5000);

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }

    // Initialize tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            showTab(tab.getAttribute('data-tab'));
        });
    });

    // Load admin data if already logged in
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && window.getComputedStyle(adminPanel).display !== 'none') {
        loadAdminData();
    }
});
