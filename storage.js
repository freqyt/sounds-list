/* ═══════════════════════════════════════════════════════════
   storage.js — 100% Free Zero-Visitor-Quota Architecture
   Visitors load static files with 0 API requests.
   Admin commits directly to GitHub via official GitHub REST API.
═══════════════════════════════════════════════════════════ */

const STORAGE_KEYS = {
  windows:      'plcat_windows_v1',
  mac:          'plcat_mac_v1',
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

/* ── SHA-256 ───────────────────────────────────────────── */

async function sha256(message) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── GitHub Direct Cloud Publishing ───────────────────── */

function getGitHubConfig() {
  const token = localStorage.getItem(STORAGE_KEYS.githubToken) || '';
  const repo = localStorage.getItem(STORAGE_KEYS.githubRepo) || DEFAULT_REPO;
  return { token, repo };
}

function setGitHubConfig(token, repo) {
  if (token) localStorage.setItem(STORAGE_KEYS.githubToken, token.trim());
  if (repo) localStorage.setItem(STORAGE_KEYS.githubRepo, repo.trim());
}

/**
 * Commits updated windows.js and mac.js directly to GitHub master branch.
 * Vercel automatically redeploys in seconds.
 * 0 Third-Party API Limits. 100% Free Forever.
 */
async function commitToGitHub(allData) {
  const { token, repo } = getGitHubConfig();
  if (!token || !repo) throw new Error('GitHub Token not configured.');

  const branch = 'master';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  // Helper to commit a single file with fresh SHA and auto-retry
  async function updateFile(path, contentStr, commitMessage) {
    const fileUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    
    // Always fetch latest SHA with cache: 'no-store' & cache-busting timestamp
    async function getLatestSha() {
      try {
        const getRes = await fetch(`${fileUrl}?ref=${branch}&_nocache=${Date.now()}`, {
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

    // Attempt PUT
    const makePut = (fileSha) => {
      const payload = {
        message: commitMessage,
        content: base64Content,
        branch: branch
      };
      if (fileSha) payload.sha = fileSha;
      return fetch(fileUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
    };

    let putRes = await makePut(sha);

    // If 409 Conflict (stale SHA), fetch fresh SHA and retry immediately
    if (putRes.status === 409) {
      sha = await getLatestSha();
      putRes = await makePut(sha);
    }

    if (!putRes.ok) {
      const errJson = await putRes.json();
      throw new Error(errJson.message || `GitHub Error ${putRes.status}`);
    }
    return true;
  }

  // Generate serialized JS files
  const winJs = serializePlatformData('windows', allData.windows);
  const macJs = serializePlatformData('mac', allData.mac);

  // Commit both files
  await updateFile('data/windows.js', winJs, 'Update Windows catalogue via Admin Dashboard');
  await updateFile('data/mac.js', macJs, 'Update Mac catalogue via Admin Dashboard');

  return true;
}

/* ── Platform Data Layer ───────────────────────────────── */

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

/* ── Normalise Helpers ─────────────────────────────────── */

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
