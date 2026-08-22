/* ═══════════════════════════════════════════════════════════
   SOUNDS LIST — FAST & INTERACTIVE STOREFRONT (app.js)
   Features:
   1. Universal Cross-Category Live Search
   2. Interactive Order Builder / Cart with 1-Click Copy
   3. Featured Deal / Spotlight Banner
   4. Floating Quick Search Button & Scroll Top
   5. Dynamic Badge, Icon & Subtitle Support
═══════════════════════════════════════════════════════════ */

let state = {
  platform: null,
  activeCategory: null,
  subFilter: 'all',
  searchQuery: '',
  cart: []
};

// ── String Escaping Helpers ──────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ea(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlight(text, query) {
  return esc(text);
}

function getData() {
  if (typeof getPlatformData === 'function' && state.platform) {
    return getPlatformData(state.platform);
  }
  return state.platform === 'windows' ? windowsData : macData;
}

// ── Screen Transitions ───────────────────────────────────

const TRANSITION_DURATION = 350;

function selectPlatform(platform) {
  state.platform = platform;
  const data = getData();
  state.activeCategory = Object.keys(data.categories)[0];
  state.searchQuery = '';

  const platformScreen = document.getElementById('platform-screen');
  const catalogueScreen = document.getElementById('catalogue-screen');

  setupCatalogue();

  platformScreen.classList.add('exit-left');

  setTimeout(() => {
    platformScreen.classList.remove('active');
    catalogueScreen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });

    setTimeout(() => {
      platformScreen.classList.remove('exit-left');
    }, TRANSITION_DURATION);
  }, 60);
}

function goBack() {
  const platformScreen = document.getElementById('platform-screen');
  const catalogueScreen = document.getElementById('catalogue-screen');

  window.scrollTo(0, 0);
  state.platform = null;
  state.searchQuery = '';
  state.cart = [];
  updateCartUI();

  catalogueScreen.classList.add('exit-right');

  setTimeout(() => {
    catalogueScreen.classList.remove('active');
    platformScreen.classList.add('active');
    window.scrollTo(0, 0);

    clearSearch();

    setTimeout(() => {
      catalogueScreen.classList.remove('exit-right');
    }, TRANSITION_DURATION);
  }, 60);
}

// ── Catalogue Setup ──────────────────────────────────────

const WIN_LOGO_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><rect x="1" y="1" width="10.2" height="10.2" rx="1.5" fill="#0078D4"/><rect x="12.8" y="1" width="10.2" height="10.2" rx="1.5" fill="#0078D4"/><rect x="1" y="12.8" width="10.2" height="10.2" rx="1.5" fill="#0078D4"/><rect x="12.8" y="12.8" width="10.2" height="10.2" rx="1.5" fill="#0078D4"/></svg>`;

const MAC_LOGO_SVG = `<svg viewBox="0 0 170 170" width="16" height="16" fill="currentColor"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.7-11.71-13.98-5.74-8.7-10.37-18.72-13.88-30.06-3.5-11.33-5.26-22.18-5.26-32.55 0-14.07 3.5-25.75 10.49-35.03 6.99-9.28 15.89-14.07 26.68-14.36 4.79 0 10.34 1.25 16.66 3.75 6.32 2.5 10.15 3.8 11.49 3.8 1.13 0 5.17-1.35 12.13-4.04 6.96-2.7 12.67-3.9 17.13-3.62 12.82.72 23.08 5.62 30.77 14.69-11.13 6.74-16.61 15.89-16.43 27.46.19 9.07 3.65 16.68 10.38 22.84 6.73 6.16 14.73 9.77 24 10.83-2.12 6.31-4.75 12.38-7.89 18.23zm-38.42-120.32c0 6.64-2.52 13.06-7.55 18.27-5.46 5.63-12.01 9.08-19.64 8.35-.11-.97-.16-1.93-.16-2.88 0-6.42 2.65-13.05 7.94-18.39 2.65-2.69 5.86-4.84 9.64-6.45 3.78-1.61 7.42-2.48 10.92-2.6.21 1.25.32 2.5.32 3.7z" fill="#ffffff"/></svg>`;

function setupCatalogue() {
  const pill = document.getElementById('current-platform-pill');
  if (pill) {
    pill.innerHTML = state.platform === 'windows' ? WIN_LOGO_SVG : MAC_LOGO_SVG;
    pill.title = state.platform === 'windows' ? 'Windows' : 'Mac';
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  updateSearchClearBtn('');

  renderTabs();
  renderCatalogue();
  updateCartUI();
}

// ── Category SVG Icons ───────────────────────────────────

const CATEGORY_SVGS = {
  instruments: `<svg class="cat-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M6 4v10"></path><path d="M10 4v10"></path><path d="M14 4v10"></path><path d="M18 4v10"></path><line x1="2" y1="14" x2="22" y2="14"></line></svg>`,
  fx: `<svg class="cat-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
  banks: `<svg class="cat-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  kontakt: `<svg class="cat-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><line x1="9" y1="7" x2="15" y2="7"></line><line x1="9" y1="11" x2="13" y2="11"></line></svg>`,
  daws: `<svg class="cat-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><path d="M7 10l2.5-3 2.5 5 2.5-3.5 2.5 2.5"></path></svg>`,
  software: `<svg class="cat-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`
};

function getCategorySvg(key, fallback = '') {
  const norm = String(key || '').toLowerCase().trim();
  if (norm.includes('bank') || norm.includes('preset') || norm.includes('sound') || norm.includes('pack')) return CATEGORY_SVGS.banks;
  if (norm.includes('kontakt') || norm.includes('librar') || norm.includes('nki')) return CATEGORY_SVGS.kontakt;
  if (norm.includes('inst') || norm.includes('piano') || norm.includes('synth')) return CATEGORY_SVGS.instruments;
  if (norm.includes('fx') || norm.includes('mix') || norm.includes('master') || norm.includes('effect')) return CATEGORY_SVGS.fx;
  if (norm.includes('daw') || norm.includes('host') || norm.includes('studio')) return CATEGORY_SVGS.daws;
  if (norm.includes('soft') || norm.includes('app') || norm.includes('tool')) return CATEGORY_SVGS.software;
  if (CATEGORY_SVGS[norm]) return CATEGORY_SVGS[norm];
  return fallback || '';
}

// ── Category Tabs ────────────────────────────────────────

function renderTabs() {
  const data = getData();
  const container = document.getElementById('category-tabs');
  if (!container) return;

  container.innerHTML = Object.entries(data.categories)
    .map(([key, cat]) => {
      const isActive = key === state.activeCategory;
      return `
        <button
          class="cat-tab ${isActive ? 'active' : ''}"
          onclick="switchCategory('${key}')"
        >
          <span class="cat-icon-wrap">${getCategorySvg(key, cat.icon)}</span>
          <span class="cat-name">${esc(cat.label)}</span>
        </button>
      `;
    }).join('');
}

function switchCategory(key) {
  state.activeCategory = key;
  state.subFilter = 'all';

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.placeholder = (key === 'kontakt')
      ? 'Search 1,440+ Kontakt libraries, brands...'
      : 'Search plugins, bundles, soundbanks, DAWs...';
  }

  if (state.searchQuery) {
    renderCatalogue();
  } else {
    renderTabs();
    renderSubFilterPills();
    renderCatalogue();
  }
}

