// ============================================
// STATE
// ============================================
let allItems = [];
let isLoggedIn = false;
let deleteTargetId = null;
let isEditing = false;
let uploadedImageUrl = '';

// ============================================
// AUTHENTICATION
// ============================================
function login() {
    const password = document.getElementById('passwordInput').value;
    const errorEl = document.getElementById('loginError');

    if (password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        errorEl.style.display = 'none';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        fetchMenu();
    } else {
        errorEl.style.display = 'block';
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    }
}

function logout() {
    isLoggedIn = false;
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').style.display = 'none';
}

// ============================================
// FETCH MENU
// ============================================
async function fetchMenu() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        allItems = data;
        renderTable();
    } catch (error) {
        showToast('Gagal memuat data: ' + error.message, 'error');
        document.getElementById('tableContainer').innerHTML =
            '<div class="empty-state"><p>❌</p><p>Gagal memuat data</p></div>';
    }
}

// ============================================
// RENDER TABLE
// ============================================
function renderTable() {
    const container = document.getElementById('tableContainer');
    const search = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = allItems;

    if (statusFilter !== 'all') {
        filtered = filtered.filter(item => item.tersedia === statusFilter);
    }

    if (search) {
        filtered = filtered.filter(item =>
            item.nama_item.toLowerCase().includes(search) ||
            (item.kategori && item.kategori.toLowerCase().includes(search))
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>📭</p>
                <p>Tidak ada menu ditemukan</p>
                <p style="font-size:14px;color:#bbb;margin-top:8px;">
                    ${allItems.length === 0 ? 'Belum ada menu. Klik "Tambah Menu" untuk memulai.' : 'Coba ubah filter pencarian.'}
                </p>
            </div>
        `;
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Gambar</th>
                    <th>Nama</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th>Status</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
    `;

    filtered.forEach(item => {
        const statusClass = item.tersedia === 'ya' ? 'available' : 'unavailable';
        const statusLabel = item.tersedia === 'ya' ? 'Tersedia' : 'Tidak Tersedia';
        const thumb = item.link_gambar || 'https://picsum.photos/id/1/60/60';

        html += `
            <tr>
                <td>${item.id}</td>
                <td><img class="menu-thumb" src="${thumb}" alt="${item.nama_item}" onerror="this.src='https://picsum.photos/id/1/60/60'"></td>
                <td><strong>${item.nama_item}</strong></td>
                <td>${item.kategori || '-'}</td>
                <td>${formatRupiah(parseInt(item.harga))}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-primary btn-sm" onclick="openEditModal(${item.id})">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDelete(${item.id})">🗑️ Hapus</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function filterTable() {
    renderTable();
}

// ============================================
// MODAL FORM
// ============================================
function openAddModal() {
    isEditing = false;
    document.getElementById('formTitle').textContent = '➕ Tambah Menu';
    document.getElementById('editId').value = '';
    document.getElementById('fNama').value = '';
    document.getElementById('fHarga').value = '';
    document.getElementById('fKategori').value = '';
    document.getElementById('fDeskripsi').value = '';
    document.getElementById('fLinkGambar').value = '';
    document.getElementById('fTersedia').value = 'ya';
    document.getElementById('fileNameDisplay').textContent = 'Belum ada file dipilih';
    document.getElementById('uploadPlaceholder').textContent = '📤 Klik untuk pilih gambar';
    document.getElementById('imagePreview').classList.remove('visible');
    document.getElementById('imagePreview').src = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('formSubmitBtn').textContent = 'Simpan';
    document.getElementById('formModal').classList.add('active');
}

async function openEditModal(id) {
    const item = allItems.find(i => parseInt(i.id) === id);
    if (!item) {
        showToast('Menu tidak ditemukan', 'error');
        return;
    }

    isEditing = true;
    document.getElementById('formTitle').textContent = '✏️ Edit Menu';
    document.getElementById('editId').value = id;
    document.getElementById('fNama').value = item.nama_item;
    document.getElementById('fHarga').value = item.harga;
    document.getElementById('fKategori').value = item.kategori || '';
    document.getElementById('fDeskripsi').value = item.deskripsi || '';
    document.getElementById('fLinkGambar').value = item.link_gambar || '';
    document.getElementById('fTersedia').value = item.tersedia || 'ya';
    document.getElementById('fileNameDisplay').textContent = item.link_gambar ? 'Gambar sudah ada' : 'Belum ada file dipilih';
    document.getElementById('uploadPlaceholder').textContent = item.link_gambar ? '📷 Gambar sudah ada, klik untuk ganti' : '📤 Klik untuk pilih gambar';

    if (item.link_gambar) {
        const preview = document.getElementById('imagePreview');
        preview.src = item.link_gambar;
        preview.classList.add('visible');
    } else {
        document.getElementById('imagePreview').classList.remove('visible');
    }

    document.getElementById('fileInput').value = '';
    document.getElementById('formSubmitBtn').textContent = 'Update';
    document.getElementById('formModal').classList.add('active');
}

function closeModal() {
    document.getElementById('formModal').classList.remove('active');
}

// ============================================
// FILE UPLOAD HANDLER
// ============================================
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageData = e.target.result;

        const preview = document.getElementById('imagePreview');
        preview.src = imageData;
        preview.classList.add('visible');

        document.getElementById('fileNameDisplay').textContent = file.name;
        document.getElementById('uploadPlaceholder').textContent = '📷 Gambar dipilih, mengupload...';

        const base64Data = imageData.split(',')[1];
        const result = await callAPI('upload_image', {
            imageData: base64Data,
            fileName: file.name,
            mimeType: file.type
        });

        if (result.success) {
            uploadedImageUrl = result.url;
            document.getElementById('fLinkGambar').value = result.url;
            document.getElementById('uploadPlaceholder').textContent = '✅ Gambar berhasil diupload';
            showToast('Gambar berhasil diupload', 'success');
        } else {
            document.getElementById('uploadPlaceholder').textContent = '❌ Gagal upload: ' + (result.error || 'unknown');
            showToast('Gagal upload gambar: ' + (result.error || 'unknown'), 'error');
        }
    };
    reader.readAsDataURL(file);
}

// ============================================
// SUBMIT FORM
// ============================================
async function submitForm() {
    const nama = document.getElementById('fNama').value.trim();
    const harga = document.getElementById('fHarga').value.trim();
    const kategori = document.getElementById('fKategori').value;
    const deskripsi = document.getElementById('fDeskripsi').value.trim();
    const linkGambar = document.getElementById('fLinkGambar').value.trim();
    const tersedia = document.getElementById('fTersedia').value;
    const editId = document.getElementById('editId').value;

    if (!nama) {
        showToast('Nama menu wajib diisi', 'error');
        document.getElementById('fNama').focus();
        return;
    }
    if (!harga || parseInt(harga) <= 0) {
        showToast('Harga wajib diisi dengan angka valid', 'error');
        document.getElementById('fHarga').focus();
        return;
    }
    if (!kategori) {
        showToast('Kategori wajib dipilih', 'error');
        document.getElementById('fKategori').focus();
        return;
    }

    const finalImage = uploadedImageUrl || linkGambar;

    const data = {
        nama_item: nama,
        harga: parseInt(harga),
        kategori: kategori,
        deskripsi: deskripsi,
        link_gambar: finalImage,
        tersedia: tersedia
    };

    let result;
    if (editId) {
        data.id = parseInt(editId);
        result = await callAPI('edit', data);
    } else {
        result = await callAPI('add', data);
    }

    if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        uploadedImageUrl = '';
        await fetchMenu();
    } else {
        showToast('Gagal: ' + (result.error || result.message || 'unknown error'), 'error');
    }
}

// ============================================
// DELETE CONFIRMATION
// ============================================
function confirmDelete(id) {
    deleteTargetId = id;
    const item = allItems.find(i => parseInt(i.id) === id);
    document.getElementById('confirmMessage').textContent =
        `Apakah Anda yakin ingin menyembunyikan menu "${item ? item.nama_item : id}"? (soft delete)`;
    document.getElementById('confirmDialog').classList.add('active');
    document.getElementById('confirmYesBtn').onclick = function() {
        executeDelete(deleteTargetId);
    };
}

function closeConfirm() {
    document.getElementById('confirmDialog').classList.remove('active');
    deleteTargetId = null;
}

async function executeDelete(id) {
    closeConfirm();
    const result = await callAPI('delete', { id: parseInt(id) });

    if (result.success) {
        showToast(result.message, 'success');
        await fetchMenu();
    } else {
        showToast('Gagal: ' + (result.error || result.message || 'unknown error'), 'error');
    }
}

// ============================================
// EVENT LISTENER
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('formModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    document.getElementById('confirmDialog').addEventListener('click', function(e) {
        if (e.target === this) closeConfirm();
    });

    document.getElementById('menuForm').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitForm();
        }
    });

    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('passwordInput').focus();
});