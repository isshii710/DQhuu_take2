export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
export const TILE_SIZE = 32;
export const MAP_TILE_COLS = 40;
export const MAP_TILE_ROWS = 40;
export const UI_HEIGHT = 96;        // bottom UI strip height
export const VIEWPORT_H = GAME_HEIGHT - UI_HEIGHT;

export const ENCOUNTER_RATE = 0.04; // 4% per step on field tiles
export const MAX_PARTY = 4;
export const SERVER_URL = 'https://dqhuu-take2.onrender.com';

export const COLORS = {
  SKY:        0x0a0a1a,
  PANEL:      0x1a1a2e,
  PANEL_DARK: 0x0d0d1e,
  BORDER:     0xd4af37,
  TEXT:       0xfff8dc,
  TEXT_DIM:   0xaaa070,
  HP_BAR:     0x22bb44,
  HP_LOW:     0xdd3322,
  MP_BAR:     0x2244dd,
  EXP_BAR:    0xcc8822,
  ENEMY_HP:   0xdd3322,
};

// Tile IDs
export const T = {
  GRASS:   0,
  WATER:   1,
  MOUNTAIN:2,
  PATH:    3,
  FOREST:  4,
  SAND:    5,
  VILLAGE: 6,
  CASTLE:  7,
  DUNGEON: 8,
  TREE:    9,
  WALL:   10,
  FLOOR:  11,
  DOOR:   12,
  CHEST:  13,
} as const;

export const WALKABLE: Set<number> = new Set([T.GRASS, T.PATH, T.FOREST, T.SAND, T.VILLAGE, T.CASTLE, T.FLOOR, T.DOOR, T.DUNGEON]);
export const ENCOUNTER_TILES: Set<number> = new Set([T.GRASS, T.FOREST, T.SAND]);

// Map IDs
export const MAP = {
  WORLD:   'world',
  VILLAGE: 'village',
  CASTLE:  'castle',
  DUNGEON: 'dungeon',
} as const;
