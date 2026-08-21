const https = require('https');

function fetchFollow(url, cb) {
  https.get(url, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      fetchFollow(res.headers.location, cb);
    } else {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => cb(data));
    }
  });
}

fetchFollow('https://docs.google.com/spreadsheets/d/1lPI8dpTFGpEEMtUOMgxPGEFgNYAzXVaetbL29AV6W3E/export?format=csv&gid=0', data => {
  console.log('--- GID 0 FULL CONTENTS ---');
  console.log(data);
});
