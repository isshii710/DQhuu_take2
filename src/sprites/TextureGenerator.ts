import Phaser from 'phaser';
import { T, TILE_SIZE } from '../config';

// ─── Color palette ────────────────────────────────────────────────────────────

const SKIN     = 0xF4C59F;
const HAIR_BRN = 0x6B3A2A;
const HAIR_BLK = 0x2C1810;
const HAIR_BLU = 0x203070;
const HAIR_ORG = 0xCC6620;
const ARMOR_BL = 0x2C4A8C;
const ARMOR_PU = 0x6A1A8C;
const ARMOR_GR = 0x2A6B3A;
const ARMOR_DK = 0x222244;
const WPN_SIL  = 0xB8B8C8;
const WPN_GLD  = 0xFFD700;
const WPN_BRN  = 0x8B5020;

// Class sprite palettes: [hair, armor, weapon]
const CLASS_PALETTES: [number, number, number][] = [
  [HAIR_BRN, ARMOR_BL, WPN_SIL],   // 戦士
  [HAIR_BLU, ARMOR_PU, WPN_GLD],   // 魔法使い
  [HAIR_ORG, ARMOR_GR, WPN_GLD],   // 回復師
  [HAIR_BLK, ARMOR_DK, WPN_SIL],   // 盗賊
];

type Rect = [number, number, number, number, number]; // x,y,w,h,color

function drawRects(g: Phaser.GameObjects.Graphics, rects: Rect[]) {
  for (const [x, y, w, h, c] of rects) {
    g.fillStyle(c, 1);
    g.fillRect(x, y, w, h);
  }
}

// ─── Player sprite (32×32, 4 walk directions × 2 frames = 8 frames wide) ────

function heroFrame(g: Phaser.GameObjects.Graphics, ox: number, hair: number, armor: number, wpn: number, frame: number, dir: number) {
  const legOffset = frame === 1 ? 1 : 0;

  const rects: Rect[] = [
    // Hair
    [ox+12, 0,  8, 5, hair],
    // Face
    [ox+12, 4,  8, 8, SKIN],
    // Eyes
    [ox+14, 7,  2, 2, 0x222222],
    [ox+18, 7,  2, 2, 0x222222],
    // Body armor
    [ox+9,  12, 14, 10, armor],
    // Left arm
    [ox+5,  12, 4,  9, armor],
    // Right arm
    [ox+23, 12, 4,  9, armor],
  ];

  // Direction: show weapon
  if (dir === 0 /* down */ || dir === 2 /* right */) {
    rects.push([ox+27, 10, 3, 14, wpn]); // weapon right side
  } else if (dir === 3 /* left */) {
    rects.push([ox+2,  10, 3, 14, wpn]); // weapon left side
  } else {
    rects.push([ox+27, 10, 3, 14, wpn]);
  }

  // Legs
  rects.push(
    [ox+11, 22, 5,  8+legOffset,  0x4A3020], // left leg
    [ox+16, 22, 5,  8-legOffset,  0x4A3020], // right leg
    // Boots
    [ox+11, 28+legOffset, 5, 4, 0x221808],
    [ox+16, 28-legOffset, 5, 4, 0x221808],
  );

  drawRects(g, rects);
}

export function generatePlayerTextures(scene: Phaser.Scene) {
  const FRAME_W = 32;
  const FRAME_H = 32;
  const DIRS = 4;  // down, up, left, right
  const FRAMES = 2;
  const W = FRAME_W * FRAMES * DIRS;
  const H = FRAME_H;

  for (let ci = 0; ci < 4; ci++) {
    const [hair, armor, wpn] = CLASS_PALETTES[ci];
    const key = `hero_${ci}`;
    if (scene.textures.exists(key)) continue;

    const g = scene.add.graphics();
    for (let dir = 0; dir < DIRS; dir++) {
      for (let fr = 0; fr < FRAMES; fr++) {
        const ox = (dir * FRAMES + fr) * FRAME_W;
        heroFrame(g, ox, hair, armor, wpn, fr, dir);
      }
    }
    g.generateTexture(key, W, H);
    g.destroy();
  }

  // NPC generic texture (purple robe)
  if (!scene.textures.exists('npc_base')) {
    const g = scene.add.graphics();
    heroFrame(g, 0, HAIR_BRN, 0x884422, 0, 0, 0);
    heroFrame(g, FRAME_W, HAIR_BRN, 0x884422, 0, 1, 0);
    g.generateTexture('npc_base', FRAME_W * 2, FRAME_H);
    g.destroy();
  }
}

