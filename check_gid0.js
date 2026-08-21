const https = require('https');

https.get('https://docs.google.com/spreadsheets/d/1lPI8dpTFGpEEMtUOMgxPGEFgNYAzXVaetbL29AV6W3E/export?format=csv&gid=0', res => {
  let csv = '';
  res.on('data', c => csv += c);
  res.on('end', () => {
    console.log('gid=0 line count:', csv.split('\n').length);
    console.log('first 5 lines:', csv.split('\n').slice(0, 5));
  });
});
