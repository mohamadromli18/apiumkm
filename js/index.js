// ============================================
// STATE
// ============================================
let allItems = [];
let cart = [];
let orderNotes = '';
let deliveryMethod = 'dine-in';
let tableNumber = '';

// ============================================
// LOCALSTORAGE
// ============================================
function saveToLocalStorage() {
    try {
        const data = {
            cart: cart,
            notes: document.getElementById('orderNotes').value,
            delivery: document.querySelector('input[name="delivery"]:checked')?.value || 'dine-in',
            table: document.getElementById('tableNumber').value
        };
        localStorage.setItem('resto_cart', JSON.stringify(data));
    } catch (e) {}
}

function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem('resto_cart');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.cart && Array.isArray(data.cart)) {
            cart = data.cart;
        }
        if (data.notes !== undefined) {
            document.getElementById('orderNotes').value = data.notes;
        }
        if (data.delivery) {
            const radio = document.querySelector(`input[name="delivery"][value="${data.delivery}"]`);
            if (radio) radio.checked = true;
            deliveryMethod = data.delivery;
        }
        if (data.table) {
            document.getElementById('tableNumber').value = data.table;
            tableNumber = data.table;
        }
        toggleTableInput(deliveryMethod);
        updateEstimation();
        updateCartUI();
        renderCartModal();
    } catch (e) {}
}

// ============================================
// ESTIMASI WAKTU
// ============================================
function calculateEstimation() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    let base = 0;
    let extraPerItem = 0;

    switch (deliveryMethod) {
        case 'dine-in':
            base = 15;
            extraPerItem = 3;
            break;
        case 'takeaway':
            base = 10;
            extraPerItem = 2;
            break;
        case 'delivery':
            base = 30;
            extraPerItem = 5;
            break;
        default:
            base = 20;
            extraPerItem = 3;
    }

    const total = base + (totalItems * extraPerItem);
    const min = total - 5;
    const max = total + 5;
    return { min, max, total };
}

function updateEstimation() {
    const display = document.getElementById('estimationDisplay');
    const text = document.getElementById('estimationText');
    if (cart.length === 0) {
        display.style.display = 'none';
        return;
    }
    const est = calculateEstimation();
    text.textContent = `${est.min}-${est.max} menit`;
    display.style.display = 'block';
}

// ============================================
// TOGGLE INPUT MEJA
// ============================================
function toggleTableInput(method) {
    const container = document.getElementById('tableInput');
    if (method === 'dine-in') {
        container.classList.add('visible');
    } else {
        container.classList.remove('visible');
    }
}

// ============================================
// FETCH MENU
// ============================================
async function fetchMenu() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Gagal mengambil data');
        const data = await response.json();
        allItems = data.filter(item => item.tersedia === 'ya');
        renderCategories();
        renderMenu('semua');
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('menuGrid').innerHTML =
            '<div class="loading">Gagal memuat menu. Periksa koneksi atau URL API.</div>';
    }
}

// ============================================
// RENDER KATEGORI
// ============================================
function renderCategories() {
    const categories = ['semua', ...new Set(allItems.map(item => item.kategori))];
    const container = document.getElementById('categories');
    container.innerHTML = categories.map(cat =>
        `<button class="category-btn ${cat === 'semua' ? 'active' : ''}" data-category="${cat}">
            ${cat === 'semua' ? 'Semua' : cat}
        </button>`
    ).join('');

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderMenu(btn.dataset.category);
        });
    });
}

