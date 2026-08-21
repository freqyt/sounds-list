/* ═══════════════════════════════════════════════════════════
   SOUNDS LIST — app.js
   Dynamic Audio Software Catalogue Engine
   Features: Storage integration, multi-badge filtering,
   hero search, price tags, category summaries & mobile optimization.
═══════════════════════════════════════════════════════════ */

// ── State ────────────────────────────────────────────────
let state = {
  platform: null,       // 'windows' | 'mac'
  activeCategory: null, // category key
  activeFilter: 'all',  // 'all' | 'bundle' | '40' | '30' | '20' | 'new' | 'hot' | 'sale'
  searchQuery: ''
};

// ── Helpers ──────────────────────────────────────────────

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

// ── Screen Transitions ───────────────────────────────────

const TRANSITION_DURATION = 380; // ms

function selectPlatform(platform) {
  state.platform = platform;
  const data = getData();
  state.activeCategory = Object.keys(data.categories)[0];
  state.activeFilter = 'all';
  state.searchQuery = '';

  const platformScreen = document.getElementById('platform-screen');
  const catalogueScreen = document.getElementById('catalogue-screen');

  setupCatalogue();

  // ① Animate platform screen OUT
  platformScreen.classList.add('exit-left');

  // ② Animate catalogue screen IN
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

  catalogueScreen.classList.add('exit-right');

  setTimeout(() => {
    catalogueScreen.classList.remove('active');
    platformScreen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });

    clearSearch();

    setTimeout(() => {
      catalogueScreen.classList.remove('exit-right');
    }, TRANSITION_DURATION);
  }, 60);
}

// ── Catalogue Setup ──────────────────────────────────────

function setupCatalogue() {
  // Platform Badge
  const badge = document.getElementById('platform-badge');
  badge.textContent = state.platform === 'windows' ? '🪟 Windows' : '🍎 Mac';
  badge.className = `platform-badge ${state.platform}`;

  // Reset filter chips
  document.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.filter === 'all');
  });

  // Clear search box
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  updateSearchClearBtn('');

  renderTabs();
  renderCatalogue();
  updateTotalStats();
}

function updateTotalStats() {
  const data = getData();
  let totalCount = 0;
  for (const key in data.categories) {
    const cat = data.categories[key];
    totalCount += (cat.bundles?.length || 0);
    totalCount += (cat.tier40?.length || 0);
    totalCount += (cat.tier30?.length || 0);
    totalCount += (cat.tier20?.length || 0);
  }
  const statEl = document.getElementById('mobile-stat-badge');
  if (statEl) statEl.textContent = `${totalCount} Products`;
}

// ── Tabs ─────────────────────────────────────────────────

function renderTabs() {
  const data = getData();
  const container = document.getElementById('category-tabs');
  if (!container) return;

  container.innerHTML = Object.entries(data.categories)
    .map(([key, cat]) => {
      const count = (cat.bundles?.length || 0) +
                    (cat.tier40?.length || 0) +
                    (cat.tier30?.length || 0) +
                    (cat.tier20?.length || 0);
      return `
        <button
          class="cat-tab ${key === state.activeCategory ? 'active' : ''}"
          onclick="switchCategory('${key}')"
        >
          <span class="cat-tab-icon">${cat.icon}</span>
          <span class="cat-tab-label">${cat.label}</span>
          <span class="cat-tab-count">${count}</span>
        </button>
      `;
    }).join('');
}

function switchCategory(key) {
  state.activeCategory = key;
  state.activeFilter = 'all';

  // Reset filter chips
  document.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.filter === 'all');
  });

  renderTabs();
  renderCatalogue();

  // Scroll to tabs if deep in page
  const tabsWrap = document.querySelector('.category-tabs-wrap');
  if (tabsWrap && window.scrollY > 200) {
    tabsWrap.scrollIntoView({ behavior: 'smooth' });
  }
}

// ── Filters ──────────────────────────────────────────────

