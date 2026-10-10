// Base API Configuration
let API_BASE_URL = localStorage.getItem('api_base_url') || 'http://localhost:5055';
let allStudents = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set default date for Add Modal
    const today = new Date().toISOString().split('T')[0];
    const addDateInput = document.getElementById('addEnrollmentDate');
    if (addDateInput) addDateInput.value = today;

    const apiUrlInput = document.getElementById('apiUrlInput');
    if (apiUrlInput) apiUrlInput.value = API_BASE_URL;

    loadStudents();
});

// Update API Base URL manually
function changeApiUrl() {
    const input = document.getElementById('apiUrlInput');
    if (input && input.value.trim() !== '') {
        API_BASE_URL = input.value.trim().replace(/\/+$/, '');
        localStorage.setItem('api_base_url', API_BASE_URL);
        showToast(`API URL updated to: ${API_BASE_URL}`, 'info');
        loadStudents();
    }
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastMsg = document.getElementById('toastMessage');
    if (!toastEl || !toastMsg) return;

    toastEl.className = `toast align-items-center text-white border-0 bg-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success'}`;
    const icon = type === 'error' ? 'exclamation-circle-fill' : type === 'info' ? 'info-circle-fill' : 'check-circle-fill';
    toastMsg.innerHTML = `<i class="bi bi-${icon}"></i> ${message}`;

    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
}

// Set API status badge
function setApiStatus(isOnline, message = '') {
    const badge = document.getElementById('apiStatusBadge');
    const alertBox = document.getElementById('connectionAlert');
    const alertMsg = document.getElementById('connectionAlertMsg');

    if (!badge) return;

    if (isOnline) {
        badge.className = 'badge bg-success';
        badge.innerHTML = '<i class="bi bi-check-circle me-1"></i> Connected (Online)';
        if (alertBox) alertBox.classList.add('d-none');
    } else {
        badge.className = 'badge bg-danger';
        badge.innerHTML = '<i class="bi bi-x-circle me-1"></i> Disconnected (Offline)';
        if (alertBox && alertMsg) {
            alertMsg.innerHTML = `Cannot reach API at <strong>${API_BASE_URL}</strong>. Please ensure the API project is running on port 5055 or 7065.`;
            alertBox.classList.remove('d-none');
        }
    }
}