// ─── Tile textures ───────────────────────────────────────────────────────────

export function generateTileTextures(scene: Phaser.Scene) {
  const S = TILE_SIZE;

  const tileDefs: { id: number; draw: (g: Phaser.GameObjects.Graphics) => void }[] = [
    {
      id: T.GRASS, draw: g => {
        g.fillStyle(0x4CAF50); g.fillRect(0,0,S,S);
        // grass tufts
        g.fillStyle(0x388E3C);
        for (const [x,y] of [[4,6],[12,20],[24,10],[20,26],[8,28]]) {
          g.fillRect(x, y, 4, 3);
        }
      }
    },
    {
      id: T.WATER, draw: g => {
        g.fillStyle(0x1565C0); g.fillRect(0,0,S,S);
        g.fillStyle(0x1976D2);
        g.fillRect(0,8,S,6); g.fillRect(0,22,S,6);
        g.fillStyle(0x64B5F6);
        g.fillRect(4,10,8,2); g.fillRect(18,24,10,2);
      }
    },
    {
      id: T.MOUNTAIN, draw: g => {
        g.fillStyle(0x616161); g.fillRect(0,0,S,S);
        // mountain silhouette
        g.fillStyle(0x757575);
        g.fillTriangle(16,4, 2,28, 30,28);
        g.fillStyle(0xEEEEEE); // snow cap
        g.fillTriangle(16,4, 10,16, 22,16);
      }
    },
    {
      id: T.PATH, draw: g => {
        g.fillStyle(0x8D6E63); g.fillRect(0,0,S,S);
        g.fillStyle(0x795548);
        g.fillRect(2,2,4,4); g.fillRect(20,16,6,4); g.fillRect(10,24,4,4);
      }
    },
    {
      id: T.FOREST, draw: g => {
        g.fillStyle(0x2E7D32); g.fillRect(0,0,S,S);
        g.fillStyle(0x1B5E20);
        g.fillRect(2,2,28,28);
        g.fillStyle(0x43A047);
        g.fillTriangle(16,2, 4,22, 28,22);
        g.fillTriangle(16,8, 6,24, 26,24);
      }
    },
    {
      id: T.SAND, draw: g => {
        g.fillStyle(0xF9A825); g.fillRect(0,0,S,S);
        g.fillStyle(0xF57F17);
        g.fillRect(6,8,4,4); g.fillRect(20,18,6,4); g.fillRect(12,26,4,4);
      }
    },
    {
      id: T.VILLAGE, draw: g => {
        g.fillStyle(0x8D6E63); g.fillRect(0,0,S,S);
        // house
        g.fillStyle(0xD7CCC8); g.fillRect(4,12,24,16);
        g.fillStyle(0xC62828); // red roof
        g.fillTriangle(16,2, 2,14, 30,14);
        g.fillStyle(0x5D4037); // door
        g.fillRect(13,20,6,8);
        g.fillStyle(0xFFEB3B); // window
        g.fillRect(6,16,6,6);
        g.fillRect(20,16,6,6);
      }
    },
    {
      id: T.CASTLE, draw: g => {
        g.fillStyle(0x90A4AE); g.fillRect(0,0,S,S);
        // battlements
        g.fillStyle(0xB0BEC5);
        g.fillRect(2,2,8,12); g.fillRect(22,2,8,12);
        g.fillRect(8,8,16,20);
        g.fillStyle(0x78909C);
        for (let x=2; x<S-2; x+=6) g.fillRect(x,2,4,6);
        g.fillStyle(0x37474F); // gate
        g.fillRect(12,20,8,12);
        g.fillStyle(0xFFD700); // flag
        g.fillRect(14,0,4,6); g.fillRect(18,0,8,4);
      }
    },
    {
      id: T.DUNGEON, draw: g => {
        g.fillStyle(0x212121); g.fillRect(0,0,S,S);
        // skull motif
        g.fillStyle(0x424242);
        g.fillRect(8,8,16,12); g.fillRect(10,20,12,6);
        g.fillStyle(0x212121); // eye sockets
        g.fillRect(10,12,4,4); g.fillRect(18,12,4,4);
        g.fillRect(13,20,6,2); // teeth
      }
    },
    {
      id: T.TREE, draw: g => {
        g.fillStyle(0x558B2F); g.fillRect(0,0,S,S);
        g.fillStyle(0x33691E);
        g.fillRect(0,0,S,S);
        g.fillStyle(0x7CB342);
        g.fillCircle(16,12,12);
        g.fillStyle(0x5D4037); // trunk
        g.fillRect(13,22,6,10);
      }
    },
    {
      id: T.WALL, draw: g => {
        g.fillStyle(0x546E7A); g.fillRect(0,0,S,S);
        g.fillStyle(0x37474F);
        for (let y=0; y<S; y+=8) {
          const offset = (y/8 % 2) * 8;
          for (let x=-8+offset; x<S; x+=16) {
            g.fillRect(x+1,y+1,14,6);
          }
        }
      }
    },
    {
      id: T.FLOOR, draw: g => {
        g.fillStyle(0xBCAAA4); g.fillRect(0,0,S,S);
        g.fillStyle(0xA1887F);
        g.fillRect(0,0,1,S); g.fillRect(0,0,S,1);
        g.fillRect(S-1,0,1,S); g.fillRect(0,S-1,S,1);
        // checker pattern
        g.fillStyle(0xD7CCC8);
        for (let r=0; r<2; r++) for (let c=0; c<2; c++) {
          if ((r+c)%2===0) g.fillRect(c*16+1,r*16+1,15,15);
        }
      }
    },
    {
      id: T.DOOR, draw: g => {
        g.fillStyle(0xBCAAA4); g.fillRect(0,0,S,S);
        g.fillStyle(0x5D4037); g.fillRect(8,0,16,28);
        g.fillStyle(0x795548); g.fillRect(10,2,12,24);
        g.fillStyle(0xFFD700); g.fillRect(20,12,4,4); // knob
        g.fillStyle(0x4E342E); g.fillRect(8,0,1,28); g.fillRect(23,0,1,28);
      }
    },
    {
      id: T.CHEST, draw: g => {
        g.fillStyle(0x8D6E63); g.fillRect(0,0,S,S);
        g.fillStyle(0xFFD700); g.fillRect(4,10,24,18);
        g.fillStyle(0xFFA000); g.fillRect(4,10,24,6);
        g.fillStyle(0x5D4037); g.fillRect(4,14,24,2); // seam
        g.fillStyle(0xFFEB3B); g.fillRect(13,10,6,18); // band
        g.fillStyle(0xF9A825); g.fillRect(14,16,4,6); // lock
      }
    },
  ];

  for (const { id, draw } of tileDefs) {
    const key = `tile_${id}`;
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    draw(g);
    g.generateTexture(key, S, S);
    g.destroy();
  }
}

