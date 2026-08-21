const fs = require('fs');

const html = fs.readFileSync('spreadsheet_edit.html', 'utf8');

// Find all matches of Tab names in the document with surrounding 80 characters
const tabNames = [
  'Sheet2', 'Kontakt', '!Kontakt Starter Pack', 'Guitar', 'Ethnic / Flute',
  'Keys / Piano', 'Drums', 'Spitfire Audio', 'Embertone', 'Vital Series',
  '8Dio', 'Sonuscore', 'THEPHONOLOOP', 'Impact Soundworks',
  '!2 Mixed Kontakt', '!1 Kontakt Library Collection', 'folders'
];

tabNames.forEach(t => {
  const idx = html.lastIndexOf(t);
  if (idx !== -1) {
    const snippet = html.substring(Math.max(0, idx - 80), Math.min(html.length, idx + 80));
    console.log(`\n=== TAB: ${t} ===`);
    console.log(snippet);
  }
});
