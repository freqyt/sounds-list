/* ═══════════════════════════════════════════════════════════
   storage.js — 100% Free Zero-Visitor-Quota Architecture
   Visitors load static files with 0 API requests.
   Admin commits directly to GitHub with encrypted token persistence.
═══════════════════════════════════════════════════════════ */

const STORAGE_KEYS = {
  windows:      'plcat_windows_v3',
  mac:          'plcat_mac_v3',
  passwordHash: 'plcat_pw_hash',
  githubToken:  'plcat_github_token',
  githubRepo:   'plcat_github_repo'
};

const DEFAULT_REPO = 'freqyt/sounds-list';

/* ── Password ──────────────────────────────────────────── */

function getPasswordHash() {
  return localStorage.getItem(STORAGE_KEYS.passwordHash) || CATALOGUE_CONFIG.passwordHash;
}

function setPasswordHash(hash) {
  localStorage.setItem(STORAGE_KEYS.passwordHash, hash);
}

/* ── Crypto Helpers (AES-GCM Encryption & SHA-256) ────── */

async function sha256(message) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Derive a CryptoKey from the admin password */
async function deriveKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('sounds-list-secure-salt-2026'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypt text with AES-256-GCM */
async function encryptSecret(plainText, password) {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  // Combine IV + Ciphertext in base64
  const combined = new Uint8Array(iv.length + cipherBuf.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipherBuf), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/** Decrypt text with AES-256-GCM */
async function decryptSecret(cipherBase64, password) {
  try {
    const raw = atob(cipherBase64);
    const combined = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) combined[i] = raw.charCodeAt(i);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await deriveKey(password);
    const decryptedBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    return new TextDecoder().decode(decryptedBuf);
  } catch (e) {
    return null;
  }
}

/* ── GitHub Direct Cloud Publishing ───────────────────── */

let _activeToken = '';

function getGitHubConfig() {
  const token = _activeToken || localStorage.getItem(STORAGE_KEYS.githubToken) || '';
  const repo = localStorage.getItem(STORAGE_KEYS.githubRepo) || DEFAULT_REPO;
  return { token, repo };
}

function setGitHubConfig(token, repo) {
  if (token) {
    _activeToken = token.trim();
    localStorage.setItem(STORAGE_KEYS.githubToken, token.trim());
  }
  if (repo) localStorage.setItem(STORAGE_KEYS.githubRepo, repo.trim());
}

/**
 * Commits updated files directly to GitHub master branch.
 */
async function commitToGitHub(allData) {
  const { token, repo } = getGitHubConfig();
  if (!token || !repo) throw new Error('GitHub Token not configured.');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  async function updateFileOnBranch(targetBranch, path, contentStr, commitMessage) {
    const fileUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    
    async function getLatestSha() {
      try {
        const getRes = await fetch(`${fileUrl}?ref=${targetBranch}&_nocache=${Date.now()}`, {
          headers: {
            ...headers,
            'If-None-Match': ''
          },
          cache: 'no-store'
        });
        if (getRes.ok) {
          const fileData = await getRes.json();
          return fileData.sha;
        }
      } catch(e) {}
      return null;
    }

    let sha = await getLatestSha();
    const base64Content = btoa(unescape(encodeURIComponent(contentStr)));

    const makePut = (fileSha) => {
      const payload = {
        message: commitMessage,
        content: base64Content,
        branch: targetBranch
      };
      if (fileSha) payload.sha = fileSha;
      return fetch(fileUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
    };

    let putRes = await makePut(sha);

    if (putRes.status === 409) {
      sha = await getLatestSha();
      putRes = await makePut(sha);
    }

    if (!putRes.ok && putRes.status !== 404) {
      const errJson = await putRes.json().catch(() => ({}));
      console.warn(`Branch ${targetBranch} update notice:`, errJson.message);
    }
    return putRes.ok;
  }

  const winJs = serializePlatformData('windows', allData.windows);
  const macJs = serializePlatformData('mac', allData.mac);

  for (const b of ['main', 'master']) {
    try {
      await updateFileOnBranch(b, 'data/windows.js', winJs, 'Update Windows catalogue via Admin Dashboard');
      await updateFileOnBranch(b, 'data/mac.js', macJs, 'Update Mac catalogue via Admin Dashboard');
    } catch(e) {
      console.warn(`Could not push to branch ${b}:`, e);
    }
  }

  // If encrypted token exists in config, keep config.js in sync too
  if (CATALOGUE_CONFIG.encryptedGitHubToken) {
    const cfgContent = `// Plugin Catalogue — Config\nconst CATALOGUE_CONFIG = ${JSON.stringify(CATALOGUE_CONFIG, null, 2)};\n`;
    for (const b of ['main', 'master']) {
      try {
        await updateFileOnBranch(b, 'config.js', cfgContent, 'Update configuration & encrypted token');
      } catch(e) {}
    }
  }

  return true;
}

/* ── Platform Data Layer ───────────────────────────────── */

async function fetchLiveRepoData(platform) {
  const { token, repo } = getGitHubConfig();
  if (token && repo) {
    try {
      const fileUrl = `https://api.github.com/repos/${repo}/contents/data/${platform}.js?ref=master&_t=${Date.now()}`;
      const res = await fetch(fileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        const decoded = decodeURIComponent(escape(atob(json.content.replace(/\s/g, ''))));
        const match = decoded.match(/=\s*(\{[\s\S]*\});?\s*$/);
        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
      }
    } catch(e) {
      console.warn('Could not fetch from GitHub API:', e);
    }
  }

  // Fallback: fetch raw static data with cache-buster
  try {
    const res = await fetch(`data/${platform}.js?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/=\s*(\{[\s\S]*\});?\s*$/);
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
    }
  } catch(e) {}

  return null;
}

function getPlatformData(platform) {
  // If in admin dashboard, check for local drafts
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.includes('admin');
  if (isAdmin) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS[platform]);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
  }
  return platform === 'windows' ? windowsData : macData;
}

function savePlatformData(platform, data) {
  localStorage.setItem(STORAGE_KEYS[platform], JSON.stringify(data));
}

function resetPlatformToDefault(platform) {
  localStorage.removeItem(STORAGE_KEYS[platform]);
}

/* ── Normalise & Sanitise Helpers ──────────────────────── */

function cleanReleaseName(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw;
  s = s.replace(/\[\s*rutracker[^\s\]]*\s*\]/gi, '');
  s = s.replace(/\(\s*rutracker[^\s\)]*\s*\)/gi, '');
  s = s.replace(/rutracker(-\d+|\.\w+)?/gi, '');
  s = s.replace(/\[\s*torrent[^\s\]]*\s*\]/gi, '');
  s = s.replace(/\.torrent$/gi, '');
  s = s.replace(/\[\s*(audionews|audioz|vstclub|peertracker)[^\]]*\]/gi, '');
  s = s.replace(/\[\s*\d{5,}\s*\]/g, '');
  s = s.replace(/\[\s*(R2R|V\.R|VR|dada|SYNTHiC4TE|DECiBEL|AudioP2P|MAGNETRiXX|FANTASTiC|DISCOVER|AUDiO|Repack)\s*\]/gi, '');
  s = s.replace(/\[\s*kontakt[^\s\]]*\s*\]/gi, '');
  s = s.replace(/\[\s*\d{2}\.\d{4}\s*\]/g, '');
  s = s.replace(/\s*\]\s*$/, '');
  s = s.replace(/\s*\d+\]\s*$/, '');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*-\s*$/, '').trim();
  s = s.replace(/^\s*-\s*/, '').trim();
  s = s.replace(/\s*-\s*-\s*/g, ' - ');
  return s;
}

function normalizeItem(item) {
  if (typeof item === 'string') return { name: cleanReleaseName(item), badges: [], note: '', image: '', tags: '', price: undefined };
  const badges = Array.isArray(item.badges)
    ? [...item.badges]
    : (item.badge ? [item.badge] : []);
  return {
    name: cleanReleaseName(item.name || ''),
    price: (item.price !== undefined && item.price !== null && item.price !== '') ? Number(item.price) : undefined,
    badges,
    note: item.note || '',
    image: item.image || item.icon || '',
    tags: item.tags || ''
  };
}

function normalizeBundle(b) {
  const badges = Array.isArray(b.badges)
    ? [...b.badges]
    : (b.badge ? [b.badge] : []);
  return {
    name:     cleanReleaseName(b.name || ''),
    price:    Number(b.price) || 0,
    includes: b.includes || '',
    note:     b.note     || '',
    badges,
    image:    b.image    || b.icon || '',
    tags:     b.tags     || ''
  };
}

function compactItem(item) {
  const n = normalizeItem(item);
  if (n.badges.length === 0 && !n.note && !n.image && !n.tags && n.price === undefined) return n.name;
  const obj = { name: n.name };
  if (n.price !== undefined) obj.price  = n.price;
  if (n.badges.length)       obj.badges = n.badges;
  if (n.note)                obj.note   = n.note;
  if (n.image)               obj.image  = n.image;
  if (n.tags)                obj.tags   = n.tags;
  return obj;
}

function compactBundle(b) {
  const n = normalizeBundle(b);
  const obj = { name: n.name, price: n.price, includes: n.includes };
  if (n.note)          obj.note   = n.note;
  if (n.badges.length) obj.badges = n.badges;
  if (n.image)         obj.image  = n.image;
  if (n.tags)          obj.tags   = n.tags;
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
