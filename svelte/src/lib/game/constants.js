export const STORAGE_KEY = 'zzzrdle-v1';
export const DATA_URL = 'data/characters.json?v=8';
export const IMG_BASE = 'https://enka.network/ui/zzz/';
export const DAILY_ATTEMPTS = 5;
export const TIME_START = 60;
export const TIME_BONUS = 5;
export const TIME_DANGER = 10;
export const TIME_POINTS_BASE = 100;
export const TIME_POINTS_EFF = 60;
export const TIME_POINTS_EFF_STEP = 15;
export const TIME_POINTS_SPEED = 50;
export const TIME_POINTS_SPEED_STEP = 5;
export const TIME_COMBO_MAX = 5;
export const TIME_RANKS = [
  { min: 2500, rank: 'SS', label: 'Legendary', cls: 'rank--ss' },
  { min: 1800, rank: 'S', label: 'Ace', cls: 'rank--s' },
  { min: 1200, rank: 'A', label: 'Elite', cls: 'rank--a' },
  { min: 700, rank: 'B', label: 'Pro', cls: 'rank--b' },
  { min: 300, rank: 'C', label: 'Rookie', cls: 'rank--c' },
  { min: 0, rank: 'D', label: 'Beginner', cls: 'rank--d' },
];
export const ATTRIBUTES = [
  { key: 'attribute', label: 'Attribute' },
  { key: 'specialty', label: 'Specialty' },
  { key: 'attackType', label: 'Attack' },
  { key: 'faction', label: 'Faction' },
  { key: 'rarity', label: 'Rarity' },
];