function setFilter(filter, btn) {
  state.activeFilter = filter;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
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

// ── Item Matching Helper ─────────────────────────────────

function matchesFilterAndSearch(item, q, f, tierPrice) {
  const n = normalizeItem(item);

  // Filter criteria
  if (f === 'new' && !n.badges.includes('NEW')) return false;
  if (f === 'hot' && !n.badges.includes('HOT')) return false;
  if (f === 'sale' && !n.badges.includes('SALE')) return false;
  if (f === '40' && tierPrice !== '40') return false;
  if (f === '30' && tierPrice !== '30') return false;
  if (f === '20' && tierPrice !== '20') return false;
  if (f === 'bundle' && tierPrice !== 'bundle') return false;

  // Search criteria
  if (!q) return true;
  return (
    n.name.toLowerCase().includes(q) ||
    (n.note && n.note.toLowerCase().includes(q))
  );
}

function matchesBundleFilterAndSearch(bundle, q, f) {
  const n = normalizeBundle(bundle);

  if (f === 'new' && !n.badges.includes('NEW')) return false;
  if (f === 'hot' && !n.badges.includes('HOT')) return false;
  if (f === 'sale' && !n.badges.includes('SALE')) return false;
  if (f === '40' || f === '30' || f === '20') return false;

  if (!q) return true;
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
  const f = state.activeFilter;

  const main = document.getElementById('catalogue-main');
  let totalVisible = 0;
  let html = '';

  // Category Hero / Legend Banner
  html += renderCategoryHero(cat);

  // ── 1. Bundles Section
  if (cat.bundles && cat.bundles.length > 0 && f !== '40' && f !== '30' && f !== '20') {
    const filteredBundles = cat.bundles.filter(b => matchesBundleFilterAndSearch(b, q, f));
    if (filteredBundles.length > 0) {
      totalVisible += filteredBundles.length;
      html += renderSection(
        'Special Bundles',
        'Discounted Plugin Packs',
        'tag-bundle',
        'BUNDLE',
        filteredBundles.map(b => renderBundleCard(b, q)).join(''),
        'bundles-grid',
        filteredBundles.length
      );
    }
  }

  // ── 2. $40 Tier Section
  if (cat.tier40 && cat.tier40.length > 0 && f !== 'bundle' && f !== '30' && f !== '20') {
    const filtered = cat.tier40.filter(item => matchesFilterAndSearch(item, q, f, '40'));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection(
        'Tier 1 Plugins',
        '$40 Per Item',
        'tag-40',
        '$40',
        filtered.map(item => renderPluginCard(item, q, '40')).join(''),
        'plugins-grid',
        filtered.length
      );
    }
  }

  // ── 3. $30 Tier Section
  if (cat.tier30 && cat.tier30.length > 0 && f !== 'bundle' && f !== '40' && f !== '20') {
    const filtered = cat.tier30.filter(item => matchesFilterAndSearch(item, q, f, '30'));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection(
        'Tier 2 Plugins',
        '$30 Per Item',
        'tag-30',
        '$30',
        filtered.map(item => renderPluginCard(item, q, '30')).join(''),
        'plugins-grid',
        filtered.length
      );
    }
  }

  // ── 4. $20 Tier Section
  if (cat.tier20 && cat.tier20.length > 0 && f !== 'bundle' && f !== '40' && f !== '30') {
    const filtered = cat.tier20.filter(item => matchesFilterAndSearch(item, q, f, '20'));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection(
        'Tier 3 Plugins',
        '$20 Per Item',
        'tag-20',
        '$20',
        filtered.map(item => renderPluginCard(item, q, '20')).join(''),
        'plugins-grid',
        filtered.length
      );
    }
  }

  // Empty State Handling
  if (totalVisible === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No matches found in ${esc(cat.label)}</h3>
        <p>No products match "${esc(state.searchQuery || state.activeFilter)}". Try searching across other terms or reset your filters.</p>
        <button class="empty-state-btn" onclick="clearSearch(); setFilter('all', document.querySelector('.chip[data-filter=all]'));">
          Reset Search & Filters
        </button>
      </div>
    `;
  }

  main.innerHTML = html;

  // Update Search Feedback and Counts
  updateSearchMeta(totalVisible, cat.label);
}

function updateSearchMeta(count, catLabel) {
  const countEl = document.getElementById('result-count');
  const feedbackEl = document.getElementById('search-feedback');

  if (countEl) {
    countEl.textContent = count > 0 ? `${count} item${count !== 1 ? 's' : ''}` : '0 items';
  }

  if (feedbackEl) {
    if (state.searchQuery) {
      feedbackEl.textContent = `Search results for "${state.searchQuery}" in ${catLabel}`;
    } else if (state.activeFilter !== 'all') {
      feedbackEl.textContent = `Filtered by: ${state.activeFilter.toUpperCase()} in ${catLabel}`;
    } else {
      feedbackEl.textContent = `Showing all items in ${catLabel}`;
    }
  }
}

// ── HTML Builders ────────────────────────────────────────

function renderCategoryHero(cat) {
  return `
    <div class="category-hero-card">
      <div class="cat-hero-left">
        <span class="cat-hero-icon">${cat.icon}</span>
        <div>
          <h2 class="cat-hero-title">${esc(cat.label)}</h2>
          <span class="cat-hero-sub">Select items or bundles from the list below</span>
        </div>
      </div>
      <div class="pricing-legend">
        ${cat.bundles?.length ? '<span class="price-pill price-pill-bundle">📦 Bundles Available</span>' : ''}
        ${cat.tier40?.length ? '<span class="price-pill price-pill-40">$40 Tier</span>' : ''}
        ${cat.tier30?.length ? '<span class="price-pill price-pill-30">$30 Tier</span>' : ''}
        ${cat.tier20?.length ? '<span class="price-pill price-pill-20">$20 Tier</span>' : ''}
      </div>
    </div>
  `;
}

function renderSection(title, subtitle, tagClass, tagText, innerHtml, gridClass, count) {
  return `
    <section class="section">
      <div class="section-header">
        <div class="section-title-wrap">
          <span class="section-price-tag ${tagClass}">${tagText}</span>
          <h3 class="section-title">${esc(title)} — ${esc(subtitle)}</h3>
        </div>
        <div class="section-line"></div>
        <span class="section-count">${count} items</span>
      </div>
      <div class="${gridClass}">
        ${innerHtml}
      </div>
    </section>
  `;
}

function renderBundleCard(bundle, q) {
  const n = normalizeBundle(bundle);
  const badgesHtml = renderBadgesHtml(n.badges);
  const noteHtml = n.note
    ? `<div class="bundle-note">⚠ ${esc(n.note)}</div>` : '';

  return `
    <article class="bundle-card">
      <div class="bundle-card-top">
        <div class="bundle-card-header">
          <div class="bundle-name-wrap">
            <h4 class="bundle-name">${highlight(n.name, q)}</h4>
            ${badgesHtml}
          </div>
          <div class="bundle-price-badge">$${n.price}</div>
        </div>
        <p class="bundle-includes">${highlight(n.includes, q)}</p>
      </div>
      ${noteHtml}
    </article>
  `;
}

function renderPluginCard(item, q, tier) {
  const n = normalizeItem(item);
  const badgesHtml = renderBadgesHtml(n.badges);
  const noteHtml = n.note
    ? `
      <button class="plugin-note-btn" title="Important notice" tabindex="0">
        ⚠
        <div class="plugin-tooltip">${esc(n.note)}</div>
      </button>
    ` : '';

  return `
    <div class="plugin-card">
      <div class="plugin-info">
        <span class="plugin-name">${highlight(n.name, q)}</span>
        ${badgesHtml}
      </div>
      <div class="plugin-side">
        <span class="item-price-chip item-price-${tier}">$${tier}</span>
        ${noteHtml}
      </div>
    </div>
  `;
}

function renderBadgesHtml(badges) {
  if (!badges || !badges.length) return '';
  return `
    <div class="badge-group">
      ${badges.map(b => {
        const lower = String(b).toLowerCase();
        const icon = lower === 'new' ? '🔥' : lower === 'hot' ? '🔴' : lower === 'sale' ? '🏷️' : '';
        return `<span class="badge badge-${lower}">${icon} ${esc(b)}</span>`;
      }).join('')}
    </div>
  `;
}

// ── Floating Scroll To Top ────────────────────────────────

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
  const btn = document.getElementById('scroll-top-btn');
  if (btn) {
    if (window.scrollY > 350) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }
});
