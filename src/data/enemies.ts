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

  // ─── 古代遺跡 ─────────────────────────────────────────────────────────────
  { id: 'stone_golem',  name: '石像ゴーレム',
    hp: 90,  atk: 26, def: 22, mag: 4,  spd: 5,
    exp: 70,  gold: 55,  drops: ['potion', 'gacha_ticket'],    sprite: 'golem' },
  { id: 'ancient_mage', name: '古代の魔道士',
    hp: 65,  atk: 12, def: 10, mag: 28, spd: 12,
    exp: 75,  gold: 60,  drops: ['mana_herb', 'gacha_ticket'], sprite: 'witch' },
  { id: 'ruins_boss',   name: '石古の守護者',
    hp: 450, atk: 38, def: 30, mag: 20, spd: 10,
    exp: 600, gold: 200, drops: ['mat_ruins', 'mat_ruins'],    sprite: 'boss'  },

  // ─── 氷の洞窟 ─────────────────────────────────────────────────────────────
  { id: 'ice_wolf',     name: 'フロストウルフ',
    hp: 75,  atk: 28, def: 16, mag: 8,  spd: 18,
    exp: 80,  gold: 65,  drops: ['herb', 'gacha_ticket'],      sprite: 'bat'   },
  { id: 'blizzard_bat', name: 'ブリザードバット',
    hp: 55,  atk: 18, def: 12, mag: 24, spd: 20,
    exp: 82,  gold: 62,  drops: ['mana_herb', 'gacha_ticket'], sprite: 'bat'   },
  { id: 'ice_boss',     name: '氷竜バルノース',
    hp: 550, atk: 42, def: 35, mag: 35, spd: 14,
    exp: 750, gold: 250, drops: ['mat_ice', 'mat_ice'],        sprite: 'dragon'},

  // ─── 溶岩洞窟 ─────────────────────────────────────────────────────────────
  { id: 'lava_lizard',  name: 'ラヴァリザード',
    hp: 95,  atk: 32, def: 20, mag: 12, spd: 11,
    exp: 95,  gold: 75,  drops: ['potion', 'gacha_ticket'],    sprite: 'dragon'},
  { id: 'fire_demon',   name: '炎魔フレイム',
    hp: 80,  atk: 25, def: 15, mag: 32, spd: 14,
    exp: 98,  gold: 78,  drops: ['mana_herb', 'gacha_ticket'], sprite: 'boss'  },
  { id: 'lava_boss',    name: '炎の大巨人',
    hp: 650, atk: 48, def: 38, mag: 28, spd: 9,
    exp: 900, gold: 300, drops: ['mat_lava', 'mat_lava'],      sprite: 'golem' },

  // ─── 海底神殿 ─────────────────────────────────────────────────────────────
  { id: 'sea_serpent',  name: 'シーサーペント',
    hp: 110, atk: 36, def: 22, mag: 14, spd: 16,
    exp: 110, gold: 88,  drops: ['potion', 'gacha_ticket'],    sprite: 'dragon'},
  { id: 'deep_witch',   name: '深海の魔女',
    hp: 85,  atk: 14, def: 16, mag: 38, spd: 18,
    exp: 115, gold: 90,  drops: ['ether', 'gacha_ticket'],     sprite: 'witch' },
  { id: 'sea_boss',     name: '海神レヴィアタン',
    hp: 780, atk: 54, def: 42, mag: 44, spd: 16,
    exp: 1100,gold: 380, drops: ['mat_ocean', 'mat_ocean'],    sprite: 'boss'  },

  // ─── 天空城 ───────────────────────────────────────────────────────────────
  { id: 'sky_knight',   name: '天空騎士',
    hp: 125, atk: 42, def: 30, mag: 18, spd: 20,
    exp: 130, gold: 105, drops: ['elixir', 'gacha_ticket'],    sprite: 'knight'},
  { id: 'angel_guard',  name: '天使ガーディアン',
    hp: 100, atk: 20, def: 28, mag: 42, spd: 22,
    exp: 135, gold: 108, drops: ['ether', 'gacha_ticket'],     sprite: 'boss'  },
  { id: 'sky_boss',     name: '堕天使ラフィエル',
    hp: 920, atk: 60, def: 48, mag: 52, spd: 20,
    exp: 1400,gold: 450, drops: ['mat_sky', 'mat_sky'],        sprite: 'boss'  },

  // ─── 魔王の城 ─────────────────────────────────────────────────────────────
  { id: 'dark_knight',  name: '暗黒騎士',
    hp: 145, atk: 50, def: 38, mag: 22, spd: 18,
    exp: 160, gold: 128, drops: ['shadow_blade', 'gacha_ticket'], sprite: 'knight'},
  { id: 'chaos_mage',   name: '混沌の魔道士',
    hp: 115, atk: 18, def: 22, mag: 55, spd: 24,
    exp: 165, gold: 130, drops: ['ether', 'gacha_ticket'],     sprite: 'witch' },
  { id: 'demon_boss',   name: '魔王グロスールⅡ',
    hp: 1200,atk: 68, def: 55, mag: 65, spd: 22,
    exp: 2000,gold: 999, drops: ['mat_dark', 'mat_dark', 'dark_scythe'], sprite: 'boss'},

  // ─── Treasure map bosses ─────────────────────────────────────────────────
  { id: 'tmap_boss_1', name: '遺跡のゴーレム王',
    hp: 200, atk: 30, def: 25, mag: 10, spd: 8,
    exp: 200, gold: 100, drops: ['mat_map1'], sprite: 'golem'  },
  { id: 'tmap_boss_2', name: '氷の幻獣フェニルス',
    hp: 250, atk: 28, def: 20, mag: 35, spd: 18,
    exp: 250, gold: 120, drops: ['mat_map2'], sprite: 'dragon' },
  { id: 'tmap_boss_3', name: '炎の魔獣フラガラッハ',
    hp: 300, atk: 40, def: 22, mag: 25, spd: 12,
    exp: 300, gold: 140, drops: ['mat_map3'], sprite: 'boss'   },
  { id: 'tmap_boss_4', name: '深海の怪物クラーケン',
    hp: 360, atk: 35, def: 30, mag: 40, spd: 10,
    exp: 360, gold: 160, drops: ['mat_map4'], sprite: 'boss'   },
  { id: 'tmap_boss_5', name: '天空の魔龍セラフィア',
    hp: 420, atk: 48, def: 35, mag: 50, spd: 20,
    exp: 450, gold: 200, drops: ['mat_map5'], sprite: 'dragon' },
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
  ruins: [
    ['stone_golem'],
    ['stone_golem', 'stone_golem'],
    ['ancient_mage'],
    ['stone_golem', 'ancient_mage'],
  ],
  ice_cave: [
    ['ice_wolf'],
    ['blizzard_bat'],
    ['ice_wolf', 'blizzard_bat'],
    ['blizzard_bat', 'blizzard_bat'],
  ],
  lava_cave: [
    ['lava_lizard'],
    ['fire_demon'],
    ['lava_lizard', 'fire_demon'],
    ['lava_lizard', 'lava_lizard'],
  ],
  sea_temple: [
    ['sea_serpent'],
    ['deep_witch'],
    ['sea_serpent', 'deep_witch'],
    ['sea_serpent', 'sea_serpent'],
  ],
  sky_castle: [
    ['sky_knight'],
    ['angel_guard'],
    ['sky_knight', 'angel_guard'],
    ['sky_knight', 'sky_knight'],
  ],
  demon_castle: [
    ['dark_knight'],
    ['chaos_mage'],
    ['dark_knight', 'chaos_mage'],
    ['dark_knight', 'dark_knight'],
  ],
  tmap_1: [['stone_golem'], ['ancient_mage'], ['stone_golem', 'ancient_mage']],
  tmap_2: [['ice_wolf'], ['blizzard_bat'], ['ice_wolf', 'blizzard_bat']],
  tmap_3: [['lava_lizard'], ['fire_demon'], ['lava_lizard', 'fire_demon']],
  tmap_4: [['sea_serpent'], ['deep_witch'], ['sea_serpent', 'deep_witch']],
  tmap_5: [['sky_knight'], ['angel_guard'], ['sky_knight', 'angel_guard']],
};

export function randomEncounter(group: string): EnemyDef[] {
  const groups = ENCOUNTER_GROUPS[group] ?? ENCOUNTER_GROUPS['world_field'];
  const pick = groups[Math.floor(Math.random() * groups.length)];
  return pick.map(id => ({ ...ENEMY_MAP[id] }));
}
