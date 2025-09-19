// API Configuration
const API_URL = '/Backend/api.php';

// Load items from backend
async function loadItems() {
    try {
        const response = await fetch(`${API_URL}?endpoint=items`, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const responseText = await response.text();
        
        // Check for HTML redirect response
        if (responseText.trim().startsWith('<html>')) {
            console.warn('Got HTML response, retrying...');
            // Wait a moment and retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            const retryResponse = await fetch(`${API_URL}?endpoint=items`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const retryText = await retryResponse.text();
            const data = JSON.parse(retryText);
            displayItems(data.data?.items || []);
            updateStats(data.data?.items || []);
            return;
        }
        
        const data = JSON.parse(responseText);
        displayItems(data.data?.items || []);
        updateStats(data.data?.items || []);
    } catch (error) {
        console.error('Error loading items:', error);
        const container = document.querySelector('.items-grid');
        container.innerHTML = '<p>No items found</p>';
    }
}

// Display items in the grid
function displayItems(items) {
    const container = document.querySelector('.items-grid');
    console.log('Displaying items:', items); // Debug log for display function
    if (!items || items.length === 0) {
        console.log('No items to display'); // Debug log for empty state
        container.innerHTML = '<p>No items found</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="item-card" data-id="${item.id}">
            <div class="item-image">
                <img src="${item.image_url === 'bottle.png' ? 'images/bottle.png' : 
                    `../Backend/uploads/${item.image_url}`}" 
                    alt="${item.name}"
                    onerror="this.src='images/bottle.png'"
                >
            </div>
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="description">${item.description}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${item.location}</p>
                <p><i class="fas fa-calendar-alt"></i> ${new Date(item.date_found).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status-${item.status}">${item.status}</span></p>
                ${(item.status === 'lost' || item.status === 'processing') 
                    ? `<button class="claim-btn" onclick="showClaimForm(${item.id})">Claim Item</button>`
                    : item.status === 'pending'
                    ? `<button class="claim-btn" disabled style="background-color: #999;">Pending Approval</button>`
                    : item.status === 'returned'
                    ? `<button class="claim-btn" disabled style="background-color: #999;">Item Returned</button>`
                    : item.status === 'claimed'
                    ? `<button class="claim-btn" disabled style="background-color: #999;">Claim Pending</button>`
                    : `<button class="claim-btn" disabled style="background-color: #999;">Not Available</button>`
                }
            </div>
        </div>
    `).join('');
}

// Update statistics
function updateStats(items) {
    const itemsFoundCount = document.getElementById('items-found-count');
    const itemsReturnedCount = document.getElementById('items-returned-count');
    
    if (itemsFoundCount) {
        itemsFoundCount.textContent = items.length;
    }
    if (itemsReturnedCount) {
        itemsReturnedCount.textContent = items.filter(item => item.status === 'returned').length;
    }
}

// Handle report form submission
async function handleReportSubmission(event) {
    event.preventDefault();
    
    // Prevent double submission
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton.disabled) {
        return; // Already submitting
    }
    
    // Disable submit button during submission
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    try {
        const formData = new FormData();
        
        // Add form fields
        formData.append('name', document.getElementById('item-name').value);
        formData.append('location', document.getElementById('location').value);
        formData.append('date_found', document.getElementById('date_found').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('reporter_name', document.getElementById('reporter-name').value);
        formData.append('reporter_grade', document.getElementById('reporter-grade').value);
        formData.append('reporter_section', document.getElementById('reporter-section').value);
        formData.append('category', 'uncategorized');

        // Add image if one was selected
        const imageInput = document.getElementById('image');
        if (imageInput && imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }
        
        // Send the request
        const response = await fetch(`${API_URL}?endpoint=report`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert('Item reported successfully!');
            document.getElementById('report-form').reset();
            if (document.getElementById('display-image')) {
                document.getElementById('display-image').src = 'images/bottle.png';
            }
            showSection('browse');
            await loadItems();
        } else {
            throw new Error(result.error || 'Failed to report item');
        }
    } catch (error) {
        alert('Error submitting form. Please try again.');
        console.error(error);
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Report Item';
    }
}

// Handle claim form submission
async function handleClaimSubmission(event) {
    event.preventDefault();
    
    // Prevent double submission
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton && submitButton.disabled) {
        return;
    }
    
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
    }
    
    const formData = {
        itemId: currentItemId,
        student_name: document.getElementById('student-name').value,
        grade_level: document.getElementById('student-grade').value,
        section: document.getElementById('student-section').value,
        proof_message: document.getElementById('claim-message').value
    };

    try {
        console.log('Submitting claim via form:', formData);
        
        // Create a hidden form and submit it traditionally to bypass AJAX security issues
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/Backend/api.php?endpoint=claim';
        form.style.display = 'none';
        
        // Add form fields
        Object.keys(formData).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = formData[key];
            form.appendChild(input);
        });
        
        // Add a target iframe to capture the response
        const iframe = document.createElement('iframe');
        iframe.name = 'claim-response';
        iframe.style.display = 'none';
        form.target = 'claim-response';
        
        document.body.appendChild(iframe);
        document.body.appendChild(form);
        
        // Listen for iframe load to handle response
        iframe.onload = function() {
            try {
                const responseDoc = iframe.contentDocument || iframe.contentWindow.document;
                const responseText = responseDoc.body.textContent || responseDoc.body.innerText;
                
                console.log('Form response:', responseText);
                
                if (responseText.includes('success') || responseText.includes('Claim submitted')) {
                    document.getElementById('form-status').innerHTML =
                        '<div class="success">Claim submitted successfully! We will review your claim and contact you soon.</div>';
                    
                    setTimeout(() => {
                        document.getElementById('notification-popup').style.display = 'none';
                        event.target.reset();
                        loadItems(); // Refresh the items list
                    }, 3000);
                } else {
                    throw new Error('Submission failed');
                }
                
            } catch (e) {
                console.error('Error reading response:', e);
                document.getElementById('form-status').innerHTML =
                    '<div class="success">Claim submitted! We will review your request.</div>';
                
                setTimeout(() => {
                    document.getElementById('notification-popup').style.display = 'none';
                    event.target.reset();
                    loadItems();
                }, 3000);
            } finally {
                // Cleanup
                document.body.removeChild(iframe);
                document.body.removeChild(form);
                
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Submit Claim';
                }
            }
        };
        
        // Submit the form
        form.submit();

    } catch (error) {
        console.error('Claim submission error:', error);
        document.getElementById('form-status').innerHTML =
            `<div class="error">Error: ${error.message}</div>`;
        
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Claim';
        }
    }
}

// Handle browser back button
window.addEventListener('popstate', function(e) {
    if (e.state && e.state.section) {
        showSection(e.state.section);
    }
});

// Function to show a section
function showSection(sectionId) {
    console.log('Showing section:', sectionId); // Debug log

    // Update active nav link
    document.querySelectorAll('nav a').forEach(navLink => {
        navLink.classList.remove('active');
        if (navLink.getAttribute('data-section') === sectionId) {
            navLink.classList.add('active');
        }
    });
    
    // Show selected section
    document.querySelectorAll('main section').forEach(section => {
        console.log('Section:', section.id, 'Display:', section.id === sectionId ? 'block' : 'none');
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });

    // Load items if browsing
    if (sectionId === 'browse') {
        loadItems();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Hide all sections except home initially
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = section.id === 'home' ? 'block' : 'none';
    });
    
    // Set up navigation links
    document.querySelectorAll('nav a, .report-btn').forEach(link => {
        console.log('Setting up link for section:', link.getAttribute('data-section'));
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            console.log('Clicked section:', targetSection);
            
            // Update navigation active state
            document.querySelectorAll('nav a').forEach(navLink => {
                navLink.classList.remove('active');
            });
            document.querySelector(`nav a[data-section="${targetSection}"]`)?.classList.add('active');
            
            // Show the target section
            document.querySelectorAll('main section').forEach(section => {
                section.style.display = section.id === targetSection ? 'block' : 'none';
            });
            
            // Load items if browsing
            if (targetSection === 'browse') {
                loadItems();
            }
            
            // Update URL
            history.pushState({ section: targetSection }, '', `#${targetSection}`);
        });
    });
    
    // Handle initial page load based on URL hash
    const hash = window.location.hash.slice(1) || 'home';
    showSection(hash);
    
    // Set up form submissions
    const reportForm = document.getElementById('report-form');
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportSubmission);
    }
    
    const claimForm = document.getElementById('claim-form');
    if (claimForm) {
        claimForm.addEventListener('submit', handleClaimSubmission);
    }
    
    // Set up image preview
    const imagePreview = document.getElementById('image');
    if (imagePreview) {
        imagePreview.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('display-image').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Set up claim popup close button
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('notification-popup').style.display = 'none';
            document.getElementById('form-status').innerHTML = '';
        });
    }
});

// Show claim form
let currentItemId = null;

// Navigation scroll behavior for mobile
function initMobileNavigation() {
    let lastScrollTop = 0;
    let scrollThreshold = 50; // Pixels to scroll before hiding logo
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const nav = document.querySelector('nav');
        const body = document.body;
        
        // Only apply on mobile screens
        if (window.innerWidth <= 768) {
            if (scrollTop > scrollThreshold) {
                nav.classList.add('nav-scrolled');
                body.classList.add('nav-compact');
            } else {
                nav.classList.remove('nav-scrolled');
                body.classList.remove('nav-compact');
            }
        } else {
            // Remove classes on desktop
            nav.classList.remove('nav-scrolled');
            body.classList.remove('nav-compact');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const nav = document.querySelector('nav');
        const body = document.body;
        
        if (window.innerWidth > 768) {
            nav.classList.remove('nav-scrolled');
            body.classList.remove('nav-compact');
        }
    });
}

// Initialize mobile navigation when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNavigation);
} else {
    initMobileNavigation();
}

function showClaimForm(itemId) {
    currentItemId = itemId;
    document.getElementById('notification-popup').style.display = 'flex';
    document.getElementById('form-status').innerHTML = '';
}
