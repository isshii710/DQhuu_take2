import type { MapDef } from '../types';
import { T } from '../config';

const M = T.MOUNTAIN;
const G = T.GRASS;
const P = T.PATH;
const W = T.WATER;
const F = T.FOREST;
const V = T.VILLAGE;
const C = T.CASTLE;
const D = T.DUNGEON;
const Tr= T.TREE;
const Wl= T.WALL;
const Fl= T.FLOOR;
const Dr= T.DOOR;

// 40×40 world overworld map
// V=ハジメ村(top-left), C=アルデア城(top-right), D=ダンジョン(bottom-center)
const WORLD_TILES: number[][] = [
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,V,V,V,V,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,C,C,C,C,C,M],
  [M,V,V,V,V,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,C,C,C,C,C,M],
  [M,V,V,V,V,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,C,C,C,C,C,M],
  [M,V,V,V,V,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,P,P,P,P,P,M],
  [M,M,P,M,M,P,G,Tr,G,G,Tr,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,Tr,Tr,Tr,G,G,P,G,G,G,G,M],
  [M,G,P,G,G,P,G,Tr,Tr,G,Tr,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,Tr,Tr,Tr,Tr,Tr,Tr,Tr,G,P,G,G,G,G,M],
  [M,G,P,G,G,P,P,P,P,P,P,P,P,P,G,G,G,G,G,G,G,G,G,G,G,Tr,F,F,F,F,F,F,Tr,G,P,G,G,G,G,M],
  [M,G,P,G,G,G,G,G,G,G,P,G,G,P,G,G,G,G,G,G,G,G,G,G,F,F,F,F,F,F,F,F,F,G,P,G,G,G,G,M],
  [M,G,P,G,G,G,G,G,G,G,P,G,G,P,P,P,G,G,G,G,G,G,G,F,F,F,F,F,F,F,F,F,F,G,P,G,G,G,G,M],
  [M,G,P,G,G,G,G,G,G,G,P,G,G,G,G,P,G,G,G,G,G,G,G,F,F,F,F,F,F,F,F,F,F,G,P,G,G,G,G,M],
  [M,G,P,P,P,P,P,P,P,G,P,G,G,G,G,P,G,G,G,G,G,G,G,F,F,F,F,F,F,F,F,F,G,G,P,G,G,G,G,M],
  [M,G,G,G,G,G,G,G,P,G,P,G,G,G,G,P,G,G,G,G,G,G,G,G,F,F,F,F,F,F,F,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,W,W,W,G,P,G,P,P,P,G,G,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,W,W,W,W,W,P,G,G,G,P,G,G,P,P,P,P,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,W,W,W,W,W,P,G,G,G,P,G,G,G,G,G,G,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,W,W,W,G,P,G,G,G,P,P,P,G,G,G,G,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,G,G,G,G,P,P,P,P,G,G,P,G,G,G,G,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,G,G,G,G,G,G,G,P,G,G,P,G,G,G,G,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,G,G,G,G,G,G,G,P,G,G,P,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,G,G,G,G,G,G,G,P,G,G,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,G,G,G,G,G,G,G,P,P,P,P,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
  [M,M,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M,M],
  [M,M,M,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
  [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
];

// Inject new area dungeon entrances into world map
WORLD_TILES[22][8]  = D; // 古代遺跡
WORLD_TILES[9][21]  = D; // 氷の洞窟
WORLD_TILES[22][30] = D; // 溶岩洞窟
WORLD_TILES[25][10] = D; // 海底神殿
WORLD_TILES[20][25] = D; // 天空城
WORLD_TILES[26][20] = D; // 魔王の城

// 20×16 village interior
const VILLAGE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Dr,Fl,Fl,Fl,Wl,Fl,Dr,Fl,Fl,Wl,Fl,Dr,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Dr,Fl,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Fl,Dr,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

// 20×16 castle interior
const CASTLE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

// ─────────────────────────────────────────────────────────────────────────────
// House interiors (10×8 each)  exit door at bottom-center (4,7)/(5,7)
// ─────────────────────────────────────────────────────────────────────────────

// house1 — 農家のおじさんの家
const HOUSE1_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Fl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Dr,Dr,Wl,Wl,Wl,Wl],
];