// ─── Enemy battle sprites (80×80) ────────────────────────────────────────────

export function generateEnemyTextures(scene: Phaser.Scene) {
  const S = 80;

  const enemyDefs: { key: string; draw: (g: Phaser.GameObjects.Graphics) => void }[] = [
    {
      key: 'slime', draw: g => {
        g.fillStyle(0x66BB6A); g.fillEllipse(40,48,60,44);
        g.fillStyle(0x43A047); g.fillEllipse(40,50,56,36);
        // eyes
        g.fillStyle(0x212121); g.fillCircle(31,42,5); g.fillCircle(49,42,5);
        g.fillStyle(0xFFFFFF); g.fillCircle(29,40,2); g.fillCircle(47,40,2);
        // mouth
        g.fillStyle(0x212121); g.fillRect(33,52,14,3);
        g.fillStyle(0x81C784); g.fillEllipse(40,32,24,18);
      }
    },
    {
      key: 'goblin', draw: g => {
        // Body
        g.fillStyle(0x8BC34A); g.fillRect(28,30,24,28);
        // Head
        g.fillEllipse(40,22,28,26);
        // Eyes
        g.fillStyle(0xFF0000); g.fillCircle(33,20,4); g.fillCircle(47,20,4);
        g.fillStyle(0xFFFF00); g.fillCircle(33,20,2); g.fillCircle(47,20,2);
        // Nose
        g.fillStyle(0x558B2F); g.fillRect(38,25,4,4);
        // Mouth/teeth
        g.fillStyle(0x33691E); g.fillRect(32,32,16,5);
        g.fillStyle(0xFFFFFF); g.fillRect(34,32,3,4); g.fillRect(40,32,3,4);
        // Arms
        g.fillStyle(0x8BC34A);
        g.fillRect(16,30,12,22); g.fillRect(52,30,12,22);
        // Weapon (club)
        g.fillStyle(0x5D4037); g.fillRect(58,18,6,28);
        g.fillEllipse(61,16,14,12);
        // Legs
        g.fillRect(28,58,10,18); g.fillRect(42,58,10,18);
      }
    },
    {
      key: 'bat', draw: g => {
        g.fillStyle(0x4A148C);
        // Wings
        g.fillTriangle(40,30, 5,10, 12,50);
        g.fillTriangle(40,30, 75,10, 68,50);
        g.fillStyle(0x7B1FA2);
        g.fillTriangle(40,30, 10,15, 15,45);
        g.fillTriangle(40,30, 70,15, 65,45);
        // Body
        g.fillStyle(0x6A1B9A); g.fillEllipse(40,38,22,26);
        // Head
        g.fillEllipse(40,26,18,18);
        // Ears
        g.fillTriangle(33,20, 28,8, 36,18);
        g.fillTriangle(47,20, 52,8, 44,18);
        // Eyes
        g.fillStyle(0xFF1744); g.fillCircle(35,26,4); g.fillCircle(45,26,4);
        g.fillStyle(0xFF6F00); g.fillCircle(35,26,2); g.fillCircle(45,26,2);
        // Fangs
        g.fillStyle(0xFFFFFF); g.fillRect(36,33,3,6); g.fillRect(41,33,3,6);
      }
    },
    {
      key: 'witch', draw: g => {
        // Robe
        g.fillStyle(0x4A148C); g.fillTriangle(40,30, 20,76, 60,76);
        g.fillRect(28,28,24,50);
        // Body
        g.fillStyle(0x6A1B9A); g.fillRect(30,26,20,30);
        // Head
        g.fillStyle(0xF4C59F); g.fillEllipse(40,18,22,22);
        // Hat
        g.fillStyle(0x1A237E);
        g.fillTriangle(40,2, 28,22, 52,22);
        g.fillRect(22,20,36,6);
        // Eyes
        g.fillStyle(0xFF6F00); g.fillCircle(35,18,4); g.fillCircle(45,18,4);
        // Staff
        g.fillStyle(0x8D6E63); g.fillRect(60,8,4,66);
        g.fillStyle(0xE040FB); g.fillCircle(62,8,8);
      }
    },
    {
      key: 'golem', draw: g => {
        g.fillStyle(0x546E7A);
        // Body
        g.fillRect(20,28,40,40);
        // Head
        g.fillRect(22,10,36,22);
        // Arms
        g.fillRect(4,28,16,36); g.fillRect(60,28,16,36);
        // Legs
        g.fillRect(22,68,16,10); g.fillRect(42,68,16,10);
        // Face cracks
        g.fillStyle(0x37474F);
        g.fillRect(30,16,4,10); g.fillRect(36,20,14,4);
        // Eyes (glowing)
        g.fillStyle(0xFF6F00); g.fillRect(28,18,8,6); g.fillRect(44,18,8,6);
        g.fillStyle(0xFFEB3B); g.fillRect(30,19,4,4); g.fillRect(46,19,4,4);
        // Seams
        g.fillStyle(0x455A64);
        g.fillRect(20,44,40,4); g.fillRect(36,28,4,40);
      }
    },
    {
      key: 'gargoyle', draw: g => {
        g.fillStyle(0x78909C);
        // Wings
        g.fillTriangle(40,24, 6,2, 20,50);
        g.fillTriangle(40,24, 74,2, 60,50);
        // Body
        g.fillRect(26,26,28,36);
        // Head
        g.fillEllipse(40,16,24,22);
        // Horns
        g.fillStyle(0x546E7A);
        g.fillTriangle(34,8, 28,0, 36,14);
        g.fillTriangle(46,8, 52,0, 44,14);
        // Eyes
        g.fillStyle(0xFF1744); g.fillCircle(35,16,5); g.fillCircle(45,16,5);
        // Claws
        g.fillStyle(0x455A64);
        g.fillRect(14,48,8,6); g.fillRect(12,52,4,10);
        g.fillRect(58,48,8,6); g.fillRect(64,52,4,10);
        g.fillRect(28,60,8,10); g.fillRect(44,60,8,10);
      }
    },
    {
      key: 'dragon', draw: g => {
        g.fillStyle(0xC62828);
        // Body
        g.fillEllipse(40,50,46,36);
        // Neck
        g.fillRect(30,20,20,36);
        // Head
        g.fillEllipse(40,14,28,20);
        // Snout
        g.fillRect(46,12,18,12);
        // Horns
        g.fillStyle(0xB71C1C);
        g.fillTriangle(34,8, 28,0, 38,14);
        g.fillTriangle(46,8, 52,0, 42,14);
        // Wings
        g.fillStyle(0xD32F2F);
        g.fillTriangle(50,30, 78,8, 70,56);
        g.fillTriangle(30,30, 2,8, 10,56);
        // Eyes
        g.fillStyle(0xFFEB3B); g.fillCircle(55,14,5);
        g.fillStyle(0x000000); g.fillCircle(55,14,2);
        // Fire
        g.fillStyle(0xFF6F00); g.fillTriangle(64,16, 76,8, 74,24);
        g.fillStyle(0xFFEB3B); g.fillTriangle(66,16, 74,10, 72,22);
        // Legs
        g.fillStyle(0xC62828);
        g.fillRect(24,66,14,12); g.fillRect(42,66,14,12);
        // Tail
        g.fillTriangle(20,52, 2,72, 28,68);
      }
    },
    {
      key: 'knight', draw: g => {
        g.fillStyle(0x212121);
        // Armor
        g.fillRect(22,28,36,36); g.fillRect(22,62,14,14); g.fillRect(44,62,14,14);
        // Chest plate
        g.fillStyle(0x37474F);
        g.fillRect(26,30,28,30);
        // Helmet
        g.fillStyle(0x212121); g.fillRect(24,8,32,24);
        g.fillStyle(0x37474F); g.fillRect(26,10,28,18);
        // Visor
        g.fillStyle(0xFF1744); g.fillRect(30,16,20,6);
        // Sword
        g.fillStyle(0xE0E0E0); g.fillRect(60,4,6,52);
        g.fillStyle(0xFFD700); g.fillRect(54,16,18,6);
        // Shield
        g.fillStyle(0x1565C0); g.fillRect(6,26,16,28);
        g.fillStyle(0xFFD700); g.fillRect(12,36,4,8);
        // Purple aura
        g.fillStyle(0x7B1FA2, 0.3);
        g.fillCircle(40,40,38);
      }
    },
    {
      key: 'boss', draw: g => {
        // Aura
        g.fillStyle(0x4A148C, 0.4); g.fillCircle(40,40,38);
        // Cloak
        g.fillStyle(0x1A237E); g.fillTriangle(40,10, 4,78, 76,78);
        // Body
        g.fillStyle(0x311B92); g.fillRect(24,24,32,48);
        // Head / skull
        g.fillStyle(0xEEEEEE); g.fillEllipse(40,16,34,30);
        // Eye sockets
        g.fillStyle(0x000000); g.fillEllipse(31,16,10,10); g.fillEllipse(49,16,10,10);
        // Glowing eyes
        g.fillStyle(0xFF1744); g.fillCircle(31,16,4); g.fillCircle(49,16,4);
        g.fillStyle(0xFF6F00, 0.8); g.fillCircle(31,16,2); g.fillCircle(49,16,2);
        // Crown of darkness
        g.fillStyle(0x311B92);
        for (let i=0; i<5; i++) {
          g.fillTriangle(22+i*9,8, 26+i*9,0, 30+i*9,8);
        }
        g.fillStyle(0x7E57C2);
        for (let i=0; i<5; i++) {
          g.fillCircle(26+i*9,4,3);
        }
        // Dark wings
        g.fillStyle(0x0D0D0D);
        g.fillTriangle(40,30, 2,2, 14,60);
        g.fillTriangle(40,30, 78,2, 66,60);
        // Orbs in hands
        g.fillStyle(0xFF1744); g.fillCircle(16,56,8);
        g.fillCircle(64,56,8);
        g.fillStyle(0xFF6F00); g.fillCircle(16,56,4); g.fillCircle(64,56,4);
        // Robe hem decoration
        g.fillStyle(0x7E57C2);
        for (let x=4; x<76; x+=8) g.fillRect(x,74,6,4);
      }
    },
  ];

  for (const { key, draw } of enemyDefs) {
    if (scene.textures.exists(`enemy_${key}`)) continue;
    const g = scene.add.graphics();
    draw(g);
    g.generateTexture(`enemy_${key}`, S, S);
    g.destroy();
  }
}
