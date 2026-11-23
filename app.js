// app.js — TelStore Interactive Store Engine
// Savatcha (Cart), Sevimlilar (Wishlist), Tezkor ko'rish (QuickView), Promokod, Qidiruv & Filter, Trade-In, Animatsiyalar

(function () {
  'use strict';

  // ==========================================
  // 1. DATA VA XOTIRA (LOCALSTORAGE)
  // ==========================================
  const CART_KEY = 'telstore_cart_items';
  const WISHLIST_KEY = 'telstore_wishlist_items';

  let cart = [];
  let wishlist = [];
  let appliedPromo = null; // { code: 'TELSTORE', discountPercent: 10 }

  const PROMO_CODES = {
    'TELSTORE': 10,
    'CHEGIRMA': 7,
    'UZB2026': 5,
    'YANGI': 5
  };

  function loadState() {
    try {
      const cartData = localStorage.getItem(CART_KEY);
      cart = cartData ? JSON.parse(cartData) : [];
    } catch (e) {
      cart = [];
    }

    try {
      const wishData = localStorage.getItem(WISHLIST_KEY);
      wishlist = wishData ? JSON.parse(wishData) : [];
    } catch (e) {
      wishlist = [];
    }

    updateCartUI();
    updateWishlistUI();
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
    updateCartUI();
  }

  function saveWishlist() {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
    updateWishlistUI();
  }

  function formatPrice(number) {
    return new Intl.NumberFormat('uz-UZ').format(Math.max(0, Math.round(number))) + " so'm";
  }

  // ==========================================
  // 2. SAVATCHA (CART) FUNKSIYALARI
  // ==========================================
  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id && item.color === product.color && item.storage === product.storage);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        img: product.img,
        color: product.color || 'Standart',
        storage: product.storage || '256GB',
        quantity: 1
      });
    }
    saveCart();
    showToast(`✅ "${product.name}" savatchaga qo'shildi!`);
    openCart();
  }

  function removeFromCart(index) {
    if (cart[index]) {
      const name = cart[index].name;
      cart.splice(index, 1);
      saveCart();
      showToast(`🗑️ "${name}" savatchadan olib tashlandi`);
    }
  }

  function updateQuantity(index, delta) {
    if (cart[index]) {
      cart[index].quantity += delta;
      if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
      }
      saveCart();
    }
  }

  function applyPromoCode(code) {
    const clean = (code || '').toUpperCase().trim();
    if (PROMO_CODES[clean]) {
      appliedPromo = {
        code: clean,
        discountPercent: PROMO_CODES[clean]
      };
      showToast(`🎉 "${clean}" promokodi qabul qilindi! Chegirma: ${appliedPromo.discountPercent}%`);
      updateCartUI();
      return true;
    } else {
      showToast(`❌ Bunday promokod mavjud emas yoki muddati o'tgan!`);
      return false;
    }
  }

  function removePromoCode() {
    appliedPromo = null;
    showToast(`Promokod bekor qilindi`);
    updateCartUI();
  }

  function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = appliedPromo ? (subtotal * appliedPromo.discountPercent) / 100 : 0;
    const finalTotal = subtotal - discountAmount;

    // Badge'lar yangilanishi va animatsiya
    document.querySelectorAll('#cart-count').forEach(el => {
      const prev = el.textContent;
      el.textContent = totalCount;
      el.style.display = totalCount > 0 ? 'flex' : 'none';
      if (totalCount > 0 && String(totalCount) !== prev) {
        el.classList.remove('badge-pop');
        void el.offsetWidth;
        el.classList.add('badge-pop');
      }
    });

    const drawerCount = document.getElementById('drawer-count');
    if (drawerCount) drawerCount.textContent = totalCount;

    const drawerTotal = document.getElementById('cart-total-price');
    if (drawerTotal) drawerTotal.textContent = formatPrice(finalTotal);

    const subtotalRow = document.getElementById('cart-subtotal-price');
    if (subtotalRow) subtotalRow.textContent = formatPrice(subtotal);

    const discountRow = document.getElementById('cart-discount-row');
    const discountVal = document.getElementById('cart-discount-val');
    if (discountRow && discountVal) {
      if (appliedPromo && discountAmount > 0) {
        discountRow.style.display = 'flex';
        discountVal.textContent = `- ${formatPrice(discountAmount)} (${appliedPromo.discountPercent}%)`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    const itemsContainer = document.getElementById('cart-items');
    if (itemsContainer) {
      if (cart.length === 0) {
        itemsContainer.innerHTML = `
          <div class="cart-empty">
            <span class="empty-icon" style="font-size: 2.8rem; display: block; margin-bottom: 12px;">🛍️</span>
            <h4>Savatchangiz hozircha bo'sh</h4>
            <p>Eng so'nggi flagmanlarni ko'rib chiqing va o'zingizga yoqqanini tanlang!</p>
            <a href="telefonlar.html" class="btn btn-primary btn-sm" style="margin-top: 14px;">Katalogni ko'rish</a>
          </div>
        `;
      } else {
        itemsContainer.innerHTML = cart.map((item, idx) => `
          <div class="cart-item">
            <img src="${item.img || 'https://via.placeholder.com/60'}" alt="${item.name}">
            <div class="cart-item-details">
              <h4>${item.name}</h4>
              <span class="cart-item-variant">${item.storage || '256GB'} • ${item.color}</span>
              <div class="cart-item-price">${formatPrice(item.price)}</div>
              <div class="cart-qty-row">
                <button class="qty-btn" onclick="window.telStore.updateQty(${idx}, -1)">−</button>
                <span class="qty-num">${item.quantity}</span>
                <button class="qty-btn" onclick="window.telStore.updateQty(${idx}, 1)">+</button>
              </div>
            </div>
            <button class="cart-item-del" onclick="window.telStore.removeItem(${idx})" title="O'chirish">&times;</button>
          </div>
        `).join('');
      }
    }
  }

  function openCart() {
    closeWishlist();
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // ==========================================
  // 3. SEVIMLILAR (WISHLIST) FUNKSIYALARI
  // ==========================================
  function toggleWishlist(product) {
    const index = wishlist.findIndex(item => item.id === product.id);
    if (index > -1) {
      wishlist.splice(index, 1);
      showToast(`💔 "${product.name}" sevimlilardan olib tashlandi`);
    } else {
      wishlist.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        img: product.img,
        specs: product.specs || ''
      });
      showToast(`❤️ "${product.name}" sevimlilarga qo'shildi!`);
    }
    saveWishlist();
  }

  function updateWishlistUI() {
    const count = wishlist.length;
    document.querySelectorAll('#wishlist-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
      if (count > 0) {
        el.classList.remove('badge-pop');
        void el.offsetWidth;
        el.classList.add('badge-pop');
      }
    });

    // Barcha yurakchalar holatini yangilash
    document.querySelectorAll('.btn-wishlist').forEach(btn => {
      const id = btn.dataset.id;
      const isFav = wishlist.some(item => item.id === id);
      if (isFav) {
        btn.classList.add('active');
        btn.innerHTML = '❤️';
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '🤍';
      }
    });

    // Wishlist drawer ro'yxatini render qilish
    const container = document.getElementById('wishlist-items');
    if (container) {
      if (wishlist.length === 0) {
        container.innerHTML = `
          <div class="cart-empty">
            <span class="empty-icon" style="font-size: 2.8rem; display: block; margin-bottom: 12px;">🤍</span>
            <h4>Sevimlilar ro'yxati bo'sh</h4>
            <p>O'zingizga yoqqan modellarni yurakcha belgisini bosib saqlab qo'ying!</p>
          </div>
        `;
      } else {
        container.innerHTML = wishlist.map((item, idx) => `
          <div class="cart-item">
            <img src="${item.img || 'https://via.placeholder.com/60'}" alt="${item.name}">
            <div class="cart-item-details">
              <h4>${item.name}</h4>
              <span class="cart-item-variant">${item.specs}</span>
              <div class="cart-item-price">${formatPrice(item.price)}</div>
              <button class="btn btn-primary btn-sm" style="margin-top: 8px; font-size: 0.76rem; padding: 5px 12px;" onclick="window.telStore.moveWishToCart(${idx})">Savatga olish</button>
            </div>
            <button class="cart-item-del" onclick="window.telStore.removeWishItem(${idx})" title="O'chirish">&times;</button>
          </div>
        `).join('');
      }
    }
  }

  function openWishlist() {
    closeCart();
    const drawer = document.getElementById('wishlist-drawer');
    if (drawer) {
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeWishlist() {
    const drawer = document.getElementById('wishlist-drawer');
    if (drawer) {
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // ==========================================
  // 4. TOAST BILDIRISHNOMALARI
  // ==========================================
  function showToast(message, duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // ==========================================
  // 5. TEZKOR KO'RISH (QUICK VIEW MODAL)
  // ==========================================
  const DEVICE_DETAILS = {
    'iphone-16-pro-max': {
      screen: "6.9\" Super Retina XDR OLED 120Hz ProMotion",
      chip: "Apple A18 Pro (3 nm) + Apple Intelligence",
      camera: "48MP asosiy + 48MP ultra-keng + 12MP 5x telephoto",
      battery: "4685 mAh (33 soatgacha video ko'rish)",
      os: "iOS 18 (O'zbek tili to'liq qo'llab-quvvatlanadi)",
      warranty: "12 oy rasmiy servis kafolati",
      prices: { '256GB': 16800000, '512GB': 18900000, '1TB': 21500000 }
    },
    'iphone-16-pro': {
      screen: "6.3\" Super Retina XDR OLED 120Hz",
      chip: "Apple A18 Pro (3 nm)",
      camera: "48MP + 48MP ultra-keng + 12MP 5x telephoto",
      battery: "3582 mAh",
      os: "iOS 18",
      warranty: "12 oy rasmiy servis kafolati",
      prices: { '128GB': 13900000, '256GB': 15200000, '512GB': 17500000 }
    },
    'iphone-16': {
      screen: "6.1\" Super Retina XDR OLED, Ceramic Shield 2",
      chip: "Apple A18 (3 nm)",
      camera: "48MP Fusion + 12MP ultra-keng",
      battery: "3561 mAh",
      os: "iOS 18",
      warranty: "12 oy rasmiy servis kafolati",
      prices: { '128GB': 11600000, '256GB': 13100000, '512GB': 15400000 }
    },
    'galaxy-s25-ultra': {
      screen: "6.8\" Dynamic AMOLED 2X 120Hz, 3000 nit",
      chip: "Snapdragon 8 Elite for Galaxy",
      camera: "200MP + 50MP periskop + 50MP ultra-keng + 10MP",
      battery: "5000 mAh (45W tezkor quvvatlash) + S-Pen",
      os: "Android 15 (One UI 7, Galaxy AI)",
      warranty: "12 oy rasmiy kafolat",
      prices: { '256GB': 14200000, '512GB': 15900000, '1TB': 18500000 }
    },
    'galaxy-s25-plus': {
      screen: "6.7\" Dynamic AMOLED 2X 120Hz",
      chip: "Snapdragon 8 Elite for Galaxy",
      camera: "50MP asosiy + 12MP ultra-keng + 10MP telephoto",
      battery: "4900 mAh (45W quvvatlash)",
      os: "Android 15 (One UI 7)",
      warranty: "12 oy rasmiy kafolat",
      prices: { '256GB': 13400000, '512GB': 14900000 }
    },
    'galaxy-z-fold-6': {
      screen: "7.6\" Bukiluvchi Dynamic AMOLED 2X + 6.3\" Tashqi ekran",
      chip: "Snapdragon 8 Gen 3 for Galaxy",
      camera: "50MP uchlik professional kamera tizimi",
      battery: "4400 mAh",
      os: "Android 14 / One UI 6.1.1",
      warranty: "12 oy rasmiy kafolat",
      prices: { '256GB': 18200000, '512GB': 20000000, '1TB': 22800000 }
    },
    'pixel-9-pro': {
      screen: "6.3\" Super Actua LTPO OLED 120Hz",
      chip: "Google Tensor G4 + Titan M2",
      camera: "50MP asosiy + 48MP ultra-keng + 48MP 5x telephoto",
      battery: "4700 mAh",
      os: "Android 15 (7 yillik rasmiy yangilanishlar)",
      warranty: "12 oy kafolat",
      prices: { '128GB': 11400000, '256GB': 12700000, '512GB': 14300000 }
    },
    'xiaomi-15-ultra': {
      screen: "6.73\" 2K LTPO OLED 120Hz, 3200 nit",
      chip: "Snapdragon 8 Elite",
      camera: "50MP 1\" sensor + 200MP periskop Leica optikasi",
      battery: "6000 mAh (90W simli, 80W simsiz)",
      os: "Xiaomi HyperOS 2",
      warranty: "12 oy rasmiy kafolat",
      prices: { '256GB': 12200000, '512GB': 13700000, '1TB': 15600000 }
    }
  };

  function openQuickView(card) {
    const id = card.dataset.id || card.querySelector('.btn-add-cart')?.dataset.id;
    const name = card.querySelector('h3')?.textContent.trim() || 'Smartfon';
    const img = card.querySelector('.product-img img')?.src || '';
    const tag = card.querySelector('.tag')?.textContent.trim() || 'Flagman';
    const basePrice = Number(card.dataset.price || 15000000);
    const activeSwatch = card.querySelector('.swatch.active');
    const color = activeSwatch ? activeSwatch.dataset.colorName : 'Standart';

    const modal = document.getElementById('modal-quickview');
    if (!modal) return;

    const details = DEVICE_DETAILS[id] || {
      screen: "OLED 120Hz Flagman displey",
      chip: "Zamonaviy kuchli 3nm protsessor",
      camera: "Professional ko'p kamerali tizim",
      battery: "Katta sig'imli akkumulyator",
      os: "So'nggi versiya operatsion tizim",
      warranty: "12 oy rasmiy servis kafolati",
      prices: { '256GB': basePrice }
    };

    let selectedStorage = Object.keys(details.prices)[0] || '256GB';
    let currentPrice = details.prices[selectedStorage] || basePrice;

    modal.querySelector('.qv-img').src = img;
    modal.querySelector('.qv-img').alt = name;
    modal.querySelector('.qv-tag').textContent = tag;
    modal.querySelector('.qv-title').textContent = name;
    modal.querySelector('.qv-price').textContent = formatPrice(currentPrice);

    // Xotira variantlari
    const storageContainer = modal.querySelector('.qv-storage-chips');
    if (storageContainer) {
      storageContainer.innerHTML = Object.keys(details.prices).map(st => `
        <button type="button" class="storage-chip ${st === selectedStorage ? 'active' : ''}" data-storage="${st}" data-price="${details.prices[st]}">${st}</button>
      `).join('');

      storageContainer.querySelectorAll('.storage-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          storageContainer.querySelectorAll('.storage-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          selectedStorage = chip.dataset.storage;
          currentPrice = Number(chip.dataset.price);
          modal.querySelector('.qv-price').textContent = formatPrice(currentPrice);
        });
      });
    }

    // Xususiyatlar jadvali
    const specsTable = modal.querySelector('.qv-specs-table');
    if (specsTable) {
      specsTable.innerHTML = `
        <tr><td>📱 Ekran:</td><td>${details.screen}</td></tr>
        <tr><td>⚡ Protsessor:</td><td>${details.chip}</td></tr>
        <tr><td>📸 Kamera:</td><td>${details.camera}</td></tr>
        <tr><td>🔋 Batareya:</td><td>${details.battery}</td></tr>
        <tr><td>🛡️ Kafolat:</td><td>${details.warranty}</td></tr>
      `;
    }

    // Savatga qo'shish tugmasi
    const addBtn = modal.querySelector('.qv-add-cart');
    if (addBtn) {
      addBtn.onclick = () => {
        addToCart({
          id: id,
          name: name,
          price: currentPrice,
          img: img,
          color: color,
          storage: selectedStorage
        });
        window.location.hash = '';
      };
    }

    window.location.hash = '#modal-quickview';
  }

  // ==========================================
  // 6. RANG TANLOVI (COLOR SWATCHES)
  // ==========================================
  function initColorSwatches() {
    document.querySelectorAll('.color-swatches').forEach(wrapper => {
      const swatches = wrapper.querySelectorAll('.swatch');
      swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          e.stopPropagation();
          swatches.forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');

          const colorName = swatch.dataset.colorName;
          const card = swatch.closest('.product-card');
          if (card) {
            const img = card.querySelector('.product-img img');
            if (img) {
              img.style.transform = 'scale(0.92)';
              setTimeout(() => { img.style.transform = ''; }, 180);
            }
            if (colorName) {
              const specEl = card.querySelector('.specs');
              if (specEl && specEl.dataset.original) {
                specEl.textContent = `${specEl.dataset.original} • ${colorName}`;
              }
            }
          }
        });
      });
    });
  }

  // ==========================================
  // 7. KATALOG QIDIRUV, FILTR VA SARALASH (telefonlar.html)
  // ==========================================
  function initCatalogFilter() {
    const searchInput = document.getElementById('catalog-search');
    const sortSelect = document.getElementById('catalog-sort');
    const grid = document.querySelector('.catalog-grid');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const counterBadge = document.getElementById('catalog-count-badge');

    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.product-card'));
    let activeBrand = 'all';

    function applyFilter() {
      const query = (searchInput?.value || '').toLowerCase().trim();
      const sort = sortSelect?.value || 'default';
      let matchCount = 0;

      cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const specs = card.querySelector('.specs')?.textContent.toLowerCase() || '';
        const tag = card.querySelector('.tag')?.textContent.toLowerCase() || '';
        const brandMatch = activeBrand === 'all' || card.classList.contains(`item-${activeBrand}`);
        const textMatch = title.includes(query) || specs.includes(query) || tag.includes(query);

        if (brandMatch && textMatch) {
          card.style.display = '';
          matchCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (counterBadge) {
        counterBadge.textContent = `${matchCount} ta model topildi`;
      }

      // Saralash
      const visible = cards.filter(c => c.style.display !== 'none');
      if (sort === 'price-asc') {
        visible.sort((a, b) => Number(a.dataset.price || 0) - Number(b.dataset.price || 0));
        visible.forEach(c => grid.appendChild(c));
      } else if (sort === 'price-desc') {
        visible.sort((a, b) => Number(b.dataset.price || 0) - Number(a.dataset.price || 0));
        visible.forEach(c => grid.appendChild(c));
      }
    }

    if (filterTabs.length > 0) {
      filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          filterTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          activeBrand = tab.dataset.brand || 'all';
          applyFilter();
        });
      });
    }

    if (searchInput) searchInput.addEventListener('input', applyFilter);
    if (sortSelect) sortSelect.addEventListener('change', applyFilter);
    applyFilter();
  }

  // ==========================================
  // 8. ONLAYN TRADE-IN KALKULYATORI
  // ==========================================
  function initTradeInCalculator() {
    const phoneSelect = document.getElementById('tradein-old-model');
    const conditionSelect = document.getElementById('tradein-condition');
    const resultSpan = document.getElementById('tradein-result-val');

    if (!phoneSelect || !conditionSelect || !resultSpan) return;

    const baseValues = {
      'iphone-15': 8900000,
      'iphone-14': 6800000,
      'iphone-13': 4900000,
      'iphone-12': 3400000,
      'iphone-11': 2200000,
      'samsung-s24': 7800000,
      'samsung-s23': 5600000,
      'samsung-s22': 3800000
    };

    const conditionMultipliers = {
      'perfect': 1.0,
      'good': 0.85,
      'normal': 0.65
    };

    function recalculate() {
      const model = phoneSelect.value;
      const cond = conditionSelect.value;
      const base = baseValues[model] || 3500000;
      const mult = conditionMultipliers[cond] || 0.85;
      const estimated = Math.round((base * mult) / 10000) * 10000;
      resultSpan.textContent = formatPrice(estimated);

      const box = resultSpan.closest('.calc-result-box');
      if (box) {
        box.classList.remove('pulse-accent');
        void box.offsetWidth;
        box.classList.add('pulse-accent');
      }
    }

    phoneSelect.addEventListener('change', recalculate);
    conditionSelect.addEventListener('change', recalculate);
    recalculate();
  }

  // ==========================================
  // 9. STATISTIKA RAQAMLARI ANIMATSIYASI
  // ==========================================
  function initStatsCounter() {
    const statElements = document.querySelectorAll('.stat-item strong[data-target]');
    if (statElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const suffix = el.dataset.suffix || '';
          let count = 0;
          const step = Math.ceil(target / 45);

          const interval = setInterval(() => {
            count += step;
            if (count >= target) {
              el.textContent = new Intl.NumberFormat('uz-UZ').format(target) + suffix;
              clearInterval(interval);
            } else {
              el.textContent = new Intl.NumberFormat('uz-UZ').format(count) + suffix;
            }
          }, 25);

          observer.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    statElements.forEach(el => observer.observe(el));
  }

  // ==========================================
  // 10. CHECKOUT MODAL & BUYURTMA
  // ==========================================
  function initCheckoutModal() {
    const modalForm = document.querySelector('.modal-form');
    if (modalForm) {
      modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = modalForm.querySelector('#modal-name')?.value || 'Mijoz';
        const phone = modalForm.querySelector('#modal-phone')?.value || '';
        const payment = modalForm.querySelector('input[name="payment_method"]:checked')?.value || 'Payme';
        const delivery = modalForm.querySelector('input[name="delivery_method"]:checked')?.value || 'Kuryer';

        showToast(`🎉 Rahmat, ${name}! Buyurtmangiz qabul qilindi. To'lov turi: ${payment}. Operatorimiz ${phone} orqali 5 daqiqada bog'lanadi.`);
        window.location.hash = '';
        modalForm.reset();
        cart = [];
        saveCart();
      });
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
          showToast('Savatchangiz bo\'sh!');
          return;
        }
        closeCart();
        window.location.hash = '#modal-buy';
        const modelInput = document.getElementById('modal-phone-model');
        if (modelInput) {
          modelInput.value = cart.map(i => `${i.name} (${i.storage || '256GB'} • ${i.color}) x${i.quantity}`).join(' + ');
        }
      });
    }
  }

  // ==========================================
  // 11. YUQORIGA QAYTISH (BACK TO TOP)
  // ==========================================
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================================
  // 12. MAHALLIY STANDALONE AOS ANIMATSIYASI
  // ==========================================
  function initStandaloneAOS() {
    const elements = document.querySelectorAll('[data-aos]');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
  }

  // ==========================================
  // GLOBAL API EXPORT
  // ==========================================
  window.telStore = {
    updateQty: updateQuantity,
    removeItem: removeFromCart,
    openCart: openCart,
    closeCart: closeCart,
    openWishlist: openWishlist,
    closeWishlist: closeWishlist,
    removeWishItem: function (idx) {
      wishlist.splice(idx, 1);
      saveWishlist();
    },
    moveWishToCart: function (idx) {
      const item = wishlist[idx];
      if (item) {
        addToCart(item);
        wishlist.splice(idx, 1);
        saveWishlist();
      }
    },
    applyPromo: applyPromoCode,
    removePromo: removePromoCode
  };

  // ==========================================
  // DOM TAYYOR BO'LGANDA
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initColorSwatches();
    initTradeInCalculator();
    initCatalogFilter();
    initStatsCounter();
    initCheckoutModal();
    initBackToTop();
    initStandaloneAOS();

    // Savatcha & Wishlist tugmalari
    document.getElementById('cart-btn')?.addEventListener('click', openCart);
    document.getElementById('cart-close')?.addEventListener('click', closeCart);
    document.querySelector('#cart-drawer .cart-drawer-overlay')?.addEventListener('click', closeCart);

    document.getElementById('wishlist-btn')?.addEventListener('click', openWishlist);
    document.getElementById('wishlist-close')?.addEventListener('click', closeWishlist);
    document.querySelector('#wishlist-drawer .cart-drawer-overlay')?.addEventListener('click', closeWishlist);

    // Promokod formasi
    const promoForm = document.getElementById('cart-promo-form');
    if (promoForm) {
      promoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('cart-promo-input');
        if (input && input.value) {
          applyPromoCode(input.value);
        }
      });
    }

    // Barcha "Savatchaga qo'shish" tugmalari
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.product-card');
        if (!card) return;

        const activeSwatch = card.querySelector('.swatch.active');
        const color = activeSwatch ? activeSwatch.dataset.colorName : 'Standart';

        addToCart({
          id: btn.dataset.id || card.dataset.id || 'item',
          name: card.querySelector('h3')?.textContent.trim() || 'Smartfon',
          price: Number(btn.dataset.price || card.dataset.price || 15000000),
          img: card.querySelector('.product-img img')?.src || '',
          color: color,
          storage: '256GB'
        });
      });
    });

    // Barcha "Sevimlilar" yurakcha tugmalari
    document.querySelectorAll('.btn-wishlist').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.product-card');
        if (!card) return;

        toggleWishlist({
          id: btn.dataset.id || card.dataset.id || 'item',
          name: card.querySelector('h3')?.textContent.trim() || 'Smartfon',
          price: Number(card.dataset.price || 15000000),
          img: card.querySelector('.product-img img')?.src || '',
          specs: card.querySelector('.specs')?.textContent.trim() || ''
        });
      });
    });

    // "Tezkor ko'rish" / Kartochka bosilganda
    document.querySelectorAll('.product-img, .btn-quickview').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const card = trigger.closest('.product-card');
        if (card) openQuickView(card);
      });
    });

    // Tezkor sotib olish modaliga model nomini kiritish
    document.querySelectorAll('.btn-buy-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.product-card');
        if (!card) return;
        const name = card.querySelector('h3')?.textContent.trim() || '';
        const activeSwatch = card.querySelector('.swatch.active');
        const color = activeSwatch ? activeSwatch.dataset.colorName : '';
        const modelInput = document.getElementById('modal-phone-model');
        if (modelInput) {
          modelInput.value = `${name} ${color ? '(' + color + ')' : ''}`.trim();
        }
      });
    });
  });

})();