// script.js - Complaint Management System Logic

// Data Storage
let complaints = [];
let nextId = 1;

// Product types configuration
const PRODUCT_TYPES = [
    'ATM',
    'MIB-11',
    'TOKEN MACHINE',
    'POS Machine',
    'Cash Counter',
    'Other'
];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeProductFilter();
    setupEventListeners();
});

// Load data from localStorage
function loadData() {
    const stored = localStorage.getItem('complaint_system_data');
    if (stored) {
        try {
            complaints = JSON.parse(stored);
            nextId = complaints.length > 0 ? Math.max(...complaints.map(c => c.id), 0) + 1 : 1;
        } catch(e) {
            console.error('Error loading data:', e);
            initializeSampleData();
        }
    } else {
        initializeSampleData();
    }
    refreshUI();
}

// Initialize sample data
function initializeSampleData() {
    complaints = [
        {
            id: 1,
            customerName: "John Doe",
            customerPhone: "+1234567890",
            customerEmail: "john.doe@example.com",
            productType: "ATM",
            serialNumber: "ATM-2024-001",
            description: "Screen not responding to touch inputs. Customer cannot complete transactions.",
            priority: "High",
            status: "pending",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            remarks: "Urgent - Multiple customers affected",
            resolvedAt: null
        }
    ];
    nextId = 2;
    saveData();
}

function saveData() {
    localStorage.setItem('complaint_system_data', JSON.stringify(complaints));
}

function refreshUI() {
    renderComplaints();
    updateStats();
}

