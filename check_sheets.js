const https = require('https');

https.get('https://docs.google.com/spreadsheets/d/1lPI8dpTFGpEEMtUOMgxPGEFgNYAzXVaetbL29AV6W3E/edit', res => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    // Look for sheet metadata in Google Sheets bootstrap data
    const matches = [...html.matchAll(/"name":"([^"]+)"[^{}]*?"sheetId":(\d+)/g)];
    if (matches.length) {
      console.log('Found sheets:');
      matches.forEach(m => console.log(' - Name:', m[1], 'gid:', m[2]));
    } else {
      console.log('No multi-sheet regex matches. Checking gid=0:');
    }
  });
});
