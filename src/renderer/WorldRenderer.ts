import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { MapDef, NpcDef } from '../types';
import { T } from '../config';
import { getHeroTexture, getNpcTexture, getTileCanvas } from '../engine/TextureCache';
import { BillboardSprite } from './BillboardSprite';

// ─── Post-process shaders ─────────────────────────────────────────────────────

// Hexagonal bokeh DOF — blurs above/below a horizontal focus band (diorama look)
const HexBokehShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    focus:    { value: 0.47 },  // focus Y in screen space (0=bottom, 1=top)
    band:     { value: 0.09 },  // half-width of sharp region
    strength: { value: 0.009 }, // max blur radius in screen space
    aspect:   { value: 16 / 9 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float focus, band, strength, aspect;
    varying vec2 vUv;

    #define PI 3.14159265359
    #define TAPS 6

    void main() {
      float d = max(0.0, abs(vUv.y - focus) - band);
      float r = d * strength;

      // Below threshold — fully sharp
      if (r < 0.0004) { gl_FragColor = texture2D(tDiffuse, vUv); return; }

      // 12-tap hexagonal pattern (2 rings × 6)
      vec4 col = vec4(0.0);
      for (int i = 0; i < TAPS; i++) {
        float a = float(i) * (PI / float(TAPS));  // 60° increments
        vec2 dir = vec2(cos(a) / aspect, sin(a));
        col += texture2D(tDiffuse, vUv + dir * r);
        col += texture2D(tDiffuse, vUv + dir * r * 0.5);
      }
      col /= float(TAPS * 2);

      // Smooth transition at band edge
      float t = clamp(d * (1.0 / max(band * 0.5, 0.001)), 0.0, 1.0);
      gl_FragColor = mix(texture2D(tDiffuse, vUv), col, t);
    }
  `,
};

// HD-2D cinematic grade: contrast + saturation + warm tint + vignette
const WarmGradeShader = {
  uniforms: {
    tDiffuse:   { value: null as THREE.Texture | null },
    offset:     { value: 1.1 },
    darkness:   { value: 0.55 },
    warmth:     { value: 0.018 },
    saturation: { value: 1.18 },
    contrast:   { value: 1.06 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float offset, darkness, warmth, saturation, contrast;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 col = texel.rgb;
      col = (col - 0.5) * contrast + 0.5;
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(l), col, saturation);
      col.r += warmth;
      col.b -= warmth * 0.6;
      vec2 uv = (vUv - 0.5) * offset;
      float vig = clamp(1.0 - dot(uv, uv) * darkness, 0.0, 1.0);
      col *= vig;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), texel.a);
    }
  `,
};

const TILE = 1;
const SPRITE_Y = 0.52;

const TILE_H: Partial<Record<number, number>> = {
  1: -0.22, 0: 0.00, 4: 0.03, 3: 0.04, 5: 0.05,
  6: 0.00,  7: 0.00, 8: -0.04, 9: 0.02,
  10: 0.00, 11: 0.00, 12: 0.00, 13: 0.00, 2: 0.00,
};

// ─── Material helpers ─────────────────────────────────────────────────────────

const MAT: Record<string, THREE.MeshLambertMaterial> = {};
function mat(hex: number): THREE.MeshLambertMaterial {
  const k = hex.toString(16);
  if (!MAT[k]) MAT[k] = new THREE.MeshLambertMaterial({ color: hex });
  return MAT[k];
}

// Emissive standard material — used for glowing windows/torches
function emissiveMat(color: number, emissive: number, intensity: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(emissive),
    emissiveIntensity: intensity,
    roughness: 0.9,
    metalness: 0.0,
  });
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
      const g = new THREE.Group();
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.2, 8), mat(0x616161));
      peak.position.y = 0.6;
      const snow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 8), mat(0xEEEEEE));
      snow.position.y = 1.14;
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
      // House body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.78), mat(0xD7CCC8));
      body.position.y = 0.3;
      // Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.48, 4), mat(0xB71C1C));
      roof.position.y = 0.78;
      roof.rotation.y = Math.PI / 4;
      // Warm glowing window (south face)
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.22),
        emissiveMat(0xFFD070, 0xFFAA20, 2.8),
      );
      win.position.set(0, 0.32, 0.392);
      // Door
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.04), mat(0x5D4037));
      door.position.set(0, 0.14, 0.41);
      g.add(body, roof, win, door);
      return g;
    }
    case T.CASTLE: {
      const g = new THREE.Group();
      // Main tower
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.05, 0.88), mat(0x90A4AE));
      base.position.y = 0.525;
      // Battlements
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.38, 0.5), mat(0xB0BEC5));
      top.position.y = 1.24;
      // Blue window slit — glowing from inside
      const slit = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.24),
        emissiveMat(0xCCE8FF, 0x88CCFF, 3.2),
      );
      slit.position.set(0, 0.6, 0.445);
      // Flag pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), mat(0x78909C));
      pole.position.set(0, 1.68, 0);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.02), mat(0xC62828));
      flag.position.set(0.11, 1.82, 0);
      g.add(base, top, slit, pole, flag);
      return g;
    }
    case T.DUNGEON:
      return null;
    case T.DOOR: {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.15), mat(0x5D4037));
      door.position.y = 0.45;
      return door;
    }
    case T.WATER:
      return null;
    default:
      return null;
  }
}

