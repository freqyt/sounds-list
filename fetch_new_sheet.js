const https = require('https');
const fs = require('fs');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve);
      } else {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      }
    });
  });
}

async function run() {
  const editHtml = await fetchUrl('https://docs.google.com/spreadsheets/d/148xYNSkkhFjHXcsJT93VFH-yr4oihOlC8H23V49LT6Q/edit');
  fs.writeFileSync('new_sheet_edit.html', editHtml);
  console.log('Saved new_sheet_edit.html, length:', editHtml.length);

  // Search for tab names and GIDs
  // Look for docs-sheet-tab-caption
  const tabRegex = /docs-sheet-tab-caption">([^<]+)<\/div>/g;
  const tabNames = [];
  let m;
  while ((m = tabRegex.exec(editHtml)) !== null) {
    tabNames.push(m[1]);
  }
  console.log('Tab names found in UI:', tabNames);

  // Also download the active gid 1468254257
  const activeCsv = await fetchUrl('https://docs.google.com/spreadsheets/d/148xYNSkkhFjHXcsJT93VFH-yr4oihOlC8H23V49LT6Q/export?format=csv&gid=1468254257');
  fs.writeFileSync('new_sheet_active.csv', activeCsv);
  console.log('Active tab (gid 1468254257) lines:', activeCsv.split('\n').length);
  console.log('Sample lines from active tab:\n', activeCsv.split('\n').slice(0, 15).join('\n'));
}

run();
