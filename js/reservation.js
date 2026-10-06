/**
 * MAISON DORÉE - The Tasting Lounge Reservation Engine
 * Luxury table bookings, tasting flights, and VIP Pass Generation (All English)
 */

const EXPERIENCES_DATA = [
  {
    id: "exp-hightea",
    name: "Imperial Afternoon High Tea",
    desc: "Gilded 3-tier stand with warm gourmet donuts, artisan mini cupcakes, scones & Premier Cru Tea.",
    price: 85
  },
  {
    id: "exp-omakase",
    name: "Master Baker's 5-Course Dessert Tasting",
    desc: "Front-row marble counter tasting of warm molten cakes, torched donuts, and custom confectionery.",
    price: 120
  },
  {
    id: "exp-morning",
    name: "Morning Gourmet Donut & Coffee Flight",
    desc: "Fresh out-of-the-oven warm brioche donuts, house fruit glazes, and Ethiopian Geisha espresso.",
    price: 45
  },
  {
    id: "exp-cake-consult",
    name: "Bespoke Cake Tasting & Consultation",
    desc: "Private wedding or gala consultation with cake sponge tastings and personalized structural sketch.",
    price: 65
  }
];

const ReservationEngine = {
  state: {
    experienceId: "exp-hightea",
    location: "New York Madison",
    guests: 2,
    date: "",
    timeSlot: "14:00"
  },

  init() {
    this.setDefaultDate();
    this.renderExperiences();
    this.bindEvents();
  },

  setDefaultDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    this.state.date = `${yyyy}-${mm}-${dd}`;

    const dateInput = document.getElementById('resDateInput');
    if (dateInput) {
      dateInput.value = this.state.date;
      dateInput.min = this.state.date;
    }
  },

  renderExperiences() {
    const container = document.getElementById('experiencesContainer');
    if (!container) return;

    container.innerHTML = EXPERIENCES_DATA.map(exp => `
      <div class="experience-card ${exp.id === this.state.experienceId ? 'selected' : ''}"
           onclick="ReservationEngine.selectExperience('${exp.id}')">
        <div class="experience-info">
          <h4>${exp.name}</h4>
          <p>${exp.desc}</p>
        </div>
        <div class="experience-price">${Cart.formatPrice(exp.price)} <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-sans); font-weight: normal;">/ guest</span></div>
      </div>
    `).join('');
  },

  selectExperience(expId) {
    this.state.experienceId = expId;
    this.renderExperiences();
    if (window.AudioEngine) AudioEngine.playChime();
  },

  selectSlot(btn, slotTime) {
    document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.state.timeSlot = slotTime;
    if (window.AudioEngine) AudioEngine.playChime();
  },

  submitReservation(e) {
    e.preventDefault();

    const name = document.getElementById('resGuestName').value.trim();
    const email = document.getElementById('resGuestEmail').value.trim();
    const phone = document.getElementById('resGuestPhone').value.trim();
    const notes = document.getElementById('resNotes').value.trim();
    const boutique = document.getElementById('resBoutiqueSelect').value;
    const guests = parseInt(document.getElementById('resGuestsSelect').value, 10);
    const date = document.getElementById('resDateInput').value;

    if (!name || !email || !date) {
      if (window.App && typeof App.showToast === 'function') {
        App.showToast('Please provide your name, email and reservation date.', 'Incomplete Details');
      }
      return;
    }

    const exp = EXPERIENCES_DATA.find(x => x.id === this.state.experienceId) || EXPERIENCES_DATA[0];
    const bookingCode = `MD-LOUNGE-${Math.floor(1000 + Math.random() * 9000)}`;

    // Populate VIP Pass Modal
    const passModal = document.getElementById('reservationPassModal');
    const passCodeEl = document.getElementById('passCodeNumber');
    const passExpEl = document.getElementById('passExperienceName');
    const passBoutiqueEl = document.getElementById('passBoutiqueName');
    const passDateEl = document.getElementById('passDateTime');
    const passGuestEl = document.getElementById('passGuestInfo');

    if (passCodeEl) passCodeEl.textContent = bookingCode;
    if (passExpEl) passExpEl.textContent = exp.name;
    if (passBoutiqueEl) passBoutiqueEl.textContent = `Maison Dorée (${boutique})`;
    if (passDateEl) passDateEl.textContent = `${date} at ${this.state.timeSlot}`;
    if (passGuestEl) passGuestEl.textContent = `${guests} Guests • Reserved for ${name}`;

    if (passModal) {
      passModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    if (window.AudioEngine) AudioEngine.playChime();
    if (window.App && typeof App.showToast === 'function') {
      App.showToast(`Tasting table confirmed for ${name}. VIP Pass generated.`, 'Booking Confirmed');
    }
  },

  bindEvents() {
    const form = document.getElementById('salonReservationForm');
    if (form) {
      form.addEventListener('submit', (e) => this.submitReservation(e));
    }
  }
};