function setSubFilter(filterKey) {
  state.subFilter = filterKey;
  renderSubFilterPills();
  renderCatalogue();
}

function renderSubFilterPills() {
  const bar = document.getElementById('sub-filter-bar');
  if (!bar) return;

  const data = getData();
  const cat = (data.categories || {})[state.activeCategory];
  if (!cat || state.searchQuery) {
    bar.style.display = 'none';
    return;
  }

  const allItems = [
    ...(cat.tier40 || []),
    ...(cat.tier30 || []),
    ...(cat.tier20 || [])
  ];

  let pills = [];

  if (state.activeCategory === 'kontakt') {
    const SOUND_TYPES = [
      { key: 'all', label: 'All Instruments', icon: '✨', count: allItems.length },
      { key: 'Strings & Orchestral', label: 'Strings', icon: '🎻' },
      { key: 'Pianos & Keys', label: 'Pianos & Keys', icon: '🎹' },
      { key: 'Guitars & Bass', label: 'Guitars & Bass', icon: '🎸' },
      { key: 'Brass & Woodwinds', label: 'Brass & Winds', icon: '🎺' },
      { key: 'Vocals & Choirs', label: 'Vocals & Choirs', icon: '🎤' },
      { key: 'Drums & Percussion', label: 'Drums & Perc', icon: '🥁' },
      { key: 'Ethnic & World', label: 'Ethnic & World', icon: '🌍' },
      { key: 'Synths & Vintage Keys', label: 'Synths & Keys', icon: '🎛️' },
      { key: 'Cinematic & Hybrid Textures', label: 'Cinematic Textures', icon: '🔮' }
    ];

    // Calculate actual counts
    SOUND_TYPES.forEach(st => {
      if (st.key === 'all') return;
      const count = allItems.filter(item => {
        const tags = (normalizeItem(item).tags || '').toLowerCase();
        return tags.includes(st.key.toLowerCase());
      }).length;
      st.count = count;
    });

    pills = SOUND_TYPES.filter(st => st.count > 0);
  } else if (state.activeCategory === 'banks') {
    const vstCounts = {};
    allItems.forEach(item => {
      const n = normalizeItem(item);
      let vstName = 'Other Soundbanks';
      if (n.name.includes(' - ')) {
        vstName = n.name.split(' - ')[0].trim();
      } else if (n.tags) {
        const firstTag = n.tags.split(',')[0].trim();
        if (firstTag && !firstTag.toLowerCase().includes('bank')) vstName = firstTag;
      }
      vstCounts[vstName] = (vstCounts[vstName] || 0) + 1;
    });

    pills = [
      { key: 'all', label: 'All Synths', icon: '✨', count: allItems.length },
      ...Object.keys(vstCounts).sort().map(vn => ({
        key: vn,
        label: vn,
        icon: '🎹',
        count: vstCounts[vn]
      }))
    ];
  } else {
    // Standard categories: Quick tier filters
    const tierCounts = [];
    if (cat.bundles && cat.bundles.length) tierCounts.push({ key: 'bundles', label: 'Bundles', icon: '📦', count: cat.bundles.length });
    if (cat.tier40 && cat.tier40.length) tierCounts.push({ key: 'tier40', label: '$40 Tier', icon: '💎', count: cat.tier40.length });
    if (cat.tier30 && cat.tier30.length) tierCounts.push({ key: 'tier30', label: '$30 Tier', icon: '🏷️', count: cat.tier30.length });
    if (cat.tier20 && cat.tier20.length) tierCounts.push({ key: 'tier20', label: '$20 Tier', icon: '⚡', count: cat.tier20.length });

    if (tierCounts.length > 1) {
      pills = [
        { key: 'all', label: 'All', icon: '✨', count: allItems.length + (cat.bundles ? cat.bundles.length : 0) },
        ...tierCounts
      ];
    }
  }

  if (pills.length <= 1) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';
  bar.innerHTML = pills.map(p => {
    const isActive = (state.subFilter === p.key);
    return `
      <button
        class="sub-filter-pill ${isActive ? 'active' : ''}"
        onclick="setSubFilter('${ea(p.key)}')"
      >
        <span class="sub-filter-icon">${p.icon}</span>
        <span class="sub-filter-label">${esc(p.label)}</span>
        <span class="sub-filter-count">${p.count}</span>
      </button>
    `;
  }).join('');
}

let _searchRaf = null;
function handleSearch(value) {
  state.searchQuery = value.trim();
  updateSearchClearBtn(state.searchQuery);
  cancelAnimationFrame(_searchRaf);
  _searchRaf = requestAnimationFrame(() => {
    renderCatalogue();
  });
}

function clearSearch() {
  state.searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = '';
  }
  updateSearchClearBtn('');
  renderTabs();
  renderCatalogue();
}

function updateSearchClearBtn(val) {
  const btn = document.getElementById('search-clear-btn');
  if (btn) {
    btn.style.display = val ? 'inline-flex' : 'none';
  }
}

function openFloatingSearch() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const input = document.getElementById('search-input');
  if (input) {
    setTimeout(() => {
      input.focus();
      input.select();
    }, 200);
  }
}

// ── Item Matching ────────────────────────────────────────

function matchesSearch(item, q) {
  if (!q) return true;
  const n = normalizeItem(item);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const target = `${n.name} ${n.tags || ''} ${n.note || ''} ${n.badges ? n.badges.join(' ') : ''}`.toLowerCase();
  return words.every(w => target.includes(w));
}

function matchesBundleSearch(bundle, q) {
  if (!q) return true;
  const n = normalizeBundle(bundle);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const target = `${n.name} ${n.tags || ''} ${n.includes || ''} ${n.note || ''} ${n.badges ? n.badges.join(' ') : ''}`.toLowerCase();
  return words.every(w => target.includes(w));
}

// ── Interactive Cart / Order Builder & Promotion Engine ──

function getCartItemKey(type, name, tier) {
  return `${type}_${(name || '').trim()}_${tier || ''}`.toLowerCase();
}

