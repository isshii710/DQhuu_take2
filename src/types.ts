export type ClassName = '戦士' | '魔法使い' | '回復師' | '盗賊'
  | '勇者' | '賢者' | '魔剣士' | '武闘家';
export type Direction = 'down' | 'up' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';
export type MapId = 'world' | 'village' | 'castle' | 'dungeon' | 'dungeon2' | 'dungeon3' | 'house1' | 'house2' | 'house3'
  | 'ruins' | 'ice_cave' | 'lava_cave' | 'sea_temple' | 'sky_castle' | 'demon_castle'
  | 'tmap_1' | 'tmap_2' | 'tmap_3' | 'tmap_4' | 'tmap_5';

export interface Stats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  mag: number;
  spd: number;
}

export interface Equipment {
  weapon:    string | null;
  armor:     string | null;
  helmet:    string | null;
  accessory: string | null;
}

export interface ItemDef {
  id: string;
  name: string;
  type: 'consumable' | 'weapon' | 'armor' | 'helmet' | 'accessory';
  desc: string;
  price: number;
  // consumable
  hpRestore?: number;
  mpRestore?: number;
  // equipment stats
  atk?: number;
  def?: number;
  mag?: number;
  spd?: number;
  mhp?: number;
  mmp?: number;
  // visual tint on sprite
  tint?: number;
}

export interface InventoryEntry {
  itemId: string;
  qty: number;
}

export interface BossProgress {
  count: number;  // kills + gacha pulls of same map
  level: number;  // current boss level
}

export interface CharacterSave {
  name: string;
  className: ClassName;
  level: number;
  exp: number;
  stats: Stats;
  equipment: Equipment;
  inventory: InventoryEntry[];
  gold: number;
  position: { mapId: MapId; tileX: number; tileY: number };
  flags: Record<string, boolean>;
  party: PartyMember[];
  activeMemberIds: string[];
  monsterBook?: Record<string, { seen: number; defeated: number }>;
  medals?: number;
  bossProgress?: Record<string, BossProgress>; // bossId → progress
  jobMastery?: Record<string, number>;          // className → mastery bonus level
  ownedMaps?: string[];                         // treasure map IDs the player owns
  completedQuests?: string[];
  questKills?: Record<string, number>;
}

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  mag: number;
  spd: number;
  exp: number;
  gold: number;
  drops: string[];
  sprite: string;
  evasion?: number;
  fleeChance?: number;
}

export interface ClassDef {
  name: ClassName;
  desc: string;
  baseStats: { hp: number; mp: number; atk: number; def: number; mag: number; spd: number };
  growthPerLevel: { hp: number; mp: number; atk: number; def: number; mag: number; spd: number };
  skills: { level: number; name: string; mpCost: number; desc: string; magMult: number; targetType?: 'enemy' | 'ally' | 'all_allies' | 'all_enemies' | 'self' }[];
  spriteBase: number;
  unlockFlag?: string;
}

// Multiplayer
export interface NetPlayer {
  id: string;
  name: string;
  className: ClassName;
  x: number;
  y: number;
  mapId: MapId;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  ready: boolean;
}

export interface BattleActionPayload {
  type: 'attack' | 'magic' | 'item' | 'run';
  targetIndex?: number;
  spellId?: string;
  itemId?: string;
}

export interface BattleRoundResult {
  results: {
    playerId?: string;
    enemyIndex?: number;
    type: string;
    damage?: number;
    heal?: number;
    text: string;
  }[];
  enemyHps: number[];
  playerHps: Record<string, number>;
  battleOver: boolean;
  victory: boolean;
}

export interface PartyMember {
  id: string;
  name: string;
  className: ClassName;
  level: number;
  exp: number;
  stats: Stats;
  equipment: Equipment;
  spriteColor: number;
}

export interface NpcDef {
  id: string;
  name: string;
  dialogue: string[];
  tileX: number;
  tileY: number;
  spriteColor: number;
  recruitId?: string;
  isInn?: boolean;
  shopType?: 'weapon' | 'armor' | 'item';
  isChest?: boolean;
  chestPool?: string[];
  isChurch?: boolean;
  bossId?: string;       // triggers a fixed boss battle when talked to
  requireFlag?: string;  // only visible/interactable if save.flags[requireFlag]
  setFlag?: string;      // sets this flag after interaction
}

export interface QuestDef {
  id: string;
  name: string;
  desc: string;
  killTarget?: string;
  killCount?: number;
  rewardGold?: number;
  rewardItems?: string[];
  rewardFlag?: string;
}

export interface MapDef {
  id: MapId;
  name: string;
  tiles: number[][];
  npcs: NpcDef[];
  exits: { tileX: number; tileY: number; targetMap: MapId; targetX: number; targetY: number }[];
  music?: string;
  encounterGroup?: string;
  bgColor?: number;
}
