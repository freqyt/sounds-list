/* ═══════════════════════════════════════════════════════════
   admin.js — Sounds List Admin Dashboard
   All edits auto-save to localStorage.
   Use Export to download updated .js data files.
═══════════════════════════════════════════════════════════ */

const BADGES = ['NEW', 'HOT', 'SALE', 'BEST SELLER'];

const CATEGORY_SVGS = {
  instruments: `<svg class="sb-cat-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:6px;"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M6 4v10"></path><path d="M10 4v10"></path><path d="M14 4v10"></path><path d="M18 4v10"></path><line x1="2" y1="14" x2="22" y2="14"></line></svg>`,
  fx: `<svg class="sb-cat-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:6px;"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
  daws: `<svg class="sb-cat-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:6px;"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><path d="M7 10l2.5-3 2.5 5 2.5-3.5 2.5 2.5"></path></svg>`,
  software: `<svg class="sb-cat-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:6px;"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`
};

function getCategorySvg(key, fallback = '') {
  const norm = String(key || '').toLowerCase().trim();
  if (norm.includes('inst') || norm.includes('piano') || norm.includes('synth')) return CATEGORY_SVGS.instruments;
  if (norm.includes('fx') || norm.includes('mix') || norm.includes('master') || norm.includes('effect')) return CATEGORY_SVGS.fx;
  if (norm.includes('daw') || norm.includes('host') || norm.includes('studio')) return CATEGORY_SVGS.daws;
  if (norm.includes('soft') || norm.includes('app') || norm.includes('tool')) return CATEGORY_SVGS.software;
  if (CATEGORY_SVGS[norm]) return CATEGORY_SVGS[norm];
  return fallback || '';
}

// ── Escape helpers ────────────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function ea(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function eh(s) {
  return esc(s);
}

// ── State ────────────────────────────────────────────────
const adm = {
  platform: 'windows',
  category: 'instruments',
  view: 'catalogue', // 'catalogue' | 'deals'
  data: { windows: null, mac: null }
};

// ── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('cat_admin') === '1' || localStorage.getItem('cat_admin_remember') === '1') {
    const savedPw = sessionStorage.getItem('cat_admin_pw') || localStorage.getItem('cat_admin_pw_saved') || 'theplug11';
    if (CATALOGUE_CONFIG.encryptedGitHubToken) {
      decryptSecret(CATALOGUE_CONFIG.encryptedGitHubToken, savedPw).then(dec => {
        if (dec) setGitHubConfig(dec, 'freqyt/sounds-list');
      });
    }
    bootDashboard();
  }
  // else: login overlay is shown by default (display:flex in CSS)
});

// ── Auth ─────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const pw  = document.getElementById('password-input').value;
  const remember = document.getElementById('remember-me')?.checked;
  const err = document.getElementById('login-error');

  btn.textContent = '...';
  btn.disabled = true;

  const hash = await sha256(pw);
  btn.textContent = 'Login';
  btn.disabled = false;

  if (hash === getPasswordHash() || hash === CATALOGUE_CONFIG.passwordHash) {
    sessionStorage.setItem('cat_admin', '1');
    sessionStorage.setItem('cat_admin_pw', pw);
    setPasswordHash(hash);

    if (remember) {
      localStorage.setItem('cat_admin_remember', '1');
      localStorage.setItem('cat_admin_pw_saved', pw);
    } else {
      localStorage.removeItem('cat_admin_remember');
      localStorage.removeItem('cat_admin_pw_saved');
    }

    // If config has an encrypted token, decrypt it into memory
    if (CATALOGUE_CONFIG.encryptedGitHubToken) {
      decryptSecret(CATALOGUE_CONFIG.encryptedGitHubToken, pw).then(dec => {
        if (dec) setGitHubConfig(dec, 'freqyt/sounds-list');
      });
    }

    err.style.display = 'none';
    bootDashboard();
  } else {
    err.style.display = 'block';
    document.getElementById('password-input').value = '';
    document.getElementById('password-input').focus();
  }
}

function handleLogout() {
  sessionStorage.removeItem('cat_admin');
  sessionStorage.removeItem('cat_admin_pw');
  localStorage.removeItem('cat_admin_remember');
  localStorage.removeItem('cat_admin_pw_saved');
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('password-input').value = '';
}

// ── Dashboard boot ────────────────────────────────────────
async function bootDashboard() {
  adm.data.windows = clone(getPlatformData('windows'));
  adm.data.mac     = clone(getPlatformData('mac'));
  adm.platform     = 'windows';
  adm.category     = firstCatKey('windows');
  adm.view         = 'catalogue';

  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';

  renderSidebar();
  renderPanel();

  // Seamlessly sync with fresh live truth from GitHub in background
  if (typeof fetchLiveRepoData === 'function') {
    try {
      const [liveWin, liveMac] = await Promise.all([
        fetchLiveRepoData('windows'),
        fetchLiveRepoData('mac')
      ]);

      let updated = false;
      if (liveWin) {
        adm.data.windows = clone(liveWin);
        savePlatformData('windows', adm.data.windows);
        updated = true;
      }
      if (liveMac) {
        adm.data.mac = clone(liveMac);
        savePlatformData('mac', adm.data.mac);
        updated = true;
      }

      if (updated) {
        renderSidebar();
        if (adm.view === 'deals') renderDealsPanel(); else renderPanel();
      }
    } catch(e) {
      console.warn('Background GitHub sync failed:', e);
    }
  }
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function firstCatKey(platform) {
  return Object.keys(adm.data[platform].categories)[0];
}

// ── Platform switch ───────────────────────────────────────
function switchPlatform(platform) {
  adm.platform = platform;
  ['windows','mac'].forEach(p => {
    document.getElementById(`plat-btn-${p}`)
      .classList.toggle('active', p === platform);
  });

  renderSidebar();
  if (adm.view === 'deals') {
    renderDealsPanel();
  } else {
    renderPanel();
  }
}

// ── Category switch ───────────────────────────────────────
function switchCategory(key) {
  adm.view = 'catalogue';
  adm.category = key;
  renderSidebar();
  renderPanel();
}

function openDealsView() {
  adm.view = 'deals';
  renderSidebar();
  renderDealsPanel();
}

// ── Sidebar ───────────────────────────────────────────────
function renderSidebar() {
  const cats = adm.data[adm.platform].categories;
  const container = document.getElementById('sb-categories');
  const dealsBtn = document.getElementById('sb-deals-btn');
  if (dealsBtn) {
    dealsBtn.classList.toggle('active', adm.view === 'deals');
  }

  container.innerHTML = Object.entries(cats).map(([key, cat]) => `
    <button
      class="sb-item sb-cat ${adm.view === 'catalogue' && key === adm.category ? 'active' : ''}"
      data-key="${key}"
      onclick="switchCategory('${key}')"
    >${getCategorySvg(key, cat.icon)} ${esc(cat.label)}</button>
  `).join('');
}

// ── Deals & Promotions Panel (Storewide Global) ───────────
function getGlobalDeal() {
  let deal = adm.data.windows?.deal || adm.data.mac?.deal;
  if (!deal) {
    deal = {
      enabled: true,
      type: 'bundle_x_for_y',
      badge: '🔥 SPECIAL DEAL',
      title: 'Any 3 Plugins for $100',
      description: 'Pick any 3 single plugins and get all 3 for just $100 total!',
      customNote: '',
      percentOff: 20,
      bundleQty: 3,
      bundlePrice: 100,
      bogoBuyQty: 2,
      bogoGetQty: 1,
      customPrice: 75,
      customIncludes: 'Omnisphere, Keyscape, Trilian + 200 Preset Banks'
    };
  }
  if (!adm.data.windows) adm.data.windows = {};
  if (!adm.data.mac) adm.data.mac = {};
  adm.data.windows.deal = deal;
  adm.data.mac.deal = deal;
  return deal;
}

function saveGlobalDeal(deal) {
  adm.data.windows.deal = clone(deal);
  adm.data.mac.deal = clone(deal);
  savePlatformData('windows', adm.data.windows);
  savePlatformData('mac', adm.data.mac);
}

function buildDealPreviewHtml(deal) {
  let previewRight = '';
  if (deal.type === 'spotlight_custom') {
    previewRight = `<div class="spotlight-price" style="font-size:1.3rem; font-weight:800; color:var(--accent);">$${deal.customPrice || 75}</div><button class="hbtn hbtn-primary">+ Add Deal</button>`;
  } else if (deal.type === 'bundle_x_for_y') {
    previewRight = `<div class="spotlight-deal-tag" style="display:flex; gap:0.35rem; align-items:baseline;"><span style="color:var(--text-2); font-weight:700;">${deal.bundleQty || 3} for</span><span style="font-size:1.3rem; font-weight:800; color:var(--accent);">$${deal.bundlePrice || 100}</span></div><span class="admin-tag">Auto-applies in cart</span>`;
  } else if (deal.type === 'percent_off') {
    previewRight = `<div class="spotlight-deal-tag"><span style="font-size:1.3rem; font-weight:800; color:var(--accent);">${deal.percentOff || 20}% OFF</span></div><span class="admin-tag">Auto-applies in cart</span>`;
  } else if (deal.type === 'bogo') {
    previewRight = `<div class="spotlight-deal-tag"><span style="font-size:1.1rem; font-weight:800; color:var(--accent);">Buy ${deal.bogoBuyQty || 2} Get ${deal.bogoGetQty || 1} Free</span></div><span class="admin-tag">Auto-applies in cart</span>`;
  }

  const badgeHtml = (deal.badge && deal.badge.trim())
    ? `<div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;"><span class="badge" style="background:linear-gradient(135deg,#ef4444,#f97316); color:#fff; font-size:0.65rem; padding:0.2rem 0.55rem; border-radius:100px;">${esc(deal.badge.trim())}</span></div>`
    : '';

  return `
    ${badgeHtml}
    <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem;">
      <div style="display:flex; align-items:center; gap:0.9rem;">
        <div style="font-size:1.8rem;">💎</div>
        <div>
          <h4 style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.2rem;">${esc(deal.title || 'Special Promotion')}</h4>
          <p style="font-size:0.84rem; color:var(--text-2); margin-bottom:0.2rem;">${esc(deal.description || 'Pick any items to claim special pricing!')}</p>
          ${deal.customNote && deal.customNote.trim() ? `<div style="font-size:0.75rem; color:var(--text-muted);">ⓘ ${esc(deal.customNote.trim())}</div>` : ''}
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:0.75rem; flex-shrink:0;">
        ${previewRight}
      </div>
    </div>
  `;
}

function renderDealsPanel() {
  const main = document.getElementById('admin-main');
  const deal = getGlobalDeal();

  let typeSpecificFields = '';

  if (deal.type === 'bundle_x_for_y') {
    typeSpecificFields = `
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Number of Plugins (Quantity)</label>
          <input type="number" min="2" max="20" class="form-input" value="${deal.bundleQty || 3}" oninput="updateDealField('bundleQty', this.value)" />
        </div>
        <div class="form-field">
          <label class="form-label">Bundle Price ($ USD)</label>
          <input type="number" min="1" max="9999" class="form-input" value="${deal.bundlePrice || 100}" oninput="updateDealField('bundlePrice', this.value)" />
        </div>
      </div>
    `;
  } else if (deal.type === 'percent_off') {
    typeSpecificFields = `
      <div class="form-field">
        <label class="form-label">Discount Percentage (% Off)</label>
        <input type="number" min="1" max="99" class="form-input" value="${deal.percentOff || 20}" oninput="updateDealField('percentOff', this.value)" />
      </div>
    `;
  } else if (deal.type === 'bogo') {
    typeSpecificFields = `
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Buy Quantity</label>
          <input type="number" min="1" max="10" class="form-input" value="${deal.bogoBuyQty || 2}" oninput="updateDealField('bogoBuyQty', this.value)" />
        </div>
        <div class="form-field">
          <label class="form-label">Get Free Quantity</label>
          <input type="number" min="1" max="10" class="form-input" value="${deal.bogoGetQty || 1}" oninput="updateDealField('bogoGetQty', this.value)" />
        </div>
      </div>
    `;
  } else if (deal.type === 'spotlight_custom') {
    typeSpecificFields = `
      <div class="form-field">
        <label class="form-label">Custom Deal Price ($ USD)</label>
        <input type="number" min="1" max="9999" class="form-input" value="${deal.customPrice || 75}" oninput="updateDealField('customPrice', this.value)" />
      </div>
    `;
  }

  main.innerHTML = `
    <div class="deals-container">
      <div class="deals-header-card">
        <div class="deals-title-row">
          <div class="deals-main-title">
            <span>⚡ Deals & Promotions Manager</span>
            <span class="admin-tag">Storewide (Windows & Mac)</span>
          </div>
          <label class="deals-toggle-wrap">
            <input type="checkbox" ${deal.enabled ? 'checked' : ''} onchange="toggleDealEnabled(this.checked)" />
            <span>${deal.enabled ? 'Promotion Active' : 'Promotion Disabled'}</span>
          </label>
        </div>
        <p class="deals-subtitle">
          Configure storefront deals, multi-buy bundles (e.g. 3 for $100), % off storewide discounts, or BOGO deals. Active promotions automatically apply to both Windows and Mac catalogues!
        </p>
      </div>

      <div class="deals-type-grid">
        <div class="deal-type-card ${deal.type === 'bundle_x_for_y' ? 'active' : ''}" onclick="setDealType('bundle_x_for_y')">
          <div class="deal-type-icon">📦</div>
          <div class="deal-type-name">Multi-Buy Bundle</div>
          <div class="deal-type-desc">e.g. Any 3 Plugins for $100. Auto-bundles in cart.</div>
        </div>

        <div class="deal-type-card ${deal.type === 'percent_off' ? 'active' : ''}" onclick="setDealType('percent_off')">
          <div class="deal-type-icon">🏷️</div>
          <div class="deal-type-name">Percentage Off</div>
          <div class="deal-type-desc">e.g. 20% OFF Storewide. Auto-discounts cart total.</div>
        </div>

        <div class="deal-type-card ${deal.type === 'bogo' ? 'active' : ''}" onclick="setDealType('bogo')">
          <div class="deal-type-icon">🎁</div>
          <div class="deal-type-name">Buy X Get Y Free</div>
          <div class="deal-type-desc">e.g. Buy 2 Get 1 Free. Lowest item becomes $0.</div>
        </div>

        <div class="deal-type-card ${deal.type === 'spotlight_custom' ? 'active' : ''}" onclick="setDealType('spotlight_custom')">
          <div class="deal-type-icon">⭐</div>
          <div class="deal-type-name">Custom Bundle Deal</div>
          <div class="deal-type-desc">Featured spotlight bundle with 1-click add button.</div>
        </div>
      </div>

      <div class="deals-form-card">
        <div class="form-grid-2">
          <div class="form-field">
            <label class="form-label">Badge Tag (Banner Pill - leave blank to hide)</label>
            <input type="text" class="form-input" value="${esc(deal.badge !== undefined && deal.badge !== null ? deal.badge : '')}" placeholder="e.g. 🔥 SPECIAL DEAL (or leave empty to hide)" oninput="updateDealField('badge', this.value)" />
          </div>
          <div class="form-field">
            <label class="form-label">Deal / Promotion Title</label>
            <input type="text" class="form-input" value="${esc(deal.title || '')}" oninput="updateDealField('title', this.value)" />
          </div>
        </div>

        <div class="form-field">
          <label class="form-label">Deal Description / Subtitle</label>
          <input type="text" class="form-input" value="${esc(deal.description || deal.customIncludes || '')}" oninput="updateDealField('description', this.value)" />
        </div>

        <div class="form-field">
          <label class="form-label">Info Note (e.g. ⓘ Includes all updates & expansion banks - leave blank to hide)</label>
          <input type="text" class="form-input" value="${esc(deal.customNote || '')}" placeholder="e.g. Includes all updates & expansion banks (or leave blank to remove)" oninput="updateDealField('customNote', this.value)" />
        </div>

        ${typeSpecificFields}

        <div class="deals-preview-wrap">
          <label class="form-label" style="margin-bottom:0.75rem; display:block;">Live Storefront Preview</label>
          <div id="deal-live-preview" style="background:linear-gradient(135deg, rgba(15,23,42,0.9), rgba(3,7,18,0.95)); border:1px solid rgba(59,130,246,0.35); border-radius:14px; padding:1.25rem;">
            ${buildDealPreviewHtml(deal)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function setDealType(type) {
  const deal = getGlobalDeal();
  deal.type = type;
  if (type === 'bundle_x_for_y' && (!deal.title || deal.title === 'Special Promotion' || deal.title.includes('%'))) {
    deal.title = `Any ${deal.bundleQty || 3} Plugins for $${deal.bundlePrice || 100}`;
    deal.description = `Pick any ${deal.bundleQty || 3} single plugins and get all ${deal.bundleQty || 3} for just $${deal.bundlePrice || 100} total!`;
  } else if (type === 'percent_off') {
    deal.title = `${deal.percentOff || 20}% OFF Storewide Flash Sale`;
    deal.description = 'Limited time discount applied automatically to your entire order at checkout!';
  } else if (type === 'bogo') {
    deal.title = `Buy ${deal.bogoBuyQty || 2} Get ${deal.bogoGetQty || 1} Free`;
    deal.description = `Add any ${(deal.bogoBuyQty || 2) + (deal.bogoGetQty || 1)} plugins to your order to get the lowest priced item free!`;
  } else if (type === 'spotlight_custom') {
    deal.title = 'Spectrasonics Bundle Deal';
    deal.description = 'Omnisphere, Keyscape, Trilian + 200 Preset Banks';
    deal.customPrice = 75;
  }
  saveGlobalDeal(deal);
  renderDealsPanel();
}

function updateDealField(field, val) {
  const deal = getGlobalDeal();
  deal[field] = val;
  saveGlobalDeal(deal);

  // Update live preview in real time without redrawing inputs:
  const previewEl = document.getElementById('deal-live-preview');
  if (previewEl) {
    previewEl.innerHTML = buildDealPreviewHtml(deal);
  }
}

function toggleDealEnabled(checked) {
  const deal = getGlobalDeal();
  deal.enabled = checked;
  saveGlobalDeal(deal);
  renderDealsPanel();
}

// ── Main panel ────────────────────────────────────────────
function renderPanel() {
  const platData = adm.data[adm.platform];
  if (!platData || !platData.categories) return;

  const cat = platData.categories[adm.category];
  const main = document.getElementById('admin-main');
  if (!cat || !main) return;

  main.innerHTML = `
    <div class="panel-header">
      <h2 class="panel-title">${getCategorySvg(adm.category, cat.icon)} ${esc(cat.label)}</h2>
      <span class="save-indicator" id="save-ind"></span>
    </div>
    ${buildSection('Bundles',   'bundles', cat.bundles  || [], 'bundle')}
    ${buildSection('$40 Each',  'tier40',  cat.tier40   || [], 'item')}
    ${buildSection('$30 Each',  'tier30',  cat.tier30   || [], 'item')}
    ${buildSection('$20 Each',  'tier20',  cat.tier20   || [], 'item')}
  `;
}

// ── Section builder ───────────────────────────────────────
function buildSection(title, tierKey, items, type) {
  const rows = items.map((item, idx) =>
    type === 'bundle'
      ? bundleRow(normalizeBundle(item), idx, tierKey)
      : itemRow(normalizeItem(item), idx, tierKey)
  ).join('');

  return `
    <div class="admin-section">
      <div class="admin-section-header">
        <span class="admin-section-title">${title}</span>
        <span class="admin-section-count">${items.length}</span>
      </div>
      <div id="list-${tierKey}">
        ${rows || '<div class="empty-list">No items yet — add one below.</div>'}
      </div>
      <button class="add-item-btn"
        onclick="addItem('${tierKey}','${type}')">
        + Add ${type === 'bundle' ? 'Bundle' : 'to ' + title}
      </button>
    </div>
  `;
}

// ── Item row ──────────────────────────────────────────────
function itemRow(item, idx, tierKey) {
  const norm = normalizeItem(item);
  return `
    <div class="admin-item-row" data-idx="${idx}">
      <input class="admin-input input-image" type="text"
        value="${ea(norm.image)}" placeholder="🖼️ Icon / URL"
        title="Icon emoji (e.g. 🎹) or image URL (https://...)"
        onchange="updateField('${tierKey}',${idx},'image',this.value)" />
      <input class="admin-input input-name" type="text"
        value="${ea(norm.name)}" placeholder="Plugin name"
        onchange="updateField('${tierKey}',${idx},'name',this.value)" />
      <input class="admin-input input-tags" type="text"
        value="${ea(norm.tags)}" placeholder="🏷️ Search tags (e.g. Adobe, DAW)"
        title="Search Keywords: customers searching these words will find this product (e.g. Adobe, Synth, Mastering)"
        onchange="updateField('${tierKey}',${idx},'tags',this.value)" />
      <div class="badge-toggles">${badgeToggles(norm.badges, idx, tierKey)}</div>
      <input class="admin-input input-note" type="text"
        value="${ea(norm.note)}" placeholder="Note (optional)"
        onchange="updateField('${tierKey}',${idx},'note',this.value)" />
      <button class="delete-btn" title="Delete item"
        onclick="deleteItem('${tierKey}',${idx})">🗑</button>
    </div>
  `;
}

// ── Bundle row (Free Re-ordering) ─────────────────────────
function bundleRow(b, idx, tierKey) {
  const norm = normalizeBundle(b);
  const total = (getTier(tierKey) || []).length;
  return `
    <div class="admin-bundle-row" data-idx="${idx}">
      <div class="bundle-row-top">
        <div class="reorder-btns">
          <button class="move-btn" title="Move Up" ${idx === 0 ? 'disabled' : ''} onclick="moveBundle(${idx}, -1)">▲</button>
          <button class="move-btn" title="Move Down" ${idx === total - 1 ? 'disabled' : ''} onclick="moveBundle(${idx}, 1)">▼</button>
        </div>
        <input class="admin-input input-image" type="text"
          value="${ea(norm.image)}" placeholder="🖼️ Icon / URL"
          title="Icon emoji (e.g. 📦) or image URL (https://...)"
          onchange="updateField('${tierKey}',${idx},'image',this.value)" />
        <input class="admin-input input-name" type="text"
          value="${ea(norm.name)}" placeholder="Bundle name"
          onchange="updateField('${tierKey}',${idx},'name',this.value)" />
        <div class="price-wrap">
          $<input class="admin-input input-price" type="number"
            value="${norm.price}" min="0" placeholder="0"
            onchange="updateField('${tierKey}',${idx},'price',Number(this.value))" />
        </div>
        <input class="admin-input input-tags" type="text"
          value="${ea(norm.tags)}" placeholder="🏷️ Search tags (e.g. Spectrasonics, Keys)"
          title="Search Keywords — customers searching these words will find this bundle"
          onchange="updateField('${tierKey}',${idx},'tags',this.value)" />
        <div class="badge-toggles">${badgeToggles(norm.badges, idx, tierKey)}</div>
        <button class="delete-btn" title="Delete bundle"
          onclick="deleteItem('${tierKey}',${idx})">🗑</button>
      </div>
      <textarea class="admin-input input-includes"
        placeholder="What's included (e.g. Plugin A, Plugin B + 200 Banks)"
        onchange="updateField('${tierKey}',${idx},'includes',this.value)"
      >${eh(norm.includes)}</textarea>
      <input class="admin-input input-note" type="text"
        value="${ea(norm.note)}" placeholder="Warning / note (optional)"
        onchange="updateField('${tierKey}',${idx},'note',this.value)" />
    </div>
  `;
}

// ── Badge toggle chips ────────────────────────────────────
function badgeToggles(activeBadges, idx, tierKey) {
  return BADGES.map(badge => {
    const isOn = activeBadges.includes(badge);
    const slug = badge.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `
      <label class="badge-toggle badge-${slug} ${isOn ? 'on' : ''}"
        title="${badge}">
        <input type="checkbox" ${isOn ? 'checked' : ''}
        onchange="toggleBadge('${tierKey}',${idx},'${badge}',this)" />
        ${badge}
      </label>
    `;
  }).join('');
}

// ── CRUD & Automatic Sorting ──────────────────────────────

function getTier(tierKey) {
  return adm.data[adm.platform].categories[adm.category][tierKey];
}

function sortTierAlphabetically(tierKey) {
  if (tierKey === 'bundles') return;
  const items = getTier(tierKey);
  if (!items || !items.length) return;
  items.sort((a, b) => {
    const nameA = (typeof a === 'string' ? a : (a.name || '')).trim().toLowerCase();
    const nameB = (typeof b === 'string' ? b : (b.name || '')).trim().toLowerCase();
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
  });
}

function sortAllPluginsAlphabetically() {
  ['windows', 'mac'].forEach(plat => {
    const data = adm.data[plat];
    if (data && data.categories) {
      Object.values(data.categories).forEach(cat => {
        ['tier40', 'tier30', 'tier20'].forEach(tierKey => {
          if (cat[tierKey] && cat[tierKey].length) {
            cat[tierKey].sort((a, b) => {
              const nameA = (typeof a === 'string' ? a : (a.name || '')).trim().toLowerCase();
              const nameB = (typeof b === 'string' ? b : (b.name || '')).trim().toLowerCase();
              return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
            });
          }
        });
      });
    }
  });
}

function moveBundle(idx, dir) {
  const bundles = getTier('bundles');
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= bundles.length) return;
  const temp = bundles[idx];
  bundles[idx] = bundles[targetIdx];
  bundles[targetIdx] = temp;
  autoSave();
  renderPanel();
}

function syncTagsToMatchingItems(productName, tags) {
  const cleanName = (productName || '').trim().toLowerCase();
  if (!cleanName) return;

  const otherPlat = adm.platform === 'windows' ? 'mac' : 'windows';
  const otherData = adm.data[otherPlat];
  if (!otherData || !otherData.categories) return;

  let matched = false;
  Object.values(otherData.categories).forEach(cat => {
    ['bundles', 'tier40', 'tier30', 'tier20'].forEach(tk => {
      if (cat[tk] && cat[tk].length) {
        cat[tk].forEach((otherItem, oIdx) => {
          const oName = (typeof otherItem === 'string' ? otherItem : otherItem.name || '').trim().toLowerCase();
          if (oName === cleanName) {
            const normOther = tk === 'bundles' ? normalizeBundle(otherItem) : normalizeItem(otherItem);
            normOther.tags = tags;
            cat[tk][oIdx] = normOther;
            matched = true;
          }
        });
      }
    });
  });

  if (matched) {
    savePlatformData(otherPlat, otherData);
  }
}

function syncAllTagsCrossPlatform() {
  const winData = adm.data.windows;
  const macData = adm.data.mac;
  if (!winData || !macData) return;

  const tagMap = new Map();

  const gatherTags = (platData) => {
    if (!platData || !platData.categories) return;
    Object.values(platData.categories).forEach(cat => {
      ['bundles', 'tier40', 'tier30', 'tier20'].forEach(tk => {
        if (cat[tk]) {
          cat[tk].forEach(item => {
            const name = (typeof item === 'string' ? item : item.name || '').trim().toLowerCase();
            const tags = (typeof item === 'object' && item.tags) ? item.tags.trim() : '';
            if (name && tags) {
              if (!tagMap.has(name) || tagMap.get(name).length < tags.length) {
                tagMap.set(name, tags);
              }
            }
          });
        }
      });
    });
  };

  gatherTags(winData);
  gatherTags(macData);

  const applyTags = (platData) => {
    if (!platData || !platData.categories) return;
    Object.values(platData.categories).forEach(cat => {
      ['bundles', 'tier40', 'tier30', 'tier20'].forEach(tk => {
        if (cat[tk]) {
          cat[tk].forEach((item, idx) => {
            const name = (typeof item === 'string' ? item : item.name || '').trim().toLowerCase();
            if (name && tagMap.has(name)) {
              const norm = tk === 'bundles' ? normalizeBundle(item) : normalizeItem(item);
              if (!norm.tags || norm.tags.trim() !== tagMap.get(name)) {
                norm.tags = tagMap.get(name);
                cat[tk][idx] = norm;
              }
            }
          });
        }
      });
    });
  };

  applyTags(winData);
  applyTags(macData);
}

function updateField(tierKey, idx, field, value) {
  const items = getTier(tierKey);
  const n = tierKey === 'bundles' ? normalizeBundle(items[idx]) : normalizeItem(items[idx]);
  n[field] = value;
  items[idx] = n;

  // Intelligently sync tags to the same product across Windows and Mac
  if (field === 'tags') {
    syncTagsToMatchingItems(n.name, value);
  }

  autoSave();
}

function toggleBadge(tierKey, idx, badge, checkbox) {
  const items = getTier(tierKey);
  const n = tierKey === 'bundles' ? normalizeBundle(items[idx]) : normalizeItem(items[idx]);

  if (checkbox.checked) {
    if (!n.badges.includes(badge)) n.badges.push(badge);
  } else {
    n.badges = n.badges.filter(b => b !== badge);
  }
  items[idx] = n;

  checkbox.parentElement.classList.toggle('on', checkbox.checked);
  autoSave();
}

function addItem(tierKey, type) {
  const items = getTier(tierKey);
  // Add new item to the bottom of the list without sorting immediately
  items.push(
    type === 'bundle'
      ? { name: 'New Bundle', price: 0, includes: '', note: '', badges: [], image: '', tags: '' }
      : { name: 'New Plugin', badges: [], note: '', image: '', tags: '' }
  );

  autoSave();
  renderPanel();

  // Scroll to and focus the newly added row at the bottom
  requestAnimationFrame(() => {
    const list  = document.getElementById(`list-${tierKey}`);
    const rows  = list?.querySelectorAll('.admin-item-row, .admin-bundle-row');
    const last  = rows?.[rows.length - 1];
    if (last) {
      last.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const nameInput = last.querySelector('.input-name');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }
  });
}

function deleteItem(tierKey, idx) {
  const items = getTier(tierKey);
  const n     = typeof items[idx] === 'string' ? items[idx] : (items[idx].name || 'this item');
  if (!confirm(`Delete "${n}"?`)) return;
  items.splice(idx, 1);
  autoSave();
  renderPanel();
}

// ── Local Auto-save (0 API Requests) ──────────────────────
let _saveTimer = null;

function autoSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    savePlatformData('windows', adm.data.windows);
    savePlatformData('mac', adm.data.mac);
    const ind2 = document.getElementById('save-ind');
    if (ind2) {
      ind2.textContent = '✓ Draft Saved (Click "Publish Live" to sync)';
      setTimeout(() => { if (ind2) ind2.textContent = ''; }, 3000);
    }
  }, 300);
}

// ── Publish Live to GitHub (0 Third-Party API Limits) ─────
async function publishLiveToCloud() {
  const { token, repo } = getGitHubConfig();
  if (!token) {
    showCloudModal();
    return;
  }

  // Intelligently sync all tags across matching products on Windows & Mac
  syncAllTagsCrossPlatform();

  // Sort all plugin tiers alphabetically across all categories before publishing
  sortAllPluginsAlphabetically();
  savePlatformData('windows', adm.data.windows);
  savePlatformData('mac', adm.data.mac);
  renderPanel();

  const btn = document.getElementById('publish-cloud-btn');
  const ind = document.getElementById('save-ind');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Publishing to GitHub...';
  }

  try {
    const success = await commitToGitHub({
      windows: adm.data.windows,
      mac: adm.data.mac
    });

    if (success) {
      if (ind) {
        ind.textContent = '🚀 Live on GitHub & Vercel!';
        setTimeout(() => { if (ind) ind.textContent = ''; }, 4000);
      }
      alert('🎉 Published to GitHub & Vercel!\n\nAll your latest changes have been committed directly to your repository.\nVercel will finish redeploying worldwide in ~10 seconds.');
    }
  } catch (err) {
    alert(`Could not publish: ${err.message}\n\nPlease check your GitHub Token in Cloud Settings.`);
  } finally {
    btn.disabled = false;
    btn.textContent = '🚀 Publish Live';
  }
}

// ── GitHub Token Modal ─────────────────────────────────────
function showCloudModal() {
  const { token, repo } = getGitHubConfig();
  document.getElementById('github-token').value = token || '';
  document.getElementById('github-repo').value = repo || 'freqyt/sounds-list';
  const statusEl = document.getElementById('cloud-status');
  statusEl.style.display = 'none';
  document.getElementById('cloud-modal').style.display = 'flex';
}

function closeCloudModal(e) {
  if (e && e.target !== document.getElementById('cloud-modal')) return;
  document.getElementById('cloud-modal').style.display = 'none';
}

async function saveGitHubConfig() {
  const tokenInput = document.getElementById('github-token').value.trim();
  const repoInput = document.getElementById('github-repo').value.trim() || 'freqyt/sounds-list';
  const btn = document.getElementById('connect-cloud-btn');
  const statusEl = document.getElementById('cloud-status');

  if (!tokenInput) {
    statusEl.textContent = 'Please enter your GitHub Personal Access Token.';
    statusEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verifying Token...';
  statusEl.style.display = 'none';

  try {
    // Verify token by making a lightweight API call to the repo
    const res = await fetch(`https://api.github.com/repos/${repoInput}`, {
      headers: {
        'Authorization': `Bearer ${tokenInput}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      throw new Error(`Invalid token or repository (HTTP ${res.status}). Ensure permission 'Contents: Read and write' is enabled.`);
    }

    setGitHubConfig(tokenInput, repoInput);

    // Encrypt token using current admin password so it is never exposed in plain text
    const currentPw = sessionStorage.getItem('cat_admin_pw') || 'theplug11';
    const encrypted = await encryptSecret(tokenInput, currentPw);
    CATALOGUE_CONFIG.encryptedGitHubToken = encrypted;

    // Immediately commit the encrypted token configuration to GitHub so it's backed up permanently
    try {
      const cfgContent = `// Plugin Catalogue — Config\nconst CATALOGUE_CONFIG = ${JSON.stringify(CATALOGUE_CONFIG, null, 2)};\n`;
      const fileUrl = `https://api.github.com/repos/${repoInput}/contents/config.js`;
      const headers = {
        'Authorization': `Bearer ${tokenInput}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };
      let sha = null;
      try {
        const getRes = await fetch(`${fileUrl}?ref=master&_t=${Date.now()}`, { headers, cache: 'no-store' });
        if (getRes.ok) {
          const fileData = await getRes.json();
          sha = fileData.sha;
        }
      } catch(e) {}
      await fetch(fileUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: 'Save encrypted GitHub token',
          content: btoa(unescape(encodeURIComponent(cfgContent))),
          branch: 'master',
          sha: sha || undefined
        })
      });
    } catch(err) {
      console.warn('Could not backup encrypted token to GitHub repo:', err);
    }

    alert('🎉 GitHub Token Verified & Encrypted!\n\nYour token has been securely encrypted with AES-256 and backed up.\nYou will never lose it, even on new devices or clear cache!');
    document.getElementById('cloud-modal').style.display = 'none';
  } catch (err) {
    statusEl.textContent = err.message || 'Verification failed. Check your token.';
    statusEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save & Connect GitHub';
  }
}

// ── Export ────────────────────────────────────────────────
function exportData(platform) {
  const content  = serializePlatformData(platform, adm.data[platform]);
  const blob     = new Blob([content], { type: 'application/javascript' });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = `${platform}.js`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Reset ─────────────────────────────────────────────────
function resetPlatform() {
  const p = adm.platform;
  if (!confirm(`Reset ${p === 'windows' ? 'Windows' : 'Mac'} catalogue to original defaults?\n\nAll your edits will be lost.`)) return;
  resetPlatformToDefault(p);
  adm.data[p] = clone(p === 'windows' ? windowsData : macData);
  savePlatformData(p, adm.data[p]);
  renderPanel();
}

// ── Password change ───────────────────────────────────────
function showChangePw() {
  document.getElementById('pw-new').value     = '';
  document.getElementById('pw-confirm').value = '';
  document.getElementById('pw-error').style.display = 'none';
  document.getElementById('pw-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('pw-new').focus(), 60);
}

function closePwModal(e) {
  if (e && e.target !== document.getElementById('pw-modal')) return;
  document.getElementById('pw-modal').style.display = 'none';
}

async function changePassword() {
  const newPw   = document.getElementById('pw-new').value;
  const confirm = document.getElementById('pw-confirm').value;
  const errEl   = document.getElementById('pw-error');

  if (!newPw || newPw.length < 4) {
    errEl.textContent = 'Password must be at least 4 characters.';
    errEl.style.display = 'block'; return;
  }
  if (newPw !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block'; return;
  }

  const hash = await sha256(newPw);
  setPasswordHash(hash);
  document.getElementById('pw-modal').style.display = 'none';
  alert('✓ Password changed successfully!');
}

// ── Escape helpers ────────────────────────────────────────
function ea(s) { // escape for attribute value
  return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function eh(s) { // escape for HTML content
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