// house2 — 魔法使いのおばあさんの家
const HOUSE2_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Fl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Dr,Dr,Wl,Wl,Wl,Wl],
];

// house3 — 若き剣士の家
const HOUSE3_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Dr,Dr,Wl,Wl,Wl,Wl],
];

// ─────────────────────────────────────────────────────────────────────────────
// 3-floor dungeon  (20×16 each)
// B1F (dungeon)  : world entrance at bottom (9,14)/(10,14); stairs to B2F at (9,1)/(10,1)
// B2F (dungeon2) : stairs up at (9,1)/(10,1); stairs down to B3F at (9,13)/(10,13)
// B3F (dungeon3) : arrive at (9,2); boss at (9,1); stairs back at (9,13)/(10,13)
// ─────────────────────────────────────────────────────────────────────────────

// B1F — wide open corridors with pillar columns, no boss
const DUNGEON_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],  // ↓B2F stairs
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],  // ↑world exit
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

// B2F — medium-depth floor, stairs up/down
const DUNGEON2_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],  // ↑B1F stairs
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],  // ↓B3F stairs
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

// B3F — boss chamber; corridor funnels to a wide boss arena at the top
const DUNGEON3_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],  // boss at (9,1)
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],  // arrive at (9,2)
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],  // chest at (15,3)
  [Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl],
  [Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl],
  [Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl],
  [Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl],
  [Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl],
  [Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl],  // ↑B2F stairs
  [Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

// ─── New story areas (16×12 each) ────────────────────────────────────────────

const RUINS_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Fl,Wl,Fl,Fl,Wl,Fl,Fl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

const ICE_CAVE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Wl,Fl,Fl,Wl,Fl,Wl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

const LAVA_CAVE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Wl],
  [Wl,Wl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Fl,Fl,Wl,Fl,Fl,Wl,Fl,Fl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

const SEA_TEMPLE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Fl,Wl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Wl,Fl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

const SKY_CASTLE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Fl,Wl,Fl,Fl,Wl,Fl,Fl,Wl,Fl,Fl,Wl,Fl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

const DEMON_CASTLE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Fl,Fl,Wl,Fl,Fl,Wl,Fl,Fl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

// ─── Treasure map dungeons (16×12 each) ──────────────────────────────────────

const TMAP1_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl], // boss NPC at (8,10)
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];
const TMAP2_TILES: number[][] = JSON.parse(JSON.stringify(TMAP1_TILES));
const TMAP3_TILES: number[][] = JSON.parse(JSON.stringify(TMAP1_TILES));
const TMAP4_TILES: number[][] = JSON.parse(JSON.stringify(TMAP1_TILES));
const TMAP5_TILES: number[][] = JSON.parse(JSON.stringify(TMAP1_TILES));

