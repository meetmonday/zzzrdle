import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = join(__dirname, '..', 'static');
const OUT_FILE = join(__dirname, 'characters.json');

const VERSION = '3.3';
const INDEX_URL = `https://static.nanoka.cc/zzz/${VERSION}/character.json`;
const CHAR_URL = id => `https://static.nanoka.cc/zzz/${VERSION}/en/character/${id}.json`;

function loadIconDir(dir) {
  return readdirSync(join(STATIC_DIR, dir))
    .filter(f => f.endsWith('.png'))
    .map(f => f.replace('.png', ''));
}

const factionIcons = loadIconDir('factions');
const attributeIcons = loadIconDir('attribute');
const specialtyIcons = loadIconDir('specialty');
const attackTypeIcons = loadIconDir('attackType');
const rarityIcons = loadIconDir('rarity');

const RARITY_MAP = { 3: 'A', 4: 'S' };

function normalize(s) {
  return s.toLowerCase().replace(/[\s._\-]/g, '');
}

const FACTION_OVERRIDES = {
  'Victoria Housekeeping Co.': 'Victoria_Housekeeping',
  'New Eridu Defense Force': 'Obol_Squad',
  'New Eridu Public Security': 'Criminal_Investigation_Special_Response_Team',
  'Roscaelifer': 'External_Strategy_Department',
};

function matchIcon(value, iconNames) {
  if (FACTION_OVERRIDES[value]) value = FACTION_OVERRIDES[value];
  const n = normalize(value);
  for (const icon of iconNames) {
    if (normalize(icon) === n) return icon;
  }
  return null;
}

async function fetchChar(id) {
  const res = await fetch(CHAR_URL(id));
  if (!res.ok) throw new Error(`Failed to fetch ${id}: ${res.status}`);
  return res.json();
}

async function main() {
  const indexRes = await fetch(INDEX_URL);
  if (!indexRes.ok) throw new Error(`Failed to fetch index: ${indexRes.status}`);
  const CHARACTER_IDS = Object.keys(await indexRes.json()).map(Number).sort((a, b) => a - b);
  console.log(`Found ${CHARACTER_IDS.length} characters in index`);

  const results = [];
  const factions = {};

  for (const id of CHARACTER_IDS) {
    try {
      const d = await fetchChar(id);
      const camp = Object.values(d.camp || {})[0] || '';
      const element = Object.values(d.element_type || {})[0] || '';
      const specialty = Object.values(d.weapon_type || {})[0] || '';
      const hitType = Object.values(d.hit_type || {})[0] || '';
      const rarityNum = d.rarity || 0;
      const rarityLabel = RARITY_MAP[rarityNum] || `R${rarityNum}`;

      const factionFile = matchIcon(camp, factionIcons);
      const attrFile = matchIcon(element, attributeIcons);
      const specFile = matchIcon(specialty, specialtyIcons);
      const attackFile = matchIcon(hitType, attackTypeIcons);
      const rarityFile = matchIcon(rarityLabel, rarityIcons);

      if (!factionFile) console.log(`WARN faction: ${d.name} "${camp}"`);
      if (!attrFile) console.log(`WARN attr: ${d.name} "${element}"`);
      if (!specFile) console.log(`WARN specialty: ${d.name} "${specialty}"`);
      if (!attackFile) console.log(`WARN attack: ${d.name} "${hitType}"`);
      if (!rarityFile) console.log(`WARN rarity: ${d.name} "${rarityLabel}"`);

      results.push({
        id: d.id,
        name: d.name,
        attribute: element,
        specialty: specialty,
        attackType: hitType,
        faction: camp,
        rarity: rarityLabel,
        image: d.icon ? `${d.icon.replaceAll('Role', 'RoleSelect')}.png` : '',
      });

      if (camp && factionFile) factions[camp] = factionFile;

      process.stdout.write(`\r${d.name} (${results.length}/${CHARACTER_IDS.length})`.padEnd(60));
    } catch (e) {
      console.log(`\nERROR ${id}: ${e.message}`);
    }
  }

  if (results.length === 0) {
    console.error('\nNo characters fetched. Check the data source and IDs.');
    process.exit(1);
  }

  results.sort((a, b) => a.id - b.id);
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const meta = {
    version: VERSION.split('+')[0],
    agents: results.length,
    updated: localDate,
  };
  writeFileSync(OUT_FILE, JSON.stringify({ meta, factions, chars: results }, null, 2));
  console.log(`\nDone: ${results.length} characters written to ${OUT_FILE}`);
}

main();
