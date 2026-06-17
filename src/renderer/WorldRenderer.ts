import * as THREE from 'three';
import type { MapDef, NpcDef } from '../types';
import { T } from '../config';
import { getHeroTexture, getNpcTexture, getTileCanvas } from '../engine/TextureCache';
import { BillboardSprite } from './BillboardSprite';

const TILE = 1;          // 1 Three.js unit = 1 tile
const SPRITE_Y = 0.52;  // height of sprite above ground

// ─── 3D object color palette ─────────────────────────────────────────────────
const MAT: Record<string, THREE.MeshLambertMaterial> = {};

function mat(hex: number): THREE.MeshLambertMaterial {
  const k = hex.toString(16);
  if (!MAT[k]) MAT[k] = new THREE.MeshLambertMaterial({ color: hex });
  return MAT[k];
}

// ─── Tile → 3D object builder ─────────────────────────────────────────────────

function build3DObject(tileId: number): THREE.Object3D | null {
  switch (tileId) {
    case T.TREE: {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.4, 6), mat(0x5D4037));
      trunk.position.y = 0.2;
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.7, 7), mat(0x388E3C));
      leaves.position.y = 0.75;
      g.add(trunk, leaves);
      return g;
    }
    case T.FOREST: {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.35, 6), mat(0x5D4037));
      trunk.position.y = 0.175;
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.65, 7), mat(0x2E7D32));
      leaves.position.y = 0.67;
      g.add(trunk, leaves);
      return g;
    }
    case T.MOUNTAIN: {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.2, 8), mat(0x616161));
      peak.position.y = 0.6;
      const snow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 8), mat(0xEEEEEE));
      snow.position.y = 1.14;
      const g = new THREE.Group();
      g.add(peak, snow);
      return g;
    }
    case T.WALL: {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 1.0), mat(0x546E7A));
      wall.position.y = 0.7;
      return wall;
    }
    case T.VILLAGE: {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.8), mat(0xD7CCC8));
      body.position.y = 0.275;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.45, 4), mat(0xC62828));
      roof.position.y = 0.73;
      roof.rotation.y = Math.PI / 4;
      g.add(body, roof);
      return g;
    }
    case T.CASTLE: {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.9), mat(0x90A4AE));
      base.position.y = 0.5;
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), mat(0xB0BEC5));
      top.position.y = 1.2;
      g.add(base, top);
      return g;
    }
    case T.DUNGEON: {
      // Dark floor, no extrusion needed
      return null;
    }
    case T.DOOR: {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.15), mat(0x5D4037));
      door.position.y = 0.45;
      return door;
    }
    case T.WATER: {
      // Slight depression — handled by ground texture
      return null;
    }
    default:
      return null;
  }
}

// ─── WorldRenderer ────────────────────────────────────────────────────────────

export class WorldRenderer {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;

  private mapGroup = new THREE.Group();
  private playerSprite: BillboardSprite | null = null;
  private npcSprites = new Map<string, BillboardSprite>();
  private otherPlayerSprites = new Map<string, BillboardSprite>();

  private targetCamX = 0;
  private targetCamZ = 0;
  private currentCamX = 0;
  private currentCamZ = 0;