function toggleCartItem(type, name, price, tier, badges = [], note = '', catKey = '') {
  const key = getCartItemKey(type, name, tier);
  const idx = state.cart.findIndex(item => item.id === key);
  if (idx >= 0) {
    state.cart.splice(idx, 1);
  } else {
    const isKontaktBank = (catKey === 'kontakt' || tier === '$20' || tier === 'Kontakt') && type === 'plugin' && !name.toLowerCase().includes('kontakt 8');
    const isPresetBank = (catKey === 'banks' || state.activeCategory === 'banks' || (tier && tier.includes('Preset Banks'))) && type === 'plugin';
    state.cart.push({
      id: key,
      type,
      name: name.trim(),
      price: Number(price) || 0,
      tier: tier || '',
      badges: Array.isArray(badges) ? badges : [],
      note: note || '',
      catKey: catKey || '',
      isKontaktBank,
      isPresetBank
    });
  }
  updateCartUI();
}

function clearCart() {
  state.cart = [];
  updateCartUI();
}

function calculateCartTotals() {
  const data = getData();
  const deal = data.deal || null;
  const originalTotal = state.cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const isKontaktBankItem = (item) => {
    if (item.type === 'bundle') return false;
    const n = (item.name || '').toLowerCase();
    if (n.includes('kontakt 8') || n.includes('kontakt engine')) return false;
    return Boolean(item.isKontaktBank || item.catKey === 'kontakt');
  };

  const isPresetBankItem = (item) => {
    if (item.type === 'bundle') return false;
    return Boolean(item.isPresetBank || item.catKey === 'banks' || (item.tags && item.tags.toLowerCase().includes('preset banks')));
  };

  const kontaktBanks = state.cart.filter(isKontaktBankItem);
  const presetBanks = state.cart.filter(item => !isKontaktBankItem(item) && isPresetBankItem(item));
  const regularItems = state.cart.filter(item => !isKontaktBankItem(item) && !isPresetBankItem(item));

  // ── 1. Dedicated Kontakt Volume Tier Pricing ($20 each / 5 for $50 / 10 for $75 / 20 for $120) ──
  let kDiscount = 0;
  let kPromoLabel = '';
  let kUpsellMsg = '';
  const kCount = kontaktBanks.length;

  if (kCount > 0) {
    const rawKTotal = kCount * 20;
    let remaining = kCount;
    let kCost = 0;

    const p20 = Math.floor(remaining / 20);
    kCost += p20 * 120;
    remaining %= 20;

    const p10 = Math.floor(remaining / 10);
    kCost += p10 * 75;
    remaining %= 10;

    const p5 = Math.floor(remaining / 5);
    kCost += p5 * 50;
    remaining %= 5;

    kCost += remaining * 20;
    kDiscount = Math.max(0, rawKTotal - kCost);

    if (kDiscount > 0) {
      const labels = [];
      if (p20 > 0) labels.push(`${p20 * 20} for $${p20 * 120}`);
      if (p10 > 0) labels.push(`10 for $75`);
      if (p5 > 0) labels.push(`5 for $50`);
      kPromoLabel = `Kontakt Tier Deal: ${labels.join(' + ')} (-$${kDiscount})`;
    }

    if (kCount < 5) {
      const needed = 5 - kCount;
      kUpsellMsg = `🎻 Add <strong>${needed} more Kontakt bank${needed === 1 ? '' : 's'}</strong> to get <strong>5 for $50</strong> (Save $50)!`;
    } else if (kCount > 5 && kCount < 10) {
      const needed = 10 - kCount;
      kUpsellMsg = `🎻 Add <strong>${needed} more Kontakt bank${needed === 1 ? '' : 's'}</strong> to get <strong>10 for $75</strong> (Save $125)!`;
    } else if (kCount > 10 && kCount < 20) {
      const needed = 20 - kCount;
      kUpsellMsg = `🎻 Add <strong>${needed} more Kontakt bank${needed === 1 ? '' : 's'}</strong> to get <strong>20 for $120</strong> (Save $280)!`;
    } else if (kDiscount > 0) {
      kUpsellMsg = `🎉 <strong>Kontakt Volume Tier Deal Applied!</strong> You saved $${kDiscount}`;
    }
  }

  // ── 2. Dedicated Preset Banks Tier Pricing (2 for $40 / 3 for $50 / 5 for $75) ──
  let bDiscount = 0;
  let bPromoLabel = '';
  let bUpsellMsg = '';
  const bCount = presetBanks.length;

  if (bCount > 0) {
    const sorted = [...presetBanks].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    const rawBTotal = sorted.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    let bCost = 0;
    let remaining = [...sorted];

    // 5 for $75
    const packs5 = Math.floor(remaining.length / 5);
    for (let i = 0; i < packs5; i++) {
      bCost += 75;
    }
    remaining = remaining.slice(packs5 * 5);

    // 3 for $50
    const packs3 = Math.floor(remaining.length / 3);
    for (let i = 0; i < packs3; i++) {
      bCost += 50;
    }
    remaining = remaining.slice(packs3 * 3);

    // 2 for $40
    const packs2 = Math.floor(remaining.length / 2);
    for (let i = 0; i < packs2; i++) {
      bCost += 40;
    }
    remaining = remaining.slice(packs2 * 2);

    // Remaining singles at face price
    remaining.forEach(item => {
      bCost += (Number(item.price) || 0);
    });

    bDiscount = Math.max(0, rawBTotal - bCost);

    if (bDiscount > 0) {
      const labels = [];
      if (packs5 > 0) labels.push(`${packs5 * 5} for $${packs5 * 75}`);
      if (packs3 > 0) labels.push(`${packs3 * 3} for $${packs3 * 50}`);
      if (packs2 > 0) labels.push(`${packs2 * 2} for $${packs2 * 40}`);
      bPromoLabel = `Preset Banks Tier Deal: ${labels.join(' + ')} (-$${bDiscount})`;
    }

    if (bCount === 1) {
      bUpsellMsg = `🎹 Add <strong>1 more volume pack</strong> to get <strong>2 for $40</strong>!`;
    } else if (bCount === 2) {
      bUpsellMsg = `🎉 <strong>2 Volumes for $40 Deal Applied!</strong> (Add 1 more to get <strong>3 for $50</strong>)`;
    } else if (bCount === 4) {
      bUpsellMsg = `🎹 Add <strong>1 more volume pack</strong> to get <strong>5 for $75</strong> (Save up to $50)!`;
    } else if (bDiscount > 0) {
      bUpsellMsg = `🎉 <strong>Synth Soundbank Volume Tier Deal Applied!</strong> You saved $${bDiscount}`;
    }
  }

  // ── 3. Standard Storewide / Plugin Promo Deal (Applies ONLY to Non-Bank items) ──
  let regularDiscount = 0;
  let regularPromoLabel = '';
  let regularUpsellMsg = '';

  if (deal && deal.enabled && regularItems.length > 0) {
    const regularTotal = regularItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    // Percentage Off
    if (deal.type === 'percent_off') {
      const pct = Number(deal.percentOff) || 0;
      if (pct > 0) {
        regularDiscount = Math.round((regularTotal * pct) / 100);
        if (regularDiscount > 0) {
          regularPromoLabel = `${pct}% OFF Deal Applied (-$${regularDiscount})`;
          regularUpsellMsg = `🎉 <strong>${pct}% Storewide Discount Active!</strong> You saved $${regularDiscount}`;
        }
      }
    }
    // Multi-Buy (e.g. Any 5 for $100)
    else if (deal.type === 'bundle_x_for_y') {
      const qty = Math.max(1, Number(deal.bundleQty) || 3);
      const bundlePrice = Number(deal.bundlePrice) || 100;
      const singlePlugins = regularItems.filter(item => item.type === 'plugin');
      const pluginCount = singlePlugins.length;
      const bundlesCount = Math.floor(pluginCount / qty);
      const remainder = pluginCount % qty;
      const needed = qty - remainder;

      if (bundlesCount > 0) {
        const sorted = [...singlePlugins].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        for (let b = 0; b < bundlesCount; b++) {
          const group = sorted.slice(b * qty, (b + 1) * qty);
          const groupSum = group.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
          if (groupSum > bundlePrice) {
            regularDiscount += (groupSum - bundlePrice);
          }
        }
        if (regularDiscount > 0) {
          regularPromoLabel = `${deal.title || `Any ${qty} for $${bundlePrice}`} (-$${regularDiscount})`;
        }
      }

      if (pluginCount === 0) {
        regularUpsellMsg = `💡 Add <strong>${qty} single plugins</strong> to unlock the <strong>${qty} for $${bundlePrice}</strong> bundle deal!`;
      } else if (remainder === 0 && regularDiscount > 0) {
        regularUpsellMsg = `🎉 <strong>${qty} for $${bundlePrice} Deal Unlocked!</strong> (You saved $${regularDiscount})`;
      } else if (needed === 1) {
        const currentCost = singlePlugins.reduce((sum, i) => sum + (Number(i.price) || 0), 0) - regularDiscount;
        const nextTarget = (bundlesCount + 1) * bundlePrice;
        const addedCost = Math.max(1, nextTarget - currentCost);
        regularUpsellMsg = `⚡ Add <strong>1 more plugin</strong> for only <strong>$${addedCost} more</strong> to get the ${qty} for $${bundlePrice} deal!`;
      } else if (needed > 1) {
        regularUpsellMsg = `💡 Add <strong>${needed} more plugin${needed === 1 ? '' : 's'}</strong> to unlock the <strong>${qty} for $${bundlePrice}</strong> deal!`;
      }
    }
    // BOGO Deal
    else if (deal.type === 'bogo') {
      const buyQty = Math.max(1, Number(deal.bogoBuyQty) || 2);
      const getQty = Math.max(1, Number(deal.bogoGetQty) || 1);
      const cycle = buyQty + getQty;
      const singlePlugins = regularItems.filter(item => item.type === 'plugin');
      const pluginCount = singlePlugins.length;
      const freeCycles = Math.floor(pluginCount / cycle);
      const remainder = pluginCount % cycle;

      if (freeCycles > 0) {
        const sorted = [...singlePlugins].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        const freeItems = sorted.slice(0, freeCycles * getQty);
        regularDiscount = freeItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        if (regularDiscount > 0) {
          regularPromoLabel = `Buy ${buyQty} Get ${getQty} Free (-$${regularDiscount})`;
        }
      }

      if (remainder === 0 && pluginCount > 0) {
        regularUpsellMsg = `🎉 <strong>Buy ${buyQty} Get ${getQty} Free Deal Applied!</strong> (You saved $${regularDiscount})`;
      } else if (remainder === buyQty) {
        regularUpsellMsg = `🎁 Add <strong>${getQty} more plugin</strong> to get it <strong>100% FREE</strong>!`;
      }
    }
  }

  const totalDiscount = kDiscount + bDiscount + regularDiscount;
  const finalTotal = Math.max(0, originalTotal - totalDiscount);

  const promoLabels = [];
  if (regularPromoLabel) promoLabels.push(regularPromoLabel);
  if (kPromoLabel) promoLabels.push(kPromoLabel);
  if (bPromoLabel) promoLabels.push(bPromoLabel);

  const upsellMsg = kUpsellMsg || bUpsellMsg || regularUpsellMsg || '';

  return {
    originalTotal,
    finalTotal,
    discount: totalDiscount,
    kDiscount,
    bDiscount,
    regularDiscount,
    promoLabel: promoLabels.join(' | '),
    upsellMsg,
    hasPromo: totalDiscount > 0
  };
}

