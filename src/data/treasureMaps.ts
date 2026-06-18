import type { MapId } from '../types';

export interface TreasureMapDef {
  id: string;
  name: string;
  mapId: MapId;
  bossId: string;
}

export const TREASURE_MAPS: TreasureMapDef[] = [
  { id: 'tmap_1', name: '古の洞窟', mapId: 'tmap_1', bossId: 'grosur' },
  { id: 'tmap_2', name: '幻の遺跡', mapId: 'tmap_2', bossId: 'shadowknight' },
  { id: 'tmap_3', name: '魔界の迷宮', mapId: 'tmap_3', bossId: 'demon_boss' },
  { id: 'tmap_4', name: '天空の試練', mapId: 'tmap_4', bossId: 'grosur' },
  { id: 'tmap_5', name: '海底の神殿', mapId: 'tmap_5', bossId: 'demon_boss' },
];

export const BOSS_LEVEL_THRESHOLDS: Record<number, number> = {
  1: 5,
  2: 15,
  3: 30,
  4: 50,
  5: 75,
};

export function getBossDropRate(level: number): number {
  return Math.min(0.1 + (level - 1) * 0.1, 0.9);
}
