/* ═══════════════════════════════════════════════════════════
   storage.js — Shared data layer
   Reads from localStorage (seeded from windows.js / mac.js).
   Used by both app.js (catalogue) and admin.js (dashboard).
═══════════════════════════════════════════════════════════ */

const STORAGE_KEYS = {
  windows:      'plcat_windows_v1',
  mac:          'plcat_mac_v1',
  passwordHash: 'plcat_pw_hash'
};

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

/* ── Platform data ─────────────────────────────────────── */

function getPlatformData(platform) {
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

/**
 * Normalise any item format to: { name, badges[], note }
 * Supports legacy { badge: "NEW" } and new { badges: ["NEW","HOT"] } formats,
 * as well as plain strings.
 */
function normalizeItem(item) {
  if (typeof item === 'string') return { name: item, badges: [], note: '' };
  const badges = Array.isArray(item.badges)
    ? [...item.badges]
    : (item.badge ? [item.badge] : []);
  return { name: item.name || '', badges, note: item.note || '' };
}

/**
 * Normalise a bundle to: { name, price, includes, note, badges[] }
 */
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

/* ── Serialise helpers (for export) ────────────────────── */

/** Compact an item: if no badges/note, return plain string */
function compactItem(item) {
  const n = normalizeItem(item);
  if (n.badges.length === 0 && !n.note) return n.name;
  const obj = { name: n.name };
  if (n.badges.length) obj.badges = n.badges;
  if (n.note)          obj.note   = n.note;
  return obj;
}

/** Compact a bundle object */
function compactBundle(b) {
  const n = normalizeBundle(b);
  const obj = { name: n.name, price: n.price, includes: n.includes };
  if (n.note)          obj.note   = n.note;
  if (n.badges.length) obj.badges = n.badges;
  return obj;
}

/** Produce an exportable JS string from a full platform data object */
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
