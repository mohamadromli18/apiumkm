// ============================================
// STATE
// ============================================
let isLoggedIn = false;

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
        fetchDashboard();
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
// FETCH DASHBOARD DATA
// ============================================
async function fetchDashboard() {
    try {
        const response = await fetch(API_URL + '?action=dashboard');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        renderStats(data);
        renderOrders(data.orders || []);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('statsGrid').innerHTML = '<div class="stat-card"><p>Gagal memuat data</p></div>';
        document.getElementById('tableContainer').innerHTML =
            '<div class="empty-state"><p>❌</p><p>Gagal memuat data</p></div>';
    }
}

// ============================================
// RENDER STATISTIK
// ============================================
function renderStats(data) {
    document.getElementById('totalOrders').textContent = data.totalOrders || 0;
    document.getElementById('todayOrders').textContent = data.todayOrders || 0;
    document.getElementById('todayRevenue').textContent = 'Rp ' + (data.todayRevenue || 0).toLocaleString('id-ID');
    document.getElementById('topMenu').textContent = data.topMenu || '-';
}

// ============================================
// RENDER TABEL PESANAN
// ============================================
function renderOrders(orders) {
    const container = document.getElementById('tableContainer');
    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>📭</p><p>Belum ada pesanan</p></div>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Waktu</th>
                    <th>Metode</th>
                    <th>Meja</th>
                    <th>Menu</th>
                    <th>Total</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    orders.forEach(order => {
        const statusClass = order.status === 'Baru' ? 'baru' :
            order.status === 'Diproses' ? 'diproses' : 'selesai';
        html += `
            <tr>
                <td>${order.waktu}</td>
                <td>${order.metode}</td>
                <td>${order.meja || '-'}</td>
                <td>${order.nama_item}</td>
                <td>Rp ${(order.total_harga || 0).toLocaleString('id-ID')}</td>
                <td><span class="status-badge ${statusClass}">${order.status || 'Baru'}</span></td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ============================================
// LOAD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('passwordInput').focus();

    // Refresh dashboard setiap 60 detik
    setInterval(() => {
        if (isLoggedIn) fetchDashboard();
    }, 60000);
});