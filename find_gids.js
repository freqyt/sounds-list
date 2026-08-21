const fs = require('fs');

const html = fs.readFileSync('spreadsheet_edit.html', 'utf8');

// Look for bootstrap data that maps tab names to gids
// Look for strings like ["Kontakt", 987927484, ...] or similar JSON structures
const tabNames = [
  'Sheet2', 'Kontakt', '!Kontakt Starter Pack', 'Guitar', 'Ethnic / Flute',
  'Keys / Piano', 'Drums', 'Spitfire Audio', 'Embertone', 'Vital Series',
  '8Dio', 'Sonuscore', 'THEPHONOLOOP', 'Impact Soundworks',
  '!2 Mixed Kontakt', '!1 Kontakt Library Collection', 'folders'
];

console.log('--- Finding GIDs for each Tab ---');

tabNames.forEach(name => {
  const escName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Pattern 1: ["Name", gid, ...] or ["Name", "...", gid] or [gid, "Name"]
  const regex1 = new RegExp('"' + escName + '",(\\d+)', 'g');
  const regex2 = new RegExp('(\\d+),"' + escName + '"', 'g');
  const regex3 = new RegExp('"' + escName + '"[^{}\\[\\]]*?(\\d{6,12})', 'g');
  
  let match;
  let gids = [];
  while ((match = regex1.exec(html)) !== null) gids.push(match[1]);
  while ((match = regex2.exec(html)) !== null) gids.push(match[1]);
  while ((match = regex3.exec(html)) !== null) gids.push(match[1]);
  
  console.log(`Tab: "${name}" -> GIDs:`, [...new Set(gids)]);
});