export const MAP_DEFS: MapDef[] = [
  {
    id: 'world',
    name: 'エルランド大陸',
    tiles: WORLD_TILES,
    bgColor: 0x226622,
    encounterGroup: 'world_field',
    npcs: [],
    exits: [
      { tileX: 2,  tileY: 2,  targetMap: 'village',      targetX: 9,  targetY: 11 },
      { tileX: 35, tileY: 2,  targetMap: 'castle',       targetX: 9,  targetY: 11 },
      { tileX: 19, tileY: 19, targetMap: 'dungeon',      targetX: 9,  targetY: 11 },
      { tileX: 8,  tileY: 22, targetMap: 'ruins',        targetX: 7,  targetY: 9  },
      { tileX: 21, tileY: 9,  targetMap: 'ice_cave',    targetX: 7,  targetY: 9  },
      { tileX: 30, tileY: 22, targetMap: 'lava_cave',   targetX: 7,  targetY: 9  },
      { tileX: 10, tileY: 25, targetMap: 'sea_temple',  targetX: 7,  targetY: 9  },
      { tileX: 25, tileY: 20, targetMap: 'sky_castle',  targetX: 7,  targetY: 9  },
      { tileX: 20, tileY: 26, targetMap: 'demon_castle',targetX: 7,  targetY: 9  },
    ],
  },
  {
    id: 'village',
    name: 'ハジメ村',
    tiles: VILLAGE_TILES,
    bgColor: 0x334422,
    npcs: [
      {
        id: 'elder', name: '村長',
        dialogue: [
          'ようこそ、ハジメ村へ。',
          '魔王グロスールが「聖石」を砕いて世界に災いをもたらしている。',
          '4つの聖石の欠片を集め、魔王を倒してくれ！',
          '北東にあるアルデア城の王様から話を聞くといい。',
        ],
        tileX: 10, tileY: 6, spriteColor: 0xFFDD88,
      },
      {
        id: 'shopkeeper', name: '商人',
        dialogue: ['何か必要なものがあれば声をかけてくれ。'],
        tileX: 5, tileY: 10, spriteColor: 0x88AAFF,
      },
      {
        id: 'guide', name: '旅人',
        dialogue: [
          '洞窟には強い魔物が住んでいる。',
          '十分に装備を整えてから挑んだ方がいい。',
          'フィールドで戦って経験値を積もう！',
        ],
        tileX: 15, tileY: 10, spriteColor: 0xFFAAAA,
      },
      { id: 'weapon_keeper', name: '武器屋', dialogue: ['いらっしゃい！', '⚔ 武器屋です。強い武器を取り揃えております！'], tileX: 3, tileY: 3, spriteColor: 0xFF5533, shopType: 'weapon' },
      { id: 'armor_keeper',  name: '防具屋', dialogue: ['いらっしゃい！', '🛡 防具屋です。頑丈な防具を揃えています！'],  tileX: 9, tileY: 3, spriteColor: 0x3355FF, shopType: 'armor' },
      { id: 'item_keeper',   name: '道具屋', dialogue: ['いらっしゃい！', '🌿 道具屋です。回復アイテムが充実！'],        tileX: 14,tileY: 3, spriteColor: 0x33AA44, shopType: 'item' },
      { id: 'inn_keeper', name: '🏨 宿屋のおかみ', dialogue: ['ここは宿屋です。'], tileX: 15, tileY: 5, spriteColor: 0xFFCCAA, isInn: true },
      { id: 'npc_aria', name: 'アリア', dialogue: ['みんなのHPを回復します！'], tileX: 7, tileY: 6, spriteColor: 0xFF88CC, recruitId: 'aria' },
      { id: 'npc_galen', name: 'ガレン', dialogue: ['俺が守ってやる！'], tileX: 13, tileY: 7, spriteColor: 0xFFAA44, recruitId: 'galen' },
      { id: 'npc_elda', name: 'エルダ', dialogue: ['光の加護がありますように。'], tileX: 7, tileY: 10, spriteColor: 0xFFFFAA, recruitId: 'elda' },
      { id: 'church', name: '神父', dialogue: ['神の祝福を。'], tileX: 17, tileY: 3, spriteColor: 0xFFFFFF, isChurch: true },
      { id: 'medal_master', name: 'メダル親父', dialogue: ['ちいさなメダルを集めておるか？', '10枚で聖水、20枚でエリクサーと交換してやろう。'], tileX: 1, tileY: 6, spriteColor: 0xAAAA44 },
    ],
    exits: [
      { tileX: 9,  tileY: 14, targetMap: 'world',  targetX: 2,  targetY: 3 },
      { tileX: 10, tileY: 14, targetMap: 'world',  targetX: 2,  targetY: 3 },
      // House entrances — walk into door tile to enter
      { tileX: 4,  tileY: 4,  targetMap: 'house1', targetX: 4,  targetY: 5 },
      { tileX: 10, tileY: 4,  targetMap: 'house2', targetX: 4,  targetY: 5 },
      { tileX: 15, tileY: 4,  targetMap: 'house3', targetX: 4,  targetY: 5 },
    ],
  },
  {
    id: 'castle',
    name: 'アルデア城',
    tiles: CASTLE_TILES,
    bgColor: 0x334455,
    npcs: [
      {
        id: 'king', name: '国王アルデア',
        dialogue: [
          'よく来た、勇者よ。',
          '魔王グロスールは「聖石」を4つに砕き、大陸各地に散らした。',
          '聖石が揃えば魔王を封じることができる。',
          '南の洞窟にある石から探してみよ。健闘を祈る！',
        ],
        tileX: 9, tileY: 7, spriteColor: 0xFFD700,
      },
      {
        id: 'knight', name: '城の騎士',
        dialogue: ['魔王の手下が洞窟に集まっているらしい。気をつけて！'],
        tileX: 5, tileY: 6, spriteColor: 0xAABBCC,
      },
      {
        id: 'knight2', name: '城の騎士',
        dialogue: ['この城には王国の宝が眠っている。いつか探してみよ。'],
        tileX: 13, tileY: 6, spriteColor: 0xAABBCC,
      },
      { id: 'npc_luna', name: 'ルナ', dialogue: ['魔法の力を使います！'], tileX: 3, tileY: 2, spriteColor: 0x8888FF, recruitId: 'luna' },
      { id: 'npc_balt', name: 'バルト', dialogue: ['合格だ。一緒に行ってやる。'], tileX: 15, tileY: 2, spriteColor: 0xFF5555, recruitId: 'balt' },
      { id: 'npc_shena', name: 'シェナ', dialogue: ['星の導きにより…'], tileX: 9, tileY: 5, spriteColor: 0xFF44FF, recruitId: 'shena' },
      { id: 'npc_rai', name: 'ライ', dialogue: ['生き残ろうぜ。'], tileX: 3, tileY: 12, spriteColor: 0x44CCFF, recruitId: 'rai' },
    ],
    exits: [
      { tileX: 9,  tileY: 14, targetMap: 'world', targetX: 35, targetY: 3 },
      { tileX: 10, tileY: 14, targetMap: 'world', targetX: 35, targetY: 3 },
    ],
  },
  {
    id: 'dungeon',
    name: '闇の洞窟 地下1階',
    tiles: DUNGEON_TILES,
    bgColor: 0x110011,
    encounterGroup: 'dungeon',
    npcs: [
      {
        id: 'trapped', name: '囚われた旅人',
        dialogue: [
          '助けてくれ…！',
          'もっと奥に行くと「聖石の欠片」がある。',
          '地下3階に魔王グロスールが待ち受けているぞ！',
        ],
        tileX: 2, tileY: 10, spriteColor: 0xFF8888,
      },
      { id: 'npc_zain', name: 'ゼイン', dialogue: ['罠には気をつけろ。'], tileX: 17, tileY: 10, spriteColor: 0x44FFAA, recruitId: 'zain' },
      {
        id: 'chest_b1f', name: '宝箱', dialogue: [],
        tileX: 3, tileY: 5, spriteColor: 0xFFD700,
        isChest: true,
        chestPool: ['herb', 'potion', 'antidote', 'leather', 'wood_sword', 'dagger'],
      },
    ],
    exits: [
      { tileX: 9,  tileY: 1,  targetMap: 'dungeon2', targetX: 9,  targetY: 2  },
      { tileX: 10, tileY: 1,  targetMap: 'dungeon2', targetX: 10, targetY: 2  },
      { tileX: 9,  tileY: 14, targetMap: 'world',    targetX: 19, targetY: 18 },
      { tileX: 10, tileY: 14, targetMap: 'world',    targetX: 19, targetY: 18 },
    ],
  },
  {
    id: 'dungeon2',
    name: '闇の洞窟 地下2階',
    tiles: DUNGEON2_TILES,
    bgColor: 0x0d000d,
    encounterGroup: 'dungeon',
    npcs: [
      {
        id: 'sage_b2f', name: '謎の賢者',
        dialogue: [
          '地下3階には強大な魔王グロスールが棲む。',
          '十分に準備を整えてから挑め。',
          '地上に戻るには上の階段を使うのじゃ。',
        ],
        tileX: 3, tileY: 10, spriteColor: 0xAAAAFF,
      },
      {
        id: 'chest_b2f', name: '宝箱', dialogue: [],
        tileX: 15, tileY: 5, spriteColor: 0xFFD700,
        isChest: true,
        chestPool: ['potion', 'mana_herb', 'chain_mail', 'iron_helm', 'staff', 'leather_ring'],
      },
    ],
    exits: [
      { tileX: 9,  tileY: 1,  targetMap: 'dungeon',  targetX: 9,  targetY: 3  },
      { tileX: 10, tileY: 1,  targetMap: 'dungeon',  targetX: 10, targetY: 3  },
      { tileX: 9,  tileY: 13, targetMap: 'dungeon3', targetX: 9,  targetY: 2  },
      { tileX: 10, tileY: 13, targetMap: 'dungeon3', targetX: 10, targetY: 2  },
    ],
  },
  {
    id: 'house1',
    name: '農家の家',
    tiles: HOUSE1_TILES,
    bgColor: 0x2A1A08,
    npcs: [
      {
        id: 'farmer', name: '農家のおじさん',
        dialogue: [
          'おお、旅人か！ゆっくりしていきな。',
          'この村はのどかでいい所だろ？',
          '北の城に行く前に、しっかり装備を整えるんだぞ。',
        ],
        tileX: 5, tileY: 3, spriteColor: 0xCC9944,
      },
    ],
    exits: [
      { tileX: 4, tileY: 7, targetMap: 'village', targetX: 4,  targetY: 5 },
      { tileX: 5, tileY: 7, targetMap: 'village', targetX: 4,  targetY: 5 },
    ],
  },
  {
    id: 'house2',
    name: '魔法使いの家',
    tiles: HOUSE2_TILES,
    bgColor: 0x0A0A20,
    npcs: [
      {
        id: 'old_mage', name: '魔法使いのおばあさん',
        dialogue: [
          'ふっふっふ、珍しい客じゃな。',
          '魔法は心の力。焦らず修行を積むのじゃ。',
          'グロスールを倒せるほどの力がおぬしにあるか？',
        ],
        tileX: 5, tileY: 3, spriteColor: 0xAA88FF,
      },
    ],
    exits: [
      { tileX: 4, tileY: 7, targetMap: 'village', targetX: 10, targetY: 5 },
      { tileX: 5, tileY: 7, targetMap: 'village', targetX: 10, targetY: 5 },
    ],
  },
  {
    id: 'house3',
    name: '剣士の家',
    tiles: HOUSE3_TILES,
    bgColor: 0x1A0A0A,
    npcs: [
      {
        id: 'young_knight', name: '若き剣士',
        dialogue: [
          'やあ！俺も冒険に出たいんだが…',
          '親父が「まだ早い」って言って聞かないんだ。',
          '魔王を倒したら俺の話も聞いてくれるかな。',
        ],
        tileX: 5, tileY: 3, spriteColor: 0xFF6644,
      },
    ],
    exits: [
      { tileX: 4, tileY: 7, targetMap: 'village', targetX: 15, targetY: 5 },
      { tileX: 5, tileY: 7, targetMap: 'village', targetX: 15, targetY: 5 },
    ],
  },
  {
    id: 'dungeon3',
    name: '闇の洞窟 地下3階',
    tiles: DUNGEON3_TILES,
    bgColor: 0x080008,
    encounterGroup: 'dungeon',
    npcs: [
      {
        id: 'boss_grosur', name: '魔王グロスール',
        dialogue: [
          'フハハハ！よく来たな、愚かな冒険者よ！',
          '聖石を砕いたのは我だ。この世界は闇に染まるのだ！',
          '貴様らにはここで散ってもらう！かかってこい！',
        ],
        tileX: 9, tileY: 1, spriteColor: 0xFF0044,
      },
      {
        id: 'chest_b3f', name: '宝箱', dialogue: [],
        tileX: 15, tileY: 3, spriteColor: 0xFFD700,
        isChest: true,
        chestPool: ['elixir', 'ether', 'plate_mail', 'silver_sword', 'crystal_staff', 'silver_ring'],
      },
    ],
    exits: [
      { tileX: 9,  tileY: 13, targetMap: 'dungeon2', targetX: 9,  targetY: 12 },
      { tileX: 10, tileY: 13, targetMap: 'dungeon2', targetX: 10, targetY: 12 },
    ],
  },

  // ─── New story areas ───────────────────────────────────────────────────────
  {
    id: 'ruins', name: '古代遺跡', tiles: RUINS_TILES,
    bgColor: 0x1A1408, encounterGroup: 'ruins',
    npcs: [
      { id: 'ruins_sage', name: '石板の文字', dialogue: ['「最奥に眠る守護者を打ち破りし者に、大地の力を与えん」'], tileX: 2, tileY: 1, spriteColor: 0xCC9944 },
      { id: 'boss_ruins', name: '石古の守護者', dialogue: ['ガガガ…侵入者ヲ排除スル…！'], tileX: 8, tileY: 1, spriteColor: 0x888866, bossId: 'ruins_boss' },
      { id: 'chest_ruins', name: '宝箱', dialogue: [], tileX: 14, tileY: 1, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'plate_mail', 'gacha_ticket', 'iron_helm'] },
    ],
    exits: [{ tileX: 7, tileY: 10, targetMap: 'world', targetX: 8, targetY: 22 }, { tileX: 8, tileY: 10, targetMap: 'world', targetX: 8, targetY: 22 }],
  },
  {
    id: 'ice_cave', name: '氷の洞窟', tiles: ICE_CAVE_TILES,
    bgColor: 0x080C1A, encounterGroup: 'ice_cave',
    npcs: [
      { id: 'ice_sage', name: '凍り付いた石板', dialogue: ['「この氷の深淵で、古の竜が怒りに眠る…」'], tileX: 2, tileY: 1, spriteColor: 0x88CCFF },
      { id: 'boss_ice', name: '氷竜バルノース', dialogue: ['目覚めを妨げた者よ…永久の氷に閉じ込めてやろう！'], tileX: 8, tileY: 1, spriteColor: 0xAADDFF, bossId: 'ice_boss' },
      { id: 'chest_ice', name: '宝箱', dialogue: [], tileX: 14, tileY: 1, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'chain_mail', 'gacha_ticket', 'ether'] },
    ],
    exits: [{ tileX: 7, tileY: 10, targetMap: 'world', targetX: 21, targetY: 9 }, { tileX: 8, tileY: 10, targetMap: 'world', targetX: 21, targetY: 9 }],
  },
  {
    id: 'lava_cave', name: '溶岩洞窟', tiles: LAVA_CAVE_TILES,
    bgColor: 0x1A0400, encounterGroup: 'lava_cave',
    npcs: [
      { id: 'lava_sage', name: '燃え盛る石碑', dialogue: ['「灼熱の王は滅びを司る。その力は計り知れない…」'], tileX: 2, tileY: 1, spriteColor: 0xFF8844 },
      { id: 'boss_lava', name: '炎の大巨人', dialogue: ['グオォォ！貴様らを灰にしてくれる！'], tileX: 8, tileY: 1, spriteColor: 0xFF4422, bossId: 'lava_boss' },
      { id: 'chest_lava', name: '宝箱', dialogue: [], tileX: 14, tileY: 1, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'plate_mail', 'gacha_ticket', 'crystal_staff'] },
    ],
    exits: [{ tileX: 7, tileY: 10, targetMap: 'world', targetX: 30, targetY: 22 }, { tileX: 8, tileY: 10, targetMap: 'world', targetX: 30, targetY: 22 }],
  },
  {
    id: 'sea_temple', name: '海底神殿', tiles: SEA_TEMPLE_TILES,
    bgColor: 0x001020, encounterGroup: 'sea_temple',
    npcs: [
      { id: 'sea_sage', name: '海底の碑文', dialogue: ['「深淵の神は古の誓いを守り、永劫にこの場所を守護する…」'], tileX: 2, tileY: 1, spriteColor: 0x2288FF },
      { id: 'boss_sea', name: '海神レヴィアタン', dialogue: ['この聖域を汚す者よ！海の怒りを受けるがいい！'], tileX: 8, tileY: 1, spriteColor: 0x0044AA, bossId: 'sea_boss' },
      { id: 'chest_sea', name: '宝箱', dialogue: [], tileX: 14, tileY: 1, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'holy_armor', 'gacha_ticket', 'ether'] },
    ],
    exits: [{ tileX: 7, tileY: 10, targetMap: 'world', targetX: 10, targetY: 25 }, { tileX: 8, tileY: 10, targetMap: 'world', targetX: 10, targetY: 25 }],
  },
  {
    id: 'sky_castle', name: '天空城', tiles: SKY_CASTLE_TILES,
    bgColor: 0x080830, encounterGroup: 'sky_castle',
    npcs: [
      { id: 'sky_sage', name: '天空の碑', dialogue: ['「かつて天使たちが守りし聖域、今は堕ちた者に支配されている…」'], tileX: 2, tileY: 1, spriteColor: 0xFFFFAA },
      { id: 'boss_sky', name: '堕天使ラフィエル', dialogue: ['愚かな人間が！この天空城に足を踏み入れた罰を受けよ！'], tileX: 8, tileY: 1, spriteColor: 0xCCCCFF, bossId: 'sky_boss' },
      { id: 'chest_sky', name: '宝箱', dialogue: [], tileX: 14, tileY: 1, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'holy_helm', 'gacha_ticket', 'speed_boots'] },
    ],
    exits: [{ tileX: 7, tileY: 10, targetMap: 'world', targetX: 25, targetY: 20 }, { tileX: 8, tileY: 10, targetMap: 'world', targetX: 25, targetY: 20 }],
  },
  {
    id: 'demon_castle', name: '魔王の城', tiles: DEMON_CASTLE_TILES,
    bgColor: 0x080008, encounterGroup: 'demon_castle',
    npcs: [
      { id: 'demon_sage', name: '呪われた石板', dialogue: ['「魔王は滅びても、その怨念が新たな器に宿った…最後の戦いに備えよ」'], tileX: 2, tileY: 1, spriteColor: 0xFF44FF },
      { id: 'boss_demon', name: '魔王グロスールⅡ', dialogue: ['フハハハ！我は滅びぬ！お前たちをここで葬り去ってやる！'], tileX: 8, tileY: 1, spriteColor: 0xFF0088, bossId: 'demon_boss' },
      { id: 'chest_demon', name: '宝箱', dialogue: [], tileX: 14, tileY: 1, spriteColor: 0xFFD700, isChest: true, chestPool: ['dark_scythe', 'holy_sword', 'elixir', 'ether'] },
    ],
    exits: [{ tileX: 7, tileY: 10, targetMap: 'world', targetX: 20, targetY: 26 }, { tileX: 8, tileY: 10, targetMap: 'world', targetX: 20, targetY: 26 }],
  },

  // ─── Treasure map dungeons ─────────────────────────────────────────────────
  {
    id: 'tmap_1', name: '古の地図①', tiles: TMAP1_TILES,
    bgColor: 0x14100A, encounterGroup: 'tmap_1',
    npcs: [
      { id: 'tmap1_boss', name: '遺跡のゴーレム王', dialogue: ['侵入者ヨ…地図ノ力ヲ返セ！'], tileX: 8, tileY: 10, spriteColor: 0x888866, bossId: 'tmap_boss_1' },
      { id: 'tmap1_chest', name: '宝箱', dialogue: [], tileX: 13, tileY: 3, spriteColor: 0xFFD700, isChest: true, chestPool: ['potion', 'elixir', 'gacha_ticket', 'iron_sword'] },
    ],
    exits: [{ tileX: 7, tileY: 1, targetMap: 'world', targetX: 20, targetY: 20 }],
  },
  {
    id: 'tmap_2', name: '古の地図②', tiles: TMAP2_TILES,
    bgColor: 0x080C14, encounterGroup: 'tmap_2',
    npcs: [
      { id: 'tmap2_boss', name: '氷の幻獣フェニルス', dialogue: ['この地図の先に眠る力は渡さぬ！'], tileX: 8, tileY: 10, spriteColor: 0xAADDFF, bossId: 'tmap_boss_2' },
      { id: 'tmap2_chest', name: '宝箱', dialogue: [], tileX: 13, tileY: 3, spriteColor: 0xFFD700, isChest: true, chestPool: ['ether', 'elixir', 'gacha_ticket', 'crystal_staff'] },
    ],
    exits: [{ tileX: 7, tileY: 1, targetMap: 'world', targetX: 20, targetY: 20 }],
  },
  {
    id: 'tmap_3', name: '古の地図③', tiles: TMAP3_TILES,
    bgColor: 0x140400, encounterGroup: 'tmap_3',
    npcs: [
      { id: 'tmap3_boss', name: '炎の魔獣フラガラッハ', dialogue: ['地図を持つ者に、炎の試練を与えよう！'], tileX: 8, tileY: 10, spriteColor: 0xFF6622, bossId: 'tmap_boss_3' },
      { id: 'tmap3_chest', name: '宝箱', dialogue: [], tileX: 13, tileY: 3, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'plate_mail', 'gacha_ticket', 'shadow_blade'] },
    ],
    exits: [{ tileX: 7, tileY: 1, targetMap: 'world', targetX: 20, targetY: 20 }],
  },
  {
    id: 'tmap_4', name: '古の地図④', tiles: TMAP4_TILES,
    bgColor: 0x001018, encounterGroup: 'tmap_4',
    npcs: [
      { id: 'tmap4_boss', name: '深海の怪物クラーケン', dialogue: ['この地図は我の縄張り…砕いてくれる！'], tileX: 8, tileY: 10, spriteColor: 0x224488, bossId: 'tmap_boss_4' },
      { id: 'tmap4_chest', name: '宝箱', dialogue: [], tileX: 13, tileY: 3, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'holy_armor', 'gacha_ticket', 'ocean_staff'] },
    ],
    exits: [{ tileX: 7, tileY: 1, targetMap: 'world', targetX: 20, targetY: 20 }],
  },
  {
    id: 'tmap_5', name: '古の地図⑤', tiles: TMAP5_TILES,
    bgColor: 0x060820, encounterGroup: 'tmap_5',
    npcs: [
      { id: 'tmap5_boss', name: '天空の魔龍セラフィア', dialogue: ['地図の謎を解いた者よ…我を倒せるか！'], tileX: 8, tileY: 10, spriteColor: 0xCCAAFF, bossId: 'tmap_boss_5' },
      { id: 'tmap5_chest', name: '宝箱', dialogue: [], tileX: 13, tileY: 3, spriteColor: 0xFFD700, isChest: true, chestPool: ['dark_scythe', 'elixir', 'gacha_ticket', 'sky_lance'] },
    ],
    exits: [{ tileX: 7, tileY: 1, targetMap: 'world', targetX: 20, targetY: 20 }],
  },
];

export const MAP_DEF_MAP: Record<string, MapDef> = Object.fromEntries(MAP_DEFS.map(m => [m.id, m]));

export function getMapDef(id: string): MapDef {
  return MAP_DEF_MAP[id] ?? MAP_DEFS[0];
}
