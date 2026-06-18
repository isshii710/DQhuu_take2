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
  [M,G,P,G,G,G,G,G,G,G,P,G,G,G,G,P,G,G,G,G,G,G,G,F,F,F,F,F,F,F,F,F,F,D,P,G,G,G,G,M],
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
  [M,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,D,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,M],
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

// ─── 古代遺跡 (ruins→ice_cave 2-floor chain) ─────────────────────────────────
const RUINS_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

const ICE_CAVE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

// ─── 溶岩洞窟 (lava_cave→sky_castle 2-floor chain) ───────────────────────────
const LAVA_CAVE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

const SKY_CASTLE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

// ─── 海底神殿 (sea_temple→demon_castle 2-floor chain, ship required) ──────────
const SEA_TEMPLE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

const DEMON_CASTLE_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
];

export const MAP_DEFS: MapDef[] = [
  {
    id: 'world',
    name: 'エルランド大陸',
    tiles: WORLD_TILES,
    bgColor: 0x226622,
    encounterGroup: 'world_field',
    npcs: [],
    exits: [
      { tileX: 2,  tileY: 2,  targetMap: 'village',  targetX: 9,  targetY: 11 },
      { tileX: 35, tileY: 2,  targetMap: 'castle',   targetX: 9,  targetY: 11 },
      { tileX: 19, tileY: 19, targetMap: 'dungeon',  targetX: 9,  targetY: 11 },
      { tileX: 33, tileY: 10, targetMap: 'ruins',    targetX: 9,  targetY: 11 },
      { tileX: 19, tileY: 22, targetMap: 'lava_cave',targetX: 9,  targetY: 11 },
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
      { id: 'ship_merchant', name: '⛵ 船商人', dialogue: ['船を販売しています。', '5000ゴールドで購入できますよ。'], tileX: 1, tileY: 8, spriteColor: 0x44AAFF },
      { id: 'dock_captain', name: '⚓ 港の船頭', dialogue: ['船があれば海を渡れますよ。', '船をお持ちでない場合は船商人から購入してください。'], tileX: 18, tileY: 12, spriteColor: 0x2288FF },
    ],
    exits: [
      { tileX: 9,  tileY: 14, targetMap: 'world', targetX: 2, targetY: 3 },
      { tileX: 10, tileY: 14, targetMap: 'world', targetX: 2, targetY: 3 },
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
  {
    id: 'ruins',
    name: '古代遺跡 1F',
    tiles: RUINS_TILES,
    bgColor: 0x221810,
    encounterGroup: 'ruins',
    npcs: [
      { id: 'ruins_sage', name: '石碑の文字', dialogue: ['ここは太古の文明が残した遺跡だ。', '奥の階段を進めばさらに深い場所へ行ける。', '石古の守護者が眠りについているという…'], tileX: 3, tileY: 10, spriteColor: 0xAABBCC },
      { id: 'chest_ruins', name: '宝箱', dialogue: [], tileX: 15, tileY: 5, spriteColor: 0xFFD700, isChest: true, chestPool: ['potion', 'mana_herb', 'chain_mail', 'iron_helm', 'gacha_ticket'] },
    ],
    exits: [
      { tileX: 9,  tileY: 1,  targetMap: 'ice_cave', targetX: 9,  targetY: 2  },
      { tileX: 10, tileY: 1,  targetMap: 'ice_cave', targetX: 10, targetY: 2  },
      { tileX: 9,  tileY: 14, targetMap: 'world',    targetX: 33, targetY: 10 },
      { tileX: 10, tileY: 14, targetMap: 'world',    targetX: 33, targetY: 10 },
    ],
  },
  {
    id: 'ice_cave',
    name: '古代遺跡 深部',
    tiles: ICE_CAVE_TILES,
    bgColor: 0x0a1020,
    encounterGroup: 'ice_cave',
    npcs: [
      { id: 'ice_boss_npc', name: '氷竜バルノース', dialogue: ['…巨大な竜がこちらを睨みつけている！', '氷の吐息が空気を凍らせる！', '戦うしかない！'], tileX: 9, tileY: 1, spriteColor: 0x88AAFF, bossId: 'ice_boss' },
      { id: 'chest_ice', name: '宝箱', dialogue: [], tileX: 15, tileY: 5, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'ether', 'crystal_staff', 'silver_ring', 'gacha_ticket'] },
    ],
    exits: [
      { tileX: 9,  tileY: 13, targetMap: 'ruins', targetX: 9,  targetY: 3  },
      { tileX: 10, tileY: 13, targetMap: 'ruins', targetX: 10, targetY: 3  },
    ],
  },
  {
    id: 'lava_cave',
    name: '溶岩洞窟 1F',
    tiles: LAVA_CAVE_TILES,
    bgColor: 0x1a0800,
    encounterGroup: 'lava_cave',
    npcs: [
      { id: 'lava_guide', name: '岩に刻まれた文字', dialogue: ['溶岩の底に天への道がある。', '炎の試練を越えし者のみが天空の城に至れる。'], tileX: 3, tileY: 10, spriteColor: 0xFF8844 },
      { id: 'chest_lava', name: '宝箱', dialogue: [], tileX: 15, tileY: 5, spriteColor: 0xFFD700, isChest: true, chestPool: ['potion', 'elixir', 'plate_mail', 'silver_sword', 'gacha_ticket'] },
    ],
    exits: [
      { tileX: 9,  tileY: 1,  targetMap: 'sky_castle', targetX: 9,  targetY: 2  },
      { tileX: 10, tileY: 1,  targetMap: 'sky_castle', targetX: 10, targetY: 2  },
      { tileX: 9,  tileY: 14, targetMap: 'world',      targetX: 19, targetY: 22 },
      { tileX: 10, tileY: 14, targetMap: 'world',      targetX: 19, targetY: 22 },
    ],
  },
  {
    id: 'sky_castle',
    name: '天空の試練場',
    tiles: SKY_CASTLE_TILES,
    bgColor: 0x101830,
    encounterGroup: 'sky_castle',
    npcs: [
      { id: 'sky_boss_npc', name: '堕天使ラフィエル', dialogue: ['侵入者か…', '天空の聖域を踏み荒らす者には永遠の闇を与えよう。', '覚悟するがいい！'], tileX: 9, tileY: 1, spriteColor: 0xFFAA44, bossId: 'sky_boss' },
      { id: 'chest_sky', name: '宝箱', dialogue: [], tileX: 15, tileY: 5, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'ether', 'gacha_ticket', 'gacha_ticket'] },
    ],
    exits: [
      { tileX: 9,  tileY: 13, targetMap: 'lava_cave', targetX: 9,  targetY: 3  },
      { tileX: 10, tileY: 13, targetMap: 'lava_cave', targetX: 10, targetY: 3  },
    ],
  },
  {
    id: 'sea_temple',
    name: '海底神殿 1F',
    tiles: SEA_TEMPLE_TILES,
    bgColor: 0x001530,
    encounterGroup: 'sea_temple',
    npcs: [
      { id: 'sea_sage', name: '深海の霊', dialogue: ['遠路はるばる来たものじゃ。', 'この神殿の奥に魔王の城への道が続いている。', '覚悟を決めて進め。'], tileX: 3, tileY: 10, spriteColor: 0x44CCFF },
      { id: 'chest_sea', name: '宝箱', dialogue: [], tileX: 15, tileY: 5, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'ether', 'crystal_staff', 'gacha_ticket', 'gacha_ticket'] },
    ],
    exits: [
      { tileX: 9,  tileY: 1,  targetMap: 'demon_castle', targetX: 9,  targetY: 2  },
      { tileX: 10, tileY: 1,  targetMap: 'demon_castle', targetX: 10, targetY: 2  },
    ],
  },
  {
    id: 'demon_castle',
    name: '魔王の城',
    tiles: DEMON_CASTLE_TILES,
    bgColor: 0x080008,
    encounterGroup: 'demon_castle',
    npcs: [
      { id: 'demon_boss_npc', name: '魔王グロスールⅡ', dialogue: ['ははは、こんな所まで来るとは…', '我はすでに蘇っている！', '今度こそお前たちを消し去ってやる！'], tileX: 9, tileY: 1, spriteColor: 0xFF0000, bossId: 'demon_boss' },
      { id: 'chest_demon', name: '宝箱', dialogue: [], tileX: 15, tileY: 5, spriteColor: 0xFFD700, isChest: true, chestPool: ['elixir', 'elixir', 'ether', 'gacha_ticket', 'gacha_ticket'] },
    ],
    exits: [
      { tileX: 9,  tileY: 13, targetMap: 'sea_temple', targetX: 9,  targetY: 3  },
      { tileX: 10, tileY: 13, targetMap: 'sea_temple', targetX: 10, targetY: 3  },
    ],
  },
  // ─── Treasure Map Dungeons (tmap_1 – tmap_5) ────────────────────────────────
  // Each is 20 × 16. Boss NPC at (9,1). Exit door at (9,14)+(10,14) → world.
  // Player enters via MenuScreen "ダンジョンに入る" button, spawned at (9,12).

  {
    id: 'tmap_1', name: '古の洞窟', bgColor: 0x1A1208, encounterGroup: 'tmap_1',
    tiles: [
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Fl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Dr,Dr,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
    ],
    npcs: [
      { id:'tmap_boss_npc_1', name:'遺跡のゴーレム王', dialogue:['「...侵入者め...」','ゴーレム王が行く手を阻む！'], tileX:9, tileY:1, spriteColor:0x8B7355, bossId:'tmap_boss_1' },
      { id:'tmap_chest_1', name:'宝箱', dialogue:[], tileX:4, tileY:3, spriteColor:0xFFD700, isChest:true, chestPool:['potion','iron_sword','leather_armor','gacha_ticket'] },
    ],
    exits: [
      { tileX:9, tileY:14, targetMap:'world', targetX:19, targetY:18 },
      { tileX:10,tileY:14, targetMap:'world', targetX:19, targetY:18 },
    ],
  },

  {
    id: 'tmap_2', name: '幻の遺跡', bgColor: 0x100A18, encounterGroup: 'tmap_2',
    tiles: [
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Wl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Dr,Dr,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
    ],
    npcs: [
      { id:'tmap_boss_npc_2', name:'氷の幻獣フェニルス', dialogue:['「幻影の中で永遠に彷徨え！」','フェニルスが姿を現した！'], tileX:9, tileY:1, spriteColor:0x88BBFF, bossId:'tmap_boss_2' },
      { id:'tmap_chest_2', name:'宝箱', dialogue:[], tileX:4, tileY:4, spriteColor:0xFFD700, isChest:true, chestPool:['ether','steel_sword','chain_mail','gacha_ticket'] },
    ],
    exits: [
      { tileX:9, tileY:14, targetMap:'world', targetX:19, targetY:18 },
      { tileX:10,tileY:14, targetMap:'world', targetX:19, targetY:18 },
    ],
  },

  {
    id: 'tmap_3', name: '魔界の迷宮', bgColor: 0x180808, encounterGroup: 'tmap_3',
    tiles: [
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
      [Wl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Fl,Wl],
      [Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl],
      [Wl,Fl,Wl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Wl,Wl,Fl,Wl],
      [Wl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Wl],
      [Wl,Wl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Wl,Wl,Fl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Wl,Wl,Fl,Wl,Wl,Wl,Wl],
      [Wl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Fl,Fl,Wl],
      [Wl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Wl],
      [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Dr,Dr,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
    ],
    npcs: [
      { id:'tmap_boss_npc_3', name:'炎の魔獣フラガラッハ', dialogue:['「灼熱の炎で焼き尽くしてくれる！」','フラガラッハが降臨した！'], tileX:9, tileY:1, spriteColor:0xFF4400, bossId:'tmap_boss_3' },
      { id:'tmap_chest_3', name:'宝箱', dialogue:[], tileX:5, tileY:11, spriteColor:0xFFD700, isChest:true, chestPool:['elixir','flame_sword','holy_armor','gacha_ticket'] },
    ],
    exits: [
      { tileX:9, tileY:14, targetMap:'world', targetX:19, targetY:18 },
      { tileX:10,tileY:14, targetMap:'world', targetX:19, targetY:18 },
    ],
  },

  {
    id: 'tmap_4', name: '天空の試練', bgColor: 0x080C20, encounterGroup: 'tmap_4',
    tiles: [
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Fl,Fl,Fl,Wl,Wl,Fl,Fl,Wl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Fl,Wl,Wl,Fl,Fl,Wl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Dr,Dr,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
    ],
    npcs: [
      { id:'tmap_boss_npc_4', name:'深海の怪物クラーケン', dialogue:['「深淵より来たる者、汝を試さん！」','クラーケンが触手を広げた！'], tileX:9, tileY:1, spriteColor:0x0055AA, bossId:'tmap_boss_4' },
      { id:'tmap_chest_4', name:'宝箱', dialogue:[], tileX:5, tileY:5, spriteColor:0xFFD700, isChest:true, chestPool:['elixir','sky_spear','holy_armor','gacha_ticket'] },
    ],
    exits: [
      { tileX:9, tileY:14, targetMap:'world', targetX:19, targetY:18 },
      { tileX:10,tileY:14, targetMap:'world', targetX:19, targetY:18 },
    ],
  },

  {
    id: 'tmap_5', name: '海底の神殿', bgColor: 0x04080E, encounterGroup: 'tmap_5',
    tiles: [
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl,Wl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Wl,Wl],
      [Wl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Fl,Fl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Dr,Dr,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
      [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
    ],
    npcs: [
      { id:'tmap_boss_npc_5', name:'天空の魔龍セラフィア', dialogue:['「翼持つ者よ、天の試練を受けよ！」','セラフィアが舞い降りた！'], tileX:9, tileY:1, spriteColor:0xDDAAFF, bossId:'tmap_boss_5' },
      { id:'tmap_chest_5', name:'宝箱', dialogue:[], tileX:4, tileY:3, spriteColor:0xFFD700, isChest:true, chestPool:['elixir','dragon_shield','holy_helm','gacha_ticket'] },
    ],
    exits: [
      { tileX:9, tileY:14, targetMap:'world', targetX:19, targetY:18 },
      { tileX:10,tileY:14, targetMap:'world', targetX:19, targetY:18 },
    ],
  },
];

export const MAP_DEF_MAP: Record<string, MapDef> = Object.fromEntries(MAP_DEFS.map(m => [m.id, m]));

export function getMapDef(id: string): MapDef {
  return MAP_DEF_MAP[id] ?? MAP_DEFS[0];
}
