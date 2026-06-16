import type { EnemyDef } from '../types';

export const ENEMIES: EnemyDef[] = [
  // ─── Early game ──────────────────────────────────────────────────────────
  {
    id: 'forestla',   name: 'フォレスラ',
    hp: 12, atk: 5,  def: 2,  mag: 2,  spd: 4,
    exp: 4,  gold: 3,
    drops: ['herb'],
    sprite: 'slime',
  },
  {
    id: 'goblin',     name: 'ゴブリン兵',
    hp: 20, atk: 8,  def: 4,  mag: 1,  spd: 7,
    exp: 8,  gold: 6,
    drops: ['herb', 'wood_sword'],
    sprite: 'goblin',
  },
  {
    id: 'vampabat',   name: 'バンパバット',
    hp: 16, atk: 7,  def: 3,  mag: 4,  spd: 12,
    exp: 10, gold: 5,
    drops: ['mana_herb'],
    sprite: 'bat',
  },

  // ─── Mid game ────────────────────────────────────────────────────────────
  {
    id: 'witchwiz',   name: 'ウィッチウィズ',
    hp: 28, atk: 6,  def: 5,  mag: 14, spd: 10,
    exp: 18, gold: 12,
    drops: ['mana_herb', 'staff'],
    sprite: 'witch',
  },
  {
    id: 'irongolem',  name: 'アイアンゴーレム',
    hp: 55, atk: 16, def: 14, mag: 2,  spd: 3,
    exp: 28, gold: 20,
    drops: ['potion', 'iron_sword'],
    sprite: 'golem',
  },
  {
    id: 'gargoyle',   name: 'ガーゴイル',
    hp: 40, atk: 14, def: 10, mag: 8,  spd: 11,
    exp: 30, gold: 22,
    drops: ['leather'],
    sprite: 'gargoyle',
  },
  {
    id: 'dragonette', name: 'ドラゴネット',
    hp: 48, atk: 18, def: 12, mag: 10, spd: 9,
    exp: 35, gold: 28,
    drops: ['elixir'],
    sprite: 'dragon',
  },

  // ─── Late game / boss ────────────────────────────────────────────────────
  {
    id: 'shadowknight',name:'シャドウナイト',
    hp: 80, atk: 24, def: 18, mag: 12, spd: 14,
    exp: 60, gold: 45,
    drops: ['shadow_blade', 'elixir'],
    sprite: 'knight',
  },
  {
    id: 'grosur',     name: '魔王グロスール',
    hp: 300, atk: 35, def: 25, mag: 30, spd: 16,
    exp: 500, gold: 999,
    drops: ['holy_sword'],
    sprite: 'boss',
  },
];

export const ENEMY_MAP: Record<string, EnemyDef> = Object.fromEntries(ENEMIES.map(e => [e.id, e]));

export const ENCOUNTER_GROUPS: Record<string, string[][]> = {
  world_field: [
    ['forestla'],
    ['forestla', 'forestla'],
    ['goblin'],
    ['forestla', 'goblin'],
    ['vampabat'],
    ['vampabat', 'vampabat'],
  ],
  world_forest: [
    ['witchwiz'],
    ['gargoyle'],
    ['gargoyle', 'vampabat'],
    ['dragonette'],
    ['witchwiz', 'goblin'],
  ],
  dungeon: [
    ['irongolem'],
    ['shadowknight'],
    ['dragonette', 'gargoyle'],
    ['shadowknight', 'witchwiz'],
  ],
  boss: [
    ['grosur'],
  ],
};

export function randomEncounter(group: string): EnemyDef[] {
  const groups = ENCOUNTER_GROUPS[group] ?? ENCOUNTER_GROUPS['world_field'];
  const pick = groups[Math.floor(Math.random() * groups.length)];
  return pick.map(id => ({ ...ENEMY_MAP[id] }));
}