function updateStats() {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const progress = complaints.filter(c => c.status === 'in-progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('progressCount').textContent = progress;
    document.getElementById('resolvedCount').textContent = resolved;
}

function initializeProductFilter() {
    const filter = document.getElementById('productFilter');
    // Clear existing besides 'All'
    filter.innerHTML = '<option value="all">All Products</option>';
    PRODUCT_TYPES.forEach(product => {
        const option = document.createElement('option');
        option.value = product;
        option.textContent = product;
        filter.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById('statusFilter').addEventListener('change', () => renderComplaints());
    document.getElementById('productFilter').addEventListener('change', () => renderComplaints());
    document.getElementById('searchInput').addEventListener('input', () => renderComplaints());
}

function renderComplaints() {
    const statusFilter = document.getElementById('statusFilter').value;
    const productFilter = document.getElementById('productFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = complaints.filter(complaint => {
        const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
        const matchesProduct = productFilter === 'all' || complaint.productType === productFilter;
        const matchesSearch = searchTerm === '' || 
            complaint.customerName.toLowerCase().includes(searchTerm) ||
            complaint.id.toString().includes(searchTerm) ||
            complaint.serialNumber.toLowerCase().includes(searchTerm);
        
        return matchesStatus && matchesProduct && matchesSearch;
    });
    
    const grid = document.getElementById('complaintsGrid');
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                <h3>No complaints found</h3>
                <p>Try adjusting your filters or add a new complaint.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filtered.map(complaint => `
        <div class="complaint-card" onclick="viewDetails(${complaint.id})">
            <div class="complaint-header">
                <span class="complaint-id">#${complaint.id}</span>
                <span class="complaint-date">${formatDate(complaint.createdAt)}</span>
            </div>
            <div class="complaint-product">${complaint.productType}</div>
            <div class="complaint-customer">
                <div style="margin-bottom: 4px;">👤 ${escapeHtml(complaint.customerName)}</div>
                <div>🏷️ ${escapeHtml(complaint.serialNumber)}</div>
            </div>
            <div class="complaint-description">${escapeHtml(truncateText(complaint.description, 100))}</div>
            <div class="badges">
                <span class="badge priority-${complaint.priority.toLowerCase()}">${complaint.priority}</span>
                <span class="badge status-${complaint.status}">${getStatusText(complaint.status)}</span>
            </div>
        </div>
    `).join('');
}

// Helpers
function getStatusText(status) {
    const statusMap = { 'pending': 'Pending', 'in-progress': 'In Progress', 'resolved': 'Resolved' };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Modal management
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Register New Complaint';
    document.getElementById('complaintForm').reset();
    document.getElementById('complaintId').value = '';
    document.getElementById('complaintModal').classList.add('active');
}

function closeModal() {
    document.getElementById('complaintModal').classList.remove('active');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

function saveComplaint() {
    const id = document.getElementById('complaintId').value;
    const complaintData = {
        customerName: document.getElementById('customerName').value.trim(),
        customerPhone: document.getElementById('customerPhone').value.trim(),
        customerEmail: document.getElementById('customerEmail').value.trim(),
        productType: document.getElementById('productType').value,
        serialNumber: document.getElementById('serialNumber').value.trim(),
        description: document.getElementById('description').value.trim(),
        priority: document.getElementById('priority').value,
    };
    
    if (!complaintData.customerName || !complaintData.customerPhone || 
        !complaintData.serialNumber || !complaintData.description || !complaintData.productType) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    if (id) {
        const index = complaints.findIndex(c => c.id == id);
        if (index !== -1) {
            complaints[index] = { ...complaints[index], ...complaintData };
            showToast('Complaint updated successfully', 'success');
        }
    } else {
        const newComplaint = {
            id: nextId++,
            ...complaintData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            remarks: '',
            resolvedAt: null
        };
        complaints.push(newComplaint);
        showToast(`Complaint #${newComplaint.id} registered!`, 'success');
    }
    
    saveData();
    refreshUI();
    closeModal();
}

function viewDetails(id) {
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return;
    
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <h4 style="margin-bottom: 1rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem;">📋 Complaint Info</h4>
                <p><strong>ID:</strong> #${complaint.id}</p>
                <p><strong>Status:</strong> 
                    <select onchange="updateStatus(${complaint.id}, this.value)" style="margin-left: 10px;">
                        <option value="pending" ${complaint.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${complaint.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </p>
                <p><strong>Priority:</strong> <span class="badge priority-${complaint.priority.toLowerCase()}">${complaint.priority}</span></p>
                <p><strong>Created:</strong> ${formatDate(complaint.createdAt)}</p>
            </div>
            <div>
                <h4 style="margin-bottom: 1rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem;">👤 Customer Details</h4>
                <p><strong>Name:</strong> ${escapeHtml(complaint.customerName)}</p>
                <p><strong>Phone:</strong> ${escapeHtml(complaint.customerPhone)}</p>
                <p><strong>Email:</strong> ${escapeHtml(complaint.customerEmail || 'N/A')}</p>
            </div>
        </div>
        <div style="margin-top: 2rem;">
            <h4 style="margin-bottom: 1rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem;">🔧 Product & Issue</h4>
            <p><strong>Product:</strong> ${complaint.productType}</p>
            <p><strong>Serial:</strong> ${escapeHtml(complaint.serialNumber)}</p>
            <p style="margin-top: 1rem;"><strong>Description:</strong></p>
            <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; margin-top: 0.5rem;">
                ${escapeHtml(complaint.description)}
            </div>
        </div>
        <div style="margin-top: 2rem;">
            <h4>💬 Admin Remarks</h4>
            <textarea id="remarksInput" rows="3" style="width: 100%; margin-top: 0.5rem;">${escapeHtml(complaint.remarks || '')}</textarea>
            <button class="btn-primary" onclick="addRemark(${complaint.id})" style="margin-top: 0.5rem;">Update Remark</button>
        </div>
        <div style="margin-top: 2rem; display: flex; gap: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
            <button class="btn-danger" onclick="deleteComplaint(${complaint.id})">Delete</button>
            <button class="btn-secondary" onclick="exportComplaint(${complaint.id})">Export JSON</button>
        </div>
    `;
    
    document.getElementById('detailModal').classList.add('active');
}

function updateStatus(id, newStatus) {
    const index = complaints.findIndex(c => c.id === id);
    if (index !== -1) {
        complaints[index].status = newStatus;
        if (newStatus === 'resolved' && !complaints[index].resolvedAt) {
            complaints[index].resolvedAt = new Date().toISOString();
        }
        saveData();
        refreshUI();
        showToast('Status updated', 'success');
    }
}

function addRemark(id) {
    const remark = document.getElementById('remarksInput').value;
    const index = complaints.findIndex(c => c.id === id);
    if (index !== -1) {
        complaints[index].remarks = remark;
        saveData();
        showToast('Remark saved', 'success');
    }
}

function deleteComplaint(id) {
    if (confirm('Delete this complaint permanently?')) {
        complaints = complaints.filter(c => c.id !== id);
        saveData();
        refreshUI();
        closeDetailModal();
        showToast('Deleted', 'success');
    }
}

function exportComplaint(id) {
    const complaint = complaints.find(c => c.id === id);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(complaint, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `complaint_${id}.json`);
    dlAnchorElem.click();
}

function exportAllData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(complaints, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "all_complaints.json");
    dlAnchorElem.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = evt => {
            try {
                const imported = JSON.parse(evt.target.result);
                if (Array.isArray(imported)) {
                    complaints = imported;
                    nextId = Math.max(...complaints.map(c => c.id), 0) + 1;
                    saveData();
                    refreshUI();
                    showToast('Imported successfully', 'success');
                }
            } catch(e) { showToast('Invalid file', 'error'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#22c55e';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function clearAllData() {
    if (confirm('Wipe ALL data? This cannot be undone.')) {
        complaints = [];
        nextId = 1;
        saveData();
        refreshUI();
        showToast('All data cleared', 'success');
    }
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target.className === 'modal active') {
        closeModal();
        closeDetailModal();
    }
}