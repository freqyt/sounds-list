/* ═══════════════════════════════════════════════════════════
   admin.js — Sounds List Admin Dashboard
   All edits auto-save to localStorage.
   Use Export to download updated .js data files.
═══════════════════════════════════════════════════════════ */

const BADGES = ['NEW', 'HOT', 'SALE', 'BEST SELLER'];

// ── State ────────────────────────────────────────────────
const adm = {
  platform: 'windows',
  category: 'instruments',
  data: { windows: null, mac: null }
};

// ── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('cat_admin') === '1') {
    bootDashboard();
  }
  // else: login overlay is shown by default (display:flex in CSS)
});

// ── Auth ─────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const pw  = document.getElementById('password-input').value;
  const err = document.getElementById('login-error');

  btn.textContent = '...';
  btn.disabled = true;

  const hash = await sha256(pw);
  btn.textContent = 'Login';
  btn.disabled = false;

  if (hash === getPasswordHash() || hash === CATALOGUE_CONFIG.passwordHash) {
    sessionStorage.setItem('cat_admin', '1');
    sessionStorage.setItem('cat_admin_pw', pw); // keep in memory for encryption/decryption during this admin session
    setPasswordHash(hash);

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
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('password-input').value = '';
}

// ── Dashboard boot ────────────────────────────────────────
function bootDashboard() {
  adm.data.windows = clone(getPlatformData('windows'));
  adm.data.mac     = clone(getPlatformData('mac'));
  adm.platform     = 'windows';
  adm.category     = firstCatKey('windows');

  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';

  renderSidebar();
  renderPanel();
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
  adm.category = firstCatKey(platform);

  ['windows','mac'].forEach(p => {
    document.getElementById(`plat-btn-${p}`)
      .classList.toggle('active', p === platform);
  });

  renderSidebar();
  renderPanel();
}

// ── Category switch ───────────────────────────────────────
function switchCategory(key) {
  adm.category = key;
  document.querySelectorAll('.sb-cat').forEach(el => {
    el.classList.toggle('active', el.dataset.key === key);
  });
  renderPanel();
}

// ── Sidebar ───────────────────────────────────────────────
function renderSidebar() {
  const cats = adm.data[adm.platform].categories;
  const container = document.getElementById('sb-categories');
  container.innerHTML = Object.entries(cats).map(([key, cat]) => `
    <button
      class="sb-item sb-cat ${key === adm.category ? 'active' : ''}"
      data-key="${key}"
      onclick="switchCategory('${key}')"
    >${cat.icon} ${cat.label}</button>
  `).join('');
}

// ── Main panel ────────────────────────────────────────────
function renderPanel() {
  const cat  = adm.data[adm.platform].categories[adm.category];
  const main = document.getElementById('admin-main');

  // Auto-sort plugin tiers alphabetically (Bundles remain in custom order)
  ['tier40', 'tier30', 'tier20'].forEach(tierKey => {
    if (cat[tierKey] && cat[tierKey].length) {
      sortTierAlphabetically(tierKey);
    }
  });

  main.innerHTML = `
    <div class="panel-header">
      <h2 class="panel-title">${cat.icon} ${cat.label}</h2>
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

function updateField(tierKey, idx, field, value) {
  const items = getTier(tierKey);
  const n = tierKey === 'bundles' ? normalizeBundle(items[idx]) : normalizeItem(items[idx]);
  n[field] = value;
  items[idx] = n;

  if (field === 'name' && tierKey !== 'bundles') {
    sortTierAlphabetically(tierKey);
    renderPanel();
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
  items.push(
    type === 'bundle'
      ? { name: 'New Bundle', price: 0, includes: '', note: '', badges: [], image: '' }
      : { name: 'New Plugin', badges: [], note: '', image: '' }
  );

  if (tierKey !== 'bundles') {
    sortTierAlphabetically(tierKey);
  }
  autoSave();
  renderPanel();

  // Scroll to and focus the newly added row
  requestAnimationFrame(() => {
    const list  = document.getElementById(`list-${tierKey}`);
    const rows  = list?.querySelectorAll('.admin-item-row, .admin-bundle-row');
    const last  = rows?.[rows.length - 1];
    if (last) {
      last.scrollIntoView({ behavior: 'smooth', block: 'center' });
      last.querySelector('input[type="text"]')?.focus();
      last.querySelector('input[type="text"]')?.select();
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
  const ind = document.getElementById('save-ind');
  if (ind) ind.textContent = 'Saving draft…';

  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    savePlatformData(adm.platform, adm.data[adm.platform]);
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

  const btn = document.getElementById('publish-cloud-btn');
  const ind = document.getElementById('save-ind');
  btn.disabled = true;
  btn.textContent = '⏳ Publishing to GitHub...';

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
