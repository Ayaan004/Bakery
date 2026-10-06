/**
 * MAISON DORÉE - Luxury Bakery & Confectionery
 * Main Application Logic, Web Audio Synthesizer, Modals & Toast Manager (English)
 */

// ==========================================================================
// Web Audio Synthesizer (Zero-dependency luxury audio effects)
// ==========================================================================
const AudioEngine = {
  ctx: null,
  isAmbientPlaying: false,
  ambientNode: null,

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Soft crystal chime chords (E6 & G#6)
      osc1.frequency.setValueAtTime(1318.51, now);
      osc2.frequency.setValueAtTime(1661.22, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  },

  toggleAmbient() {
    this.initContext();
    const btn = document.getElementById('ambientAudioBtn');
    
    if (this.isAmbientPlaying) {
      if (this.ambientNode) {
        this.ambientNode.stop();
        this.ambientNode.disconnect();
        this.ambientNode = null;
      }
      this.isAmbientPlaying = false;
      if (btn) btn.classList.remove('active');
      App.showToast('Bakery lounge ambience muted', 'Atmosphere');
    } else {
      try {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 0.25;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 320;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.015;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        this.ambientNode = noise;
        this.isAmbientPlaying = true;
        if (btn) btn.classList.add('active');
        App.showToast('Warm bakery atmosphere enabled', 'Atmosphere');
      } catch (e) {
        console.warn('Ambient audio could not start:', e);
      }
    }
  }
};

// ==========================================================================
// Main Application Controller
// ==========================================================================
const App = {
  filterCategory: 'all',
  filterDietary: 'all',
  searchQuery: '',
  sortBy: 'featured',
  activeQuickViewProduct: null,
  quickViewQty: 1,

  init() {
    this.bindGlobalEvents();
    this.renderCatalog();
    this.initAccordions();
    this.initHeaderScroll();
    
    // Initialize Sub-Engines
    Cart.init();
    CakeBuilder.init();
    ReservationEngine.init();
  },

  renderCatalog() {
    const grid = document.getElementById('catalogGrid');
    const countEl = document.getElementById('catalogResultsCount');
    if (!grid) return;

    let filtered = [...PRODUCTS_DATA];

    // Category Filter
    if (this.filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === this.filterCategory);
    }

    // Dietary Filter
    if (this.filterDietary !== 'all') {
      filtered = filtered.filter(p => p.dietary && p.dietary.includes(this.filterDietary));
    }

    // Search Query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (this.sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    if (countEl) {
      countEl.textContent = `${filtered.length} Creations Available`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <h3 class="font-serif" style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--gold-light);">No Confections Found</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Try adjusting your search terms or filter selection to explore our cakes, donuts, and cupcakes.</p>
          <button class="btn btn-outline btn-sm" onclick="App.resetFilters()">Clear Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(product => {
      const isFav = Cart.isWishlisted(product.id);
      return `
        <div class="product-card" data-product-id="${product.id}">
          <div class="product-image-box">
            <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy">
            
            <div class="product-badge-overlay">
              <span class="luxe-badge ${product.badgeType || 'gold'}">
                ${product.badge}
              </span>
            </div>

            <div class="product-actions-overlay">
              <button class="card-action-btn ${isFav ? 'wishlisted' : ''}" 
                      onclick="Cart.toggleWishlist('${product.id}')" 
                      title="${isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </button>
            </div>

            <button class="quick-view-overlay-btn" onclick="App.openQuickView('${product.id}')">
              Quick View
            </button>
          </div>

          <div class="product-content">
            <div class="product-meta">
              <span class="product-category-tag">${product.categoryLabel}</span>
              <div class="product-rating">
                <svg width="13" height="13" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>${product.rating.toFixed(2)} (${product.reviewsCount})</span>
              </div>
            </div>

            <h3 class="product-title" onclick="App.openQuickView('${product.id}')" style="cursor: pointer;">${product.name}</h3>
            <div class="product-french-title">${product.subtitle}</div>
            <p class="product-desc">${product.description}</p>

            <div class="product-footer">
              <div class="product-price-box">
                <span class="price-label">Price</span>
                <span class="product-price">${Cart.formatPrice(product.price)}</span>
              </div>
              <button class="btn-add-bag" onclick="Cart.addItem('${product.id}', 1)">
                Add to Bag
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  setCategoryFilter(category, btnEl) {
    this.filterCategory = category;
    document.querySelectorAll('.category-pills .pill-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    this.renderCatalog();
    if (AudioEngine) AudioEngine.playChime();
  },

  setDietaryFilter(dietary, btnEl) {
    this.filterDietary = dietary;
    document.querySelectorAll('.dietary-chip').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    this.renderCatalog();
    if (AudioEngine) AudioEngine.playChime();
  },

  resetFilters() {
    this.filterCategory = 'all';
    this.filterDietary = 'all';
    this.searchQuery = '';
    const searchInput = document.getElementById('catalogSearchInput');
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.category-pills .pill-btn').forEach((b, idx) => {
      if (idx === 0) b.classList.add('active');
      else b.classList.remove('active');
    });
    document.querySelectorAll('.dietary-chip').forEach((b, idx) => {
      if (idx === 0) b.classList.add('active');
      else b.classList.remove('active');
    });
    this.renderCatalog();
  },

  openQuickView(productId) {
    const product = PRODUCTS_DATA.find(p => p.id === productId);
    if (!product) return;

    this.activeQuickViewProduct = product;
    this.quickViewQty = 1;

    const modal = document.getElementById('quickViewModal');
    const imgEl = document.getElementById('qvImage');
    const badgeEl = document.getElementById('qvBadge');
    const titleEl = document.getElementById('qvTitle');
    const subtitleEl = document.getElementById('qvFrench');
    const descEl = document.getElementById('qvDesc');
    const priceEl = document.getElementById('qvPrice');
    const pairingEl = document.getElementById('qvPairing');
    const allergensEl = document.getElementById('qvAllergens');
    const servingEl = document.getElementById('qvServing');
    const qtyValEl = document.getElementById('qvQtyVal');

    if (imgEl) imgEl.src = product.image;
    if (badgeEl) badgeEl.textContent = product.badge;
    if (titleEl) titleEl.textContent = product.name;
    if (subtitleEl) subtitleEl.textContent = product.subtitle;
    if (descEl) descEl.textContent = product.description;
    if (priceEl) priceEl.textContent = Cart.formatPrice(product.price);
    if (pairingEl) pairingEl.textContent = product.pairing || 'Master Baker Recommendation';
    if (servingEl) servingEl.textContent = product.serving || '';
    if (qtyValEl) qtyValEl.textContent = '1';

    if (allergensEl) {
      allergensEl.innerHTML = (product.allergens || []).map(a => `<span class="allergen-tag">${a}</span>`).join('');
    }

    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeQuickView() {
    const modal = document.getElementById('quickViewModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  updateQuickViewQty(delta) {
    this.quickViewQty = Math.max(1, this.quickViewQty + delta);
    const qtyEl = document.getElementById('qvQtyVal');
    const priceEl = document.getElementById('qvPrice');
    if (qtyEl) qtyEl.textContent = this.quickViewQty;
    if (priceEl && this.activeQuickViewProduct) {
      priceEl.textContent = Cart.formatPrice(this.activeQuickViewProduct.price * this.quickViewQty);
    }
  },

  addQuickViewToBag() {
    if (!this.activeQuickViewProduct) return;
    Cart.addItem(this.activeQuickViewProduct.id, this.quickViewQty);
    this.closeQuickView();
    Cart.toggleDrawer(true);
  },

  // Checkout Multi-Step Modal
  openCheckoutModal() {
    if (Cart.items.length === 0) {
      this.showToast('Your shopping bag is empty. Please add items to checkout.', 'Empty Bag');
      return;
    }
    Cart.toggleDrawer(false);
    const modal = document.getElementById('checkoutModal');
    const totalEl = document.getElementById('checkoutTotalReview');
    if (totalEl) totalEl.textContent = Cart.formatPrice(Cart.getTotals().total);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  submitCheckout(e) {
    e.preventDefault();

    const name = document.getElementById('chkFullName').value.trim();
    const email = document.getElementById('chkEmail').value.trim();
    const address = document.getElementById('chkAddress').value.trim();
    const city = document.getElementById('chkCity').value.trim();
    const fulfillment = document.querySelector('input[name="fulfillmentMethod"]:checked')?.value || 'courier';

    if (!name || !email) {
      this.showToast('Please provide your name and email to proceed.', 'Incomplete Details');
      return;
    }

    const orderId = `MD-ORDER-${Math.floor(100000 + Math.random() * 900000)}`;
    const totals = Cart.getTotals();
    const itemsPurchased = [...Cart.items];

    this.closeCheckoutModal();

    // Populate Receipt Modal
    const receiptModal = document.getElementById('orderReceiptModal');
    const orderNumEl = document.getElementById('receiptOrderNumber');
    const orderDateEl = document.getElementById('receiptDate');
    const orderItemsEl = document.getElementById('receiptItemsList');
    const orderTotalEl = document.getElementById('receiptTotal');
    const orderFulfillmentEl = document.getElementById('receiptFulfillment');
    const customerEl = document.getElementById('receiptCustomer');

    if (orderNumEl) orderNumEl.textContent = orderId;
    if (orderDateEl) orderDateEl.textContent = new Date().toLocaleDateString('en-US', { dateStyle: 'full' });
    if (customerEl) customerEl.textContent = `${name} (${email})`;
    if (orderFulfillmentEl) {
      orderFulfillmentEl.textContent = fulfillment === 'courier' 
        ? `White-Glove Temperature-Controlled Courier to ${address}, ${city}` 
        : 'Private Bakery Boutique Concierge Pickup (New York / Paris)';
    }

    if (orderItemsEl) {
      orderItemsEl.innerHTML = itemsPurchased.map(i => `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.6rem;">
          <span>${i.qty} × ${i.name}</span>
          <span style="font-weight: 600; color: var(--gold-light);">${Cart.formatPrice(i.price * i.qty)}</span>
        </div>
      `).join('');
    }

    if (orderTotalEl) orderTotalEl.textContent = Cart.formatPrice(totals.total);

    if (receiptModal) {
      receiptModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    Cart.clearCart();
    AudioEngine.playChime();
    this.showToast(`Order ${orderId} confirmed! Receipt prepared.`, 'Order Placed');
  },

  closeReceiptModal() {
    const modal = document.getElementById('orderReceiptModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  printReceipt() {
    window.print();
  },

  closePassModal() {
    const modal = document.getElementById('reservationPassModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  // Luxury Toast Manager
  showToast(message, title = 'Maison Dorée') {
    const container = document.getElementById('toastStack');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'luxe-toast';
    toast.innerHTML = `
      <div class="toast-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
        </svg>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideToastOut 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
      }
    }, 4500);
  },

  toggleTheme() {
    document.body.classList.toggle('theme-ivory');
    const isIvory = document.body.classList.contains('theme-ivory');
    const themeIcon = document.getElementById('themeToggleIcon');
    if (themeIcon) {
      themeIcon.innerHTML = isIvory 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    }
    this.showToast(isIvory ? 'Switched to Ivory daylight theme' : 'Switched to Midnight Obsidian luxury theme', 'Theme Altered');
  },

  scrollToMenu() {
    const el = document.getElementById('menuSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  },

  scrollToCakes() {
    const el = document.getElementById('bespokeSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  },

  scrollToSalon() {
    const el = document.getElementById('salonSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  },

  initAccordions() {
    document.querySelectorAll('.faq-item-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const isOpen = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!isOpen) item.classList.add('active');
        AudioEngine.playChime();
      });
    });
  },

  initHeaderScroll() {
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    });
  },

  bindGlobalEvents() {
    // Search input
    const searchInput = document.getElementById('catalogSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderCatalog();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('catalogSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.renderCatalog();
      });
    }

    // Currency select
    const currSelect = document.getElementById('globalCurrencySelect');
    if (currSelect) {
      currSelect.value = Cart.currency;
      currSelect.addEventListener('change', (e) => {
        Cart.setCurrency(e.target.value);
      });
    }

    // Ambient Audio toggle
    const audioBtn = document.getElementById('ambientAudioBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => AudioEngine.toggleAmbient());
    }

    // Theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Mobile nav
    const mobileBtn = document.getElementById('mobileNavToggle');
    const mobileMenu = document.getElementById('mobileNavMenu');
    if (mobileBtn && mobileMenu) {
      mobileBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
      });
    }

    // Review form modal
    const reviewForm = document.getElementById('submitReviewForm');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const author = document.getElementById('revAuthor').value.trim();
        const text = document.getElementById('revText').value.trim();
        if (author && text) {
          const list = document.getElementById('reviewsList');
          if (list) {
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
              <div class="review-stars">★★★★★</div>
              <p class="review-quote">"${text}"</p>
              <div class="review-author">
                <div class="author-avatar">${author.charAt(0).toUpperCase()}</div>
                <div>
                  <div class="author-name">${author}</div>
                  <div class="author-title">Verified Gourmet Guest</div>
                </div>
              </div>
            `;
            list.prepend(card);
          }
          this.closeReviewModal();
          this.showToast(`Thank you, ${author}. Your review has been published.`, 'Review Submitted');
          reviewForm.reset();
        }
      });
    }

    // Newsletter form
    const newsForm = document.getElementById('newsletterForm');
    if (newsForm) {
      newsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail')?.value.trim();
        if (email) {
          this.showToast(`Welcome to the Tasting Club. Check ${email} for your 15% discount invitation.`, 'Privilege Club');
          newsForm.reset();
        }
      });
    }

    // Private gala contact form
    const contactForm = document.getElementById('privateEventForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.showToast('Your private inquiry has been sent to our Head Concierge.', 'Concierge Received');
        contactForm.reset();
      });
    }
  },

  openReviewModal() {
    const modal = document.getElementById('writeReviewModal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeReviewModal() {
    const modal = document.getElementById('writeReviewModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
