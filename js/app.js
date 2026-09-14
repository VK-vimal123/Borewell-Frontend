// Sri Vellingiri Engineering Works - Main Application Script
// Multi-language Support, Interactive UI, Service Booking, & Owner Work Gallery System

document.addEventListener('DOMContentLoaded', () => {
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  let currentLang = (urlLang && ['en', 'ta', 'hi'].includes(urlLang)) 
    ? urlLang 
    : (localStorage.getItem('sri_vellingiri_lang') || 'en');

  let cachedServices = [];
  let cachedGallery = [];
  let activeGalleryCategory = 'all';
  let ownerSession = {
    token: localStorage.getItem('sri_owner_token') || null,
    name: localStorage.getItem('sri_owner_name') || null
  };

  // Modals instances
  let galleryModalInstance = null;
  let ownerLoginModalInstance = null;
  let ownerGalleryModalInstance = null;
  let editGalleryModalInstance = null;

  // Initialize UI components
  initThemeToggle();
  initLanguageSwitcher();
  initNavigation();
  initModals();
  initServiceRequestForm();
  initOwnerPortal();

  // Load initial data from backend (with automatic fallbacks)
  loadServices();
  loadGallery();
  checkApiHealth();

  // -------------------------------------------------------------
  // Health & Server Status Check
  // -------------------------------------------------------------
  async function checkApiHealth() {
    try {
      const health = await API.checkHealth();
      console.log('✅ Sri Vellingiri Engineering API Status:', health.status);
    } catch (e) {
      console.warn('API is offline or starting up...');
    }
  }

  // -------------------------------------------------------------
  // Language Switcher Logic (English, Tamil, Hindi)
  // -------------------------------------------------------------
  function initLanguageSwitcher() {
    const langSelect = document.getElementById('langSelect');
    const langSelectMobile = document.getElementById('langSelectMobile');

    function handleLangChange(lang) {
      currentLang = lang;
      try {
        localStorage.setItem('sri_vellingiri_lang', lang);
      } catch (e) {
        // ignore
      }

      if (langSelect) langSelect.value = lang;
      if (langSelectMobile) langSelectMobile.value = lang;

      applyTranslations(lang);
      if (typeof updateOwnerUiState === 'function') updateOwnerUiState();
      if (cachedServices.length > 0) renderServices(cachedServices);
      if (cachedGallery.length > 0) renderGallery(cachedGallery);
    }

    // Apply saved language immediately on load
    handleLangChange(currentLang);

    if (langSelect) {
      langSelect.addEventListener('change', (e) => handleLangChange(e.target.value));
    }
    if (langSelectMobile) {
      langSelectMobile.addEventListener('change', (e) => handleLangChange(e.target.value));
    }
  }

  // -------------------------------------------------------------
  // Theme Toggle Logic (Dark Theme / White Theme)
  // -------------------------------------------------------------
  function initThemeToggle() {
    const desktopBtn = document.getElementById('themeToggleBtn');
    const mobileBtn = document.getElementById('themeToggleBtnMobile');

    function getSavedTheme() {
      try {
        return localStorage.getItem('sri_vellingiri_theme') || 'dark';
      } catch (e) {
        return 'dark';
      }
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('sri_vellingiri_theme', theme);
      } catch (e) {
        // ignore
      }

      const isLight = theme === 'light';
      const iconHtml = isLight
        ? '<i class="bi bi-sun-fill text-warning"></i>'
        : '<i class="bi bi-moon-stars-fill"></i>';
      const label = isLight ? 'Switch to Dark Mode' : 'Switch to White Theme';

      [desktopBtn, mobileBtn].forEach((btn) => {
        if (btn) {
          btn.innerHTML = iconHtml;
          btn.setAttribute('title', label);
          btn.setAttribute('aria-label', label);
        }
      });
    }

    function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || getSavedTheme();
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
    }

    // Apply saved theme immediately on init
    applyTheme(getSavedTheme());

    if (desktopBtn) {
      desktopBtn.addEventListener('click', toggleTheme);
    }
    if (mobileBtn) {
      mobileBtn.addEventListener('click', toggleTheme);
    }
  }

  function applyTranslations(lang) {
    const dict = translations[lang] || translations.en;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    document.documentElement.lang = lang;
  }

  function getLocalized(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const val = obj[currentLang];
    if (val && (currentLang === 'en' || val !== obj.en || !obj.en)) {
      return val;
    }
    // Fallback translations for English strings in ta/hi
    const enText = ((obj.en || Object.values(obj)[0] || '') + '').trim().toLowerCase();
    if (currentLang === 'ta') {
      if (enText.includes('drill rod') || enText.includes('rods')) return 'டிரில்லிங் ராடு த்ரெட் கட்டிங் & ஆய்வு பணிகள்';
      if (enText.includes('dth rig') || enText.includes('truck-mounted')) return 'கனரக லாரி போர்வெல் டி.டி.எச் ரிக் - ஆழ்துளை கிணறு பணிகள்';
      if (enText.includes('lathe')) return 'கனரக லேத் டர்னிங் & ஸ்பிண்டில் மெஷினிங்';
      if (enText.includes('welding')) return 'ரிக் மாஸ்ட் கட்டமைப்பு வெல்டிங்';
      if (enText.includes('compressor')) return 'உயர் அழுத்த கம்ப்ரஸர் பராமரிப்பு';
      if (enText.includes('pneumatic hammer') || enText.includes('aquifers')) return 'கடின பாறைகளை துளைக்கும் உயர் அழுத்த டி.டி.எச் மற்றும் ரோட்டரி அமைப்பு முழுமையான பராமரிப்பு.';
      if (enText.includes('high-precision threading') || enText.includes('industrial drill rods')) return '4.5" மற்றும் 6" தொழில்துறை டிரில்லிங் ராடுகளுக்கு உயர்தர லேத் த்ரெட்டிங் மற்றும் ஆய்வு பணிகள்.';
    } else if (currentLang === 'hi') {
      if (enText.includes('drill rod') || enText.includes('rods')) return 'ड्रिलिंग रॉड थ्रेडिंग एवं निरीक्षण कार्य';
      if (enText.includes('dth rig') || enText.includes('truck-mounted')) return 'हैवी-ड्यूटी ट्रक-माउंटेड बोरवेल डीटीएच रिग कार्य';
      if (enText.includes('lathe')) return 'हैवी लेथ टर्निंग एवं स्पिंडल मशीनिंग';
      if (enText.includes('welding')) return 'रिग मास्ट संरचनात्मक वेल्डिंग';
      if (enText.includes('compressor')) return 'हाई-प्रेशर कंप्रेसर मेंटेनेंस';
      if (enText.includes('pneumatic hammer') || enText.includes('aquifers')) return 'कठिन चट्टानों को भेदने के लिए हाई-प्रेशर डीटीएच हैमर एवं रोटरी सिस्टम मेंटेनेंस।';
      if (enText.includes('high-precision threading') || enText.includes('industrial drill rods')) return '4.5" एवं 6" ड्रिलिंग रॉड्स के लिए हाई-प्रिसिजन थ्रेडिंग और इंस्पेक्शन कार्य।';
    }
    return obj[currentLang] || obj.en || Object.values(obj)[0] || '';
  }

  // -------------------------------------------------------------
  // Navigation & Scroll Behavior
  // -------------------------------------------------------------
  function initNavigation() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarCollapse = document.getElementById('navbarContent');

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
          const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
          if (bsCollapse) bsCollapse.hide();
        }
      });
    });

    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      let currentSectionId = '';
      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
          currentSectionId = section.getAttribute('id');
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
          link.classList.add('active');
        }
      });
    });
  }

  // -------------------------------------------------------------
  // Services Loading & Rendering
  // -------------------------------------------------------------
  async function loadServices() {
    const container = document.getElementById('servicesContainer');
    if (!container) return;

    try {
      const rawServices = await API.getServices();
      const services = (rawServices || []).filter(
        (s) => s.slug !== 'compressor-works' && s.slug !== 'rig-repair-maintenance'
      );
      cachedServices = services;
      renderServices(services);
    } catch (err) {
      console.error('Error in loadServices:', err);
      container.innerHTML = `<div class="col-12 text-center py-4"><p class="text-muted">Unable to load services right now. Please call our workshop directly.</p></div>`;
    }
  }

  function renderServices(services) {
    const container = document.getElementById('servicesContainer');
    if (!container || !services || services.length === 0) return;

    const filtered = services.filter(
      (s) => s.slug !== 'compressor-works' && s.slug !== 'rig-repair-maintenance'
    );

    const dict = translations[currentLang] || translations.en;

    container.innerHTML = filtered.map((s) => {
      const title = getLocalized(s.title);
      const shortDesc = getLocalized(s.shortDescription);
      const icon = s.icon || 'bi-gear-wide-connected';
      
      let image = 'assets/images/service-rig.svg';
      if (s.slug === 'lathe-works') {
        image = 'assets/images/service-lathe.png';
      } else if (s.slug === 'welding-works') {
        image = 'assets/images/service-welding.png';
      } else if (s.slug === 'borewell-rig-service') {
        image = 'assets/images/Complete Borewel/lorry1.png';
      } else if (s.slug === 'drilling-rod-works') {
        image = 'assets/images/Complete Borewel/rod1.png';
      } else if (s.image) {
        image = s.image;
      }

      const features = s.features ? (s.features[currentLang] || s.features.en || []) : [];
      const featuresHtml = features.length > 0
        ? `<ul class="service-features-list">
            ${features.map(f => `<li><i class="bi bi-check2-circle"></i><span>${f}</span></li>`).join('')}
          </ul>`
        : '';

      return `
        <div class="col-lg-6 col-md-6 mb-4">
          <div class="service-card">
            <div class="service-card-img-wrap">
              <img src="${image}" alt="${title}" loading="lazy" />
            </div>
            <div class="service-card-body">
              <span class="service-card-icon-tag"><i class="bi ${icon} me-1"></i> ${dict.engineering_works_tag || 'Engineering Works'}</span>
              <h3 class="service-card-title">${title}</h3>
              <p class="service-card-desc">${shortDesc}</p>
              ${featuresHtml}
              <div class="mt-auto pt-3 border-top">
                <button class="btn btn-sm btn-outline-custom w-100 select-service-btn" data-service-title="${title}">
                  <i class="bi bi-calendar-check me-1"></i> ${dict.service_request_btn || 'Request This Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.select-service-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const title = e.currentTarget.getAttribute('data-service-title');
        const serviceSelect = document.getElementById('serviceRequired');
        if (serviceSelect) {
          for (let i = 0; i < serviceSelect.options.length; i++) {
            if (serviceSelect.options[i].text.toLowerCase().includes(title.toLowerCase().substring(0, 8))) {
              serviceSelect.selectedIndex = i;
              break;
            }
          }
        }
        const reqSec = document.getElementById('service-request');
        if (reqSec) {
          reqSec.scrollIntoView({ behavior: 'smooth' });
          const nameInput = document.getElementById('customerName');
          if (nameInput) nameInput.focus();
        }
      });
    });
  }

  // -------------------------------------------------------------
  // Customer-Facing Gallery Loading & Filtering (View Only)
  // -------------------------------------------------------------
  async function loadGallery(category = 'all') {
    const container = document.getElementById('galleryContainer');
    if (!container) return;

    activeGalleryCategory = category;

    try {
      const items = await API.getGallery(category);
      cachedGallery = items;
      renderGallery(items);
      updateOwnerPhotoCount(items.length);
    } catch (err) {
      console.error('Error loading gallery:', err);
      container.innerHTML = `<div class="col-12 text-center py-4"><p class="text-muted">Unable to load gallery photos. Please visit our workshop.</p></div>`;
    }
  }

  function renderGallery(items) {
    const container = document.getElementById('galleryContainer');
    if (!container || !items) return;

    if (items.length === 0) {
      container.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted">No photos available for this category yet.</p></div>`;
      return;
    }

    container.innerHTML = items.map((item) => {
      const title = getLocalized(item.title);
      const desc = getLocalized(item.description);
      const catName = formatCategoryName(item.category);
      
      // Determine Image URL: Use uploaded image or category fallback
      let imageUrl = item.imageUrl || '';
      if (!imageUrl) {
        if (item.category === 'workshop') imageUrl = 'assets/images/gallery-lathe-1.png';
        else if (item.category === 'welding') imageUrl = 'assets/images/gallery-welding-1.png';
        else if (item.category === 'rig') imageUrl = 'assets/images/gallery-rig-1.svg';
        else if (item.category === 'drilling_rods') imageUrl = 'assets/images/gallery-rods-1.svg';
        else if (item.category === 'compressor') imageUrl = 'assets/images/gallery-compressor-1.svg';
        else imageUrl = 'assets/images/gallery-workshop-1.svg';
      }

      const defaultDesc = currentLang === 'ta'
        ? 'ஸ்ரீ வெள்ளிங்கிரி இன்ஜினியரிங் ஒர்க்ஸ் நேரடி பட்டறை பணி.'
        : (currentLang === 'hi' ? 'श्री वेल्लिंगिरी इंजीनियरिंग वर्क्स कस्टम सेवा।' : 'Sri Vellingiri Engineering Works custom service.');

      return `
        <div class="col-lg-4 col-md-6 mb-4 gallery-card-item" data-category="${item.category}">
          <div class="gallery-item-card" data-img="${imageUrl}" data-title="${title}" data-desc="${desc}" data-cat="${catName}">
            <div class="gallery-img-wrap">
              <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.onerror=null; this.src='assets/images/logo.png';" />
            </div>
            <div class="gallery-item-body">
              <span class="gallery-item-cat">${catName}</span>
              <h4 class="gallery-item-title">${title}</h4>
              <p class="gallery-item-desc">${desc || defaultDesc}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click for preview modal (View only)
    document.querySelectorAll('.gallery-item-card').forEach((card) => {
      card.addEventListener('click', () => {
        const img = card.getAttribute('data-img');
        const title = card.getAttribute('data-title');
        const desc = card.getAttribute('data-desc');
        const cat = card.getAttribute('data-cat');
        openGalleryModal(img, title, desc, cat);
      });
    });
  }

  function formatCategoryName(cat) {
    if (!cat) return '';
    const raw = String(cat).toLowerCase();
    const isTa = currentLang === 'ta';
    const isHi = currentLang === 'hi';

    if (raw.includes('rod') || raw.includes('thread')) {
      if (isTa) return 'டிரில்லிங் ராடுகள் & த்ரெட்டிங்';
      if (isHi) return 'ड्रिलिंग रॉड्स एवं थ्रेडिंग';
      return 'Drilling Rods & Threading';
    }
    if (raw.includes('rig') || raw.includes('borewell') || raw.includes('dth') || raw.includes('overhaul')) {
      if (isTa) return 'போர்வெல் ரிக் சர்வீஸ்';
      if (isHi) return 'बोरवेल रिग सर्विस';
      return 'Borewell Rig Service';
    }
    if (raw.includes('weld') || raw.includes('fabricat') || raw.includes('structure')) {
      if (isTa) return 'ரிக் வெல்டிங் & கட்டமைப்பு';
      if (isHi) return 'रिग वेल्डिंग एवं फैब्रिकेशन';
      return 'Rig Welding & Fabrication';
    }
    if (raw.includes('compressor')) {
      if (isTa) return 'கம்ப்ரஸர் பணிகள்';
      if (isHi) return 'कंप्रेसर कार्य';
      return 'Compressor Works';
    }
    if (raw.includes('lathe') || raw.includes('workshop') || raw.includes('turning') || raw.includes('floor')) {
      if (isTa) return 'பட்டறை தளம் / லேத் வேலைகள்';
      if (isHi) return 'वर्कशॉप फ्लोर / लेथ कार्य';
      return 'Workshop Floor / Lathe';
    }

    const map = {
      workshop: isTa ? 'பட்டறை தளம்' : (isHi ? 'वर्कशॉप फ्लोर' : 'Workshop Floor / Lathe'),
      welding: isTa ? 'வெல்டிங் வேலைகள்' : (isHi ? 'वेल्डिंग कार्य' : 'Welding & Fabrication'),
      rig: isTa ? 'போர்வெல் ரிக்குகள்' : (isHi ? 'बोरवेल रिग्स' : 'Borewell Rig Service'),
      drilling_rods: isTa ? 'டிரில்லிங் ராடுகள்' : (isHi ? 'ड्रिलिंग रॉड्स' : 'Drilling Rods'),
      compressor: isTa ? 'கம்ப்ரஸர் பணிகள்' : (isHi ? 'कंप्रेसर कार्य' : 'Compressor Works')
    };
    return map[cat] || cat;
  }

  function getCategoryBadgeClass(cat) {
    const map = {
      workshop: 'badge-cat-workshop',
      welding: 'badge-cat-welding',
      rig: 'badge-cat-rig',
      drilling_rods: 'badge-cat-drilling_rods',
      compressor: 'badge-cat-compressor'
    };
    return map[cat] || 'bg-secondary';
  }

  // Filter Buttons
  const filterBtns = document.querySelectorAll('.gallery-filters .filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      loadGallery(cat);
    });
  });

  // -------------------------------------------------------------
  // Modals Initialization
  // -------------------------------------------------------------
  function initModals() {
    const galleryEl = document.getElementById('galleryModal');
    if (galleryEl && typeof bootstrap !== 'undefined') {
      galleryModalInstance = new bootstrap.Modal(galleryEl);
    }

    const loginEl = document.getElementById('ownerLoginModal');
    if (loginEl && typeof bootstrap !== 'undefined') {
      ownerLoginModalInstance = new bootstrap.Modal(loginEl);
    }

    const ownerGalEl = document.getElementById('ownerGalleryModal');
    if (ownerGalEl && typeof bootstrap !== 'undefined') {
      ownerGalleryModalInstance = new bootstrap.Modal(ownerGalEl);
    }

    const editEl = document.getElementById('editGalleryModal');
    if (editEl && typeof bootstrap !== 'undefined') {
      editGalleryModalInstance = new bootstrap.Modal(editEl);
    }
  }

  function openGalleryModal(img, title, desc, cat) {
    const modalImg = document.getElementById('modalGalleryImg');
    const modalTitle = document.getElementById('modalGalleryTitle');
    const modalDesc = document.getElementById('modalGalleryDesc');
    const modalCat = document.getElementById('modalGalleryCat');

    if (modalImg) modalImg.src = img;
    if (modalTitle) modalTitle.textContent = title;
    if (modalDesc) modalDesc.textContent = desc;
    if (modalCat) modalCat.textContent = cat;

    if (galleryModalInstance) {
      galleryModalInstance.show();
    }
  }

  // -------------------------------------------------------------
  // Owner Work Gallery Portal Logic
  // -------------------------------------------------------------
  function initOwnerPortal() {
    const ownerPortalBtn = document.getElementById('ownerPortalBtn');
    const ownerFooterLink = document.getElementById('ownerFooterLink');
    const ownerLoginForm = document.getElementById('ownerLoginForm');
    const ownerPinInput = document.getElementById('ownerPinInput');
    const loginAlert = document.getElementById('loginAlert');
    const togglePinVisibility = document.getElementById('togglePinVisibility');
    const pinEyeIcon = document.getElementById('pinEyeIcon');
    const ownerLogoutBtn = document.getElementById('ownerLogoutBtn');
    const ownerUploadForm = document.getElementById('ownerUploadForm');
    const workPhotoFile = document.getElementById('workPhotoFile');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const dropzonePlaceholder = document.getElementById('dropzonePlaceholder');
    const dropzonePreview = document.getElementById('dropzonePreview');
    const photoPreviewImg = document.getElementById('photoPreviewImg');
    const photoFileName = document.getElementById('photoFileName');
    const removeSelectedPhotoBtn = document.getElementById('removeSelectedPhotoBtn');
    const uploadAlert = document.getElementById('uploadAlert');
    const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
    const adminFilterSelect = document.getElementById('adminFilterSelect');
    const refreshOwnerPhotosBtn = document.getElementById('refreshOwnerPhotosBtn');
    const editGalleryForm = document.getElementById('editGalleryForm');

    // Update UI if owner is already logged in
    updateOwnerUiState();

    // Trigger Open Owner Portal
    function openOwnerPortal() {
      if (ownerSession.token) {
        openOwnerDashboard();
      } else {
        if (loginAlert) loginAlert.classList.add('d-none');
        if (ownerPinInput) ownerPinInput.value = '';
        if (ownerLoginModalInstance) ownerLoginModalInstance.show();
      }
    }

    if (ownerPortalBtn) ownerPortalBtn.addEventListener('click', (e) => { e.preventDefault(); openOwnerPortal(); });
    if (ownerFooterLink) ownerFooterLink.addEventListener('click', (e) => { e.preventDefault(); openOwnerPortal(); });

    // Toggle PIN visibility
    if (togglePinVisibility && ownerPinInput) {
      togglePinVisibility.addEventListener('click', () => {
        if (ownerPinInput.type === 'password') {
          ownerPinInput.type = 'text';
          if (pinEyeIcon) pinEyeIcon.className = 'bi bi-eye-slash';
        } else {
          ownerPinInput.type = 'password';
          if (pinEyeIcon) pinEyeIcon.className = 'bi bi-eye';
        }
      });
    }

    // PIN Login Submit
    if (ownerLoginForm) {
      ownerLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pin = ownerPinInput.value.trim();
        const submitBtn = document.getElementById('ownerLoginSubmitBtn');

        if (!pin) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Verifying...`;
        loginAlert.classList.add('d-none');

        try {
          const res = await API.verifyOwnerPin(pin);
          ownerSession.token = res.token;
          ownerSession.name = res.ownerName || 'Owner';
          localStorage.setItem('sri_owner_token', res.token);
          localStorage.setItem('sri_owner_name', ownerSession.name);

          updateOwnerUiState();
          if (ownerLoginModalInstance) ownerLoginModalInstance.hide();
          openOwnerDashboard();
        } catch (err) {
          loginAlert.textContent = err.message || 'Invalid Owner PIN. Please try again.';
          loginAlert.classList.remove('d-none');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="bi bi-unlock-fill me-1"></i> Unlock Dashboard`;
        }
      });
    }

    // Owner Logout
    if (ownerLogoutBtn) {
      ownerLogoutBtn.addEventListener('click', () => {
        ownerSession.token = null;
        ownerSession.name = null;
        localStorage.removeItem('sri_owner_token');
        localStorage.removeItem('sri_owner_name');
        updateOwnerUiState();
        if (ownerGalleryModalInstance) ownerGalleryModalInstance.hide();
      });
    }

    // Open Owner Dashboard Modal
    function openOwnerDashboard() {
      const sessionLabel = document.getElementById('ownerSessionLabel');
      if (sessionLabel) {
        sessionLabel.textContent = `Logged in as: ${ownerSession.name || 'Nathan (Owner)'}`;
      }
      if (ownerGalleryModalInstance) {
        ownerGalleryModalInstance.show();
      }
      loadOwnerPhotosList();
    }

    function updateOwnerUiState() {
      const dict = translations[currentLang] || translations.en;
      if (ownerPortalBtn) {
        if (ownerSession.token) {
          const ownerLabel = dict.owner_active_btn || 'Owner: Nathan';
          ownerPortalBtn.innerHTML = `<i class="bi bi-person-check-fill text-success me-1"></i> ${ownerLabel}`;
          ownerPortalBtn.classList.remove('btn-outline-warning');
          ownerPortalBtn.classList.add('btn-warning');
        } else {
          const portalLabel = dict.owner_portal_btn || 'Owner Portal';
          ownerPortalBtn.innerHTML = `<i class="bi bi-shield-lock-fill text-warning me-1"></i> ${portalLabel}`;
          ownerPortalBtn.classList.remove('btn-warning');
          ownerPortalBtn.classList.add('btn-outline-warning');
        }
      }
    }

    // Drag and Drop / File Input Preview
    if (uploadDropzone && workPhotoFile) {
      uploadDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropzone.classList.add('dragover');
      });
      uploadDropzone.addEventListener('dragleave', () => {
        uploadDropzone.classList.remove('dragover');
      });
      uploadDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          workPhotoFile.files = e.dataTransfer.files;
          handleFileSelection(e.dataTransfer.files[0]);
        }
      });

      workPhotoFile.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFileSelection(e.target.files[0]);
        }
      });
    }

    function handleFileSelection(file) {
      if (!file) return;
      if (!file.type.match('image.*')) {
        alert('Please select a valid image file (JPG, PNG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (photoPreviewImg) photoPreviewImg.src = e.target.result;
        if (photoFileName) photoFileName.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
        if (dropzonePlaceholder) dropzonePlaceholder.classList.add('d-none');
        if (dropzonePreview) dropzonePreview.classList.remove('d-none');
      };
      reader.readAsDataURL(file);
    }

    if (removeSelectedPhotoBtn && workPhotoFile) {
      removeSelectedPhotoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        workPhotoFile.value = '';
        if (dropzonePlaceholder) dropzonePlaceholder.classList.remove('d-none');
        if (dropzonePreview) dropzonePreview.classList.add('d-none');
        if (photoPreviewImg) photoPreviewImg.src = '';
      });
    }

    // Owner Photo Upload Submission
    if (ownerUploadForm) {
      ownerUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = workPhotoFile.files[0];
        const title = document.getElementById('workTitle').value.trim();
        const category = document.getElementById('workCategory').value;
        const description = document.getElementById('workDescription').value.trim();

        if (!file) {
          showUploadAlert('Please select a work photo to upload.', 'warning');
          return;
        }
        if (!title) {
          showUploadAlert('Please enter a work title.', 'warning');
          return;
        }

        uploadSubmitBtn.disabled = true;
        uploadSubmitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Uploading & Publishing...`;
        showUploadAlert('Uploading photo to server...', 'info');

        try {
          const formData = new FormData();
          formData.append('photo', file);
          formData.append('title', title);
          formData.append('category', category);
          formData.append('description', description);

          const res = await API.uploadGalleryPhoto(formData);

          showUploadAlert(`🎉 ${res.message || 'Work photo uploaded and published successfully!'}`, 'success');
          
          // Reset form and preview
          ownerUploadForm.reset();
          if (dropzonePlaceholder) dropzonePlaceholder.classList.remove('d-none');
          if (dropzonePreview) dropzonePreview.classList.add('d-none');

          // Immediately reload Customer Gallery & Owner List
          await loadGallery(activeGalleryCategory);
          loadOwnerPhotosList();

          // Auto-switch to manage tab after 1.5s
          setTimeout(() => {
            const manageTabBtn = document.getElementById('manage-tab');
            if (manageTabBtn) manageTabBtn.click();
            if (uploadAlert) uploadAlert.classList.add('d-none');
          }, 1500);

        } catch (err) {
          showUploadAlert(`Upload failed: ${err.message}`, 'danger');
        } finally {
          uploadSubmitBtn.disabled = false;
          uploadSubmitBtn.innerHTML = `<i class="bi bi-cloud-arrow-up-fill me-1"></i> Upload &amp; Publish to Gallery`;
        }
      });
    }

    function showUploadAlert(msg, type = 'info') {
      if (!uploadAlert) return;
      uploadAlert.className = `alert alert-${type} py-2 small mb-0`;
      uploadAlert.innerHTML = msg;
      uploadAlert.classList.remove('d-none');
    }

    // Manage Photos Tab: Render Table
    async function loadOwnerPhotosList() {
      const tableBody = document.getElementById('ownerPhotosTableBody');
      if (!tableBody) return;

      tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span> Loading work photos...</td></tr>`;

      try {
        const filterCat = adminFilterSelect ? adminFilterSelect.value : 'all';
        const items = await API.getGallery(filterCat);
        updateOwnerPhotoCount(items.length);

        if (items.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No photos found in this category.</td></tr>`;
          return;
        }

        tableBody.innerHTML = items.map((item) => {
          const id = item._id || item.id || '';
          const title = getLocalized(item.title);
          const desc = getLocalized(item.description);
          const catName = formatCategoryName(item.category);
          const badgeClass = getCategoryBadgeClass(item.category);
          
          let imageUrl = item.imageUrl || '';
          if (!imageUrl) {
            if (item.category === 'workshop') imageUrl = 'assets/images/gallery-lathe-1.png';
            else if (item.category === 'welding') imageUrl = 'assets/images/gallery-welding-1.png';
            else if (item.category === 'rig') imageUrl = 'assets/images/gallery-rig-1.svg';
            else if (item.category === 'drilling_rods') imageUrl = 'assets/images/gallery-rods-1.svg';
            else if (item.category === 'compressor') imageUrl = 'assets/images/gallery-compressor-1.svg';
            else imageUrl = 'assets/images/gallery-workshop-1.svg';
          }

          return `
            <tr>
              <td>
                <img src="${imageUrl}" alt="${title}" class="owner-thumb-img" onerror="this.src='assets/images/logo.png'" />
              </td>
              <td>
                <span class="fw-bold text-dark">${title}</span>
              </td>
              <td>
                <span class="badge ${badgeClass}">${catName}</span>
              </td>
              <td>
                <small class="text-muted text-truncate d-inline-block" style="max-width: 260px;">${desc || '-'}</small>
              </td>
              <td class="text-end">
                <button type="button" class="btn btn-sm btn-outline-primary py-0 px-2 me-1 edit-item-btn" 
                  data-id="${id}" 
                  data-title="${title}" 
                  data-cat="${item.category}" 
                  data-desc="${desc}" 
                  data-img="${imageUrl}">
                  <i class="bi bi-pencil-square"></i> Edit
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 delete-item-btn" data-id="${id}" data-title="${title}">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        // Attach Edit actions
        document.querySelectorAll('.edit-item-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const title = btn.getAttribute('data-title');
            const cat = btn.getAttribute('data-cat');
            const desc = btn.getAttribute('data-desc');
            const img = btn.getAttribute('data-img');

            openEditModal(id, title, cat, desc, img);
          });
        });

        // Attach Delete actions
        document.querySelectorAll('.delete-item-btn').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const title = btn.getAttribute('data-title');
            if (confirm(`Are you sure you want to delete "${title}" from the gallery?`)) {
              try {
                await API.deleteGalleryItem(id);
                await loadGallery(activeGalleryCategory);
                loadOwnerPhotosList();
              } catch (err) {
                alert('Failed to delete photo: ' + err.message);
              }
            }
          });
        });

      } catch (err) {
        console.error('Error loading owner photos:', err);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Failed to load photos. Please refresh.</td></tr>`;
      }
    }

    if (adminFilterSelect) {
      adminFilterSelect.addEventListener('change', () => loadOwnerPhotosList());
    }
    if (refreshOwnerPhotosBtn) {
      refreshOwnerPhotosBtn.addEventListener('click', () => loadOwnerPhotosList());
    }

    // Open Edit Modal
    function openEditModal(id, title, cat, desc, img) {
      const editItemId = document.getElementById('editItemId');
      const editWorkTitle = document.getElementById('editWorkTitle');
      const editWorkCategory = document.getElementById('editWorkCategory');
      const editWorkDescription = document.getElementById('editWorkDescription');
      const editItemPreview = document.getElementById('editItemPreview');
      const editAlert = document.getElementById('editAlert');

      if (editItemId) editItemId.value = id;
      if (editWorkTitle) editWorkTitle.value = title;
      if (editWorkCategory) editWorkCategory.value = cat;
      if (editWorkDescription) editWorkDescription.value = desc || '';
      if (editItemPreview) editItemPreview.src = img;
      if (editAlert) editAlert.classList.add('d-none');

      if (editGalleryModalInstance) {
        editGalleryModalInstance.show();
      }
    }

    // Edit Form Submit
    if (editGalleryForm) {
      editGalleryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editItemId').value;
        const title = document.getElementById('editWorkTitle').value.trim();
        const category = document.getElementById('editWorkCategory').value;
        const description = document.getElementById('editWorkDescription').value.trim();
        const saveBtn = document.getElementById('saveEditBtn');
        const editAlert = document.getElementById('editAlert');

        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

        try {
          await API.updateGalleryItem(id, { title, category, description });
          if (editGalleryModalInstance) editGalleryModalInstance.hide();
          await loadGallery(activeGalleryCategory);
          loadOwnerPhotosList();
        } catch (err) {
          if (editAlert) {
            editAlert.className = 'alert alert-danger py-2 small';
            editAlert.textContent = err.message || 'Failed to update photo details';
            editAlert.classList.remove('d-none');
          }
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<i class="bi bi-check2-circle me-1"></i> Save Changes`;
        }
      });
    }
  }

  function updateOwnerPhotoCount(count) {
    const el = document.getElementById('ownerPhotoCount');
    if (el) el.textContent = count;
  }

  // -------------------------------------------------------------
  // Service Request Form Handling (Customer Booking) — EmailJS
  // -------------------------------------------------------------
  function initServiceRequestForm() {
    const form = document.getElementById('serviceRequestForm');
    const alertBox = document.getElementById('formAlert');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnLoading = document.getElementById('submitBtnLoading');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const customerName = document.getElementById('customerName').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const serviceSelect = document.getElementById('serviceRequired');
      const serviceRequired = serviceSelect.options[serviceSelect.selectedIndex].text;
      const urgency = document.getElementById('urgency') ? document.getElementById('urgency').value : 'Normal';
      const message = document.getElementById('message').value.trim();

      if (!customerName) {
        showAlert('Please enter your full name.', 'warning');
        return;
      }
      if (!phone || phone.length < 8) {
        showAlert('Please enter a valid phone number so we can reach you.', 'warning');
        return;
      }
      if (!serviceSelect.value) {
        showAlert('Please select the required service.', 'warning');
        return;
      }

      // Show loading state
      submitBtn.disabled = true;
      if (submitBtnText) submitBtnText.classList.add('d-none');
      if (submitBtnLoading) submitBtnLoading.classList.remove('d-none');
      alertBox.classList.add('d-none');

      try {
        // Initialize EmailJS with public key from config
        const cfg = window.EMAILJS_CONFIG || {};
        emailjs.init(cfg.publicKey);

        // Template params — must match variable names in your EmailJS template
        const templateParams = {
          name:         customerName,       // matches {{name}} in template
          phone:        phone,              // matches {{phone}} in template
          service:      serviceRequired,    // matches {{service}} in template
          message:      message || 'No additional details provided.', // matches {{message}}
          reply_to:     phone,
          to_name:      'Nathan',
          submitted_at: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        };

        await emailjs.send(cfg.serviceId, cfg.templateId, templateParams);

        const successMsg = `
          <h5 class="alert-heading fw-bold"><i class="bi bi-check-circle-fill me-2 text-success"></i> Request Sent Successfully!</h5>
          <p class="mb-2">Thank you <strong>${customerName}</strong>! Your service request for <strong>${serviceRequired}</strong> has been emailed to our workshop. Nathan will call you back on <strong>${phone}</strong> shortly.</p>
          <hr/>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span class="small text-dark fw-bold">Need instant response?</span>
            <a href="https://wa.me/919344604042?text=${encodeURIComponent(`Hello Nathan (Sri Vellingiri Works),\nI submitted a service request.\n\nName: ${customerName}\nService: ${serviceRequired}\nPhone: ${phone}\n${message ? 'Details: ' + message : ''}`)}" target="_blank" class="btn btn-sm btn-whatsapp-custom">
              <i class="bi bi-whatsapp"></i> Open WhatsApp Chat
            </a>
          </div>
        `;

        showAlert(successMsg, 'success', true);
        form.reset();
      } catch (err) {
        console.error('EmailJS send error:', err);
        showAlert(
          `<i class="bi bi-exclamation-triangle-fill me-2"></i> Failed to send your request. Please call Nathan directly at <strong>+91 93446 04042</strong> or use WhatsApp.`,
          'danger',
          true
        );
      } finally {
        submitBtn.disabled = false;
        if (submitBtnText) submitBtnText.classList.remove('d-none');
        if (submitBtnLoading) submitBtnLoading.classList.add('d-none');
      }
    });

    function showAlert(content, type = 'info', isHtml = false) {
      if (!alertBox) return;
      alertBox.className = `alert alert-${type} mt-3 mb-0`;
      if (isHtml) {
        alertBox.innerHTML = content;
      } else {
        alertBox.textContent = content;
      }
      alertBox.classList.remove('d-none');
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
});
