/**
 * MAISON DORÉE - Bespoke Cake Atelier
 * Interactive 3D-styled Visualizer & Custom Cake Configurator (English)
 */

const CakeBuilder = {
  config: {
    tier: 'tier-2',
    sponge: 'sponge-vanilla',
    finish: 'finish-gold-noir',
    extras: ['extra-gold-leaf'],
    inscription: '',
    eventDate: ''
  },

  init() {
    this.renderOptions();
    this.updatePreview();
    this.updateSummary();
    this.bindEvents();
  },

  renderOptions() {
    // 1. Tiers
    const tiersContainer = document.getElementById('cakeTiersOptions');
    if (tiersContainer) {
      tiersContainer.innerHTML = CAKE_OPTIONS.tiers.map(t => `
        <div class="config-option-card ${t.id === this.config.tier ? 'selected' : ''}" 
             onclick="CakeBuilder.selectOption('tier', '${t.id}')">
          <div>
            <div class="option-name">${t.name}</div>
            <div class="option-desc">${t.servings} • Height: ${t.height}</div>
          </div>
          <div class="option-extra">${Cart.formatPrice(t.price)}</div>
        </div>
      `).join('');
    }

    // 2. Sponges
    const spongesContainer = document.getElementById('cakeSpongesOptions');
    if (spongesContainer) {
      spongesContainer.innerHTML = CAKE_OPTIONS.sponges.map(s => `
        <div class="config-option-card ${s.id === this.config.sponge ? 'selected' : ''}"
             onclick="CakeBuilder.selectOption('sponge', '${s.id}')">
          <div>
            <div class="option-name">${s.name}</div>
            <div class="option-desc">${s.desc}</div>
          </div>
          <div class="option-extra">${s.price > 0 ? `+${Cart.formatPrice(s.price)}` : 'Included'}</div>
        </div>
      `).join('');
    }

    // 3. Finishes
    const finishesContainer = document.getElementById('cakeFinishesOptions');
    if (finishesContainer) {
      finishesContainer.innerHTML = CAKE_OPTIONS.finishes.map(f => `
        <div class="config-option-card ${f.id === this.config.finish ? 'selected' : ''}"
             onclick="CakeBuilder.selectOption('finish', '${f.id}')">
          <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.4rem;">
            <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background: ${f.color}; border: 1px solid ${f.accent}; box-shadow: 0 0 6px ${f.accent};"></span>
            <div class="option-name" style="margin-bottom: 0;">${f.name}</div>
          </div>
          <div class="option-extra">+${Cart.formatPrice(f.price)}</div>
        </div>
      `).join('');
    }

    // 4. Extras
    const extrasContainer = document.getElementById('cakeExtrasOptions');
    if (extrasContainer) {
      extrasContainer.innerHTML = CAKE_OPTIONS.extras.map(e => `
        <div class="config-option-card ${this.config.extras.includes(e.id) ? 'selected' : ''}"
             onclick="CakeBuilder.toggleExtra('${e.id}')">
          <div class="option-name">${e.name}</div>
          <div class="option-extra">+${Cart.formatPrice(e.price)}</div>
        </div>
      `).join('');
    }
  },

  selectOption(category, id) {
    this.config[category] = id;
    this.renderOptions();
    this.updatePreview();
    this.updateSummary();
    if (window.AudioEngine) AudioEngine.playChime();
  },

  toggleExtra(id) {
    const idx = this.config.extras.indexOf(id);
    if (idx > -1) {
      this.config.extras.splice(idx, 1);
    } else {
      this.config.extras.push(id);
    }
    this.renderOptions();
    this.updatePreview();
    this.updateSummary();
    if (window.AudioEngine) AudioEngine.playChime();
  },

  calculateTotal() {
    const tierObj = CAKE_OPTIONS.tiers.find(t => t.id === this.config.tier) || CAKE_OPTIONS.tiers[1];
    const spongeObj = CAKE_OPTIONS.sponges.find(s => s.id === this.config.sponge) || CAKE_OPTIONS.sponges[0];
    const finishObj = CAKE_OPTIONS.finishes.find(f => f.id === this.config.finish) || CAKE_OPTIONS.finishes[0];
    
    let extrasTotal = 0;
    this.config.extras.forEach(extraId => {
      const ext = CAKE_OPTIONS.extras.find(e => e.id === extraId);
      if (ext) extrasTotal += ext.price;
    });

    return tierObj.price + spongeObj.price + finishObj.price + extrasTotal;
  },

  updatePreview() {
    const tiersStack = document.getElementById('cakeTiersStack');
    const topperEl = document.getElementById('cakeTopperVisual');
    if (!tiersStack) return;

    const finishObj = CAKE_OPTIONS.finishes.find(f => f.id === this.config.finish) || CAKE_OPTIONS.finishes[0];
    
    let tierCount = 2;
    if (this.config.tier === 'tier-1') tierCount = 1;
    if (this.config.tier === 'tier-2') tierCount = 2;
    if (this.config.tier === 'tier-3') tierCount = 3;
    if (this.config.tier === 'tier-4') tierCount = 4;

    let tiersHtml = '';
    for (let i = 1; i <= tierCount; i++) {
      tiersHtml += `
        <div class="cake-tier-block cake-tier-${i}" style="
          background: ${finishObj.color};
          border: 1px solid ${finishObj.accent};
          box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,255,255,0.15);
        "></div>
      `;
    }

    tiersStack.innerHTML = tiersHtml;

    // Topper
    if (topperEl) {
      if (this.config.extras.includes('extra-peonies')) {
        topperEl.textContent = '🌸';
      } else if (this.config.extras.includes('extra-gold-leaf')) {
        topperEl.textContent = '✨';
      } else if (this.config.extras.includes('extra-macarons')) {
        topperEl.textContent = '🍩';
      } else {
        topperEl.textContent = '👑';
      }
    }
  },

  updateSummary() {
    const tierObj = CAKE_OPTIONS.tiers.find(t => t.id === this.config.tier) || CAKE_OPTIONS.tiers[1];
    const spongeObj = CAKE_OPTIONS.sponges.find(s => s.id === this.config.sponge) || CAKE_OPTIONS.sponges[0];
    const finishObj = CAKE_OPTIONS.finishes.find(f => f.id === this.config.finish) || CAKE_OPTIONS.finishes[0];
    
    const summaryTier = document.getElementById('cakeSummaryTier');
    const summarySponge = document.getElementById('cakeSummarySponge');
    const summaryFinish = document.getElementById('cakeSummaryFinish');
    const summaryExtras = document.getElementById('cakeSummaryExtras');
    const summaryPrice = document.getElementById('cakeSummaryTotalPrice');

    if (summaryTier) summaryTier.textContent = `${tierObj.name} (${tierObj.servings})`;
    if (summarySponge) summarySponge.textContent = spongeObj.name;
    if (summaryFinish) summaryFinish.textContent = finishObj.name;
    
    if (summaryExtras) {
      if (this.config.extras.length === 0) {
        summaryExtras.textContent = 'None';
      } else {
        const extraNames = this.config.extras.map(eId => {
          const item = CAKE_OPTIONS.extras.find(e => e.id === eId);
          return item ? item.name : '';
        }).filter(Boolean);
        summaryExtras.textContent = extraNames.join(', ');
      }
    }

    const total = this.calculateTotal();
    if (summaryPrice) summaryPrice.textContent = Cart.formatPrice(total);
  },

  addBespokeToBag() {
    const tierObj = CAKE_OPTIONS.tiers.find(t => t.id === this.config.tier);
    const spongeObj = CAKE_OPTIONS.sponges.find(s => s.id === this.config.sponge);
    const finishObj = CAKE_OPTIONS.finishes.find(f => f.id === this.config.finish);
    const inscription = (document.getElementById('cakeInscriptionInput') || {}).value || '';
    const totalUSD = this.calculateTotal();

    const bespokeProduct = {
      id: `bespoke-cake-${Date.now()}`,
      name: `Custom Bespoke Cake (${tierObj.name})`,
      subtitle: "Handcrafted Custom Celebration Tiered Cake",
      price: totalUSD,
      image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=1200&q=85",
      customNotes: `Tier: ${tierObj.name} | Sponge: ${spongeObj.name} | Finish: ${finishObj.name}${inscription ? ` | Inscription: "${inscription}"` : ''}`
    };

    Cart.addItem(null, 1, bespokeProduct);
    Cart.toggleDrawer(true);
  },

  bindEvents() {
    const addBtn = document.getElementById('addBespokeToBagBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addBespokeToBag());
    }

    const inscriptionInput = document.getElementById('cakeInscriptionInput');
    if (inscriptionInput) {
      inscriptionInput.addEventListener('input', (e) => {
        this.config.inscription = e.target.value;
      });
    }
  }
};