function updateCartUI() {
  const bar = document.getElementById('order-cart-bar');
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  const upsellEl = document.getElementById('cart-upsell-banner');

  const totalCount = state.cart.length;
  const totals = calculateCartTotals();

  if (countEl) countEl.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'} selected`;
  if (totalEl) {
    if (totals.hasPromo) {
      totalEl.innerHTML = `
        <span class="cart-orig-strike">$${totals.originalTotal}</span>
        <span class="cart-promo-total">$${totals.finalTotal}</span>
        <span class="cart-savings-pill">Save $${totals.discount}</span>
      `;
    } else {
      totalEl.textContent = `$${totals.finalTotal}`;
    }
  }

  if (upsellEl) {
    if (totals.upsellMsg && totalCount > 0) {
      upsellEl.innerHTML = totals.upsellMsg;
      upsellEl.style.display = 'block';
    } else {
      upsellEl.style.display = 'none';
    }
  }

  if (bar) {
    bar.classList.toggle('visible', totalCount > 0);
  }

  // Update card active classes dynamically
  document.querySelectorAll('.plugin-card, .bundle-card, .spotlight-card').forEach(card => {
    const key = card.getAttribute('data-cart-key');
    if (key) {
      const isIn = state.cart.some(item => item.id === key);
      card.classList.toggle('in-cart', isIn);
      const checkEl = card.querySelector('.cart-check-indicator');
      if (checkEl) {
        checkEl.textContent = isIn ? '✓' : '+';
        checkEl.classList.toggle('in-cart', isIn);
      }
    }
  });

  const spotlightAddBtn = document.getElementById('spotlight-add-btn');
  if (spotlightAddBtn) {
    const key = spotlightAddBtn.getAttribute('data-cart-key');
    const isIn = key && state.cart.some(item => item.id === key);
    spotlightAddBtn.innerHTML = isIn ? '✓ Added' : '+ Add Deal';
    spotlightAddBtn.classList.toggle('in-cart', isIn);
  }
}

