const fs = require('fs');

const items = JSON.parse(fs.readFileSync('all_unique_kontakt.json', 'utf8'));

// Format items for the catalog
const kontaktItems = items.map(p => {
  return {
    name: p.company !== 'Other' ? `${p.company} - ${p.name}` : p.name,
    tags: `${p.company},${p.soundType},Kontakt,Kontakt Library`,
    badges: []
  };
});

['./data/windows.js', './data/mac.js'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const varName = file.includes('windows') ? 'windowsData' : 'macData';
  const cleanJson = content.replace(/const\s+(windowsData|macData)\s*=\s*/, '').replace(/;\s*$/, '');
  const data = JSON.parse(cleanJson);
  
  data.categories.kontakt = {
    label: "Kontakt Libraries",
    icon: "",
    bundles: [
      {
        name: "Ultimate Kontakt Producer Vault",
        price: 150,
        includes: "Curated collection of 1,400+ flagship Kontakt instruments across all sound categories",
        badges: ["BEST SELLER"],
        tags: "Kontakt,All,Mega Bundle,Strings,Guitars,Keys"
      }
    ],
    tier40: kontaktItems,
    tier30: [],
    tier20: []
  };

  const newCode = `const ${varName} = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(file, newCode, 'utf8');
  console.log(`Successfully updated ${file} with ${kontaktItems.length} unique Kontakt libraries!`);
});
