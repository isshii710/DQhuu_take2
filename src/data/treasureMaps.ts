import type { MapId } from '../types';

export interface TreasureMapDef {
  id: string;
  name: string;
  mapId: MapId;
  bossId: string;
}

export const TREASURE_MAPS: TreasureMapDef[] = [
  { id: 'tmap_1', name: '古の洞窟',  mapId: 'tmap_1', bossId: 'tmap_boss_1' },
  { id: 'tmap_2', name: '幻の遺跡',  mapId: 'tmap_2', bossId: 'tmap_boss_2' },
  { id: 'tmap_3', name: '魔界の迷宮',mapId: 'tmap_3', bossId: 'tmap_boss_3' },
  { id: 'tmap_4', name: '天空の試練',mapId: 'tmap_4', bossId: 'tmap_boss_4' },
  { id: 'tmap_5', name: '海底の神殿',mapId: 'tmap_5', bossId: 'tmap_boss_5' },
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
