const fs = require('fs');

const html = fs.readFileSync('spreadsheet_edit.html', 'utf8');

// Find index of "!2 Mixed Kontakt"
const idx = html.indexOf('!2 Mixed Kontakt');
console.log('Index of !2 Mixed Kontakt in HTML:', idx);

if (idx !== -1) {
  console.log('Surrounding 400 chars:');
  console.log(html.substring(Math.max(0, idx - 200), idx + 200));
}

// Find all indices of "!2 Mixed Kontakt" in the whole file
let pos = 0;
while ((pos = html.indexOf('!2 Mixed Kontakt', pos)) !== -1) {
  console.log(`Found at pos ${pos}:`);
  console.log(html.substring(Math.max(0, pos - 150), pos + 150));
  pos += 16;
}
