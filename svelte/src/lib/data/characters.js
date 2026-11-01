import { todayString } from '../utils/dates.js';

export const DATA_URL = 'data/characters.json?v=8';
export const IMG_BASE = 'https://enka.network/ui/zzz/';

export function normalizeName(name) {
  return (name || '').toLowerCase().trim();
}

// Fill in derived fields stripped from the data file to save bandwidth.
export function expandCharacter(c, factions) {
  if (!c) return c;
  c.image = IMG_BASE + c.image;
  c.attributeIcon = `/attribute/${c.attribute}.png`;
  c.specialtyIcon = `/specialty/${c.specialty}.png`;
  c.attackTypeIcon = `/attackType/${c.attackType}.png`;
  c.factionIcon = `/factions/${(factions && factions[c.faction]) || c.faction.replace('.', '').replace(/ /g, '_')}.png`;
  c.rarityIcon = `/rarity/${c.rarity}.png`;
  return c;
}

export async function loadCharacters(fetchFn = fetch) {
  const url = `${import.meta.env.BASE_URL}${DATA_URL}`;
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(res.statusText || `HTTP ${res.status}`);
  const data = await res.json();
  const characters = (data.chars || []).map((c) => expandCharacter({ ...c }, data.factions));
  return { characters, meta: data.meta, factions: data.factions };
}

export function findCharacter(characters, query) {
  const n = normalizeName(query);
  return characters.find((c) => normalizeName(c.name) === n);
}

export function dailyIndex(characters, date = todayString()) {
  // Reuse hash logic? Daily uses seededIndex(date, length); keep in store.
  return null;
}
