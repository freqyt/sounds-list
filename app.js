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
  if (!query) return esc(text);
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return esc(text).replace(re, '<mark class="highlight">$1</mark>');
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

// ── Category Tabs ────────────────────────────────────────

function renderTabs() {
  const data = getData();
  const container = document.getElementById('category-tabs');
  if (!container) return;

  container.innerHTML = Object.entries(data.categories)
    .map(([key, cat]) => {
      return `
        <button
          class="cat-tab ${key === state.activeCategory ? 'active' : ''}"
          onclick="switchCategory('${key}')"
        >
          <span>${cat.icon}</span>
          <span>${cat.label}</span>
        </button>
      `;
    }).join('');
}

function switchCategory(key) {
  state.activeCategory = key;
  if (state.searchQuery) {
    clearSearch();
  } else {
    renderTabs();
    renderCatalogue();
  }
}

// ── Search Handling ──────────────────────────────────────

function handleSearch(value) {
  state.searchQuery = value.trim();
  updateSearchClearBtn(state.searchQuery);
  renderCatalogue();
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
  return (
    n.name.toLowerCase().includes(q) ||
    (n.note && n.note.toLowerCase().includes(q))
  );
}

function matchesBundleSearch(bundle, q) {
  if (!q) return true;
  const n = normalizeBundle(bundle);
  return (
    n.name.toLowerCase().includes(q) ||
    (n.includes && n.includes.toLowerCase().includes(q)) ||
    (n.note && n.note.toLowerCase().includes(q))
  );
}

// ── Interactive Cart / Order Builder & Promotion Engine ──

function getCartItemKey(type, name, tier) {
  return `${type}_${(name || '').trim()}_${tier || ''}`.toLowerCase();
}

