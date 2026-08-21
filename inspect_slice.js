const fs = require('fs');

const html = fs.readFileSync('spreadsheet_edit.html', 'utf8');
const slice = html.substring(275000, 290000);

// Find all occurrences of [0,0,"..."]
const regex = /\[0,0,\"([^\"]+)\"\]/g;
let m;
while ((m = regex.exec(slice)) !== null) {
  const name = m[1];
  const pre = slice.substring(Math.max(0, m.index - 50), m.index);
  console.log(`Tab: "${name}" -> Preceding snippet: ${pre}`);
}
