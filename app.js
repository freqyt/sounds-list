/* ═══════════════════════════════════════════════════════════
   SOUNDS LIST — MINIMAL & FAST app.js
   Clean, distraction-free catalogue engine
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
  const badge = document.getElementById('platform-badge');
  if (badge) {
    badge.textContent = state.platform === 'windows' ? 'Windows' : 'Mac';
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

  // 1. Bundles
  if (cat.bundles && cat.bundles.length > 0) {
    const filtered = cat.bundles.filter(b => matchesBundleSearch(b, q));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection('Bundles', filtered.map(b => renderBundleCard(b, q)).join(''), 'bundles-grid', filtered.length);
    }
  }

  // 2. $40 Tier
  if (cat.tier40 && cat.tier40.length > 0) {
    const filtered = cat.tier40.filter(item => matchesSearch(item, q));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection('$40 Each', filtered.map(item => renderPluginCard(item, q)).join(''), 'plugins-grid', filtered.length);
    }
  }

  // 3. $30 Tier
  if (cat.tier30 && cat.tier30.length > 0) {
    const filtered = cat.tier30.filter(item => matchesSearch(item, q));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection('$30 Each', filtered.map(item => renderPluginCard(item, q)).join(''), 'plugins-grid', filtered.length);
    }
  }

  // 4. $20 Tier
  if (cat.tier20 && cat.tier20.length > 0) {
    const filtered = cat.tier20.filter(item => matchesSearch(item, q));
    if (filtered.length > 0) {
      totalVisible += filtered.length;
      html += renderSection('$20 Each', filtered.map(item => renderPluginCard(item, q)).join(''), 'plugins-grid', filtered.length);
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

function renderSection(title, innerHtml, gridClass, count) {
  return `
    <section class="section">
      <div class="section-header">
        <h3 class="section-title">${esc(title)}</h3>
        <span class="section-count">${count}</span>
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
  const noteHtml = n.note ? `<div class="bundle-note">⚠ ${esc(n.note)}</div>` : '';

  return `
    <article class="bundle-card">
      <div class="bundle-card-top">
        <div class="bundle-name">${highlight(n.name, q)} ${badgesHtml}</div>
        <div class="bundle-price">$${n.price}</div>
      </div>
      <p class="bundle-includes">${highlight(n.includes, q)}</p>
      ${noteHtml}
    </article>
  `;
}

function renderPluginCard(item, q) {
  const n = normalizeItem(item);
  const badgesHtml = renderBadgesHtml(n.badges);
  const noteHtml = n.note ? `<span class="note-indicator" title="${esc(n.note)}">⚠</span>` : '';

  return `
    <div class="plugin-card">
      <span class="plugin-name">${highlight(n.name, q)}</span>
      <div class="plugin-badges-wrap">
        ${badgesHtml}
        ${noteHtml}
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