// 1. GET ALL STUDENTS (Read / GET)
async function loadStudents() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted mb-0">Connecting to API at ${API_BASE_URL}...</p>
            </td>
        </tr>
    `;

    try {
        let response = null;
        try {
            response = await fetch(`${API_BASE_URL}/api/students`);
        } catch (fetchErr) {
            // If http failed, try fallback https if not already https
            if (API_BASE_URL.startsWith('http://localhost:5055')) {
                const fallbackUrl = 'https://localhost:7065';
                try {
                    const fallbackRes = await fetch(`${fallbackUrl}/api/students`);
                    if (fallbackRes.ok) {
                        API_BASE_URL = fallbackUrl;
                        localStorage.setItem('api_base_url', API_BASE_URL);
                        response = fallbackRes;
                    }
                } catch {
                    // fallback also failed
                }
            }
            if (!response) throw fetchErr;
        }

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        allStudents = data;
        setApiStatus(true);
        updateStats();
        populateDepartmentFilter();
        renderTable(allStudents);
    } catch (err) {
        console.error('API Error:', err);
        setApiStatus(false, err.message);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-cloud-slash text-danger fs-1 mb-2 d-block"></i>
                    <h5 class="fw-bold text-dark">Failed to connect to API</h5>
                    <p class="text-muted small mb-3">Make sure the <strong>Api</strong> project is running.</p>
                    <div class="d-flex justify-content-center gap-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="loadStudents()">
                            <i class="bi bi-arrow-clockwise me-1"></i> Try Again
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Render Students Table
function renderTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    if (!students || students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="bi bi-people text-muted fs-1 mb-2 d-block"></i>
                        <h6 class="fw-bold text-dark">No Students Found</h6>
                        <p class="text-muted small mb-3">Click below to create your first student record in SQL Server.</p>
                        <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addStudentModal">
                            <i class="bi bi-person-plus-fill me-1"></i> Add Student
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let rowsHtml = '';
    students.forEach((student, index) => {
        const initials = student.name ? student.name.charAt(0).toUpperCase() : 'S';
        const formattedDate = student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'N/A';

        rowsHtml += `
            <tr>
                <td class="text-muted fw-bold">#${student.id}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="student-avatar">${initials}</div>
                        <div>
                            <div class="fw-semibold text-dark">${escapeHtml(student.name)}</div>
                            <small class="text-muted d-sm-none">${escapeHtml(student.email)}</small>
                        </div>
                    </div>
                </td>
                <td class="text-muted">${escapeHtml(student.email)}</td>
                <td>
                    <span class="badge badge-dept">${escapeHtml(student.department)}</span>
                </td>
                <td class="text-muted">${escapeHtml(student.phone || 'N/A')}</td>
                <td class="text-muted">${formattedDate}</td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info action-btn" title="View Details" onclick="openViewModal(${student.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning action-btn ms-1" title="Edit Student" onclick="openEditModal(${student.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger action-btn ms-1" title="Delete Student" onclick="openDeleteModal(${student.id}, '${escapeJs(student.name)}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

// Update Top Statistics
function updateStats() {
    const totalCountEl = document.getElementById('totalCount');
    const deptCountEl = document.getElementById('deptCount');

    if (totalCountEl) totalCountEl.innerText = allStudents.length;

    if (deptCountEl) {
        const uniqueDepts = new Set(allStudents.map(s => s.department).filter(Boolean));
        deptCountEl.innerText = uniqueDepts.size;
    }
}

// Populate Department Filter Dropdown
function populateDepartmentFilter() {
    const deptSelect = document.getElementById('departmentFilter');
    if (!deptSelect) return;

    const currentVal = deptSelect.value;
    const uniqueDepts = [...new Set(allStudents.map(s => s.department).filter(Boolean))].sort();

    let options = '<option value="">All Departments</option>';
    uniqueDepts.forEach(dept => {
        const selected = dept === currentVal ? 'selected' : '';
        options += `<option value="${escapeHtml(dept)}" ${selected}>${escapeHtml(dept)}</option>`;
    });
    deptSelect.innerHTML = options;
}

// Search & Filter
function filterStudents() {
    const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const selectedDept = document.getElementById('departmentFilter')?.value || '';

    const filtered = allStudents.filter(student => {
        const matchesQuery = !query ||
            (student.name && student.name.toLowerCase().includes(query)) ||
            (student.email && student.email.toLowerCase().includes(query)) ||
            (student.department && student.department.toLowerCase().includes(query)) ||
            (student.phone && student.phone.toLowerCase().includes(query));

        const matchesDept = !selectedDept || student.department === selectedDept;

        return matchesQuery && matchesDept;
    });

    renderTable(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const deptSelect = document.getElementById('departmentFilter');
    if (searchInput) searchInput.value = '';
    if (deptSelect) deptSelect.value = '';
    renderTable(allStudents);
}

// 2. CREATE STUDENT (POST)
async function handleAddStudent(event) {
    event.preventDefault();
    const saveBtn = document.getElementById('saveAddBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Creating...';

    const newStudent = {
        name: document.getElementById('addName').value.trim(),
        email: document.getElementById('addEmail').value.trim(),
        department: document.getElementById('addDepartment').value.trim(),
        phone: document.getElementById('addPhone').value.trim(),
        enrollmentDate: document.getElementById('addEnrollmentDate').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newStudent)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.message || 'Failed to create student record.');
        }

        const created = await response.json();
        showToast(`Student '${created.name}' created successfully!`, 'success');

        // Close modal & reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
        if (modal) modal.hide();
        document.getElementById('addStudentForm').reset();
        document.getElementById('addEnrollmentDate').value = new Date().toISOString().split('T')[0];

        // Refresh data
        await loadStudents();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check-lg"></i> Create Student (POST)';
    }
}

// 3. EDIT STUDENT (PUT)
function openEditModal(id) {
    const student = allStudents.find(s => s.id === id);
    if (!student) return;

    document.getElementById('editId').value = student.id;
    document.getElementById('editName').value = student.name || '';
    document.getElementById('editEmail').value = student.email || '';
    document.getElementById('editDepartment').value = student.department || '';
    document.getElementById('editPhone').value = student.phone || '';

    if (student.enrollmentDate) {
        document.getElementById('editEnrollmentDate').value = student.enrollmentDate.split('T')[0];
    }

    const modal = new bootstrap.Modal(document.getElementById('editStudentModal'));
    modal.show();
}

async function handleEditStudent(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('editId').value);
    const saveBtn = document.getElementById('saveEditBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

    const updatedStudent = {
        id: id,
        name: document.getElementById('editName').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        department: document.getElementById('editDepartment').value.trim(),
        phone: document.getElementById('editPhone').value.trim(),
        enrollmentDate: document.getElementById('editEnrollmentDate').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedStudent)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.message || 'Failed to update student record.');
        }

        showToast(`Student #${id} updated successfully!`, 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('editStudentModal'));
        if (modal) modal.hide();

        await loadStudents();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-save"></i> Save Changes (PUT)';
    }
}

// 4. VIEW DETAILS (GET by ID)
async function openViewModal(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/students/${id}`);
        if (!response.ok) throw new Error('Student details not found');
        const student = await response.json();

        document.getElementById('viewAvatar').innerText = (student.name || 'S').charAt(0).toUpperCase();
        document.getElementById('viewName').innerText = student.name;
        document.getElementById('viewDepartment').innerText = student.department;
        document.getElementById('viewId').innerText = `#${student.id}`;
        document.getElementById('viewEmail').innerText = student.email;
        document.getElementById('viewPhone').innerText = student.phone || 'N/A';
        document.getElementById('viewEnrollmentDate').innerText = student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A';

        const modal = new bootstrap.Modal(document.getElementById('viewStudentModal'));
        modal.show();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// 5. DELETE STUDENT (DELETE)
function openDeleteModal(id, name) {
    document.getElementById('deleteStudentId').value = id;
    document.getElementById('deleteStudentName').innerText = `${name} (#${id})`;

    const modal = new bootstrap.Modal(document.getElementById('deleteStudentModal'));
    modal.show();
}

async function handleDeleteStudent() {
    const id = parseInt(document.getElementById('deleteStudentId').value);
    const deleteBtn = document.getElementById('confirmDeleteBtn');
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Deleting...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.message || 'Failed to delete student.');
        }

        showToast(`Student #${id} deleted from database!`, 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteStudentModal'));
        if (modal) modal.hide();

        await loadStudents();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="bi bi-trash-fill"></i> Yes, Delete Record';
    }
}

// Utility: HTML Escaping
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJs(text) {
    if (!text) return '';
    return String(text).replace(/'/g, "\\'").replace(/"/g, '\\"');
}
