// ============================================
// KONFIGURASI BERSAMA
// ============================================

// 🔥 GANTI DENGAN URL API ANDA
const API_URL = 'https://script.google.com/macros/s/AKfycbx_5XaWeKR3BRTGwJkmcSSnkNzeJ06T8uSQbK1b77W1TrhbqhuvvKowhRnAYvipEzW4/exec';

// 🔥 GANTI DENGAN PASSWORD YANG SAMA DENGAN DI APPS SCRIPT
const ADMIN_PASSWORD = 'admin123';

// 🔥 KONFIGURASI KHUSUS INDEX.HTML
const WHATSAPP_NUMBER = '6285749490884';
const STORE_NAME = 'Aghnia Restaurant';

// ============================================
// FUNGSI BERSAMA
// ============================================

// Format Rupiah
function formatRupiah(angka) {
    return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ============================================
// API CALLS (Untuk admin.html)
// ============================================
async function callAPI(action, data = {}) {
    const payload = {
        action: action,
        password: ADMIN_PASSWORD,
        ...data
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}