function applyShadow(obj: THREE.Object3D): void {
  obj.traverse(child => {
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
}

// ─── WorldRenderer ────────────────────────────────────────────────────────────

export class WorldRenderer {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;

  private composer!: EffectComposer;
  private bokehPass!: ShaderPass;

  private mapGroup = new THREE.Group();
  private exitMarkers = new THREE.Group();
  private exitMaterials: THREE.MeshBasicMaterial[] = [];
  private playerSprite: BillboardSprite | null = null;
  private npcSprites = new Map<string, BillboardSprite>();
  private otherPlayerSprites = new Map<string, BillboardSprite>();
  private fieldEnemySprites = new Map<string, BillboardSprite>();
  private skyDome: THREE.Mesh | null = null;
  private buildingLights: THREE.PointLight[] = [];
  private chestGroups = new Map<string, { lid: THREE.Mesh; opened: boolean }>();

  private sun!: THREE.DirectionalLight;
  private blobShadowGroup = new THREE.Group();
  private blobShadowMat: THREE.MeshBasicMaterial | null = null;
  private playerBlob: THREE.Mesh | null = null;
  private npcBlobs = new Map<string, THREE.Mesh>();
  private enemyBlobs = new Map<string, THREE.Mesh>();

  private targetCamX = 0;
  private targetCamZ = 0;
  private currentCamX = 0;
  private currentCamZ = 0;

  private readonly CAM_H = 10;
  private readonly CAM_Z_OFFSET = 9;
  private readonly FRUSTUM = 5.5;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a1a);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0a1a, 22, 42);

    const aspect = canvas.clientWidth / canvas.clientHeight;
    const f = this.FRUSTUM;
    this.camera = new THREE.OrthographicCamera(-f, f, f / aspect, -f / aspect, 0.1, 100);
    this.camera.position.set(0, this.CAM_H, this.CAM_Z_OFFSET);
    this.camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffe6c4, 0.62);
    this.sun = new THREE.DirectionalLight(0xfff2d6, 1.15);
    this.sun.position.set(6, 14, -3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 50;
    this.sun.shadow.camera.left   = -10;
    this.sun.shadow.camera.right  =  10;
    this.sun.shadow.camera.top    =  10;
    this.sun.shadow.camera.bottom = -10;
    this.sun.shadow.bias = -0.002;
    const fill = new THREE.DirectionalLight(0x6688cc, 0.35);
    fill.position.set(-6, 8, 6);
    this.scene.add(ambient, this.sun, this.sun.target, fill);

    this.scene.add(this.mapGroup);
    this.scene.add(this.exitMarkers);
    this.scene.add(this.blobShadowGroup);

    this.setupComposer(canvas);
    this.onResize();
    window.addEventListener('resize', () => this.onResize());
  }

  private setupComposer(canvas: HTMLCanvasElement) {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.composer.setSize(w, h);

    const renderPass = new RenderPass(this.scene, this.camera);

    // Hexagonal bokeh — diorama tilt-shift feel with circular bokeh samples
    this.bokehPass = new ShaderPass(HexBokehShader);
    this.bokehPass.uniforms['aspect'].value = w / h;

    const gradePass = new ShaderPass(WarmGradeShader);

    this.composer.addPass(renderPass);
    this.composer.addPass(this.bokehPass);
    this.composer.addPass(gradePass);
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

    if (this.composer && this.bokehPass) {
      this.composer.setSize(w, h);
      this.bokehPass.uniforms['aspect'].value = w / h;
    }
  }

  // ─── Sky dome ─────────────────────────────────────────────────────────────

  private setupSky(isOutdoor: boolean) {
    if (this.skyDome) {
      this.scene.remove(this.skyDome);
      this.skyDome.geometry.dispose();
      (this.skyDome.material as THREE.ShaderMaterial).dispose();
      this.skyDome = null;
    }
    if (!isOutdoor) return;

    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor:   { value: new THREE.Color(0x1a3a8a) },
        horizColor: { value: new THREE.Color(0xf0c080) },
      },
      vertexShader: /* glsl */`
        varying float vY;
        void main() {
          vY = normalize(position).y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec3 topColor;
        uniform vec3 horizColor;
        varying float vY;
        void main() {
          float t = clamp(pow(max(vY, 0.0), 0.45), 0.0, 1.0);
          gl_FragColor = vec4(mix(horizColor, topColor, t), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });

    const geo = new THREE.SphereGeometry(80, 16, 12);
    this.skyDome = new THREE.Mesh(geo, skyMat);
    this.scene.add(this.skyDome);
  }

  // ─── Terrain geometry ─────────────────────────────────────────────────────

  private buildTerrainGeometry(tiles: number[][], cols: number, rows: number): THREE.BufferGeometry {
    const vertCount = (rows + 1) * (cols + 1);
    const positions = new Float32Array(vertCount * 3);
    const normals   = new Float32Array(vertCount * 3);
    const uvs       = new Float32Array(vertCount * 2);

    const vertH = new Float32Array(vertCount);
    for (let i = 0; i <= rows; i++) {
      for (let j = 0; j <= cols; j++) {
        const vidx = i * (cols + 1) + j;
        let sum = 0, count = 0;
        for (const [dy, dx] of [[-1, -1], [-1, 0], [0, -1], [0, 0]] as const) {
          const ty = i + dy, tx = j + dx;
          if (ty >= 0 && ty < rows && tx >= 0 && tx < cols) {
            sum += TILE_H[tiles[ty][tx]] ?? 0;
            count++;
          }
        }
        vertH[vidx] = count > 0 ? sum / count : 0;
      }
    }

    for (let i = 0; i <= rows; i++) {
      for (let j = 0; j <= cols; j++) {
        const vidx = i * (cols + 1) + j;
        const p = vidx * 3;
        positions[p + 0] = j * TILE;
        positions[p + 1] = vertH[vidx];
        positions[p + 2] = i * TILE;
        normals[p + 0] = 0; normals[p + 1] = 1; normals[p + 2] = 0;
        const u = vidx * 2;
        uvs[u + 0] = j / cols;
        uvs[u + 1] = 1 - i / rows;
      }
    }

    const indices = new Uint32Array(rows * cols * 6);
    let idx = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const tl = i * (cols + 1) + j;
        const tr = tl + 1;
        const bl = (i + 1) * (cols + 1) + j;
        const br = bl + 1;
        indices[idx++] = tl; indices[idx++] = bl; indices[idx++] = tr;
        indices[idx++] = tr; indices[idx++] = bl; indices[idx++] = br;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal',   new THREE.BufferAttribute(normals,   3));
    geo.setAttribute('uv',       new THREE.BufferAttribute(uvs,       2));
    geo.computeVertexNormals();
    return geo;
  }

  // ─── Map building ─────────────────────────────────────────────────────────

  loadMap(mapDef: MapDef) {
    this.mapGroup.clear();
    this.npcSprites.forEach(s => s?.removeFrom(this.scene));
    this.npcSprites.clear();
    this.chestGroups.clear();
    this.clearFieldEnemies();

    // Remove previous building lights
    this.buildingLights.forEach(l => this.scene.remove(l));
    this.buildingLights = [];

    const rows = mapDef.tiles.length;
    const cols = mapDef.tiles[0].length;

    const isOutdoor = mapDef.id === 'world' || mapDef.id === 'village' || mapDef.id === 'castle';
    this.setupSky(isOutdoor);
    if (isOutdoor) {
      this.scene.fog = new THREE.Fog(0xf0c080, 28, 52);
      this.renderer.setClearColor(0x1a3a8a);
    } else {
      this.scene.fog = new THREE.Fog(0x111122, 12, 22);
      this.renderer.setClearColor(0x0a0a1a);
    }

    // Terrain
    const groundCanvas = this.buildGroundCanvas(mapDef.tiles, cols, rows);
    const groundTex = new THREE.CanvasTexture(groundCanvas);
    groundTex.magFilter = THREE.NearestFilter;
    groundTex.minFilter = THREE.NearestFilter;

    const groundGeo = this.buildTerrainGeometry(mapDef.tiles, cols, rows);
    const groundMat = new THREE.MeshLambertMaterial({ map: groundTex });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.mapGroup.add(ground);

    // Clear blob shadows from previous map
    this.blobShadowGroup.clear();
    this.playerBlob = null;
    this.npcBlobs.clear();
    this.enemyBlobs.clear();

    // 3D objects + warm point lights inside buildings
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const tileId = mapDef.tiles[ty][tx];
        const obj = build3DObject(tileId);
        if (obj) {
          applyShadow(obj);
          const h = TILE_H[tileId] ?? 0;
          obj.position.set(tx + 0.5, h, ty + 0.5);
          this.mapGroup.add(obj);

          // Warm point light inside village buildings and castle
          if (tileId === T.VILLAGE) {
            const pl = new THREE.PointLight(0xFF9933, 0.9, 3.5);
            pl.position.set(tx + 0.5, h + 0.4, ty + 0.5);
            this.scene.add(pl);
            this.buildingLights.push(pl);
          } else if (tileId === T.CASTLE) {
            const pl = new THREE.PointLight(0x99CCFF, 0.7, 4.0);
            pl.position.set(tx + 0.5, h + 0.7, ty + 0.5);
            this.scene.add(pl);
            this.buildingLights.push(pl);
          }
        }
      }
    }

    this.scene.userData.mapCols = cols;
    this.scene.userData.mapRows = rows;

    mapDef.npcs.forEach(npc => this.addNpc(npc));

    this.exitMarkers.clear();
    this.exitMaterials = [];
    mapDef.exits.forEach(exit => {
      const m = new THREE.MeshBasicMaterial({ color: 0x00DDFF, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
      this.exitMaterials.push(m);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.46, 20), m);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(exit.tileX + 0.5, 0.02, exit.tileY + 0.5);
      this.exitMarkers.add(ring);
    });
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
    if (this.playerBlob) this.blobShadowGroup.remove(this.playerBlob);

    const tex = getHeroTexture(classIndex);
    const sp = new BillboardSprite(tex, 8, 1.1);
    sp.setPosition(tileX + 0.5, SPRITE_Y, tileZ + 0.5);
    sp.addTo(this.scene);
    this.playerSprite = sp;

    this.playerBlob = this.makeBlobMesh(0.65);
    this.playerBlob.position.set(tileX + 0.5, 0.01, tileZ + 0.5);
    this.blobShadowGroup.add(this.playerBlob);

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

    if (npc.isChest) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.42), mat(0x5D4037));
      body.position.y = 0.16;
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.42), mat(0xDBA523));
      lid.position.y = 0.41;
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.06, 0.44), mat(0xFFD700));
      band.position.y = 0.26;
      g.add(body, lid, band);
      applyShadow(g);
      this.chestGroups.set(npc.id, { lid, opened: false });
      g.position.set(npc.tileX + 0.5, 0, npc.tileY + 0.5);
      this.mapGroup.add(g);
      this.npcSprites.set(npc.id, null as unknown as BillboardSprite);
      return;
    }

    const sp = new BillboardSprite(getNpcTexture(), 1, 1.0);
    const r = ((npc.spriteColor >> 16) & 0xff) / 255;
    const g = ((npc.spriteColor >> 8)  & 0xff) / 255;
    const b = (npc.spriteColor & 0xff)         / 255;
    sp.setTint(r, g, b);
    sp.setPosition(npc.tileX + 0.5, SPRITE_Y, npc.tileY + 0.5);
    sp.addTo(this.scene);
    this.npcSprites.set(npc.id, sp);

    // Static blob shadow for NPC (NPCs don't move)
    const npcBlob = this.makeBlobMesh(0.55);
    npcBlob.position.set(npc.tileX + 0.5, 0.01, npc.tileY + 0.5);
    this.blobShadowGroup.add(npcBlob);
    this.npcBlobs.set(npc.id, npcBlob);
  }

  // ─── Field enemies ────────────────────────────────────────────────────────

  addFieldEnemy(id: string, texture: THREE.Texture, tileX: number, tileZ: number) {
    if (this.fieldEnemySprites.has(id)) return;
    const sp = new BillboardSprite(texture, 1, 0.78);
    sp.setPosition(tileX + 0.5, SPRITE_Y, tileZ + 0.5);
    sp.addTo(this.scene);
    this.fieldEnemySprites.set(id, sp);

    const blob = this.makeBlobMesh(0.5);
    blob.position.set(tileX + 0.5, 0.01, tileZ + 0.5);
    this.blobShadowGroup.add(blob);
    this.enemyBlobs.set(id, blob);
  }

  moveFieldEnemy(id: string, tileX: number, tileZ: number) {
    this.fieldEnemySprites.get(id)?.setPosition(tileX + 0.5, SPRITE_Y, tileZ + 0.5);
  }

  setFieldEnemyWorldPos(id: string, worldX: number, worldZ: number) {
    this.fieldEnemySprites.get(id)?.setPosition(worldX, SPRITE_Y, worldZ);
  }

  projectToScreen(worldX: number, worldZ: number): { x: number; y: number } | null {
    const v = new THREE.Vector3(worldX, 1.5, worldZ);
    v.project(this.camera);
    if (v.z > 1) return null;
    return {
      x: (v.x + 1) / 2 * window.innerWidth,
      y: (-v.y + 1) / 2 * window.innerHeight,
    };
  }

  removeFieldEnemy(id: string) {
    const sp = this.fieldEnemySprites.get(id);
    if (!sp) return;
    sp.removeFrom(this.scene);
    this.fieldEnemySprites.delete(id);
    const blob = this.enemyBlobs.get(id);
    if (blob) { this.blobShadowGroup.remove(blob); this.enemyBlobs.delete(id); }
  }

  clearFieldEnemies() {
    this.fieldEnemySprites.forEach(sp => sp.removeFrom(this.scene));
    this.fieldEnemySprites.clear();
    this.enemyBlobs.forEach(b => this.blobShadowGroup.remove(b));
    this.enemyBlobs.clear();
  }

  // ─── Other players ────────────────────────────────────────────────────────

  addOtherPlayer(id: string, classIndex: number, tileX: number, tileZ: number): BillboardSprite | null {
    if (this.otherPlayerSprites.has(id)) return null;
    const tex = getHeroTexture(classIndex);
    const sp = new BillboardSprite(tex, 8, 1.1);
    sp.setTint(0.7, 0.85, 1.0);
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

  openChest(npcId: string) {
    const chest = this.chestGroups.get(npcId);
    if (!chest || chest.opened) return;
    chest.opened = true;
    const startTime = Date.now();
    const duration = 500;
    const animate = () => {
      const t = Math.min(1, (Date.now() - startTime) / duration);
      chest.lid.rotation.x = -Math.PI * 0.7 * t;
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  private makeBlobMesh(size: number): THREE.Mesh {
    if (!this.blobShadowMat) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      grad.addColorStop(0, 'rgba(0,0,0,0.5)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      this.blobShadowMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        opacity: 1,
      });
    }
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size * 0.55),
      this.blobShadowMat,
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = -1;
    return mesh;
  }

  // ─── Update / render ──────────────────────────────────────────────────────

  update(delta: number) {
    const alpha = 1 - Math.pow(0.005, delta / 1000);
    this.currentCamX += (this.targetCamX - this.currentCamX) * alpha;
    this.currentCamZ += (this.targetCamZ - this.currentCamZ) * alpha;

    const x = this.currentCamX;
    const z = this.currentCamZ;
    this.camera.position.set(x, this.CAM_H, z + this.CAM_Z_OFFSET);
    this.camera.lookAt(x, 0, z);

    // Keep shadow frustum centred on the visible area
    this.sun.position.set(x + 6, 14, z - 3);
    this.sun.target.position.set(x, 0, z);
    this.sun.target.updateMatrixWorld();

    // Sync blob shadow positions
    if (this.playerBlob && this.playerSprite) {
      const p = this.playerSprite.sprite.position;
      this.playerBlob.position.set(p.x, 0.01, p.z);
    }
    this.fieldEnemySprites.forEach((sp, id) => {
      const blob = this.enemyBlobs.get(id);
      if (blob && sp) blob.position.set(sp.sprite.position.x, 0.01, sp.sprite.position.z);
    });

    if (this.skyDome) {
      this.skyDome.position.set(x, 0, z);
    }

    // Pulse building lights (gentle flicker)
    const flicker = 0.85 + Math.sin(Date.now() * 0.0034) * 0.12 + Math.sin(Date.now() * 0.0071) * 0.03;
    this.buildingLights.forEach(pl => { pl.intensity = pl.color.r > 0.7 ? 0.9 * flicker : 0.7 * flicker; });

    // Exit ring pulse
    const pulse = Math.sin(Date.now() * 0.0028) * 0.3 + 0.7;
    this.exitMaterials.forEach(m => { m.opacity = pulse; });
    this.exitMarkers.children.forEach((c, i) => {
      (c as THREE.Mesh).rotation.z += delta * 0.0012 * (i % 2 === 0 ? 1 : -1);
    });

    // NPC sprite idle bob
    const npcBob = Math.sin(Date.now() * 0.0018) * 0.04;
    this.npcSprites.forEach(sp => {
      if (sp) sp.sprite.position.y = SPRITE_Y + npcBob;
    });
  }

  render() {
    this.composer.render();
  }

  get playerSpriteRef(): BillboardSprite | null { return this.playerSprite; }
}