// ============================================
// RENDER MENU
// ============================================
function renderMenu(category) {
    const filtered = category === 'semua' ?
        allItems :
        allItems.filter(item => item.kategori === category);

    const container = document.getElementById('menuGrid');

    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">Tidak ada menu di kategori ini</div>';
        return;
    }

    container.innerHTML = filtered.map(item => `
        <div class="menu-card" data-id="${item.id}">
            <img class="card-img" src="${item.link_gambar}" alt="${item.nama_item}" 
                 onerror="this.src='https://picsum.photos/id/1/400/300'">
            <div class="card-content">
                <div class="card-title">${item.nama_item}</div>
                <div class="card-category">${item.kategori}</div>
                <div class="card-desc">${item.deskripsi || ''}</div>
                <div class="price-row">
                    <span class="price">${formatRupiah(parseInt(item.harga))}</span>
                    <button class="order-btn" data-id="${item.id}" data-nama="${item.nama_item}" data-harga="${item.harga}">
                        + Tambah
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const nama = btn.dataset.nama;
            const harga = parseInt(btn.dataset.harga);
            addToCart(id, nama, harga);
        });
    });
}

// ============================================
// FUNGSI KERANJANG
// ============================================
function addToCart(id, nama, harga) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id, nama_item: nama, harga, quantity: 1 });
    }
    updateCartUI();
    saveToLocalStorage();

    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = '✓ Ditambahkan';
    setTimeout(() => { btn.innerText = originalText; }, 800);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    renderCartModal();
    saveToLocalStorage();
    updateEstimation();
}

function updateQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
        removeFromCart(id);
        return;
    }
    item.quantity = newQty;
    updateCartUI();
    renderCartModal();
    saveToLocalStorage();
    updateEstimation();
}

function getTotalItems() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getTotalPrice() {
    return cart.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
}

// ============================================
// UPDATE UI KERANJANG
// ============================================
function updateCartUI() {
    const footer = document.getElementById('cartFooter');
    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();

    if (totalItems === 0) {
        footer.style.display = 'none';
    } else {
        footer.style.display = 'flex';
        document.getElementById('footerItemCount').innerText = totalItems;
        document.getElementById('footerTotal').innerHTML = formatRupiah(totalPrice);
    }
    updateEstimation();
}

// ============================================
// RENDER MODAL KERANJANG
// ============================================
function renderCartModal() {
    const container = document.getElementById('cartItemsContainer');
    const totalPrice = getTotalPrice();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <p style="font-size:48px;">🛒</p>
                <p>Keranjang masih kosong</p>
                <p style="font-size:14px;color:#bbb;margin-top:8px;">Tambahkan menu dari daftar</p>
            </div>
        `;
        document.getElementById('modalTotalPrice').innerHTML = formatRupiah(0);
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.nama_item}</div>
                <div class="cart-item-price">${formatRupiah(item.harga)}</div>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn remove" onclick="removeFromCart(${item.id})">✕</button>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
        </div>
    `).join('');

    document.getElementById('modalTotalPrice').innerHTML = formatRupiah(totalPrice);
}

// ============================================
// FORMAT PESANAN WA
// ============================================
function formatWhatsAppMessage() {
    const methodLabels = {
        'dine-in': 'Dine-in',
        'takeaway': 'Takeaway',
        'delivery': 'Delivery'
    };

    let message = `*PESANAN DARI ${STORE_NAME.toUpperCase()}*%0A%0A`;

    const method = document.querySelector('input[name="delivery"]:checked')?.value || 'dine-in';
    message += `📋 Metode: ${methodLabels[method] || method}%0A`;
    if (method === 'dine-in') {
        const table = document.getElementById('tableNumber').value || '-';
        message += `🪑 Meja: ${table}%0A`;
    }
    message += `%0A`;

    cart.forEach(item => {
        message += `🍽️ ${item.nama_item}%0A`;
        message += `   📦 ${item.quantity} x ${formatRupiah(item.harga)} = ${formatRupiah(item.harga * item.quantity)}%0A`;
    });

    const total = getTotalPrice();
    message += `%0A*TOTAL: ${formatRupiah(total)}*%0A%0A`;

    const notes = document.getElementById('orderNotes').value.trim();
    if (notes) {
        message += `📝 Catatan: ${notes}%0A%0A`;
    }

    const est = calculateEstimation();
    message += `⏱️ Estimasi siap: ${est.min}-${est.max} menit%0A%0A`;

    message += `Silakan konfirmasi pesanan dan berikan alamat pengiriman.%0A`;
    message += `Terima kasih! 🙏`;
    return message;
}

// ============================================
// KIRIM PESANAN KE API (LEVEL 2)
// ============================================
async function saveOrderToAPI() {
    const method = document.querySelector('input[name="delivery"]:checked')?.value || 'dine-in';
    const table = document.getElementById('tableNumber').value || '';
    const notes = document.getElementById('orderNotes').value.trim();
    const est = calculateEstimation();
    const total = getTotalPrice();

    const items = cart.map(item => ({
        nama_item: item.nama_item,
        harga: item.harga,
        quantity: item.quantity
    }));

    const payload = {
        action: 'order',
        password: ADMIN_PASSWORD,
        metode: method,
        meja: table,
        items: items,
        total: total,
        catatan: notes,
        estimasi: `${est.min}-${est.max} menit`
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            console.log('✅ Pesanan berhasil disimpan:', result);
        } else {
            console.error('❌ Gagal simpan pesanan:', result.error);
        }
    } catch (error) {
        console.error('❌ Error saat simpan pesanan:', error);
    }
}

// ============================================
// CHECKOUT
// ============================================
function checkout() {
    if (cart.length === 0) {
        alert('Keranjang masih kosong. Silakan pilih menu terlebih dahulu.');
        return;
    }

    const method = document.querySelector('input[name="delivery"]:checked')?.value || 'dine-in';
    if (method === 'dine-in') {
        const table = document.getElementById('tableNumber').value;
        if (!table || table < 1 || table > 20) {
            alert('Silakan isi nomor meja (1-20) untuk pesanan Dine-in.');
            return;
        }
    }

    saveOrderToAPI().then(() => {
        const message = formatWhatsAppMessage();
        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        window.open(waUrl, '_blank');

        cart = [];
        updateCartUI();
        saveToLocalStorage();
        closeModal();
    });
}

// ============================================
// EVENT LISTENER
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Buka modal
    document.getElementById('viewCartBtn').addEventListener('click', () => {
        orderNotes = document.getElementById('orderNotes').value;
        const selectedRadio = document.querySelector('input[name="delivery"]:checked');
        if (selectedRadio) deliveryMethod = selectedRadio.value;
        tableNumber = document.getElementById('tableNumber').value;
        renderCartModal();
        updateEstimation();
        document.getElementById('cartModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Tutup modal
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cartModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('cartModal')) {
            closeModal();
        }
    });

    // Perubahan metode pengiriman
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const method = document.querySelector('input[name="delivery"]:checked')?.value;
            if (method) {
                deliveryMethod = method;
                toggleTableInput(method);
                updateEstimation();
                saveToLocalStorage();
            }
        });
    });

    // Perubahan meja & catatan
    document.getElementById('tableNumber').addEventListener('input', () => {
        saveToLocalStorage();
    });
    document.getElementById('orderNotes').addEventListener('input', () => {
        saveToLocalStorage();
    });

    // Checkout
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    document.getElementById('modalCheckoutBtn').addEventListener('click', () => {
        closeModal();
        setTimeout(checkout, 300);
    });

    // Load data
    loadFromLocalStorage();
    fetchMenu();
});

function closeModal() {
    document.getElementById('cartModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    saveToLocalStorage();
}