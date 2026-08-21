const fs = require('fs');

const html = fs.readFileSync('spreadsheet_edit.html', 'utf8');

// Search for all patterns like [id, "... [0, 0, \"Name\"] ..."] or [id, "[..., \"id\", ... [0,0,\"Name\"]
const regex = /\[(\d+),\"\[\d+,\d+,\"?(\d+)?\"?,\[\{\"1\":\[\[0,0,\"([^\"]+)\"\]/g;
let m;
const tabs = [];
while ((m = regex.exec(html)) !== null) {
  tabs.push({
    num1: m[1],
    num2: m[2],
    name: m[3]
  });
}

console.log('--- Extracted Tab Names & GIDs ---');
console.log(JSON.stringify(tabs, null, 2));
