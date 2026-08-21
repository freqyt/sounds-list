const fs = require('fs');

const raw = fs.readFileSync('C:/Users/freq/.gemini/antigravity/brain/c1281f93-a43c-4b2b-ae6d-a8236d08695e/.system_generated/steps/2147/content.md', 'utf8');
const lines = raw.split('\n');

const KNOWN_COMPANIES = [
  '8Dio', 'Acousticsamples', 'Audio Imperia', 'Audiobro', 'Beastsamples', 'Best Service',
  'Big Fish Audio', 'Chris Hein', 'Cinematic Samples Pty', 'Cinematic Studio Series', 'Cinematic Studio',
  'Cinesamples', 'Dezert Audio', 'E-MU', 'East West Quantum Leap', 'EastWest', 'Evolution Series',
  'Fracture Sounds', 'Heavyocity', 'Ilya Efimov', 'Impact Soundworks', 'Indiginus',
  'Junior Porciuncula', 'Karanyi Sounds', 'Keepforest', 'Musical Sampling', 'Native Instruments',
  'norCtrack', 'Orange Tree Samples', 'Output', 'ProjectSAM', 'Realitone', 'Sample Logic',
  'Silence And Other Sounds', 'Slate + Ash Orchestral Tools', 'Slate + Ash', 'Sonica Instruments',
  'Sonicsmiths aka Cinesamples', 'Sonicsmiths', 'Sonuscore', 'Sound Dust', 'Soundiron',
  'Spitfire Audio', 'Spitfire', 'Steven Slate Drums', 'Strezov Sampling', 'Synthonic Audio',
  'Teletone Audio', 'ThePhonoLoop', 'UJAM', 'Vicious Antelope', 'Vir2 Instruments',
  'Wave Alchemy', 'Westwood Instruments', 'Zero-G', 'e-instruments', 'Keepforest'
];

function cleanItem(rawTitle) {
  let s = rawTitle.trim();
  s = s.replace(/\.(zip|torrent|rar|7z)$/i, '').trim();
  s = s.replace(/[\(\[\{]\s*kontakt\s*[\)\]\}]/gi, '').trim();
  s = s.replace(/\s*part\s*[-_]?\s*\d+/gi, '').trim();
  s = s.replace(/\s+v?\.?\d+(\.\d+)+(\w*)?(\s*(Full\s*\+\s*Update|Update|Full))?/gi, '').trim();
  s = s.replace(/\s+KP2$/i, '').trim();
  s = s.replace(/\s+Full\s*\+\s*Update$/i, '').trim();

  let company = '';
  let name = s;

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

  if (company.toLowerCase().includes('spitfire')) company = 'Spitfire Audio';
  if (company.toLowerCase().includes('slate + ash')) company = 'Slate + Ash';
  if (company.toLowerCase().includes('cinematic studio')) company = 'Cinematic Studio Series';
  if (company.toLowerCase().includes('east west') || company.toLowerCase().includes('eastwest')) company = 'EastWest';
  if (company.toLowerCase().includes('cinesamples')) company = 'Cinesamples';

  const lstr = (name + ' ' + (company || '')).toLowerCase();
  let category = 'Cinematic & Hybrid Textures';

  if (lstr.includes('piano') || lstr.includes('keys') || lstr.includes('korg') || lstr.includes('upright') || lstr.includes('grand') || lstr.includes('rhodes') || lstr.includes('themk')) {
    category = 'Pianos & Keys';
  } else if (lstr.includes('string') || lstr.includes('orchestr') || lstr.includes('cello') || lstr.includes('violin') || lstr.includes('viola') || lstr.includes('fiddle') || lstr.includes('adagio') || lstr.includes('chamber')) {
    category = 'Strings & Orchestral';
  } else if (lstr.includes('guitar') || lstr.includes('bass') || lstr.includes('hinterland') || lstr.includes('dracus') || lstr.includes('stratosphere') || lstr.includes('getlow')) {
    category = 'Guitars & Bass';
  } else if (lstr.includes('brass') || lstr.includes('horn') || lstr.includes('sax') || lstr.includes('woodwind') || lstr.includes('flute') || lstr.includes('whistle') || lstr.includes('forzo')) {
    category = 'Brass & Woodwinds';
  } else if (lstr.includes('choir') || lstr.includes('vocal') || lstr.includes('glaze') || lstr.includes('mystica') || lstr.includes('voices') || lstr.includes('sway')) {
    category = 'Vocals & Choirs';
  } else if (lstr.includes('drum') || lstr.includes('percuss') || lstr.includes('hans zimmer percuss') || lstr.includes('berserkr')) {
    category = 'Drums & Percussion';
  } else if (lstr.includes('ethnic') || lstr.includes('koto') || lstr.includes('ireland') || lstr.includes('west africa') || lstr.includes('arabian') || lstr.includes('harp') || lstr.includes('ukulele')) {
    category = 'Ethnic & World';
  } else if (lstr.includes('synth') || lstr.includes('planet phatt') || lstr.includes('orbit') || lstr.includes('saw') || lstr.includes('analog tales') || lstr.includes('analog nightmares')) {
    category = 'Synths & Vintage Keys';
  }

  return {
    raw: rawTitle,
    company: company || 'Other',
    name: name || rawTitle,
    soundType: category
  };
}

const parsed = [];
const seen = new Set();

for (const line of lines) {
  if (!line.includes('drive.google.com')) continue;
  const match = line.match(/^,([^,]+),/);
  if (!match) continue;
  const title = match[1];
  const item = cleanItem(title);
  const key = (item.company + '__' + item.name).toLowerCase();
  if (!seen.has(key)) {
    seen.add(key);
    parsed.push(item);
  }
}

console.log(`Parsed ${parsed.length} unique Kontakt libraries!`);

const byType = {};
parsed.forEach(p => {
  if (!byType[p.soundType]) byType[p.soundType] = [];
  byType[p.soundType].push(p);
});

console.log('\n--- Sound Type Breakdown ---');
Object.entries(byType).forEach(([type, arr]) => {
  console.log(`${type}: ${arr.length} libraries`);
});