function buildOrderSummaryText() {
  if (state.cart.length === 0) return '';
  const platName = state.platform === 'windows' ? 'Windows' : 'Mac';
  const totals = calculateCartTotals();

  const lines = state.cart.map(item => {
    const bundleTag = item.type === 'bundle' ? ' (Bundle)' : '';
    return `• ${item.name}${bundleTag} - $${item.price}`;
  });

  let orderText = `FREQ Sounds List Order (${platName}):\n${lines.join('\n')}\n━━━━━━━━━━━━━━━━━━\n`;
  if (totals.hasPromo) {
    orderText += `🏷️ Promo Applied: ${totals.promoLabel}\n💰 Total: $${totals.finalTotal} (Saved $${totals.discount}!)\n`;
  } else {
    orderText += `💰 Total: $${totals.finalTotal}\n`;
  }
  return orderText;
}

async function copyOrderList() {
  if (state.cart.length === 0) return;
  const orderText = buildOrderSummaryText();

  try {
    await navigator.clipboard.writeText(orderText);
    const textEl = document.getElementById('cart-copy-text');
    const btn = document.getElementById('cart-copy-btn');
    if (textEl && btn) {
      const prev = textEl.textContent;
      textEl.textContent = '✓ Copied';
      btn.classList.add('copied');
      setTimeout(() => {
        textEl.textContent = prev;
        btn.classList.remove('copied');
      }, 2000);
    }
  } catch (e) {
    prompt('Copy your order list:', orderText);
  }
}

async function sendOrderViaDM() {
  if (state.cart.length === 0) return;
  const orderText = buildOrderSummaryText();

  try {
    await navigator.clipboard.writeText(orderText);
  } catch (e) {
    // fallback
  }

  // Open Instagram Direct Message
  window.open('https://ig.me/m/freqyt', '_blank', 'noopener,noreferrer');

  const orderTextEl = document.getElementById('cart-order-text');
  const orderBtn = document.getElementById('cart-order-btn');
  if (orderTextEl && orderBtn) {
    const prev = orderTextEl.textContent;
    orderTextEl.textContent = '✓ Copied & Opened DM!';
    orderBtn.classList.add('sent');
    setTimeout(() => {
      orderTextEl.textContent = prev;
      orderBtn.classList.remove('sent');
    }, 2500);
  }
}

// ── Main Render ──────────────────────────────────────────

