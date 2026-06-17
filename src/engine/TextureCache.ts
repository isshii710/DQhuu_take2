import * as THREE from 'three';
import { T } from '../config';

// ─── Palette ─────────────────────────────────────────────────────────────────

const SKIN     = '#F4C59F';
const HAIR_BRN = '#6B3A2A';
const HAIR_BLK = '#2C1810';
const HAIR_BLU = '#203070';
const HAIR_ORG = '#CC6620';
const ARMOR_BL = '#2C4A8C';
const ARMOR_PU = '#6A1A8C';
const ARMOR_GR = '#2A6B3A';
const ARMOR_DK = '#222244';
const WPN_SIL  = '#B8B8C8';
const WPN_GLD  = '#FFD700';

const CLASS_PALETTES: [string, string, string][] = [
  [HAIR_BRN, ARMOR_BL, WPN_SIL],
  [HAIR_BLU, ARMOR_PU, WPN_GLD],
  [HAIR_ORG, ARMOR_GR, WPN_GLD],
  [HAIR_BLK, ARMOR_DK, WPN_SIL],
];

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function hex(n: number, alpha = 1): string {
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return alpha < 1
    ? `rgba(${r},${g},${b},${alpha})`
    : `rgb(${r},${g},${b})`;
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
}

function circle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function ellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function tri(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

// ─── Hero sprite (32×32 per frame, 8 frames wide = 4 dirs × 2 walk) ─────────

function drawHeroFrame(ctx: CanvasRenderingContext2D, ox: number, hair: string, armor: string, wpn: string, frame: number) {
  const lo = frame === 1 ? 1 : 0;

  // Hair
  rect(ctx, ox+12, 0,  8, 5,  hair);
  // Face
  rect(ctx, ox+12, 4,  8, 8,  SKIN);
  // Eyes
  rect(ctx, ox+14, 7,  2, 2,  '#222222');
  rect(ctx, ox+18, 7,  2, 2,  '#222222');
  // Body
  rect(ctx, ox+9,  12, 14, 10, armor);
  // Arms
  rect(ctx, ox+5,  12, 4,  9,  armor);
  rect(ctx, ox+23, 12, 4,  9,  armor);
  // Weapon
  rect(ctx, ox+27, 10, 3, 14, wpn);
  // Legs
  rect(ctx, ox+11, 22, 5, 8+lo, '#4A3020');
  rect(ctx, ox+16, 22, 5, 8-lo, '#4A3020');
  // Boots
  rect(ctx, ox+11, 28+lo, 5, 4, '#221808');
  rect(ctx, ox+16, 28-lo, 5, 4, '#221808');
}

const heroTextureCache = new Map<number, THREE.CanvasTexture>();
const heroCanvasCache  = new Map<number, HTMLCanvasElement>();

export function getHeroTexture(classIndex: number): THREE.CanvasTexture {
  if (heroTextureCache.has(classIndex)) return heroTextureCache.get(classIndex)!;

  const FRAME_W = 32, FRAME_H = 32, DIRS = 4, FRAMES = 2;
  const [canvas, ctx] = makeCanvas(FRAME_W * DIRS * FRAMES, FRAME_H);
  heroCanvasCache.set(classIndex, canvas);

  const [hair, armor, wpn] = CLASS_PALETTES[classIndex] ?? CLASS_PALETTES[0];
  for (let dir = 0; dir < DIRS; dir++) {
    for (let fr = 0; fr < FRAMES; fr++) {
      const ox = (dir * FRAMES + fr) * FRAME_W;
      drawHeroFrame(ctx, ox, hair, armor, wpn, fr);
    }
  }
  const tex = makeTexture(canvas);
  heroTextureCache.set(classIndex, tex);
  return tex;
}

export function getHeroCanvas(classIndex: number): HTMLCanvasElement {
  getHeroTexture(classIndex);
  return heroCanvasCache.get(classIndex)!;
}

// ─── NPC sprite ───────────────────────────────────────────────────────────────

let npcTexture: THREE.CanvasTexture | null = null;

export function getNpcTexture(): THREE.CanvasTexture {
  if (npcTexture) return npcTexture;
  const [canvas, ctx] = makeCanvas(32, 32);
  drawHeroFrame(ctx, 0, HAIR_BRN, '#884422', '#8B5020', 0);
  npcTexture = makeTexture(canvas);
  return npcTexture;
}

// ─── Tile canvases ────────────────────────────────────────────────────────────

const tileCanvasCache = new Map<number, HTMLCanvasElement>();

export function getTileCanvas(tileId: number): HTMLCanvasElement {
  if (tileCanvasCache.has(tileId)) return tileCanvasCache.get(tileId)!;
  const S = 32;
  const [canvas, ctx] = makeCanvas(S, S);
  drawTile(ctx, tileId, S);
  tileCanvasCache.set(tileId, canvas);
  return canvas;
}

function drawTile(ctx: CanvasRenderingContext2D, id: number, S: number) {
  switch (id) {
    case T.GRASS:
      rect(ctx, 0, 0, S, S, '#4CAF50');
      rect(ctx, 4, 6,  4, 3, '#388E3C');
      rect(ctx, 12,20, 4, 3, '#388E3C');
      rect(ctx, 24,10, 4, 3, '#388E3C');
      rect(ctx, 20,26, 4, 3, '#388E3C');
      break;
    case T.WATER:
      rect(ctx, 0, 0, S, S, '#1565C0');
      rect(ctx, 0, 8, S, 6, '#1976D2');
      rect(ctx, 0, 22,S, 6, '#1976D2');
      rect(ctx, 4, 10, 8, 2, '#64B5F6');
      rect(ctx, 18,24,10, 2, '#64B5F6');
      break;
    case T.MOUNTAIN:
      rect(ctx, 0, 0, S, S, '#616161');
      tri(ctx, 16,4, 2,28, 30,28, '#757575');
      tri(ctx, 16,4, 10,16, 22,16, '#EEEEEE');
      break;
    case T.PATH:
      rect(ctx, 0, 0, S, S, '#8D6E63');
      rect(ctx, 2, 2, 4, 4, '#795548');
      rect(ctx, 20,16, 6, 4, '#795548');
      rect(ctx, 10,24, 4, 4, '#795548');
      break;
    case T.FOREST:
      rect(ctx, 0, 0, S, S, '#2E7D32');
      rect(ctx, 2, 2,28,28, '#1B5E20');
      tri(ctx, 16,2, 4,22, 28,22, '#43A047');
      tri(ctx, 16,8, 6,24, 26,24, '#43A047');
      break;
    case T.SAND:
      rect(ctx, 0, 0, S, S, '#F9A825');
      rect(ctx, 6, 8, 4, 4, '#F57F17');
      rect(ctx, 20,18, 6, 4, '#F57F17');
      rect(ctx, 12,26, 4, 4, '#F57F17');
      break;
    case T.VILLAGE:
      rect(ctx, 0, 0, S, S, '#8D6E63');
      rect(ctx, 4,12,24,16, '#D7CCC8');
      tri(ctx, 16,2, 2,14, 30,14, '#C62828');
      rect(ctx, 13,20, 6, 8, '#5D4037');
      rect(ctx, 6, 16, 6, 6, '#FFB300');
      rect(ctx, 20,16, 6, 6, '#FFB300');
      break;
    case T.CASTLE:
      rect(ctx, 0, 0, S, S, '#90A4AE');
      rect(ctx, 2, 2, 8,12, '#B0BEC5');
      rect(ctx, 22,2, 8,12, '#B0BEC5');
      rect(ctx, 8, 8,16,20, '#B0BEC5');
      rect(ctx, 12,20, 8,12, '#37474F');
      rect(ctx, 14,0,  4, 6, '#FFD700');
      rect(ctx, 18,0,  8, 4, '#FFD700');
      break;
    case T.DUNGEON:
      rect(ctx, 0, 0, S, S, '#212121');
      rect(ctx, 8, 8,16,12, '#424242');
      rect(ctx, 10,20,12, 6, '#424242');
      rect(ctx, 10,12, 4, 4, '#212121');
      rect(ctx, 18,12, 4, 4, '#212121');
      rect(ctx, 13,20, 6, 2, '#212121');
      break;
    case T.TREE:
      rect(ctx, 0, 0, S, S, '#33691E');
      circle(ctx, 16,12,12, '#7CB342');
      rect(ctx, 13,22, 6,10, '#5D4037');
      break;
    case T.WALL:
      rect(ctx, 0, 0, S, S, '#546E7A');
      for (let y = 0; y < S; y += 8) {
        const off = ((y/8) % 2) * 8;
        for (let x = -8+off; x < S; x += 16) {
          rect(ctx, x+1, y+1, 14, 6, '#37474F');
        }
      }
      break;
    case T.FLOOR:
      rect(ctx, 0, 0, S, S, '#BCAAA4');
      rect(ctx, 0, 0, 1, S, '#A1887F');
      rect(ctx, 0, 0, S, 1, '#A1887F');
      rect(ctx, S-1,0, 1, S, '#A1887F');
      rect(ctx, 0, S-1,S, 1, '#A1887F');
      rect(ctx, 1, 1,15,15, '#D7CCC8');
      rect(ctx, 17,17,15,15, '#D7CCC8');
      break;
    case T.DOOR:
      rect(ctx, 0, 0, S, S, '#BCAAA4');
      rect(ctx, 8, 0,16,28, '#5D4037');
      rect(ctx, 10,2,12,24, '#795548');
      rect(ctx, 20,12, 4, 4, '#FFD700');
      break;
    default:
      rect(ctx, 0, 0, S, S, '#222222');
  }
}

// ─── Enemy sprite textures (80×80) ────────────────────────────────────────────

const enemyTextureCache = new Map<string, THREE.CanvasTexture>();
const enemyCanvasCache  = new Map<string, HTMLCanvasElement>();

export function getEnemyTexture(key: string): THREE.CanvasTexture {
  if (enemyTextureCache.has(key)) return enemyTextureCache.get(key)!;
  const [canvas, ctx] = makeCanvas(80, 80);
  drawEnemy(ctx, key, 80);
  const tex = makeTexture(canvas);
  enemyTextureCache.set(key, tex);
  enemyCanvasCache.set(key, canvas);
  return tex;
}

export function getEnemyCanvas(key: string): HTMLCanvasElement {
  getEnemyTexture(key);
  return enemyCanvasCache.get(key)!;
}

function drawEnemy(ctx: CanvasRenderingContext2D, key: string, S: number) {
  switch (key) {
    case 'slime':
      ellipse(ctx, 40,48, 30,22, '#66BB6A');
      ellipse(ctx, 40,50, 28,18, '#43A047');
      circle(ctx, 31,42, 5, '#212121');
      circle(ctx, 49,42, 5, '#212121');
      circle(ctx, 29,40, 2, '#FFFFFF');
      circle(ctx, 47,40, 2, '#FFFFFF');
      rect(ctx, 33,52,14, 3, '#212121');
      ellipse(ctx, 40,32, 12, 9, '#81C784');
      break;
    case 'goblin':
      rect(ctx, 28,30,24,28, '#8BC34A');
      ellipse(ctx, 40,22, 14,13, '#8BC34A');
      circle(ctx, 33,20, 4, '#FF0000');
      circle(ctx, 47,20, 4, '#FF0000');
      circle(ctx, 33,20, 2, '#FFFF00');
      circle(ctx, 47,20, 2, '#FFFF00');
      rect(ctx, 38,25, 4, 4, '#558B2F');
      rect(ctx, 32,32,16, 5, '#33691E');
      rect(ctx, 34,32, 3, 4, '#FFFFFF');
      rect(ctx, 40,32, 3, 4, '#FFFFFF');
      rect(ctx, 16,30,12,22, '#8BC34A');
      rect(ctx, 52,30,12,22, '#8BC34A');
      rect(ctx, 58,18, 6,28, '#5D4037');
      ellipse(ctx, 61,16, 7, 6, '#5D4037');
      rect(ctx, 28,58,10,18, '#8BC34A');
      rect(ctx, 42,58,10,18, '#8BC34A');
      break;
    case 'bat':
      tri(ctx, 40,30, 5,10, 12,50, '#4A148C');
      tri(ctx, 40,30, 75,10, 68,50, '#4A148C');
      tri(ctx, 40,30, 10,15, 15,45, '#7B1FA2');
      tri(ctx, 40,30, 70,15, 65,45, '#7B1FA2');
      ellipse(ctx, 40,38, 11,13, '#6A1B9A');
      ellipse(ctx, 40,26, 9, 9, '#6A1B9A');
      tri(ctx, 33,20, 28,8, 36,18, '#6A1B9A');
      tri(ctx, 47,20, 52,8, 44,18, '#6A1B9A');
      circle(ctx, 35,26, 4, '#FF1744');
      circle(ctx, 45,26, 4, '#FF1744');
      circle(ctx, 35,26, 2, '#FF6F00');
      circle(ctx, 45,26, 2, '#FF6F00');
      rect(ctx, 36,33, 3, 6, '#FFFFFF');
      rect(ctx, 41,33, 3, 6, '#FFFFFF');
      break;
    case 'witch':
      tri(ctx, 40,30, 20,76, 60,76, '#4A148C');
      rect(ctx, 28,28,24,50, '#4A148C');
      rect(ctx, 30,26,20,30, '#6A1B9A');
      ellipse(ctx, 40,18, 11,11, '#F4C59F');
      tri(ctx, 40,2, 28,22, 52,22, '#1A237E');
      rect(ctx, 22,20,36, 6, '#1A237E');
      circle(ctx, 35,18, 4, '#FF6F00');
      circle(ctx, 45,18, 4, '#FF6F00');
      rect(ctx, 60, 8, 4,66, '#8D6E63');
      circle(ctx, 62, 8, 8, '#E040FB');
      break;
    case 'golem':
      rect(ctx, 20,28,40,40, '#546E7A');
      rect(ctx, 22,10,36,22, '#546E7A');
      rect(ctx, 4, 28,16,36, '#546E7A');
      rect(ctx, 60,28,16,36, '#546E7A');
      rect(ctx, 22,68,16,10, '#546E7A');
      rect(ctx, 42,68,16,10, '#546E7A');
      rect(ctx, 28,18, 8, 6, '#FF6F00');
      rect(ctx, 44,18, 8, 6, '#FF6F00');
      rect(ctx, 30,19, 4, 4, '#FFEB3B');
      rect(ctx, 46,19, 4, 4, '#FFEB3B');
      rect(ctx, 20,44,40, 4, '#455A64');
      rect(ctx, 36,28, 4,40, '#455A64');
      break;
    case 'gargoyle':
      rect(ctx, 26,26,28,36, '#78909C');
      tri(ctx, 40,24, 6,2, 20,50, '#78909C');
      tri(ctx, 40,24, 74,2, 60,50, '#78909C');
      ellipse(ctx, 40,16, 12,11, '#78909C');
      tri(ctx, 34,8, 28,0, 36,14, '#546E7A');
      tri(ctx, 46,8, 52,0, 44,14, '#546E7A');
      circle(ctx, 35,16, 5, '#FF1744');
      circle(ctx, 45,16, 5, '#FF1744');
      rect(ctx, 14,48, 8, 6, '#455A64');
      rect(ctx, 12,52, 4,10, '#455A64');
      rect(ctx, 58,48, 8, 6, '#455A64');
      rect(ctx, 64,52, 4,10, '#455A64');
      break;
    case 'dragon':
      ellipse(ctx, 40,50, 23,18, '#C62828');
      rect(ctx, 30,20,20,36, '#C62828');
      ellipse(ctx, 40,14, 14,10, '#C62828');
      rect(ctx, 46,12,18,12, '#C62828');
      tri(ctx, 34,8, 28,0, 38,14, '#B71C1C');
      tri(ctx, 46,8, 52,0, 42,14, '#B71C1C');
      tri(ctx, 50,30, 78,8, 70,56, '#D32F2F');
      tri(ctx, 30,30, 2, 8, 10,56, '#D32F2F');
      circle(ctx, 55,14, 5, '#FFEB3B');
      circle(ctx, 55,14, 2, '#000000');
      tri(ctx, 64,16, 76,8, 74,24, '#FF6F00');
      tri(ctx, 66,16, 74,10, 72,22, '#FFEB3B');
      rect(ctx, 24,66,14,12, '#C62828');
      rect(ctx, 42,66,14,12, '#C62828');
      tri(ctx, 20,52, 2,72, 28,68, '#B71C1C');
      break;
    case 'knight':
      rect(ctx, 22,28,36,36, '#212121');
      rect(ctx, 22,62,14,14, '#212121');
      rect(ctx, 44,62,14,14, '#212121');
      rect(ctx, 26,30,28,30, '#37474F');
      rect(ctx, 24, 8,32,24, '#212121');
      rect(ctx, 26,10,28,18, '#37474F');
      rect(ctx, 30,16,20, 6, '#FF1744');
      rect(ctx, 60, 4, 6,52, '#E0E0E0');
      rect(ctx, 54,16,18, 6, '#FFD700');
      rect(ctx, 6, 26,16,28, '#1565C0');
      rect(ctx, 12,36, 4, 8, '#FFD700');
      break;
    case 'boss':
      circle(ctx, 40,40, 38, '#4A148C', 0.4);
      tri(ctx, 40,10, 4,78, 76,78, '#1A237E');
      rect(ctx, 24,24,32,48, '#311B92');
      ellipse(ctx, 40,16, 17,15, '#EEEEEE');
      ellipse(ctx, 31,16, 5, 5, '#000000');
      ellipse(ctx, 49,16, 5, 5, '#000000');
      circle(ctx, 31,16, 4, '#FF1744');
      circle(ctx, 49,16, 4, '#FF1744');
      for (let i = 0; i < 5; i++) {
        tri(ctx, 22+i*9,8, 26+i*9,0, 30+i*9,8, '#311B92');
        circle(ctx, 26+i*9, 4, 3, '#7E57C2');
      }
      tri(ctx, 40,30, 2,2,  14,60, '#0D0D0D');
      tri(ctx, 40,30, 78,2, 66,60, '#0D0D0D');
      circle(ctx, 16,56, 8, '#FF1744');
      circle(ctx, 64,56, 8, '#FF1744');
      circle(ctx, 16,56, 4, '#FF6F00');
      circle(ctx, 64,56, 4, '#FF6F00');
      for (let x = 4; x < 76; x += 8) rect(ctx, x, 74, 6, 4, '#7E57C2');
      break;
    default:
      circle(ctx, 40, 40, 30, '#555555');
      break;
  }
}

// ─── Preload all textures ─────────────────────────────────────────────────────

export function preloadAllTextures() {
  for (let i = 0; i < 4; i++) getHeroTexture(i);
  getNpcTexture();
  const tileIds = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];
  tileIds.forEach(id => getTileCanvas(id));
  const enemies = ['slime','goblin','bat','witch','golem','gargoyle','dragon','knight','boss'];
  enemies.forEach(k => getEnemyTexture(k));
}
