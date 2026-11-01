import { normalizeName } from '../data/characters.js';

export function filterCharacters(chars, query) {
  const q = normalizeName(query);
  if (!q) return [];
  return chars
    .filter((c) => normalizeName(c.name).includes(q))
    .sort((a, b) => {
      const an = normalizeName(a.name);
      const bn = normalizeName(b.name);
      const aStarts = an.startsWith(q);
      const bStarts = bn.startsWith(q);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return an.localeCompare(bn);
    })
    .slice(0, 8);
}
