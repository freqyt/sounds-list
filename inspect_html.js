const fs = require('fs');

const html = fs.readFileSync('spreadsheet_edit.html', 'utf8');

// Find all sheet names in bootstrap data
// Look for patterns like ["Sheet Name", 0, ...] or {name: "...", sheetId: ...}
const matches = [...html.matchAll(/\[\"([^\"]+)\",\d+,\d+,\d+,/g)];
console.log('Matches for sheet pattern:');
matches.forEach(m => console.log(m[0]));

// Search for any mention of "Kontakt" or "!2" or "Mixed"
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Mixed') || l.includes('Kontakt') || l.includes('987927484') || l.includes('sheetId')) {
    console.log(`Line ${i}:`, l.substring(0, 300));
  }
});
