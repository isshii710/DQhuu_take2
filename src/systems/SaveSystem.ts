import type { CharacterSave } from '../types';
import { calcStats, getClassDef } from '../data/characters';

const SAVE_KEY = 'aldea_save';
const SETTINGS_KEY = 'aldea_settings';

export interface GameSettings {
  bgmVolume: number;
  sfxVolume: number;
  lastPlayedName?: string;
}

export function defaultSave(name: string, className: CharacterSave['className']): CharacterSave {
  const cls = getClassDef(className);
  const stats = calcStats(cls, 1);
  return {
    name,
    className,
    level: 1,
    exp: 0,
    stats: {
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      mp: stats.maxMp,
      maxMp: stats.maxMp,
      atk: stats.atk,
      def: stats.def,
      mag: stats.mag,
      spd: stats.spd,
    },
    equipment: { weapon: null, armor: null, helmet: null, accessory: null },
    inventory: [{ itemId: 'herb', qty: 3 }],
    gold: 50,
    position: { mapId: 'village', tileX: 9, tileY: 13 },
    flags: {},
    party: [],
    activeMemberIds: [],
  };
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function loadSave(): CharacterSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw) as CharacterSave;
    // 後方互換: partyフィールドが存在しない古いセーブデータへの対応
    if (!Array.isArray(save.party)) save.party = [];
    if (!Array.isArray(save.activeMemberIds)) save.activeMemberIds = [];
    return save;
  } catch {
    return null;
  }
}

export function writeSave(data: CharacterSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { bgmVolume: 0.5, sfxVolume: 0.8 };
    return JSON.parse(raw) as GameSettings;
  } catch {
    return { bgmVolume: 0.5, sfxVolume: 0.8 };
  }
}

export function writeSettings(s: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
