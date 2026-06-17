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

// 20×16 dungeon — fully connected, no dead ends
// Main corridors at rows 1, 3, 7, 11, 13; boss at (9,1)
const DUNGEON_TILES: number[][] = [
  [Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Wl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Fl,Fl,Fl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Fl,Fl,Fl,Wl,Wl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Wl,Wl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Fl,Wl,Wl,Wl,Fl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Wl,Wl,Fl,Wl,Wl,Fl,Wl,Wl,Fl,Wl,Wl,Fl,Wl,Wl,Fl,Wl,Wl,Wl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
  [Wl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Dr,Dr,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Fl,Wl],
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
      { tileX: 2,  tileY: 2,  targetMap: 'village', targetX: 9,  targetY: 11 },
      { tileX: 35, tileY: 2,  targetMap: 'castle',  targetX: 9,  targetY: 11 },
      { tileX: 19, tileY: 19, targetMap: 'dungeon', targetX: 9,  targetY: 11 },
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
    name: '闇の洞窟',
    tiles: DUNGEON_TILES,
    bgColor: 0x110011,
    encounterGroup: 'dungeon',
    npcs: [
      {
        id: 'trapped', name: '囚われた旅人',
        dialogue: [
          '助けてくれ…！',
          'この奥に「聖石の欠片」がある。',
          '魔王の番人・シャドウナイトを倒せば手に入るはずだ。',
        ],
        tileX: 3, tileY: 5, spriteColor: 0xFF8888,
      },
      { id: 'npc_zain', name: 'ゼイン', dialogue: ['罠には気をつけろ。'], tileX: 15, tileY: 5, spriteColor: 0x44FFAA, recruitId: 'zain' },
      {
        id: 'boss_grosur', name: '魔王グロスール',
        dialogue: [
          'フハハハ！よく来たな、愚かな冒険者よ！',
          '聖石を砕いたのは我だ。この世界は闇に染まるのだ！',
          '貴様らにはここで散ってもらう！かかってこい！',
        ],
        tileX: 9, tileY: 1, spriteColor: 0xFF0044,
      },
    ],
    exits: [
      { tileX: 9,  tileY: 14, targetMap: 'world', targetX: 19, targetY: 18 },
      { tileX: 10, tileY: 14, targetMap: 'world', targetX: 19, targetY: 18 },
    ],
  },
];

export const MAP_DEF_MAP: Record<string, MapDef> = Object.fromEntries(MAP_DEFS.map(m => [m.id, m]));

export function getMapDef(id: string): MapDef {
  return MAP_DEF_MAP[id] ?? MAP_DEFS[0];
}