function toggleCartItem(type, name, price, tier, badges = [], note = '') {
  const key = getCartItemKey(type, name, tier);
  const idx = state.cart.findIndex(item => item.id === key);
  if (idx >= 0) {
    state.cart.splice(idx, 1);
  } else {
    state.cart.push({
      id: key,
      type,
      name: name.trim(),
      price: Number(price) || 0,
      tier: tier || '',
      badges: Array.isArray(badges) ? badges : [],
      note: note || ''
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
  const originalTotal = state.cart.reduce((sum, item) => sum + (item.price || 0), 0);

  if (!deal || !deal.enabled || state.cart.length === 0) {
    return {
      originalTotal,
      finalTotal: originalTotal,
      discount: 0,
      promoLabel: '',
      upsellMsg: '',
      hasPromo: false
    };
  }

  let discount = 0;
  let promoLabel = '';
  let upsellMsg = '';

  // 1. Percentage Off (% Off Storewide)
  if (deal.type === 'percent_off') {
    const pct = Number(deal.percentOff) || 0;
    if (pct > 0) {
      discount = Math.round((originalTotal * pct) / 100);
      promoLabel = `${pct}% OFF Deal Applied (-$${discount})`;
      upsellMsg = `🎉 <strong>${pct}% Storewide Discount Active!</strong> You saved $${discount}`;
    }
  }

  // 2. Multi-Buy Deal (e.g. Any 3 plugins for $100)
  else if (deal.type === 'bundle_x_for_y') {
    const qty = Number(deal.bundleQty) || 3;
    const bundlePrice = Number(deal.bundlePrice) || 100;
    const eligible = state.cart.filter(item => item.type === 'plugin' || item.price <= 40);
    const bundlesCount = Math.floor(eligible.length / qty);
    const remainder = eligible.length % qty;
    const needed = qty - remainder;

    if (bundlesCount > 0) {
      const sorted = [...eligible].sort((a, b) => b.price - a.price);
      const bundledItems = sorted.slice(0, bundlesCount * qty);
      const bundledOriginalVal = bundledItems.reduce((sum, i) => sum + i.price, 0);
      const bundledPromoVal = bundlesCount * bundlePrice;
      discount = Math.max(0, bundledOriginalVal - bundledPromoVal);
      promoLabel = `${deal.title || `Any ${qty} for $${bundlePrice}`} (-$${discount})`;
    }

    if (remainder === 0 && eligible.length > 0) {
      upsellMsg = `🎉 <strong>${qty} for $${bundlePrice} Deal Unlocked!</strong> (You saved $${discount})`;
    } else if (needed === 1) {
      const currentCost = eligible.reduce((sum, i) => sum + i.price, 0) - discount;
      const nextTargetCost = (bundlesCount + 1) * bundlePrice;
      const diff = Math.max(1, nextTargetCost - currentCost);
      upsellMsg = `⚡ Add <strong>1 more product</strong> for only <strong>$${diff} more</strong> to get the ${qty} for $${bundlePrice} deal!`;
    } else if (needed > 1) {
      upsellMsg = `💡 Add <strong>${needed} more products</strong> to unlock the <strong>${qty} for $${bundlePrice}</strong> bundle deal!`;
    }
  }

  // 3. Buy X Get Y Free (BOGO)
  else if (deal.type === 'bogo') {
    const buyQty = Number(deal.bogoBuyQty) || 2;
    const getQty = Number(deal.bogoGetQty) || 1;
    const cycle = buyQty + getQty;
    const eligible = state.cart.filter(item => item.type === 'plugin' || item.price <= 40);
    const freeCount = Math.floor(eligible.length / cycle) * getQty;
    const remainder = eligible.length % cycle;

    if (freeCount > 0) {
      const sorted = [...eligible].sort((a, b) => a.price - b.price);
      const freeItems = sorted.slice(0, freeCount);
      discount = freeItems.reduce((sum, i) => sum + i.price, 0);
      promoLabel = `Buy ${buyQty} Get ${getQty} Free (-$${discount})`;
    }

    if (remainder === buyQty) {
      upsellMsg = `🎁 Add <strong>${getQty} more product</strong> to get it <strong>100% FREE</strong>!`;
    } else if (remainder > 0 && remainder < buyQty) {
      const moreNeeded = buyQty - remainder;
      upsellMsg = `🎁 Add <strong>${moreNeeded} more</strong> to qualify for a <strong>FREE product</strong>!`;
    } else if (remainder === 0 && eligible.length > 0) {
      upsellMsg = `🎉 <strong>Buy ${buyQty} Get ${getQty} Free Deal Applied!</strong> (Saved $${discount})`;
    }
  }

  const finalTotal = Math.max(0, originalTotal - discount);

  return {
    originalTotal,
    finalTotal,
    discount,
    promoLabel,
    upsellMsg,
    hasPromo: discount > 0
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

async function copyOrderList() {
  if (state.cart.length === 0) return;
  const platName = state.platform === 'windows' ? 'Windows' : 'Mac';
  const totals = calculateCartTotals();

  const lines = state.cart.map(item => {
    const tag = item.type === 'bundle' ? 'Bundle' : item.tier;
    return `• ${item.name} (${tag}) - $${item.price}`;
  });

  let orderText = `🎵 FREQ Sounds List Order (${platName}):\n${lines.join('\n')}\n━━━━━━━━━━━━━━━━━━\n`;
  if (totals.hasPromo) {
    orderText += `🏷️ Promo Applied: ${totals.promoLabel}\n💰 Total: $${totals.finalTotal} (You saved $${totals.discount}!)\n`;
  } else {
    orderText += `💰 Total: $${totals.finalTotal}\n`;
  }

  try {
    await navigator.clipboard.writeText(orderText);
    const textEl = document.getElementById('cart-copy-text');
    const btn = document.getElementById('cart-copy-btn');
    if (textEl && btn) {
      const prev = textEl.textContent;
      textEl.textContent = '✓ Copied!';
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

  // ── 1. GLOBAL SEARCH MODE (Scans Across ALL Categories) ──
  if (q) {
    let totalVisible = 0;
    let html = '';

    html += `
      <div class="search-results-banner">
        <span class="search-results-title">🔍 Search results for "<strong>${esc(state.searchQuery)}</strong>" across all categories:</span>
      </div>
    `;

    Object.entries(data.categories).forEach(([catKey, cat]) => {
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
              <span class="search-cat-icon">${cat.icon}</span>
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
        <div class="empty-state">
          <h3>No results found</h3>
          <p>No products match "${esc(state.searchQuery)}" across any category.</p>
          <button class="empty-btn" onclick="clearSearch()">Clear Search</button>
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

  // 1. Bundles (custom manual ordering preserved)
  if (cat.bundles && cat.bundles.length > 0) {
    totalVisible += cat.bundles.length;
    html += renderSection('Bundles', cat.bundles.map(b => renderBundleCard(b, '', state.activeCategory)).join(''), 'bundles-grid');
  }

  // 2. $40 Tier (Always Alphabetical)
  if (cat.tier40 && cat.tier40.length > 0) {
    const sorted = sortItemsAZ(cat.tier40);
    totalVisible += sorted.length;
    html += renderSection('$40 Each', sorted.map(item => renderPluginCard(item, '', '$40', state.activeCategory)).join(''), 'plugins-grid');
  }

  // 3. $30 Tier (Always Alphabetical)
  if (cat.tier30 && cat.tier30.length > 0) {
    const sorted = sortItemsAZ(cat.tier30);
    totalVisible += sorted.length;
    html += renderSection('$30 Each', sorted.map(item => renderPluginCard(item, '', '$30', state.activeCategory)).join(''), 'plugins-grid');
  }

  // 4. $20 Tier (Always Alphabetical)
  if (cat.tier20 && cat.tier20.length > 0) {
    const sorted = sortItemsAZ(cat.tier20);
    totalVisible += sorted.length;
    html += renderSection('$20 Each', sorted.map(item => renderPluginCard(item, '', '$20', state.activeCategory)).join(''), 'plugins-grid');
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
  const data = getData();
  const deal = data.deal;
  if (!deal || !deal.enabled) return '';

  const badgeText = deal.badge || '🔥 FEATURED DEAL';
  const title = deal.title || 'Special Promotion';
  const desc = deal.description || deal.customIncludes || '';
  const note = deal.customNote || '';
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
        <div class="spotlight-top-tag">
          <span class="spotlight-badge-pill">${esc(badgeText)}</span>
        </div>
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

  // 1. Bundles (custom manual ordering preserved)
  if (cat.bundles && cat.bundles.length > 0) {
    totalVisible += cat.bundles.length;
    html += renderSection('Bundles', cat.bundles.map(b => renderBundleCard(b, '', state.activeCategory)).join(''), 'bundles-grid');
  }

  // 2. $40 Tier (Always Alphabetical)
  if (cat.tier40 && cat.tier40.length > 0) {
    const sorted = sortItemsAZ(cat.tier40);
    totalVisible += sorted.length;
    html += renderSection('$40 Each', sorted.map(item => renderPluginCard(item, '', '$40', state.activeCategory)).join(''), 'plugins-grid');
  }

  // 3. $30 Tier (Always Alphabetical)
  if (cat.tier30 && cat.tier30.length > 0) {
    const sorted = sortItemsAZ(cat.tier30);
    totalVisible += sorted.length;
    html += renderSection('$30 Each', sorted.map(item => renderPluginCard(item, '', '$30', state.activeCategory)).join(''), 'plugins-grid');
  }

  // 4. $20 Tier (Always Alphabetical)
  if (cat.tier20 && cat.tier20.length > 0) {
    const sorted = sortItemsAZ(cat.tier20);
    totalVisible += sorted.length;
    html += renderSection('$20 Each', sorted.map(item => renderPluginCard(item, '', '$20', state.activeCategory)).join(''), 'plugins-grid');
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

function getSpotlightBundle(data) {
  if (data.categories && data.categories.instruments && data.categories.instruments.bundles) {
    const best = data.categories.instruments.bundles.find(b => {
      const n = normalizeBundle(b);
      return (n.badges || []).some(bg => String(bg).toLowerCase().includes('best'));
    });
    if (best) return normalizeBundle(best);
    if (data.categories.instruments.bundles.length > 0) {
      return normalizeBundle(data.categories.instruments.bundles[0]);
    }
  }
  return null;
}

function renderSpotlightBanner(bundle) {
  const cartKey = getCartItemKey('bundle', bundle.name, 'Bundle');
  const inCart = state.cart.some(item => item.id === cartKey);
  const thumbHtml = renderThumbnailHtml(bundle.image, true);
  const badgesHtml = renderBadgesHtml(bundle.badges);

  return `
    <div class="spotlight-wrap">
      <div class="spotlight-card ${inCart ? 'in-cart' : ''}" data-cart-key="${esc(cartKey)}">
        <div class="spotlight-top-tag">
          <span class="spotlight-badge-pill">🔥 FEATURED DEAL</span>
          ${badgesHtml}
        </div>
        <div class="spotlight-body">
          <div class="spotlight-left">
            ${thumbHtml}
            <div class="spotlight-info">
              <h4 class="spotlight-title">${esc(bundle.name)}</h4>
              <p class="spotlight-desc">${esc(bundle.includes)}</p>
              ${bundle.note ? `<div class="spotlight-note">${INFO_SVG}<span>${esc(bundle.note)}</span></div>` : ''}
            </div>
          </div>
          <div class="spotlight-right">
            <div class="spotlight-price">$${bundle.price}</div>
            <button
              id="spotlight-add-btn"
              class="spotlight-add-btn ${inCart ? 'in-cart' : ''}"
              data-cart-key="${esc(cartKey)}"
              onclick="toggleCartItem('bundle', '${ea(bundle.name)}', ${bundle.price}, 'Bundle', ${JSON.stringify(bundle.badges).replace(/"/g, '&quot;')}, '${ea(bundle.note)}')"
            >
              ${inCart ? '✓ Added' : '+ Add Deal'}
            </button>
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

function renderBundleCard(bundle, q, catKey = '') {
  const n = normalizeBundle(bundle);
  const cartKey = getCartItemKey('bundle', n.name, 'Bundle');
  const inCart = state.cart.some(item => item.id === cartKey);
  const badgesHtml = renderBadgesHtml(n.badges);
  const thumbHtml = renderThumbnailHtml(n.image, true);
  const noteHtml = n.note ? `<span class="bundle-note-inline">${INFO_SVG}<span>${esc(n.note)}</span></span>` : '';

  return `
    <article
      class="bundle-card ${inCart ? 'in-cart' : ''}"
      data-cart-key="${esc(cartKey)}"
      onclick="toggleCartItem('bundle', '${ea(n.name)}', ${n.price}, 'Bundle', ${JSON.stringify(n.badges).replace(/"/g, '&quot;')}, '${ea(n.note)}')"
    >
      <div class="bundle-card-top">
        <div class="bundle-header-left">
          ${thumbHtml}
          <div class="bundle-name">${highlight(n.name, q)} ${badgesHtml}</div>
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

function renderPluginCard(item, q, tier = '$40', catKey = '') {
  const n = normalizeItem(item);
  const cartKey = getCartItemKey('plugin', n.name, tier);
  const inCart = state.cart.some(item => item.id === cartKey);
  const badgesHtml = renderBadgesHtml(n.badges);
  const thumbHtml = renderThumbnailHtml(n.image, false);
  const noteHtml = n.note ? `<span class="plugin-note-tag">${INFO_SVG}<span>${esc(n.note)}</span></span>` : '';
  const numPrice = Number(tier.replace('$', '')) || 40;

  return `
    <div
      class="plugin-card ${n.note ? 'has-note' : ''} ${inCart ? 'in-cart' : ''}"
      data-cart-key="${esc(cartKey)}"
      onclick="toggleCartItem('plugin', '${ea(n.name)}', ${numPrice}, '${ea(tier)}', ${JSON.stringify(n.badges).replace(/"/g, '&quot;')}, '${ea(n.note)}')"
    >
      <div class="plugin-card-left">
        ${thumbHtml}
        <div class="plugin-info-wrap">
          <span class="plugin-name">${highlight(n.name, q)}</span>
          ${noteHtml}
        </div>
      </div>
      <div class="plugin-badges-wrap">
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
