const fs = require('fs');

const allData = JSON.parse(fs.readFileSync('all_tabs_raw.json', 'utf8'));

const KNOWN_COMPANIES = [
  '8Dio', 'Acousticsamples', 'Audio Imperia', 'Audiobro', 'Audiority', 'Beastsamples', 'Best Service',
  'Big Fish Audio', 'Bolder Sounds', 'Boom Library', 'Cinesamples', 'Cinematic Studio Series', 'Cinematic Studio',
  'Cinematic Samples Pty', 'Chris Hein', 'Crypto Cipher', 'Dan Keen', 'Dezert Audio', 'E-MU',
  'East West Quantum Leap', 'EastWest', 'Edu Prado Sounds', 'Embertone', 'Epic SoundLab', 'Evolution Series',
  'Fluffy Audio', 'Fracture Sounds', 'FrozenPlain', 'Genesis', 'Glitchmachines', 'Gothic Instruments',
  'Heavyocity', 'Hideaway Studio', 'Ilya Efimov', 'Impact Soundworks', 'Indiginus', 'ISW',
  'Junior Porciuncula', 'Karanyi Sounds', 'Keepforest', 'Loot Audio', 'Loops de la Crème',
  'Muze', 'Musical Sampling', 'Native Instruments', 'NI', 'norCtrack', 'Orange Tree Samples', 'Output',
  'Performance Samples', 'Plugin Guru', 'PresentDayProduction', 'ProjectSAM', 'Pulse Percussion',
  'Rast Sound', 'Realitone', 'Rigid Audio', 'Sample Logic', 'SampleHero', 'Samplephonics', 'Sampletekk',
  'Sampleism', 'Scarbee', 'Silence And Other Sounds', 'Skybox Audio', 'Slate + Ash Orchestral Tools',
  'Slate + Ash', 'Sonic Faction', 'Soniccouture', 'Sonica Instruments', 'Sonicsmiths aka Cinesamples',
  'Sonicsmiths', 'Sonokinetic', 'Sonuscore', 'Sound Dust', 'Soundiron', 'Spitfire Audio', 'Spitfire',
  'Steven Slate Drums', 'Straight Ahead Samples', 'Strezov Sampling', 'Synthonic Audio', 'Tapeloops',
  'Teletone Audio', 'The Cargo Cult', 'The Unfinished', 'ThePhonoLoop', 'Tom Cosm', 'Ueberschall',
  'UJAM', 'Versilian Studios', 'Vicious Antelope', 'Vir2 Instruments', 'Vir2', 'Vital Series',
  'VST Buzz', 'Waldorf', 'Wave Alchemy', 'Wavelet Audio', 'Wavesfactory', 'Westwood Instruments',
  'Wrongtools', 'Zero-G', 'e-instruments'
];