  // Camera configuration
  private readonly CAM_H = 10;
  private readonly CAM_Z_OFFSET = 9;
  private readonly FRUSTUM = 5.5; // half-width in tiles

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a1a);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0a1a, 25, 40);

    // Orthographic camera for classic 3/4 RPG view
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const f = this.FRUSTUM;
    this.camera = new THREE.OrthographicCamera(-f, f, f/aspect, -f/aspect, 0.1, 100);
    this.camera.position.set(0, this.CAM_H, this.CAM_Z_OFFSET);
    this.camera.lookAt(0, 0, 0);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffeedd, 0.75);
    const sun = new THREE.DirectionalLight(0xfff8e7, 0.9);
    sun.position.set(5, 12, -4);
    this.scene.add(ambient, sun);

    this.scene.add(this.mapGroup);

    // Handle resize
    this.onResize();
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const f = this.FRUSTUM;
    this.camera.left   = -f;
    this.camera.right  =  f;
    this.camera.top    =  f / aspect;
    this.camera.bottom = -f / aspect;
    this.camera.updateProjectionMatrix();
  }

  // ─── Map building ─────────────────────────────────────────────────────────

  loadMap(mapDef: MapDef) {
    // Clear previous map
    this.mapGroup.clear();
    this.npcSprites.forEach(s => s.removeFrom(this.scene));
    this.npcSprites.clear();

    const rows = mapDef.tiles.length;
    const cols = mapDef.tiles[0].length;

    // Build ground as a single textured plane
    const groundCanvas = this.buildGroundCanvas(mapDef.tiles, cols, rows);
    const groundTex = new THREE.CanvasTexture(groundCanvas);
    groundTex.magFilter = THREE.NearestFilter;
    groundTex.minFilter = THREE.NearestFilter;

    const groundGeo = new THREE.PlaneGeometry(cols * TILE, rows * TILE);
    const groundMat = new THREE.MeshBasicMaterial({ map: groundTex });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cols / 2, 0, rows / 2);
    this.mapGroup.add(ground);

    // Place 3D objects on elevated tiles
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const tileId = mapDef.tiles[ty][tx];
        const obj = build3DObject(tileId);
        if (obj) {
          obj.position.set(tx + 0.5, 0, ty + 0.5);
          this.mapGroup.add(obj);
        }
      }
    }

    // Camera bounds
    this.scene.userData.mapCols = cols;
    this.scene.userData.mapRows = rows;

    // NPCs
    mapDef.npcs.forEach(npc => this.addNpc(npc));
  }

  private buildGroundCanvas(tiles: number[][], cols: number, rows: number): HTMLCanvasElement {
    const S = 32;
    const c = document.createElement('canvas');
    c.width  = cols * S;
    c.height = rows * S;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    tiles.forEach((row, ty) => {
      row.forEach((tileId, tx) => {
        const tc = getTileCanvas(tileId);
        ctx.drawImage(tc, tx * S, ty * S);
      });
    });
    return c;
  }

  // ─── Player ───────────────────────────────────────────────────────────────

  spawnPlayer(classIndex: number, tileX: number, tileZ: number): BillboardSprite {
    this.playerSprite?.removeFrom(this.scene);
    const tex = getHeroTexture(classIndex);
    const sp = new BillboardSprite(tex, 8, 1.1);
    sp.setPosition(tileX + 0.5, SPRITE_Y, tileZ + 0.5);
    sp.addTo(this.scene);
    this.playerSprite = sp;

    // Initial camera position
    this.currentCamX = tileX + 0.5;
    this.currentCamZ = tileZ + 0.5;
    this.targetCamX = this.currentCamX;
    this.targetCamZ = this.currentCamZ;

    return sp;
  }

  setPlayerTile(tileX: number, tileZ: number) {
    this.targetCamX = tileX + 0.5;
    this.targetCamZ = tileZ + 0.5;
  }

  // ─── NPCs ─────────────────────────────────────────────────────────────────

  addNpc(npc: NpcDef) {
    if (this.npcSprites.has(npc.id)) return;
    const sp = new BillboardSprite(getNpcTexture(), 1, 1.0);
    // Apply NPC color as tint (convert hex to RGB 0-1)
    const r = ((npc.spriteColor >> 16) & 0xff) / 255;
    const g = ((npc.spriteColor >> 8)  & 0xff) / 255;
    const b = (npc.spriteColor & 0xff)         / 255;
    sp.setTint(r, g, b);
    sp.setPosition(npc.tileX + 0.5, SPRITE_Y, npc.tileY + 0.5);
    sp.addTo(this.scene);
    this.npcSprites.set(npc.id, sp);
  }

  // ─── Other players (multiplayer) ─────────────────────────────────────────

  addOtherPlayer(id: string, classIndex: number, tileX: number, tileZ: number): BillboardSprite | null {
    if (this.otherPlayerSprites.has(id)) return null;
    const tex = getHeroTexture(classIndex);
    const sp = new BillboardSprite(tex, 8, 1.1);
    sp.setTint(0.7, 0.85, 1.0); // bluish tint
    sp.setPosition(tileX + 0.5, SPRITE_Y, tileZ + 0.5);
    sp.addTo(this.scene);
    this.otherPlayerSprites.set(id, sp);
    return sp;
  }

  updateOtherPlayer(id: string, tileX: number, tileZ: number, visible: boolean) {
    const sp = this.otherPlayerSprites.get(id);
    if (!sp) return;
    sp.setVisible(visible);
    if (visible) sp.setPosition(tileX + 0.5, SPRITE_Y, tileZ + 0.5);
  }

  removeOtherPlayer(id: string) {
    const sp = this.otherPlayerSprites.get(id);
    if (!sp) return;
    sp.removeFrom(this.scene);
    this.otherPlayerSprites.delete(id);
  }

  // ─── Camera ───────────────────────────────────────────────────────────────

  update(delta: number) {
    // Smooth camera follow (lerp toward target)
    const alpha = 1 - Math.pow(0.005, delta / 1000);
    this.currentCamX += (this.targetCamX - this.currentCamX) * alpha;
    this.currentCamZ += (this.targetCamZ - this.currentCamZ) * alpha;

    const x = this.currentCamX;
    const z = this.currentCamZ;
    this.camera.position.set(x, this.CAM_H, z + this.CAM_Z_OFFSET);
    this.camera.lookAt(x, 0, z);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  get playerSpriteRef(): BillboardSprite | null { return this.playerSprite; }
}