function renderCatalogue() {
  const data = getData();
  const q = state.searchQuery.toLowerCase().trim();
  const main = document.getElementById('catalogue-main');
  if (!main) return;

  // Helper: Alphabetical sort for plugin items
  const sortItemsAZ = (list) => {
    if (!list) return [];
    return [...list].sort((a, b) => {
      const nameA = (typeof a === 'string' ? a : (a.name || '')).trim().toLowerCase();
      const nameB = (typeof b === 'string' ? b : (b.name || '')).trim().toLowerCase();
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  // ── 1. SEARCH MODE (Excludes Kontakt unless viewing Kontakt tab) ──
  if (q) {
    let totalVisible = 0;
    let html = '';
    const isViewingKontakt = (state.activeCategory === 'kontakt');

    Object.entries(data.categories).forEach(([catKey, cat]) => {
      // If currently on Kontakt tab, search ONLY inside Kontakt
      if (isViewingKontakt && catKey !== 'kontakt') return;
      // If on any other category, cross-search everything EXCEPT Kontakt
      if (!isViewingKontakt && catKey === 'kontakt') return;

      let catHtml = '';
      let catCount = 0;

      // Bundles
      if (cat.bundles && cat.bundles.length > 0) {
        const filtered = cat.bundles.filter(b => matchesBundleSearch(b, q));
        if (filtered.length > 0) {
          catCount += filtered.length;
          catHtml += renderSection('Bundles', filtered.map(b => renderBundleCard(b, q, catKey)).join(''), 'bundles-grid');
        }
      }

      // $40 Tier
      if (cat.tier40 && cat.tier40.length > 0) {
        const sorted = sortItemsAZ(cat.tier40);
        const filtered = sorted.filter(item => matchesSearch(item, q));
        if (filtered.length > 0) {
          catCount += filtered.length;
          catHtml += renderSection('$40 Each', filtered.map(item => renderPluginCard(item, q, '$40', catKey)).join(''), 'plugins-grid');
        }
      }

      // $30 Tier
      if (cat.tier30 && cat.tier30.length > 0) {
        const sorted = sortItemsAZ(cat.tier30);
        const filtered = sorted.filter(item => matchesSearch(item, q));
        if (filtered.length > 0) {
          catCount += filtered.length;
          catHtml += renderSection('$30 Each', filtered.map(item => renderPluginCard(item, q, '$30', catKey)).join(''), 'plugins-grid');
        }
      }

      // $20 Tier
      if (cat.tier20 && cat.tier20.length > 0) {
        const sorted = sortItemsAZ(cat.tier20);
        const filtered = sorted.filter(item => matchesSearch(item, q));
        if (filtered.length > 0) {
          catCount += filtered.length;
          catHtml += renderSection('$20 Each', filtered.map(item => renderPluginCard(item, q, '$20', catKey)).join(''), 'plugins-grid');
        }
      }

      if (catCount > 0) {
        totalVisible += catCount;
        html += `
          <div class="search-category-group">
            <div class="search-category-header">
              <span class="search-cat-icon">${getCategorySvg(catKey, cat.icon)}</span>
              <span class="search-cat-name">${cat.label}</span>
              <span class="search-cat-badge">${catCount} match${catCount === 1 ? '' : 'es'}</span>
            </div>
            ${catHtml}
          </div>
        `;
      }
    });

    if (totalVisible === 0) {
      html = `
        <div class="empty-state search-empty-state">
          <div class="search-empty-icon">✨</div>
          <h3 class="search-empty-title">Can't find "<strong>${esc(state.searchQuery)}</strong>"?</h3>
          <p class="search-empty-desc">
            I can source almost any <strong>plugin, soundbank, DAW, or software</strong>! Ask me directly and I'll get it sorted for you.
          </p>
          <div class="search-empty-actions">
            <a href="https://ig.me/m/freqyt" target="_blank" rel="noopener noreferrer" class="dm-request-btn">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              <span>DM @freqyt on Instagram to Source It</span>
            </a>
            <button class="empty-clear-btn" onclick="clearSearch()">View Full Catalogue</button>
          </div>
        </div>
      `;
    }

    main.innerHTML = html;
    updateCartUI();
    return;
  }

  // ── 2. NORMAL CATEGORY VIEW ─────────────────────────────
  const cat = data.categories[state.activeCategory];
  if (!cat) return;

  let totalVisible = 0;
  let html = '';

  // Featured Spotlight Banner (at top of main view)
  const spotlightHtml = renderSpotlightBanner();
  if (spotlightHtml) {
    html += spotlightHtml;
  }

  // ── PRESET BANKS: SEPARATE BY VST ──
  if (state.activeCategory === 'banks') {
    const allItems = [
      ...(cat.tier40 || []),
      ...(cat.tier30 || []),
      ...(cat.tier20 || [])
    ];

    // Group items by VST Synth name (e.g. "Omnisphere", "Analog Lab", "ElectraX", "Serum", "Portal", etc.)
    const vstGroups = {};
    allItems.forEach(item => {
      const n = normalizeItem(item);
      let vstName = 'Other Soundbanks';
      if (n.name.includes(' - ')) {
        vstName = n.name.split(' - ')[0].trim();
      } else if (n.tags) {
        const firstTag = n.tags.split(',')[0].trim();
        if (firstTag && !firstTag.toLowerCase().includes('bank')) vstName = firstTag;
      }
      if (!vstGroups[vstName]) vstGroups[vstName] = [];
      vstGroups[vstName].push(item);
    });

    const usedBundleNames = new Set();
    let vstCardsHtml = '';

    // Render each VST group in alphabetical order
    Object.keys(vstGroups).sort().forEach(vstName => {
      if (state.subFilter !== 'all' && state.subFilter !== vstName) return;

      const items = sortItemsAZ(vstGroups[vstName]);
      totalVisible += items.length;

      // Find matching bundle(s) for this VST
      const matchingBundles = (cat.bundles || []).filter(b => {
        const bn = (b.name || '').toLowerCase();
        const bt = (b.tags || '').toLowerCase();
        const vn = vstName.toLowerCase();
        return bn.includes(vn) || bt.includes(vn);
      });

      matchingBundles.forEach(b => usedBundleNames.add(b.name));

      let sectionInner = '';
      if (matchingBundles.length > 0) {
        sectionInner += `<div class="bundles-grid vst-card-bundles">${matchingBundles.map(b => renderBundleCard(b, '', 'banks', vstName)).join('')}</div>`;
      }
      sectionInner += `<div class="plugins-grid vst-card-plugins">${items.map(item => renderPluginCard(item, '', '$30', 'banks', vstName)).join('')}</div>`;

      vstCardsHtml += `
        <div class="vst-bank-card">
          <div class="vst-bank-card-header">
            ${getCategorySvg('banks')}
            <h4 class="vst-bank-card-title">${esc(vstName)} Banks</h4>
          </div>
          <div class="vst-bank-card-body">
            ${sectionInner}
          </div>
        </div>
      `;
    });

    html += `<div class="vst-bank-grid">${vstCardsHtml}</div>`;

    // Render any remaining global bundles that were not tied to a single VST
    if (state.subFilter === 'all') {
      const remainingBundles = (cat.bundles || []).filter(b => !usedBundleNames.has(b.name));
      if (remainingBundles.length > 0) {
        totalVisible += remainingBundles.length;
        html = renderSection('Mega Bundles & Vaults', remainingBundles.map(b => renderBundleCard(b, '', 'banks')).join(''), 'bundles-grid') + html;
      }
    }
  } else if (state.activeCategory === 'kontakt') {
    // ── KONTAKT LIBRARIES: GROUPED BY SOUND TYPE ──
    const allItems = [
      ...(cat.tier40 || []),
      ...(cat.tier30 || []),
      ...(cat.tier20 || [])
    ];

    // Bundles at top
    if (state.subFilter === 'all' && cat.bundles && cat.bundles.length > 0) {
      totalVisible += cat.bundles.length;
      html += renderSection('Featured Bundles', cat.bundles.map(b => renderBundleCard(b, '', 'kontakt')).join(''), 'bundles-grid');
    }

    const SOUND_TYPE_ORDER = [
      { key: 'Strings & Orchestral', icon: '🎻' },
      { key: 'Pianos & Keys', icon: '🎹' },
      { key: 'Guitars & Bass', icon: '🎸' },
      { key: 'Brass & Woodwinds', icon: '🎺' },
      { key: 'Vocals & Choirs', icon: '🎤' },
      { key: 'Drums & Percussion', icon: '🥁' },
      { key: 'Ethnic & World', icon: '🌍' },
      { key: 'Synths & Vintage Keys', icon: '🎛️' },
      { key: 'Cinematic & Hybrid Textures', icon: '🔮' }
    ];

    const typeGroups = {};
    SOUND_TYPE_ORDER.forEach(st => { typeGroups[st.key] = []; });
    typeGroups['Other Kontakt Instruments'] = [];

    allItems.forEach(item => {
      const n = normalizeItem(item);
      const tags = (n.tags || '').toLowerCase();
      let matched = false;
      for (const st of SOUND_TYPE_ORDER) {
        if (tags.includes(st.key.toLowerCase())) {
          typeGroups[st.key].push(item);
          matched = true;
          break;
        }
      }
      if (!matched) {
        typeGroups['Other Kontakt Instruments'].push(item);
      }
    });

    SOUND_TYPE_ORDER.concat([{ key: 'Other Kontakt Instruments', icon: '📦' }]).forEach(st => {
      if (state.subFilter !== 'all' && state.subFilter !== st.key) return;

      const items = typeGroups[st.key];
      if (items && items.length > 0) {
        const sorted = sortItemsAZ(items);
        totalVisible += sorted.length;
        html += `
          <section class="section kontakt-soundtype-section">
            <div class="section-header">
              <h3 class="section-title"><span>${st.icon}</span> ${esc(st.key)}</h3>
              <span class="section-count">${sorted.length}</span>
            </div>
            <div class="plugins-grid">${sorted.map(item => renderPluginCard(item, '', '$20', 'kontakt')).join('')}</div>
          </section>
        `;
      }
    });
  } else {
    // ── STANDARD CATEGORIES (Instruments, FX, DAWs, Software) ──
    // 1. Bundles
    if ((state.subFilter === 'all' || state.subFilter === 'bundles') && cat.bundles && cat.bundles.length > 0) {
      totalVisible += cat.bundles.length;
      html += renderSection('Bundles', cat.bundles.map(b => renderBundleCard(b, '', state.activeCategory)).join(''), 'bundles-grid');
    }

    // 2. $40 Tier
    if ((state.subFilter === 'all' || state.subFilter === 'tier40') && cat.tier40 && cat.tier40.length > 0) {
      const sorted = sortItemsAZ(cat.tier40);
      totalVisible += sorted.length;
      html += renderSection('$40 Each', sorted.map(item => renderPluginCard(item, '', '$40', state.activeCategory)).join(''), 'plugins-grid');
    }

    // 3. $30 Tier
    if ((state.subFilter === 'all' || state.subFilter === 'tier30') && cat.tier30 && cat.tier30.length > 0) {
      const sorted = sortItemsAZ(cat.tier30);
      totalVisible += sorted.length;
      html += renderSection('$30 Each', sorted.map(item => renderPluginCard(item, '', '$30', state.activeCategory)).join(''), 'plugins-grid');
    }

    // 4. $20 Tier
    if ((state.subFilter === 'all' || state.subFilter === 'tier20') && cat.tier20 && cat.tier20.length > 0) {
      const sorted = sortItemsAZ(cat.tier20);
      totalVisible += sorted.length;
      html += renderSection('$20 Each', sorted.map(item => renderPluginCard(item, '', '$20', state.activeCategory)).join(''), 'plugins-grid');
    }
  }

  // Empty State
  if (totalVisible === 0) {
    html = `
      <div class="empty-state">
        <h3>No products yet</h3>
        <p>This category has no items listed.</p>
      </div>
    `;
  }

  main.innerHTML = html;
  updateCartUI();
}

// ── Spotlight Banner Helper ──────────────────────────────

function renderSpotlightBanner() {
  // If customer is on the Kontakt Libraries tab, always display the dedicated Kontakt Volume Tier Pricing
  if (state.activeCategory === 'kontakt') {
    return `
      <div class="spotlight-wrap">
        <div class="spotlight-card spotlight-promo-card kontakt-pricing-banner">
          <div class="spotlight-top-tag">
            <span class="spotlight-badge-pill" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6);">VOLUME SAVINGS</span>
          </div>
          <div class="spotlight-body">
            <div class="spotlight-left">
              <div class="spotlight-deal-icon">🎻</div>
              <div class="spotlight-info">
                <h4 class="spotlight-title">Kontakt Volume Tier Deals</h4>
                <p class="spotlight-desc">Pick any libraries across 1,440+ instruments — volume discounts auto-apply in your cart!</p>
                <div class="spotlight-note">${INFO_SVG}<span>$40 for Kontakt 8 VST at top of list (eligible for standard plugin sales)</span></div>
              </div>
            </div>
            <div class="spotlight-right kontakt-tier-pills-wrap">
              <div class="kontakt-tier-chip"><span class="kt-label">1 Bank</span><span class="kt-price">$20</span></div>
              <div class="kontakt-tier-chip highlight"><span class="kt-label">5 Banks</span><span class="kt-price">$50</span></div>
              <div class="kontakt-tier-chip highlight"><span class="kt-label">10 Banks</span><span class="kt-price">$75</span></div>
              <div class="kontakt-tier-chip highlight"><span class="kt-label">20 Banks</span><span class="kt-price">$120</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // If customer is on the Preset Banks tab, always display the dedicated Preset Banks Volume Tier Pricing
  if (state.activeCategory === 'banks') {
    return `
      <div class="spotlight-wrap">
        <div class="spotlight-card spotlight-promo-card preset-pricing-banner">
          <div class="spotlight-top-tag">
            <span class="spotlight-badge-pill" style="background: linear-gradient(135deg, #10b981, #3b82f6);">VOLUME SAVINGS</span>
          </div>
          <div class="spotlight-body">
            <div class="spotlight-left">
              <div class="spotlight-deal-icon">🎹</div>
              <div class="spotlight-info">
                <h4 class="spotlight-title">Synth Soundbank Volume Deals</h4>
                <p class="spotlight-desc">Massive multi-bank preset vaults across Omnisphere, Analog Lab, Serum &amp; more — volume deals auto-apply in cart!</p>
                <div class="spotlight-note">${INFO_SVG}<span>Discounted complete synth vaults &amp; mega bundles available below</span></div>
              </div>
            </div>
            <div class="spotlight-right kontakt-tier-pills-wrap">
              <div class="kontakt-tier-chip highlight"><span class="kt-label">2 Volumes</span><span class="kt-price">$40</span></div>
              <div class="kontakt-tier-chip highlight"><span class="kt-label">3 Volumes</span><span class="kt-price">$50</span></div>
              <div class="kontakt-tier-chip highlight"><span class="kt-label">5 Volumes</span><span class="kt-price">$75</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const data = getData();
  const deal = data.deal;
  if (!deal || !deal.enabled) return '';

  const badgeText = deal.badge ? deal.badge.trim() : '';
  const badgeHtml = badgeText ? `<div class="spotlight-top-tag"><span class="spotlight-badge-pill">${esc(badgeText)}</span></div>` : '';
  const title = deal.title || 'Special Promotion';
  const desc = deal.description || deal.customIncludes || '';
  const note = deal.customNote ? deal.customNote.trim() : '';
  const type = deal.type || 'bundle_x_for_y';

  let rightHtml = '';
  if (type === 'spotlight_custom') {
    const price = Number(deal.customPrice) || 75;
    const cartKey = getCartItemKey('bundle', title, 'Bundle');
    const inCart = state.cart.some(item => item.id === cartKey);
    rightHtml = `
      <div class="spotlight-price">$${price}</div>
      <button
        id="spotlight-add-btn"
        class="spotlight-add-btn ${inCart ? 'in-cart' : ''}"
        data-cart-key="${esc(cartKey)}"
        onclick="toggleCartItem('bundle', '${ea(title)}', ${price}, 'Bundle', ['DEAL'], '${ea(note)}')"
      >
        ${inCart ? '✓ Added' : '+ Add Deal'}
      </button>
    `;
  } else if (type === 'bundle_x_for_y') {
    const qty = deal.bundleQty || 3;
    const price = deal.bundlePrice || 100;
    rightHtml = `
      <div class="spotlight-deal-tag">
        <span class="spotlight-deal-qty">${qty} for</span>
        <span class="spotlight-price">$${price}</span>
      </div>
      <span class="spotlight-hint">Auto-applies in cart</span>
    `;
  } else if (type === 'percent_off') {
    const pct = deal.percentOff || 20;
    rightHtml = `
      <div class="spotlight-deal-tag">
        <span class="spotlight-price">${pct}% OFF</span>
      </div>
      <span class="spotlight-hint">Auto-applies in cart</span>
    `;
  } else if (type === 'bogo') {
    const buy = deal.bogoBuyQty || 2;
    const get = deal.bogoGetQty || 1;
    rightHtml = `
      <div class="spotlight-deal-tag">
        <span class="spotlight-price">Buy ${buy} Get ${get} Free</span>
      </div>
      <span class="spotlight-hint">Auto-applies in cart</span>
    `;
  }

  return `
    <div class="spotlight-wrap">
      <div class="spotlight-card spotlight-promo-card">
        ${badgeHtml}
        <div class="spotlight-body">
          <div class="spotlight-left">
            <div class="spotlight-deal-icon">💎</div>
            <div class="spotlight-info">
              <h4 class="spotlight-title">${esc(title)}</h4>
              <p class="spotlight-desc">${esc(desc)}</p>
              ${note ? `<div class="spotlight-note">${INFO_SVG}<span>${esc(note)}</span></div>` : ''}
            </div>
          </div>
          <div class="spotlight-right">
            ${rightHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── HTML Builders ────────────────────────────────────────

function renderSection(title, innerHtml, gridClass) {
  return `
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">${esc(title)}</h3>
      </div>
      <div class="${gridClass}">
        ${innerHtml}
      </div>
    </section>
  `;
}

function renderThumbnailHtml(imageStr, isBundle = false) {
  if (!imageStr) return '';
  const clean = imageStr.trim();
  const isUrl = /^https?:\/\/|^\/|^\.\/|^data:image/i.test(clean);
  if (isUrl) {
    return `<div class="${isBundle ? 'bundle-thumb-wrap' : 'plugin-thumb-wrap'}"><img class="${isBundle ? 'bundle-thumb-img' : 'plugin-thumb-img'}" src="${esc(clean)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`;
  }
  return `<div class="${isBundle ? 'bundle-thumb-wrap' : 'plugin-thumb-wrap'}"><span class="${isBundle ? 'bundle-thumb-icon' : 'plugin-thumb-icon'}">${esc(clean)}</span></div>`;
}

const INFO_SVG = `<svg class="info-svg" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.8"></circle><line x1="8" y1="7.2" x2="8" y2="11.5"></line><circle cx="8" cy="4.5" r="0.75" fill="currentColor"></circle></svg>`;

function renderBundleCard(bundle, q, catKey = '', vstContext = '') {
  const n = normalizeBundle(bundle);
  const cartKey = getCartItemKey('bundle', n.name, 'Bundle');
  const inCart = state.cart.some(item => item.id === cartKey);
  const badgesHtml = renderBadgesHtml(n.badges);
  const thumbHtml = renderThumbnailHtml(n.image, true);
  const noteHtml = n.note ? `<span class="bundle-note-inline">${INFO_SVG}<span>${esc(n.note)}</span></span>` : '';

  // Clean title for display inside VST section (e.g. "Analog Lab Bank Suite" -> "Bank Suite")
  let displayName = n.name;
  if (vstContext && !q) {
    if (displayName.toLowerCase().startsWith(vstContext.toLowerCase() + ' ')) {
      displayName = displayName.substring(vstContext.length + 1).trim();
    }
  }

  return `
    <article
      class="bundle-card ${inCart ? 'in-cart' : ''}"
      data-cart-key="${esc(cartKey)}"
      onclick="toggleCartItem('bundle', '${ea(n.name)}', ${n.price}, 'Bundle', ${JSON.stringify(n.badges).replace(/"/g, '&quot;')}, '${ea(n.note)}')"
    >
      <div class="bundle-card-top">
        <div class="bundle-header-left">
          ${thumbHtml}
          <div class="bundle-name">${highlight(displayName, q)} ${badgesHtml}</div>
        </div>
        <div class="bundle-card-top-right">
          <div class="bundle-price">$${n.price}</div>
          <span class="cart-check-indicator ${inCart ? 'in-cart' : ''}" title="Add to Order">${inCart ? '✓' : '+'}</span>
        </div>
      </div>
      <p class="bundle-includes">${highlight(n.includes, q)} ${noteHtml}</p>
    </article>
  `;
}

function renderPluginCard(item, q, tier = '$40', catKey = '', vstContext = '') {
  const n = normalizeItem(item);
  const numPrice = (n.price !== undefined && n.price !== null && n.price !== '') ? Number(n.price) : (Number(tier.replace('$', '')) || 40);
  const displayTier = n.price !== undefined ? `$${n.price}` : tier;
  const cartKey = getCartItemKey('plugin', n.name, displayTier);
  const inCart = state.cart.some(item => item.id === cartKey);
  const badgesHtml = renderBadgesHtml(n.badges);
  const thumbHtml = renderThumbnailHtml(n.image, false);
  const noteHtml = n.note ? `<span class="plugin-note-tag">${INFO_SVG}<span>${esc(n.note)}</span></span>` : '';
  const isPricePill = catKey === 'banks' || state.activeCategory === 'banks' || catKey === 'kontakt' || state.activeCategory === 'kontakt' || n.price !== undefined;
  const priceTagHtml = isPricePill ? `<span class="plugin-price-tag">$${numPrice}</span>` : '';

  // Clean title for display inside VST section (e.g. "Analog Lab - Volume 1" -> "Volume 1")
  let displayName = n.name;
  if (vstContext && !q) {
    if (displayName.toLowerCase().startsWith(vstContext.toLowerCase() + ' - ')) {
      displayName = displayName.substring(vstContext.length + 3).trim();
    } else if (displayName.toLowerCase().startsWith(vstContext.toLowerCase() + ' ')) {
      displayName = displayName.substring(vstContext.length + 1).trim();
    }
  }

  let nameHtml = highlight(displayName, q);
  if ((catKey === 'kontakt' || state.activeCategory === 'kontakt') && n.name.includes(' - ') && !q) {
    const parts = n.name.split(' - ');
    const comp = parts[0].trim();
    const lib = parts.slice(1).join(' - ').trim();
    nameHtml = `<div class="kontakt-card-meta"><span class="kontakt-company-label">${esc(comp)}</span><span class="kontakt-lib-name">${esc(lib)}</span></div>`;
  }

  return `
    <div
      class="plugin-card ${n.note ? 'has-note' : ''} ${inCart ? 'in-cart' : ''}"
      data-cart-key="${esc(cartKey)}"
      onclick="toggleCartItem('plugin', '${ea(n.name)}', ${numPrice}, '${ea(displayTier)}', ${JSON.stringify(n.badges).replace(/"/g, '&quot;')}, '${ea(n.note)}', '${catKey || state.activeCategory}')"
    >
      <div class="plugin-card-left">
        ${thumbHtml}
        <div class="plugin-info-wrap">
          <span class="plugin-name">${nameHtml}</span>
          ${noteHtml}
        </div>
      </div>
      <div class="plugin-badges-wrap">
        ${priceTagHtml}
        ${badgesHtml}
        <span class="cart-check-indicator ${inCart ? 'in-cart' : ''}" title="Add to Order">${inCart ? '✓' : '+'}</span>
      </div>
    </div>
  `;
}

function renderBadgesHtml(badges) {
  if (!badges || !badges.length) return '';
  return badges.map(b => {
    const raw = String(b).trim();
    const slug = raw.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `<span class="badge badge-${slug}">${esc(raw)}</span>`;
  }).join(' ');
}

// ── Floating Scroll & Search Actions ─────────────────────

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  const searchBtn = document.getElementById('floating-search-btn');
  const show = window.scrollY > 150;

  if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', show);
  if (searchBtn) searchBtn.classList.toggle('visible', show);
});

// ── Initialize on Page Load ──────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
});
