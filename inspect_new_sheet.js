const https = require('https');
const fs = require('fs');

function fetchFollow(url, cb) {
  https.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      fetchFollow(res.headers.location, cb);
    } else {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => cb(data));
    }
  });
}

fetchFollow('https://docs.google.com/spreadsheets/d/148xYNSkkhFjHXcsJT93VFH-yr4oihOlC8H23V49LT6Q/export?format=csv&gid=1468254257', csv => {
  const lines = csv.split('\n').filter(l => l.trim().length > 0);
  console.log('New spreadsheet lines:', lines.length);
  console.log('--- First 30 lines ---');
  console.log(lines.slice(0, 30).join('\n'));
});
