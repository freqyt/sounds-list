const https = require('https');
const fs = require('fs');

function fetchUrl(url, cb) {
  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      fetchUrl(res.headers.location, cb);
    } else {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => cb(data));
    }
  });
}

fetchUrl('https://docs.google.com/spreadsheets/d/1lPI8dpTFGpEEMtUOMgxPGEFgNYAzXVaetbL29AV6W3E/edit', html => {
  fs.writeFileSync('spreadsheet_edit.html', html);
  console.log('Saved spreadsheet_edit.html, size:', html.length);
  
  // Search for sheet definitions
  // In Google Sheets, tabs are stored in bootstrap data under "sheets" or "sheetId" or "gid"
  const gids = [];
  const regex = /"(\d{5,12})"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    gids.push(match[1]);
  }
  console.log('Potential GIDs found in HTML:', [...new Set(gids)]);
});