function cleanItem(rawTitle) {
  let s = rawTitle.trim();
  // Strip leading quotes/commas
  s = s.replace(/^[,"]+|[,"]+$/g, '').trim();
  // Strip extensions
  s = s.replace(/\.(zip|torrent|rar|7z|iso|pkg|exe)$/i, '').trim();
  // Strip (KONTAKT), [KONTAKT], etc.
  s = s.replace(/[\(\[\{]\s*kontakt[^\)\]\}]*[\)\]\}]/gi, '').trim();
  // Strip part numbers
  s = s.replace(/\s*part\s*[-_]?\s*\d+/gi, '').trim();
  s = s.replace(/\s+cd\s*\d+/gi, '').trim();
  // Strip version numbers like v1.0.2, 1.3.0 Full + Update, etc.
  s = s.replace(/\s+v?\.?\d+(\.\d+)+(\w*)?(\s*(Full\s*\+\s*Update|Update|Full|FIXED|FiXED|MAC|WIN))?/gi, '').trim();
  s = s.replace(/\s+(KP2|KP3|KP4|KP5|KP6|KP7)$/i, '').trim();
  s = s.replace(/\s+Full\s*\+\s*Update$/i, '').trim();
  s = s.replace(/\s+Update$/i, '').trim();

  let company = '';
  let name = s;

  // Try matching known company prefix with dash, colon, or space
  for (const comp of KNOWN_COMPANIES) {
    const pattern = new RegExp('^' + comp.replace(/[+*?^${}()|[\]\\]/g, '\\$&') + '\\s*[-–—:]\\s*', 'i');
    if (pattern.test(s)) {
      company = comp;
      name = s.replace(pattern, '').trim();
      break;
    }
  }

  if (!company) {
    for (const comp of KNOWN_COMPANIES) {
      if (s.toLowerCase().startsWith(comp.toLowerCase() + ' ')) {
        company = comp;
        name = s.substring(comp.length).trim();
        break;
      }
    }
  }

  if (!company && s.includes(' - ')) {
    const parts = s.split(' - ');
    company = parts[0].trim();
    name = parts.slice(1).join(' - ').trim();
  }

  // Canonicalize company names
  if (company.toLowerCase().includes('spitfire')) company = 'Spitfire Audio';
  if (company.toLowerCase().includes('slate + ash')) company = 'Slate + Ash';
  if (company.toLowerCase().includes('cinematic studio')) company = 'Cinematic Studio Series';
  if (company.toLowerCase().includes('east west') || company.toLowerCase().includes('eastwest')) company = 'EastWest';
  if (company.toLowerCase().includes('cinesamples')) company = 'Cinesamples';
  if (company.toLowerCase() === 'ni' || company.toLowerCase() === 'native instrument') company = 'Native Instruments';
  if (company.toLowerCase().includes('phonoloop')) company = 'ThePhonoLoop';
  if (company.toLowerCase() === 'isw') company = 'Impact Soundworks';

  name = name.replace(/^[-–—:\s]+/, '').trim();

  // Categorize by sound type
  const lstr = (name + ' ' + (company || '')).toLowerCase();
  let category = 'Cinematic & Hybrid Textures';

  if (lstr.includes('piano') || lstr.includes('keys') || lstr.includes('korg') || lstr.includes('upright') || lstr.includes('grand') || lstr.includes('rhodes') || lstr.includes('themk') || lstr.includes('clav') || lstr.includes('celesta') || lstr.includes('harpsichord')) {
    category = 'Pianos & Keys';
  } else if (lstr.includes('string') || lstr.includes('orchestr') || lstr.includes('cello') || lstr.includes('violin') || lstr.includes('viola') || lstr.includes('fiddle') || lstr.includes('adagio') || lstr.includes('chamber') || lstr.includes('quartet') || lstr.includes('ensemble') || lstr.includes('appassionata') || lstr.includes('mural') || lstr.includes('albion') || lstr.includes('symphon')) {
    category = 'Strings & Orchestral';
  } else if (lstr.includes('guitar') || lstr.includes('bass') || lstr.includes('hinterland') || lstr.includes('dracus') || lstr.includes('stratosphere') || lstr.includes('getlow') || lstr.includes('strum') || lstr.includes('pick') || lstr.includes('telecaster') || lstr.includes('acoustic') || lstr.includes('nylon')) {
    category = 'Guitars & Bass';
  } else if (lstr.includes('brass') || lstr.includes('horn') || lstr.includes('sax') || lstr.includes('woodwind') || lstr.includes('flute') || lstr.includes('whistle') || lstr.includes('forzo') || lstr.includes('trumpet') || lstr.includes('trombone') || lstr.includes('tuba') || lstr.includes('clarinet') || lstr.includes('oboe')) {
    category = 'Brass & Woodwinds';
  } else if (lstr.includes('choir') || lstr.includes('vocal') || lstr.includes('glaze') || lstr.includes('mystica') || lstr.includes('voices') || lstr.includes('sway') || lstr.includes('requiem') || lstr.includes('cantus') || lstr.includes('altus') || lstr.includes('shevannai')) {
    category = 'Vocals & Choirs';
  } else if (lstr.includes('drum') || lstr.includes('percuss') || lstr.includes('hans zimmer percuss') || lstr.includes('berserkr') || lstr.includes('taiko') || lstr.includes('strike') || lstr.includes('damage') || lstr.includes('batterie') || lstr.includes('snare') || lstr.includes('kick')) {
    category = 'Drums & Percussion';
  } else if (lstr.includes('ethnic') || lstr.includes('ireland') || lstr.includes('west africa') || lstr.includes('arabian') || lstr.includes('harp') || lstr.includes('koto') || lstr.includes('ukulele') || lstr.includes('erhu') || lstr.includes('duduk') || lstr.includes('guzheng') || lstr.includes('sitar') || lstr.includes('bamboo') || lstr.includes('world')) {
    category = 'Ethnic & World';
  } else if (lstr.includes('synth') || lstr.includes('planet phatt') || lstr.includes('orbit') || lstr.includes('saw') || lstr.includes('analog tales') || lstr.includes('analog nightmares') || lstr.includes('moog') || lstr.includes('jupiter') || lstr.includes('juno') || lstr.includes('prophet') || lstr.includes('oberheim') || lstr.includes('modular')) {
    category = 'Synths & Vintage Keys';
  }

  return {
    raw: rawTitle,
    company: company || 'Other',
    name: name || rawTitle,
    soundType: category
  };
}

const allItems = [];
const seen = new Set();

allData.forEach(tabObj => {
  tabObj.rows.forEach(row => {
    const parts = row.split(',');
    // Title is usually column 1 or column 0
    let title = parts[1] || parts[0];
    if (!title || title.includes('drive.google.com') || title.length < 3) return;
    title = title.replace(/^"|"$/g, '').trim();
    if (title.toLowerCase().startsWith('title') || title.toLowerCase() === 'name') return;

    const item = cleanItem(title);
    const key = (item.company + '___' + item.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seen.has(key) && item.name.length > 2) {
      seen.add(key);
      allItems.push(item);
    }
  });
});

console.log(`\n==========================================`);
console.log(`TOTAL UNIQUE KONTAKT LIBRARIES FOUND: ${allItems.length}`);
console.log(`==========================================\n`);

const byType = {};
allItems.forEach(p => {
  if (!byType[p.soundType]) byType[p.soundType] = [];
  byType[p.soundType].push(p);
});

console.log('--- Breakdown by Sound Type ---');
Object.entries(byType).sort((a,b) => b[1].length - a[1].length).forEach(([type, arr]) => {
  console.log(`${type}: ${arr.length} libraries`);
});

fs.writeFileSync('all_unique_kontakt.json', JSON.stringify(allItems, null, 2));
