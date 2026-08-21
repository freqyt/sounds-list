const https = require('https');
const fs = require('fs');

const TABS = [
  { name: '!2 Mixed Kontakt', gid: '27617380' },
  { name: '!1 Kontakt Library Collection', gid: '1167512856' },
  { name: '!Kontakt Starter Pack', gid: '1915126199' },
  { name: 'Guitar', gid: '1196018356' },
  { name: 'Ethnic / Flute', gid: '1327242256' },
  { name: 'Keys / Piano', gid: '1395412626' },
  { name: 'Drums', gid: '223509802' },
  { name: 'Spitfire Audio', gid: '295139510' },
  { name: 'Embertone', gid: '544060365' },
  { name: 'Vital Series', gid: '170496853' },
  { name: '8Dio', gid: '336350526' },
  { name: 'Sonuscore', gid: '1190034288' },
  { name: 'THEPHONOLOOP', gid: '1351273787' },
  { name: 'Impact Soundworks', gid: '465899058' },
  { name: 'Kontakt', gid: '987927484' },
  { name: 'Sheet2', gid: '1731019889' }
];

function fetchTab(tab) {
  return new Promise((resolve) => {
    const url = `https://docs.google.com/spreadsheets/d/1lPI8dpTFGpEEMtUOMgxPGEFgNYAzXVaetbL29AV6W3E/export?format=csv&gid=${tab.gid}`;
    function doGet(fetchUrl) {
      https.get(fetchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doGet(res.headers.location);
        } else {
          let csv = '';
          res.on('data', c => csv += c);
          res.on('end', () => {
            const rows = csv.split('\n').filter(r => r.includes('drive.google.com') || (r.length > 5 && !r.startsWith('Title') && !r.startsWith(',Title')));
            console.log(`Downloaded "${tab.name}" (gid: ${tab.gid}) -> ${rows.length} rows`);
            resolve({ tab: tab.name, csv, rows });
          });
        }
      });
    }
    doGet(url);
  });
}

async function run() {
  console.log('Fetching all 16 data tabs from Google Sheets...');
  const allResults = [];
  for (const tab of TABS) {
    const res = await fetchTab(tab);
    allResults.push(res);
  }
  fs.writeFileSync('all_tabs_raw.json', JSON.stringify(allResults, null, 2));
  console.log('\nAll tabs downloaded and saved to all_tabs_raw.json!');
}

run();
