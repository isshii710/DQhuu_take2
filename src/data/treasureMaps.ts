import type { MapId } from '../types';

export interface TreasureMapDef {
  id: string;        // e.g. 'tmap_1'
  mapId: MapId;      // map to load
  name: string;
  rarity: number;    // 1=common ... 5=rare, affects gacha weight
  bossId: string;    // fixed boss enemy id
  materialDrop: string;
}

export const TREASURE_MAPS: TreasureMapDef[] = [
  { id: 'tmap_1', mapId: 'tmap_1', name: '古の地図①', rarity: 1, bossId: 'tmap_boss_1', materialDrop: 'mat_map1' },
  { id: 'tmap_2', mapId: 'tmap_2', name: '古の地図②', rarity: 2, bossId: 'tmap_boss_2', materialDrop: 'mat_map2' },
  { id: 'tmap_3', mapId: 'tmap_3', name: '古の地図③', rarity: 3, bossId: 'tmap_boss_3', materialDrop: 'mat_map3' },
  { id: 'tmap_4', mapId: 'tmap_4', name: '古の地図④', rarity: 4, bossId: 'tmap_boss_4', materialDrop: 'mat_map4' },
  { id: 'tmap_5', mapId: 'tmap_5', name: '古の地図⑤', rarity: 5, bossId: 'tmap_boss_5', materialDrop: 'mat_map5' },
];

export const TMAP_MAP: Record<string, TreasureMapDef> = Object.fromEntries(
  TREASURE_MAPS.map(m => [m.id, m])
);

// CR-style level thresholds: count needed to reach this level
// Index = level (0=unused, 1=base, 2=first upgrade, ...)
export const BOSS_LEVEL_THRESHOLDS = [0, 0, 2, 4, 8, 15, 30, 60, 120, 250, 500];

export function getBossLevel(count: number): number {
  let level = 1;
  for (let i = 2; i < BOSS_LEVEL_THRESHOLDS.length; i++) {
    if (count >= BOSS_LEVEL_THRESHOLDS[i]) level = i - 1;
    else break;
  }
  return level;
}

export function getBossDropRate(level: number): number {
  // Base 25%, +10% per level above 1, cap at 95%
  return Math.min(0.95, 0.25 + (level - 1) * 0.10);
}

export function getCountToNextLevel(level: number): number {
  const nextIdx = level + 1;
  if (nextIdx >= BOSS_LEVEL_THRESHOLDS.length) return Infinity;
  return BOSS_LEVEL_THRESHOLDS[nextIdx];
}

// Gacha weights by rarity (higher rarity = rarer)
const GACHA_WEIGHTS = [0, 40, 28, 18, 10, 4]; // index = rarity

export function pullGacha(): TreasureMapDef {
  const total = TREASURE_MAPS.reduce((s, m) => s + GACHA_WEIGHTS[m.rarity], 0);
  let r = Math.random() * total;
  for (const m of TREASURE_MAPS) {
    r -= GACHA_WEIGHTS[m.rarity];
    if (r <= 0) return m;
  }
  return TREASURE_MAPS[0];
}
