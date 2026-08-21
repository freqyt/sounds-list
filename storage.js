/* ═══════════════════════════════════════════════════════════
   storage.js — Shared Data & Optimized Real-Time Cloud Layer
   Features: Smart 15-minute visitor TTL caching to conserve
   free-tier API quota, plus 1-click single-request cloud publishing.
═══════════════════════════════════════════════════════════ */

const STORAGE_KEYS = {
  windows:        'plcat_windows_v1',
  mac:            'plcat_mac_v1',
  passwordHash:   'plcat_pw_hash',
  jsonbinKey:     'plcat_jsonbin_key',
  jsonbinBinId:   'plcat_jsonbin_bin_id',
  lastCloudFetch: 'plcat_last_cloud_fetch'
};

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 Minutes Cache Window for Public Visitors

/* ── Password ──────────────────────────────────────────── */

function getPasswordHash() {
  return localStorage.getItem(STORAGE_KEYS.passwordHash) || CATALOGUE_CONFIG.passwordHash;
}

function setPasswordHash(hash) {
  localStorage.setItem(STORAGE_KEYS.passwordHash, hash);
}

/* ── SHA-256 (browser built-in) ────────────────────────── */

async function sha256(message) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Cloud Configuration ───────────────────────────────── */

function getJsonBinConfig() {
  const key = localStorage.getItem(STORAGE_KEYS.jsonbinKey) || CATALOGUE_CONFIG.jsonbin?.apiKey || '';
  const binId = localStorage.getItem(STORAGE_KEYS.jsonbinBinId) || CATALOGUE_CONFIG.jsonbin?.binId || '';
  return { key, binId };
}

function setJsonBinConfig(key, binId) {
  if (key) localStorage.setItem(STORAGE_KEYS.jsonbinKey, key.trim());
  if (binId) localStorage.setItem(STORAGE_KEYS.jsonbinBinId, binId.trim());
}

/* ── Smart Quota-Optimized Cloud Fetch ─────────────────── */

let _cloudCache = null;

async function fetchLiveCloudData(forceRefresh = false) {
  const { key, binId } = getJsonBinConfig();
  if (!binId) return null;

  const now = Date.now();
  const lastFetch = Number(localStorage.getItem(STORAGE_KEYS.lastCloudFetch) || 0);

  // 1. If within 15-minute cache TTL and not forcing, read directly from cache (0 API Requests!)
  if (!forceRefresh && (now - lastFetch < CACHE_TTL_MS)) {
    try {
      const win = localStorage.getItem(STORAGE_KEYS.windows);
      const mac = localStorage.getItem(STORAGE_KEYS.mac);
      if (win && mac) {
        _cloudCache = { windows: JSON.parse(win), mac: JSON.parse(mac) };
        return _cloudCache;
      }
    } catch(e) {}
  }

  // 2. Fetch fresh copy from JSONBin
  try {
    const headers = {};
    if (key) headers['X-Master-Key'] = key;

    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    const record = json.record;

    if (record && record.windows && record.mac) {
      _cloudCache = record;
      localStorage.setItem(STORAGE_KEYS.windows, JSON.stringify(record.windows));
      localStorage.setItem(STORAGE_KEYS.mac, JSON.stringify(record.mac));
      localStorage.setItem(STORAGE_KEYS.lastCloudFetch, String(now));
      return record;
    }
  } catch (err) {
    console.warn('Using local fallback:', err);
  }
  return null;
}

async function saveLiveCloudData(allData) {
  const { key, binId } = getJsonBinConfig();
  if (!key || !binId) return false;

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': key
      },
      body: JSON.stringify(allData)
    });
    
    if (res.ok) {
      localStorage.setItem(STORAGE_KEYS.lastCloudFetch, String(Date.now()));
    }
    return res.ok;
  } catch (err) {
    console.error('Cloud save failed:', err);
    return false;
  }
}

async function createNewJsonBin(apiKey, initialData) {
  try {
    const res = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
        'X-Bin-Name': 'Sounds List Catalogue',
        'X-Bin-Private': 'false'
      },
      body: JSON.stringify(initialData)
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const json = await res.json();
    return json.metadata?.id || null;
  } catch (err) {
    console.error('Create bin failed:', err);
    throw err;
  }
}

/* ── Platform data ─────────────────────────────────────── */

function getPlatformData(platform) {
  if (_cloudCache && _cloudCache[platform]) {
    return _cloudCache[platform];
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[platform]);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* fall through */ }
  return platform === 'windows' ? windowsData : macData;
}

function savePlatformData(platform, data) {
  localStorage.setItem(STORAGE_KEYS[platform], JSON.stringify(data));
}

function resetPlatformToDefault(platform) {
  localStorage.removeItem(STORAGE_KEYS[platform]);
}

/* ── Normalise helpers ─────────────────────────────────── */

function normalizeItem(item) {
  if (typeof item === 'string') return { name: item, badges: [], note: '' };
  const badges = Array.isArray(item.badges)
    ? [...item.badges]
    : (item.badge ? [item.badge] : []);
  return { name: item.name || '', badges, note: item.note || '' };
}

function normalizeBundle(b) {
  const badges = Array.isArray(b.badges)
    ? [...b.badges]
    : (b.badge ? [b.badge] : []);
  return {
    name:     b.name     || '',
    price:    Number(b.price) || 0,
    includes: b.includes || '',
    note:     b.note     || '',
    badges
  };
}

function compactItem(item) {
  const n = normalizeItem(item);
  if (n.badges.length === 0 && !n.note) return n.name;
  const obj = { name: n.name };
  if (n.badges.length) obj.badges = n.badges;
  if (n.note)          obj.note   = n.note;
  return obj;
}

function compactBundle(b) {
  const n = normalizeBundle(b);
  const obj = { name: n.name, price: n.price, includes: n.includes };
  if (n.note)          obj.note   = n.note;
  if (n.badges.length) obj.badges = n.badges;
  return obj;
}

function serializePlatformData(platform, data) {
  const varName = platform === 'windows' ? 'windowsData' : 'macData';
  const out = JSON.parse(JSON.stringify(data));
  for (const catKey in out.categories) {
    const cat = out.categories[catKey];
    for (const tier of ['tier40', 'tier30', 'tier20']) {
      if (cat[tier]) cat[tier] = cat[tier].map(compactItem);
    }
    if (cat.bundles) cat.bundles = cat.bundles.map(compactBundle);
  }
  return `const ${varName} = ${JSON.stringify(out, null, 2)};\n`;
}
