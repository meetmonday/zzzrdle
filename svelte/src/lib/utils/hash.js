// Hash-based helpers copied/adapted from the vanilla app.js monolith.
// Pure functions: no DOM, no global state. Unit-testable.

export function hashString(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x9e3779b9);
    h2 = Math.imul(h2 ^ ch, 0x5f356495);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 0x85ebca6b);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 0xc2b2ae35);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 0x85ebca6b);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 0xc2b2ae35);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)) >>> 0;
}

export function seededIndex(seed, length) {
  if (length <= 0) return 0;
  const hash = hashString(seed);
  return Math.floor((hash / 0x100000000) * length);
}
