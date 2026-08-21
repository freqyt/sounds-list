const fs = require('fs');

const html = fs.readFileSync('spreadsheet_edit.html', 'utf8');

// Find all occurrences of sheet-tab or sheetId or tab names
const tabRegex = /class="docs-sheet-tab[^"]*"[^>]*>([\s\S]*?)<\/td>/g;
let m;
while ((m = tabRegex.exec(html)) !== null) {
  console.log('Tab HTML snippet:', m[0]);
}

// Also check all occurrences of id="sheet-button-"
const sheetBtnRegex = /id="sheet-button-([^"]+)"/g;
while ((m = sheetBtnRegex.exec(html)) !== null) {
  console.log('Sheet button ID:', m[1]);
}

// Find all numbers followed by tab names
const anyTab = [...html.matchAll(/data-sheet-id="([^"]+)"/g)];
console.log('data-sheet-id matches:', anyTab.map(x => x[1]));
