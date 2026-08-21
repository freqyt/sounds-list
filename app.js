/* ═══════════════════════════════════════════════════════════
   SOUNDS LIST — MINIMAL & FAST app.js
   Features: Zero clutter, state persistence on refresh,
   instant live search, dynamic badge support & animations.
═══════════════════════════════════════════════════════════ */

let state = {
  platform: null,
  activeCategory: null,
  searchQuery: ''
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

// ── State Persistence & URL Hash ─────────────────────────

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
  renderTabs();
  renderCatalogue();
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
    searchInput.focus();
  }
  updateSearchClearBtn('');
  renderCatalogue();
}

function updateSearchClearBtn(val) {
  const btn = document.getElementById('search-clear-btn');
  if (btn) {
    btn.style.display = val ? 'inline-flex' : 'none';
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

// ── Main Render ──────────────────────────────────────────

function renderCatalogue() {
  const data = getData();
  const cat = data.categories[state.activeCategory];
  const q = state.searchQuery.toLowerCase();
  const main = document.getElementById('catalogue-main');

  let totalVisible = 0;
  let html = '';

  // Helper: Alphabetical sort for plugin items
  const sortItemsAZ = (list) => {
    if (!list) return [];
    return [...list].sort((a, b) => {
      const nameA = (typeof a === 'string' ? a : (a.name || '')).trim().toLowerCase();
      const nameB = (typeof b === 'string' ? b : (b.name || '')).trim().toLowerCase();
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  // 1. Bundles (custom manual ordering preserved)
  if (cat.bundles && cat.bundles.length > 0) {
    const filtered = cat.bundles.filter(b => matchesBundleSearch(b, q));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection('Bundles', filtered.map(b => renderBundleCard(b, q)).join(''), 'bundles-grid');
    }
  }

  // 2. $40 Tier (Always Alphabetical)
  if (cat.tier40 && cat.tier40.length > 0) {
    const sorted = sortItemsAZ(cat.tier40);
    const filtered = sorted.filter(item => matchesSearch(item, q));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection('$40 Each', filtered.map(item => renderPluginCard(item, q)).join(''), 'plugins-grid');
    }
  }

  // 3. $30 Tier (Always Alphabetical)
  if (cat.tier30 && cat.tier30.length > 0) {
    const sorted = sortItemsAZ(cat.tier30);
    const filtered = sorted.filter(item => matchesSearch(item, q));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection('$30 Each', filtered.map(item => renderPluginCard(item, q)).join(''), 'plugins-grid');
    }
  }

  // 4. $20 Tier (Always Alphabetical)
  if (cat.tier20 && cat.tier20.length > 0) {
    const sorted = sortItemsAZ(cat.tier20);
    const filtered = sorted.filter(item => matchesSearch(item, q));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection('$20 Each', filtered.map(item => renderPluginCard(item, q)).join(''), 'plugins-grid');
    }
  }

  // Empty State
  if (totalVisible === 0) {
    html = `
      <div class="empty-state">
        <h3>No results found</h3>
        <p>No products match "${esc(state.searchQuery)}" in ${esc(cat.label)}.</p>
        <button class="empty-btn" onclick="clearSearch()">Clear Search</button>
      </div>
    `;
  }

  main.innerHTML = html;
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

function renderBundleCard(bundle, q) {
  const n = normalizeBundle(bundle);
  const badgesHtml = renderBadgesHtml(n.badges);
  const thumbHtml = renderThumbnailHtml(n.image, true);
  const noteHtml = n.note ? `<div class="bundle-note">${INFO_SVG}<span>${esc(n.note)}</span></div>` : '';

  return `
    <article class="bundle-card">
      <div class="bundle-main-content">
        <div class="bundle-card-top">
          <div class="bundle-header-left">
            ${thumbHtml}
            <div class="bundle-name">${highlight(n.name, q)} ${badgesHtml}</div>
          </div>
          <div class="bundle-price">$${n.price}</div>
        </div>
        <p class="bundle-includes">${highlight(n.includes, q)}</p>
      </div>
      ${noteHtml}
    </article>
  `;
}

function renderPluginCard(item, q) {
  const n = normalizeItem(item);
  const badgesHtml = renderBadgesHtml(n.badges);
  const thumbHtml = renderThumbnailHtml(n.image, false);
  const noteHtml = n.note ? `<span class="plugin-note-tag">${INFO_SVG}<span>${esc(n.note)}</span></span>` : '';

  return `
    <div class="plugin-card ${n.note ? 'has-note' : ''}">
      <div class="plugin-card-left">
        ${thumbHtml}
        <div class="plugin-info-wrap">
          <span class="plugin-name">${highlight(n.name, q)}</span>
          ${noteHtml}
        </div>
      </div>
      <div class="plugin-badges-wrap">
        ${badgesHtml}
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

// ── Floating Scroll To Top ────────────────────────────────

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
  const btn = document.getElementById('scroll-top-btn');
  if (btn) {
    btn.classList.toggle('visible', window.scrollY > 300);
  }
});

// ── Initialize on Page Load ──────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
});
