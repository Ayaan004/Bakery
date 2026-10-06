/**
 * MAISON DORÉE - Luxury Cart & Wishlist Engine
 * Handles real-time currency conversions, multi-step checkout, promo codes & persistence (English)
 */

const Cart = {
  items: [],
  wishlist: [],
  currency: 'USD',
  appliedPromo: null,
  freeShippingThreshold: 120, // in USD
  shippingCost: 15, // in USD

  init() {
    this.loadStorage();
    this.bindEvents();
    this.updateBadges();
  },

  loadStorage() {
    try {
      const savedCart = localStorage.getItem('md_cart');
      if (savedCart) this.items = JSON.parse(savedCart);

      const savedWish = localStorage.getItem('md_wishlist');
      if (savedWish) this.wishlist = JSON.parse(savedWish);

      const savedCurr = localStorage.getItem('md_currency');
      if (savedCurr && CURRENCIES[savedCurr]) this.currency = savedCurr;
    } catch (e) {
      console.warn('Storage read warning:', e);
    }
  },

  saveStorage() {
    try {
      localStorage.setItem('md_cart', JSON.stringify(this.items));
      localStorage.setItem('md_wishlist', JSON.stringify(this.wishlist));
      localStorage.setItem('md_currency', this.currency);
    } catch (e) {
      console.warn('Storage write warning:', e);
    }
    this.updateBadges();
  },

  setCurrency(currCode) {
    if (CURRENCIES[currCode]) {
      this.currency = currCode;
      this.saveStorage();
      if (window.App && typeof App.renderCatalog === 'function') {
        App.renderCatalog();
      }
      this.renderCartDrawer();
      if (window.CakeBuilder && typeof CakeBuilder.updateSummary === 'function') {
        CakeBuilder.updateSummary();
      }
      if (window.ReservationEngine && typeof ReservationEngine.renderExperiences === 'function') {
        ReservationEngine.renderExperiences();
      }
      if (window.App && typeof App.showToast === 'function') {
        App.showToast(`Currency updated to ${CURRENCIES[currCode].name}`, 'Currency');
      }
    }
  },

  formatPrice(usdAmount) {
    const curr = CURRENCIES[this.currency] || CURRENCIES.USD;
    const converted = usdAmount * curr.rate;
    return `${curr.symbol}${converted.toFixed(2)}`;
  },

  addItem(productId, qty = 1, customData = null) {
    let product;
    if (customData) {
      product = customData;
    } else {
      product = PRODUCTS_DATA.find(p => p.id === productId);
    }

    if (!product) return;

    const itemKey = customData ? `custom-${Date.now()}` : product.id;
    const existingIndex = this.items.findIndex(item => item.id === itemKey);

    if (existingIndex > -1 && !customData) {
      this.items[existingIndex].qty += qty;
    } else {
      this.items.push({
        id: itemKey,
        productId: product.id,
        name: product.name,
        subtitle: product.subtitle || '',
        price: product.price,
        image: product.image,
        qty: qty,
        customNotes: product.customNotes || null
      });
    }

    this.saveStorage();
    this.renderCartDrawer();

    if (window.AudioEngine) AudioEngine.playChime();

    if (window.App && typeof App.showToast === 'function') {
      App.showToast(`Added ${qty} × ${product.name} to your bag`, 'Added to Bag');
    }
  },

  updateQty(itemId, delta) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      this.removeItem(itemId);
      return;
    }

    this.saveStorage();
    this.renderCartDrawer();
  },

  removeItem(itemId) {
    this.items = this.items.filter(i => i.id !== itemId);
    this.saveStorage();
    this.renderCartDrawer();
  },

  clearCart() {
    this.items = [];
    this.appliedPromo = null;
    this.saveStorage();
    this.renderCartDrawer();
  },

  applyPromo(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Please enter a promo code.' };

    if (cleanCode === 'LUXE15') {
      this.appliedPromo = { code: 'LUXE15', type: 'percent', value: 0.15, desc: '15% Privilege Discount' };
      this.renderCartDrawer();
      return { success: true, message: '15% VIP discount applied to your order!' };
    } else if (cleanCode === 'FREESHIP') {
      this.appliedPromo = { code: 'FREESHIP', type: 'free_shipping', value: 0, desc: 'Complimentary Chilled Courier' };
      this.renderCartDrawer();
      return { success: true, message: 'Complimentary courier delivery unlocked!' };
    } else if (cleanCode === 'MAISON') {
      this.appliedPromo = { code: 'MAISON', type: 'gift', value: 0, desc: 'Complimentary Cupcake Box' };
      this.renderCartDrawer();
      return { success: true, message: 'Complimentary Cupcake Box gift added!' };
    }

    return { success: false, message: 'Invalid or expired promo code.' };
  },

  getTotals() {
    const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let discount = 0;
    let shipping = subtotal >= this.freeShippingThreshold ? 0 : this.shippingCost;

    if (this.appliedPromo) {
      if (this.appliedPromo.type === 'percent') {
        discount = subtotal * this.appliedPromo.value;
      } else if (this.appliedPromo.type === 'free_shipping') {
        shipping = 0;
      }
    }

    if (subtotal === 0) shipping = 0;

    const total = Math.max(0, subtotal - discount + shipping);

    return {
      subtotal,
      discount,
      shipping,
      total,
      isFreeShipping: shipping === 0 && subtotal > 0
    };
  },

  updateBadges() {
    const totalCount = this.items.reduce((sum, item) => sum + item.qty, 0);
    const cartBadges = document.querySelectorAll('.cart-badge-count');
    cartBadges.forEach(b => {
      b.textContent = totalCount;
      b.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    const wishBadges = document.querySelectorAll('.wish-badge-count');
    wishBadges.forEach(b => {
      b.textContent = this.wishlist.length;
      b.style.display = this.wishlist.length > 0 ? 'flex' : 'none';
    });
  },

  toggleWishlist(productId) {
    const index = this.wishlist.indexOf(productId);
    const product = PRODUCTS_DATA.find(p => p.id === productId);

    if (index > -1) {
      this.wishlist.splice(index, 1);
      if (window.App && typeof App.showToast === 'function') {
        App.showToast(`Removed from your saved favorites`, 'Wishlist');
      }
    } else {
      this.wishlist.push(productId);
      if (window.AudioEngine) AudioEngine.playChime();
      if (window.App && typeof App.showToast === 'function') {
        App.showToast(`Saved ${product ? product.name : 'item'} to your wishlist`, 'Saved Item');
      }
    }

    this.saveStorage();
    if (window.App && typeof App.renderCatalog === 'function') {
      App.renderCatalog();
    }
    this.renderWishlistDrawer();
  },

  isWishlisted(productId) {
    return this.wishlist.includes(productId);
  },

  renderCartDrawer() {
    const container = document.getElementById('cartDrawerItems');
    const freeShipText = document.getElementById('freeShipRemainingText');
    const freeShipFill = document.getElementById('freeShipProgressFill');
    const subtotalEl = document.getElementById('cartSubtotalAmount');
    const discountRow = document.getElementById('cartDiscountRow');
    const discountEl = document.getElementById('cartDiscountAmount');
    const shippingEl = document.getElementById('cartShippingAmount');
    const totalEl = document.getElementById('cartTotalAmount');

    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="drawer-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <h4>Your Shopping Bag is Empty</h4>
          <p>Discover our freshly baked signature cakes, gourmet glazed donuts, and artisan cupcakes.</p>
          <button class="btn btn-outline btn-sm" onclick="Cart.toggleDrawer(false); App.scrollToMenu();">Explore Menu</button>
        </div>
      `;
      if (freeShipText) freeShipText.innerHTML = `<span>Complimentary courier delivery on orders over ${this.formatPrice(this.freeShippingThreshold)}</span>`;
      if (freeShipFill) freeShipFill.style.width = '0%';
      if (subtotalEl) subtotalEl.textContent = this.formatPrice(0);
      if (shippingEl) shippingEl.textContent = this.formatPrice(0);
      if (totalEl) totalEl.textContent = this.formatPrice(0);
      if (discountRow) discountRow.style.display = 'none';
      return;
    }

    // Render items
    container.innerHTML = this.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-thumb">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
        </div>
        <div class="cart-item-details">
          <div>
            <h4 class="cart-item-title">${item.name}</h4>
            ${item.subtitle ? `<div class="cart-item-french">${item.subtitle}</div>` : ''}
            ${item.customNotes ? `<div style="font-size: 0.72rem; color: var(--gold-primary); margin-bottom: 4px;">${item.customNotes}</div>` : ''}
          </div>
          <div class="cart-item-bottom">
            <div class="qty-stepper">
              <button class="qty-btn" onclick="Cart.updateQty('${item.id}', -1)">-</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="Cart.updateQty('${item.id}', 1)">+</button>
            </div>
            <div class="cart-item-price">${this.formatPrice(item.price * item.qty)}</div>
            <button class="cart-item-remove" onclick="Cart.removeItem('${item.id}')" title="Remove item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Totals & Free Shipping Bar
    const totals = this.getTotals();
    const remainingForFree = Math.max(0, this.freeShippingThreshold - totals.subtotal);
    const progressPercent = Math.min(100, (totals.subtotal / this.freeShippingThreshold) * 100);

    if (freeShipText) {
      if (remainingForFree === 0) {
        freeShipText.innerHTML = `<span>🎉 You have unlocked complimentary refrigerated courier delivery!</span>`;
      } else {
        freeShipText.innerHTML = `<span>Add <strong>${this.formatPrice(remainingForFree)}</strong> more for complimentary delivery</span>`;
      }
    }
    if (freeShipFill) freeShipFill.style.width = `${progressPercent}%`;

    if (subtotalEl) subtotalEl.textContent = this.formatPrice(totals.subtotal);
    
    if (discountRow) {
      if (totals.discount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `-${this.formatPrice(totals.discount)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (shippingEl) {
      shippingEl.textContent = totals.shipping === 0 ? 'Complimentary' : this.formatPrice(totals.shipping);
    }
    if (totalEl) totalEl.textContent = this.formatPrice(totals.total);
  },

  renderWishlistDrawer() {
    const container = document.getElementById('wishlistDrawerItems');
    if (!container) return;

    if (this.wishlist.length === 0) {
      container.innerHTML = `
        <div class="drawer-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
          <h4>Your Wishlist is Empty</h4>
          <p>Tap the heart icon on any cake, donut, or cupcake to save for later.</p>
        </div>
      `;
      return;
    }

    const wishProducts = PRODUCTS_DATA.filter(p => this.wishlist.includes(p.id));

    container.innerHTML = wishProducts.map(p => `
      <div class="cart-item">
        <div class="cart-item-thumb">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </div>
        <div class="cart-item-details">
          <div>
            <h4 class="cart-item-title">${p.name}</h4>
            <div class="cart-item-french">${p.subtitle}</div>
            <div class="cart-item-price" style="margin-top: 4px;">${this.formatPrice(p.price)}</div>
          </div>
          <div class="cart-item-bottom" style="margin-top: 8px;">
            <button class="btn btn-primary btn-sm" onclick="Cart.addItem('${p.id}', 1); Cart.toggleWishlist('${p.id}');">
              Move to Bag
            </button>
            <button class="cart-item-remove" onclick="Cart.toggleWishlist('${p.id}')">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  },

  toggleDrawer(open) {
    const drawer = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartBackdrop');
    if (drawer && backdrop) {
      if (open) {
        this.renderCartDrawer();
        drawer.classList.add('open');
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
      } else {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  },

  toggleWishlistDrawer(open) {
    const drawer = document.getElementById('wishlistDrawer');
    const backdrop = document.getElementById('wishlistBackdrop');
    if (drawer && backdrop) {
      if (open) {
        this.renderWishlistDrawer();
        drawer.classList.add('open');
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
      } else {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  },

  bindEvents() {
    const promoForm = document.getElementById('cartPromoForm');
    if (promoForm) {
      promoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('cartPromoInput');
        if (!input) return;
        const res = this.applyPromo(input.value);
        if (window.App && typeof App.showToast === 'function') {
          App.showToast(res.message, res.success ? 'Promo Applied' : 'Promo Code');
        }
      });
    }
  }
};
