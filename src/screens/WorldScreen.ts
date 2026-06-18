import type { CharacterSave, MapId, Direction, NpcDef, ItemDef } from '../types';
import type { PartyMemberDef } from '../data/partyMembers';
import { TILE_SIZE, WALKABLE, ENCOUNTER_TILES, ENCOUNTER_RATE, T } from '../config';
import { getMapDef } from '../data/maps';
import { writeSave } from '../systems/SaveSystem';
import { randomEncounter, ENEMY_MAP, ENCOUNTER_GROUPS } from '../data/enemies';
import { ITEM_MAP } from '../data/items';
import { hasItem, removeItem } from '../systems/InventorySystem';
import { TREASURE_MAPS } from '../data/treasureMaps';
import { QUESTS } from '../data/quests';
import { checkQuestCompletion } from '../systems/QuestSystem';
import { getEnemyTexture } from '../engine/TextureCache';
import { mpManager } from '../systems/MultiplayerManager';
import type { NetPlayer, EnemyDef } from '../types';
import { WorldRenderer } from '../renderer/WorldRenderer';
import { BillboardSprite } from '../renderer/BillboardSprite';
import { HUD } from '../ui/HUD';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { getPartyMemberDef } from '../data/partyMembers';
import { isRecruited, isRecruitable, recruitMember } from '../systems/PartySystem';
import { getClassDef, calcStats } from '../data/characters';

interface FieldEnemy {
  id: string;
  tileX: number;
  tileY: number;
  visX: number;     // visual world X (interpolated)
  visZ: number;     // visual world Z (interpolated)
  enemyIds: string[];
  spriteKey: string;
  moveTimer: number;       // ms until next move
  moveInterval: number;    // randomised interval for this enemy
}

const MAP_FLAGS: Partial<Record<MapId, string>> = {
  village:      'village_visited',
  world:        'world_visited',
  castle:       'castle_visited',
  dungeon:      'dungeon_entered',
  dungeon2:     'dungeon2_entered',
  dungeon3:     'dungeon3_entered',
  house1:       'house1_visited',
  house2:       'house2_visited',
  house3:       'house3_visited',
  ruins:        'ruins_visited',
  ice_cave:     'ice_cave_visited',
  lava_cave:    'lava_cave_visited',
  sea_temple:   'sea_temple_visited',
  sky_castle:   'sky_castle_visited',
  demon_castle: 'demon_castle_visited',
};

const FONT = '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';
const MOVE_DURATION = 250; // ms per tile move

// Maps each quest to the MapIds where the target enemy can be found
const QUEST_TARGET_MAPS: Record<string, MapId[]> = {
  first_kill:    ['world'],
  goblin_slayer: ['world'],
  dragon_slayer: ['dungeon', 'world'],
  metal_hunter:  ['world'],
  maou:          ['dungeon', 'dungeon2', 'dungeon3'],
  shadow_knight: ['dungeon'],
  demon_lord:    ['demon_castle'],
};

export interface BattleOpts { save: CharacterSave; enemies: EnemyDef[]; isMultiplayer: boolean; isHost: boolean; returnMap: MapId; onDefeat?: () => void; bossId?: string; }

export class WorldScreen {
  private uiRoot: HTMLElement;
  private hudEl: HUD;
  private joystick: VirtualJoystick;
  private dialogEl: HTMLElement;
  private dialogNameEl: HTMLElement;
  private dialogBodyEl: HTMLElement;
  private dialogPromptEl: HTMLElement;
  private actionBtn: HTMLButtonElement;
  private menuBtn: HTMLButtonElement;

  private renderer: WorldRenderer;
  private playerSprite: BillboardSprite | null = null;
  private otherPlayers = new Map<string, { sprite: BillboardSprite; data: NetPlayer }>();

  private save!: CharacterSave;
  private mapId!: MapId;
  private isMultiplayer = false;
  private isHost = false;

  private playerDir: Direction = 'down';
  private moving = false;
  private moveT = 0;
  private moveDur = MOVE_DURATION;
  private moveFromX = 0; private moveFromZ = 0;
  private moveToX = 0;   private moveToZ = 0;
  private walkFrame = 0;
  private stepsSinceEncounter = 0;
  private pendingMoveEnd: (() => void) | null = null;

  private dialogOpen = false;
  private dialogLines: string[] = [];
  private dialogPage = 0;

  private heldDir: Direction | null = null;

  private isHosting = false;
  private hostedRoomCode = '';
  private guestCount = 0;
  private roomCodeOverlay: HTMLElement | null = null;

  private fieldEnemies: FieldEnemy[] = [];
  private preBattleMapId: MapId | null = null;

  private pendingClassPick: { def: PartyMemberDef } | null = null;
  private pendingBossBattle = false;
  private pendingBossId: string | null = null;

  private onOpenGacha?: () => void;
  private onOpenCraft?: () => void;
  private onEnterMap?: (mapId: MapId) => void;

  private minimapCvs: HTMLCanvasElement | null = null;
  private minimapCtx: CanvasRenderingContext2D | null = null;

  // Day/night clock (1 game hour = 20 real seconds; starts at 10:00)
  private gameHour = 10;
  private gameClockAccum = 0;

  private shopLabels: Array<{ el: HTMLElement; worldX: number; worldZ: number }> = [];
  private exitLabels: Array<{ el: HTMLElement; worldX: number; worldZ: number }> = [];
  private exitLabelT = 0;
  private questMarkers: Array<{ el: HTMLElement; worldX: number; worldZ: number }> = [];
  private questPanel: HTMLElement | null = null;
  private mapTransitionCooldown = 0; // ms — prevents re-entering exit immediately after map change

  private onBattle!: (opts: BattleOpts) => void;
  private onMenu!: (save: CharacterSave, onClose: (s: CharacterSave)=>void, onFieldAction?: (action: string) => void, onOpenGacha?: ()=>void, onOpenCraft?: ()=>void, onEnterMap?: (mapId: MapId)=>void) => void;
  private stealthMode = false;
  private stealthIndicator: HTMLElement | null = null;

  private active = false;
  private lastTime = 0;

  private inputKeys = {
    up: false, down: false, left: false, right: false,
  };

  constructor(canvas: HTMLCanvasElement, uiContainer: HTMLElement) {
    this.renderer = new WorldRenderer(canvas);

    // ─── UI overlay ────────────────────────────────────────────────────────

    this.uiRoot = document.createElement('div');
    this.uiRoot.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;';
    uiContainer.appendChild(this.uiRoot);

    // HUD at bottom
    this.hudEl = new HUD(this.uiRoot);

    // Controls bar (joystick + buttons)
    const ctrlBar = document.createElement('div');
    ctrlBar.style.cssText = `
      position:absolute;bottom:0;left:0;right:0;
      height:100px;
      display:flex;align-items:center;justify-content:space-between;
      padding:0 18px;
      pointer-events:none;
    `;
    this.uiRoot.appendChild(ctrlBar);

    // VirtualJoystick — covers full width above the button row (floating, appears at touch)
    const joyWrap = document.createElement('div');
    joyWrap.style.cssText = 'position:absolute;top:0;bottom:100px;left:0;right:0;pointer-events:auto;';
    this.uiRoot.appendChild(joyWrap);
    this.joystick = new VirtualJoystick(joyWrap, dir => {
      this.heldDir = dir;
    });

    // A + M buttons (right side)
    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = `
      position:absolute;bottom:22px;right:16px;
      display:flex;gap:12px;align-items:center;
      pointer-events:none;
    `;
    this.uiRoot.appendChild(btnWrap);

    this.menuBtn  = this.makeBtn('M', '#AABBFF', '#8899FF', () => this.openMenu());
    this.actionBtn = this.makeBtn('話す', '#FFD700', '#FFDD66', () => this.onActionButton());
    btnWrap.appendChild(this.menuBtn);
    btnWrap.appendChild(this.actionBtn);

    // Dialogue box
    this.dialogEl = document.createElement('div');
    this.dialogEl.style.cssText = `
      position:absolute;bottom:104px;left:8px;right:8px;
      background:rgba(10,10,30,0.96);
      border:2px solid rgba(212,175,55,0.7);
      border-radius:6px;padding:10px 14px;
      display:none;pointer-events:auto;
      cursor:pointer;
    `;
    this.dialogNameEl = document.createElement('div');
    this.dialogNameEl.style.cssText = `color:#FFD700;font-size:12px;font-family:${FONT};margin-bottom:6px;`;
    this.dialogBodyEl = document.createElement('div');
    this.dialogBodyEl.style.cssText = `color:#FFFDE7;font-size:14px;font-family:${FONT};line-height:1.5;`;
    this.dialogPromptEl = document.createElement('div');
    this.dialogPromptEl.style.cssText = `color:#FFD700;font-size:14px;text-align:right;margin-top:4px;font-family:${FONT};`;
    this.dialogEl.appendChild(this.dialogNameEl);
    this.dialogEl.appendChild(this.dialogBodyEl);
    this.dialogEl.appendChild(this.dialogPromptEl);
    this.dialogEl.addEventListener('click', () => this.advanceDialog());
    this.uiRoot.appendChild(this.dialogEl);

    // Keyboard input
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup',   this.onKeyUp);
  }

  private makeBtn(label: string, color: string, border: string, onClick: ()=>void): HTMLButtonElement {
    const b = document.createElement('button');
    b.style.cssText = `
      min-width:48px;height:48px;padding:0 10px;border-radius:24px;
      background:rgba(255,255,255,0.12);
      border:2px solid ${border}88;
      color:${color};font-size:14px;font-weight:bold;
      font-family:${FONT};cursor:pointer;pointer-events:auto;
      text-shadow:0 1px 3px #000;
    `;
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  // ─── Activate / Deactivate ─────────────────────────────────────────────────

  activate(
    save: CharacterSave,
    opts: { isMultiplayer: boolean; isHost?: boolean; fromBattle?: boolean },
    onBattle: (o: BattleOpts)=>void,
    onMenu:   (s: CharacterSave, onClose: (s:CharacterSave)=>void, onFieldAction?: (action: string) => void,
               onOpenGacha?: ()=>void, onOpenCraft?: ()=>void, onEnterMap?: (mapId: MapId)=>void)=>void,
    onOpenGacha?: () => void,
    onOpenCraft?: () => void,
    onEnterMap?: (mapId: MapId) => void,
  ) {
    this.onOpenGacha = onOpenGacha;
    this.onOpenCraft = onOpenCraft;
    this.onEnterMap  = onEnterMap;
    this.save = save;
    this.mapId = save.position.mapId;
    this.isMultiplayer = opts.isMultiplayer;
    this.isHost = opts.isHost ?? false;
    this.onBattle = onBattle;
    this.onMenu   = onMenu;
    // Always use internal implementations for gacha and map entry
    this.onOpenGacha = () => this.showGachaDialog();
    this.onEnterMap  = (mapId: MapId) => this.enterTreasureMap(mapId);
    this.onOpenCraft = onOpenCraft;
    this.moving = false;
    this.dialogOpen = false;
    this.dialogEl.style.display = 'none';

    const classIdx = ['戦士','魔法使い','回復師','盗賊'].indexOf(save.className);
    const ci = classIdx >= 0 ? classIdx : 0;

    // Load map and spawn player
    const mapDef = getMapDef(this.mapId);
    this.renderer.loadMap(mapDef); // clears field enemy sprites via clearFieldEnemies()
    this.renderer.setTimeOfDay(this.gameHour + this.gameClockAccum / 20000);
    this.playerSprite = this.renderer.spawnPlayer(ci, save.position.tileX, save.position.tileY);

    // Field enemies
    const isDungeon = (id: string) => ['dungeon','dungeon2','dungeon3','ruins','ice_cave','lava_cave','sea_temple','sky_castle','demon_castle','tmap_1','tmap_2','tmap_3','tmap_4','tmap_5'].includes(id);
    const sameMapReturn = opts.fromBattle && this.preBattleMapId === this.mapId;
    if (sameMapReturn) {
      for (const fe of this.fieldEnemies) {
        fe.visX = fe.tileX + 0.5;
        fe.visZ = fe.tileY + 0.5;
        this.renderer.addFieldEnemy(fe.id, getEnemyTexture(fe.spriteKey), fe.tileX, fe.tileY);
      }
    } else {
      this.fieldEnemies = [];
      if (mapDef.encounterGroup) this.spawnFieldEnemies();
    }
    this.preBattleMapId = null;

    // Minimap
    this.minimapCvs?.remove();
    this.minimapCvs = document.createElement('canvas');
    this.minimapCvs.width = 80; this.minimapCvs.height = 80;
    this.minimapCvs.style.cssText = 'position:absolute;top:8px;right:8px;width:80px;height:80px;border:1px solid rgba(212,175,55,0.5);border-radius:4px;image-rendering:pixelated;pointer-events:none;z-index:5;opacity:0.85;';
    this.uiRoot.appendChild(this.minimapCvs);
    this.minimapCtx = this.minimapCvs.getContext('2d')!;
    this.drawMinimap();

    // Shop labels, exit labels, quest markers
    this.buildShopLabels();
    this.buildExitLabels();
    this.buildQuestMarkers();
    this.buildQuestPanel();

    this.uiRoot.style.display = 'block';
    this.hudEl.show();
    this.hudEl.update(save, mapDef.name);
    this.hudEl.showMapBanner(mapDef.name);

    // マップ訪問フラグを設定
    const mapFlag = MAP_FLAGS[this.mapId];
    if (mapFlag) save.flags[mapFlag] = true;

    if (this.isMultiplayer) this.setupMultiplayer();

    this.active = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  deactivate() {
    this.active = false;
    this.uiRoot.style.display = 'none';
  }

  // ─── Game loop ─────────────────────────────────────────────────────────────

  private loop = (time: number) => {
    if (!this.active) return;
    requestAnimationFrame(this.loop);

    const delta = Math.min(time - this.lastTime, 100);
    this.lastTime = time;

    this.update(delta);
    this.renderer.update(delta);
    this.renderer.render();
  };

  private update(delta: number) {
    if (this.mapTransitionCooldown > 0) this.mapTransitionCooldown = Math.max(0, this.mapTransitionCooldown - delta);

    // Advance game clock: 20 real seconds = 1 game hour
    this.gameClockAccum += delta;
    if (this.gameClockAccum >= 20000) {
      this.gameClockAccum -= 20000;
      this.gameHour = (this.gameHour + 1) % 24;
    }
    this.renderer.setTimeOfDay(this.gameHour + this.gameClockAccum / 20000);
    this.renderer.setPlayerLight(this.save.equipment.accessory === 'lantern');

    // Per-enemy individual movement timers + smooth visual interpolation
    let anyMoved = false;
    for (const fe of this.fieldEnemies) {
      // Individual move tick
      fe.moveTimer -= delta;
      if (fe.moveTimer <= 0) {
        fe.moveTimer = fe.moveInterval + Math.random() * 400;
        this.moveSingleEnemy(fe);
        anyMoved = true;
      }
      // Lerp visual position toward logical tile
      const alpha = Math.min(1, delta * 0.008);
      fe.visX += (fe.tileX + 0.5 - fe.visX) * alpha;
      fe.visZ += (fe.tileY + 0.5 - fe.visZ) * alpha;
      this.renderer.setFieldEnemyWorldPos(fe.id, fe.visX, fe.visZ);
    }
    if (anyMoved) this.drawMinimap();

    // Shop label projection
    for (const sl of this.shopLabels) {
      const s = this.renderer.projectToScreen(sl.worldX, sl.worldZ);
      if (s) {
        sl.el.style.display = 'block';
        sl.el.style.left = (s.x - sl.el.offsetWidth / 2) + 'px';
        sl.el.style.top = (s.y - 50) + 'px';
      } else {
        sl.el.style.display = 'none';
      }
    }

    // Exit label projection + blink
    this.exitLabelT = (this.exitLabelT + delta) % 1400;
    const exitOpacity = this.exitLabelT < 700 ? '1' : '0.45';
    for (const el of this.exitLabels) {
      const s = this.renderer.projectToScreen(el.worldX, el.worldZ);
      if (s) {
        el.el.style.display = 'block';
        el.el.style.opacity = exitOpacity;
        el.el.style.left = (s.x - el.el.offsetWidth / 2) + 'px';
        el.el.style.top = (s.y - 62) + 'px';
      } else {
        el.el.style.display = 'none';
      }
    }

    // Quest marker projection + pulse
    const qPulse = this.exitLabelT < 700 ? '1' : '0.6';
    for (const qm of this.questMarkers) {
      const s = this.renderer.projectToScreen(qm.worldX, qm.worldZ);
      if (s) {
        qm.el.style.display = 'block';
        qm.el.style.opacity = qPulse;
        qm.el.style.left = (s.x - qm.el.offsetWidth / 2) + 'px';
        qm.el.style.top = (s.y - 80) + 'px';
      } else {
        qm.el.style.display = 'none';
      }
    }

    // Walk animation
    if (this.moving) {
      this.moveT += delta;
      const t = Math.min(this.moveT / this.moveDur, 1);
      const x = this.moveFromX + (this.moveToX - this.moveFromX) * t;
      const z = this.moveFromZ + (this.moveToZ - this.moveFromZ) * t;
      this.playerSprite?.setPosition(x, 0.52, z);
      this.renderer.setPlayerTile(x - 0.5, z - 0.5);

      // Walk frame: toggle at midpoint
      const frame = Math.floor(t * 4) % 2;
      const walkDir = this.faceDir(this.playerDir);
      const dirIndex = {down:0,up:3,left:2,right:1}[walkDir];
      this.playerSprite?.setFrame(dirIndex * 2 + frame);

      if (t >= 1 && this.pendingMoveEnd) {
        this.moving = false;
        const fn = this.pendingMoveEnd;
        this.pendingMoveEnd = null;
        fn();
      }
    } else if (!this.dialogOpen) {
      // Try to move
      const dir = this.heldDir ?? this.pressedDir();
      if (dir) this.tryMove(dir);
    }
  }

  private faceDir(dir: Direction): 'up'|'down'|'left'|'right' {
    if (dir === 'up-left'   || dir === 'down-left')  return 'left';
    if (dir === 'up-right'  || dir === 'down-right') return 'right';
    return dir as 'up'|'down'|'left'|'right';
  }

  private pressedDir(): Direction | null {
    const u = this.inputKeys.up, d = this.inputKeys.down;
    const l = this.inputKeys.left, r = this.inputKeys.right;
    if (u && r) return 'up-right';
    if (u && l) return 'up-left';
    if (d && r) return 'down-right';
    if (d && l) return 'down-left';
    if (u) return 'up';
    if (d) return 'down';
    if (l) return 'left';
    if (r) return 'right';
    return null;
  }

  // ─── Movement ──────────────────────────────────────────────────────────────

  private tryMove(dir: Direction) {
    if (this.moving || this.dialogOpen) return;

    const mapDef = getMapDef(this.mapId);
    const tiles = mapDef.tiles;
    const tx = this.save.position.tileX;
    const ty = this.save.position.tileY;

    let nx = tx, ny = ty;
    if (dir === 'down' || dir === 'down-left' || dir === 'down-right') ny++;
    if (dir === 'up'   || dir === 'up-left'   || dir === 'up-right')   ny--;
    if (dir === 'left' || dir === 'up-left'   || dir === 'down-left')  nx--;
    if (dir === 'right'|| dir === 'up-right'  || dir === 'down-right') nx++;

    this.playerDir = dir;
    const spriteDir = this.faceDir(dir);
    const dirIndex = {down:0,up:3,left:2,right:1}[spriteDir];
    this.playerSprite?.setFrame(dirIndex * 2);

    if (ny<0||ny>=tiles.length||nx<0||nx>=tiles[0].length) return;

    const tileId = tiles[ny][nx];
    if (!WALKABLE.has(tileId)) return;

    // Check exit (guarded by cooldown to prevent flickering on map entry)
    const exit = mapDef.exits.find(e=>e.tileX===nx&&e.tileY===ny);
    if (exit && this.mapTransitionCooldown <= 0) { this.changeMap(exit.targetMap, exit.targetX, exit.targetY); return; }

    // Check NPC
    const npc = mapDef.npcs.find(n=>n.tileX===nx&&n.tileY===ny);
    if (npc) {
      if (npc.isChest) {
        this.showChestDialog(npc);
      } else if (npc.isInn) {
        this.showInnDialog();
      } else if (npc.isChurch) {
        this.showChurchDialog();
      } else if (npc.id === 'medal_master') {
        this.showMedalMasterDialog();
      } else if (npc.id === 'ship_merchant') {
        this.showShipMerchantDialog();
      } else if (npc.id === 'dock_captain') {
        this.showDockDialog();
      } else if (npc.shopType) {
        this.showShopDialog(npc);
      } else if (npc.bossId) {
        this.showDialogue(npc.name, npc.dialogue);
        this.pendingBossId = npc.bossId;
        if (npc.id === 'boss_grosur') this.pendingBossBattle = true;
      } else if (npc.recruitId) {
        this.handleRecruitNpc(npc);
      } else {
        this.showDialogue(npc.name, npc.dialogue);
      }
      return;
    }

    // Start move
    this.moving = true;
    this.moveT = 0;
    this.moveFromX = tx + 0.5;
    this.moveFromZ = ty + 0.5;
    this.moveToX = nx + 0.5;
    this.moveToZ = ny + 0.5;

    this.save.position.tileX = nx;
    this.save.position.tileY = ny;

    this.pendingMoveEnd = () => {
      // Check field enemy collision
      const hitEnemy = this.fieldEnemies.find(e => e.tileX === nx && e.tileY === ny);
      if (hitEnemy) {
        this.removeFieldEnemyById(hitEnemy.id);
        const enemyDefs = hitEnemy.enemyIds.map(id => ({ ...ENEMY_MAP[id] }));
        writeSave(this.save);
        if (this.isMultiplayer) mpManager.movePlayer(nx, ny, this.mapId, this.faceDir(dir));
        this.hudEl.update(this.save, getMapDef(this.mapId).name);
        this.triggerBattle(enemyDefs);
        return;
      }
      // Random encounters in dungeons (floor tiles don't match ENCOUNTER_TILES, so check inline)
      const inDungeon = ['dungeon','dungeon2','dungeon3','ruins','ice_cave','lava_cave','sea_temple','sky_castle','demon_castle','tmap_1','tmap_2','tmap_3','tmap_4','tmap_5'].includes(this.mapId);
      if (inDungeon && !this.stealthMode) {
        this.stepsSinceEncounter++;
        if (this.stepsSinceEncounter >= 5 && Math.random() < ENCOUNTER_RATE) {
          this.stepsSinceEncounter = 0;
          this.triggerBattle();
        }
      }
      this.drawMinimap();
      writeSave(this.save);
      if (this.isMultiplayer) {
        mpManager.movePlayer(nx, ny, this.mapId, this.faceDir(dir));
      }
      this.hudEl.update(this.save, getMapDef(this.mapId).name);
    };
  }

  private changeMap(targetMap: MapId, targetX: number, targetY: number) {
    this.fieldEnemies = []; // renderer.loadMap() will clear sprites
    this.save.position = { mapId: targetMap, tileX: targetX, tileY: targetY };
    this.mapId = targetMap;
    this.mapTransitionCooldown = 600; // prevent immediate re-exit after transition

    // マップ訪問フラグを設定
    const mapFlag = MAP_FLAGS[targetMap];
    if (mapFlag) this.save.flags[mapFlag] = true;

    writeSave(this.save);

    const mapDef = getMapDef(targetMap);
    this.renderer.loadMap(mapDef);
    this.playerSprite = this.renderer.spawnPlayer(
      ['戦士','魔法使い','回復師','盗賊'].indexOf(this.save.className),
      targetX, targetY
    );

    const isDungeon = (id: string) => ['dungeon','dungeon2','dungeon3','ruins','ice_cave','lava_cave','sea_temple','sky_castle','demon_castle','tmap_1','tmap_2','tmap_3','tmap_4','tmap_5'].includes(id);
    if (mapDef.encounterGroup && !isDungeon(targetMap)) this.spawnFieldEnemies();

    // Minimap for new map
    this.minimapCvs?.remove();
    this.minimapCvs = document.createElement('canvas');
    this.minimapCvs.width = 80; this.minimapCvs.height = 80;
    this.minimapCvs.style.cssText = 'position:absolute;top:8px;right:8px;width:80px;height:80px;border:1px solid rgba(212,175,55,0.5);border-radius:4px;image-rendering:pixelated;pointer-events:none;z-index:5;opacity:0.85;';
    this.uiRoot.appendChild(this.minimapCvs);
    this.minimapCtx = this.minimapCvs.getContext('2d')!;
    this.drawMinimap();

    // Shop labels, exit labels, quest markers for new map
    this.buildShopLabels();
    this.buildExitLabels();
    this.buildQuestMarkers();
    this.updateQuestPanel();

    this.hudEl.update(this.save, mapDef.name);
    this.hudEl.showMapBanner(mapDef.name);
  }

  // ─── Encounter ─────────────────────────────────────────────────────────────

  private checkEncounter(tileId: number) {
    if (this.stealthMode) { this.stepsSinceEncounter = 0; return; }
    if (!ENCOUNTER_TILES.has(tileId)) { this.stepsSinceEncounter = 0; return; }
    this.stepsSinceEncounter++;
    if (this.stepsSinceEncounter < 5) return;
    if (Math.random() < ENCOUNTER_RATE) {
      this.stepsSinceEncounter = 0;
      this.triggerBattle();
    }
  }

  private triggerBattle(enemies?: EnemyDef[], bossId?: string) {
    this.preBattleMapId = this.mapId;
    const mapDef = getMapDef(this.mapId);
    const battleEnemies = enemies ?? randomEncounter(mapDef.encounterGroup ?? 'world_field');

    // Battle transition: white flash
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:#FFF;z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.13s ease-in;';
    document.body.appendChild(flash);
    requestAnimationFrame(() => { flash.style.opacity = '1'; });

    setTimeout(() => {
      this.onBattle({ save: this.save, enemies: battleEnemies, isMultiplayer: this.isMultiplayer, isHost: this.isHost, returnMap: this.mapId, onDefeat: () => this.handleDefeat(), bossId });
      flash.style.transition = 'opacity 0.22s ease-out';
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 280);
    }, 220);
  }

  // ─── Field enemies ─────────────────────────────────────────────────────────

  private spawnFieldEnemies() {
    const mapDef = getMapDef(this.mapId);
    const tiles = mapDef.tiles;
    const rows = tiles.length;
    const cols = tiles[0]?.length ?? 0;
    const npcSet = new Set(mapDef.npcs.map(n => `${n.tileX},${n.tileY}`));
    const px = this.save.position.tileX;
    const py = this.save.position.tileY;
    const isDungeon = this.mapId === 'dungeon' || this.mapId === 'dungeon2' || this.mapId === 'dungeon3';
    // Dungeons use FLOOR tiles; outdoor uses standard encounter tiles
    const spawnTiles = isDungeon ? new Set([T.FLOOR]) : ENCOUNTER_TILES;
    const safeZone = isDungeon ? 4 : 6;

    const candidates: {x: number; y: number}[] = [];
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        if (!spawnTiles.has(tiles[ty][tx])) continue;
        if (npcSet.has(`${tx},${ty}`)) continue;
        if (Math.abs(tx - px) < safeZone && Math.abs(ty - py) < safeZone) continue;
        candidates.push({x: tx, y: ty});
      }
    }
    candidates.sort(() => Math.random() - 0.5);

    const group = mapDef.encounterGroup ?? 'world_field';
    const groups = ENCOUNTER_GROUPS[group] ?? ENCOUNTER_GROUPS['world_field'];
    const count = isDungeon
      ? Math.min(6, Math.max(3, Math.floor(candidates.length * 0.05)))
      : Math.min(8, Math.max(5, Math.floor(candidates.length * 0.02)));

    for (let i = 0; i < Math.min(count, candidates.length); i++) {
      const pos = candidates[i];
      const groupPick = groups[Math.floor(Math.random() * groups.length)];
      const spriteKey = ENEMY_MAP[groupPick[0]]?.sprite ?? 'slime';
      const id = `fe_${Date.now()}_${i}`;
      const interval = 700 + Math.random() * 1000; // 700–1700ms, different per enemy
      this.fieldEnemies.push({ id, tileX: pos.x, tileY: pos.y, visX: pos.x + 0.5, visZ: pos.y + 0.5, enemyIds: groupPick, spriteKey, moveTimer: Math.random() * interval, moveInterval: interval });
      this.renderer.addFieldEnemy(id, getEnemyTexture(spriteKey), pos.x, pos.y);
    }
  }

  private moveSingleEnemy(fe: FieldEnemy) {
    if (this.dialogOpen) return;
    const mapDef = getMapDef(this.mapId);
    const tiles = mapDef.tiles;
    const rows = tiles.length;
    const cols = tiles[0]?.length ?? 0;
    const px = this.save.position.tileX;
    const py = this.save.position.tileY;
    const dist = Math.abs(fe.tileX - px) + Math.abs(fe.tileY - py);

    let dirs: {dx: number; dy: number}[];
    if (dist <= 5 && dist > 1) {
      // Chase player
      const sdx = Math.sign(px - fe.tileX);
      const sdy = Math.sign(py - fe.tileY);
      dirs = [{dx:sdx,dy:0},{dx:0,dy:sdy},{dx:-sdx,dy:0},{dx:0,dy:-sdy}].filter(d => d.dx!==0||d.dy!==0);
    } else {
      dirs = [{dx:0,dy:1},{dx:0,dy:-1},{dx:1,dy:0},{dx:-1,dy:0}];
      dirs.sort(() => Math.random() - 0.5);
    }

    for (const d of dirs) {
      const nx = fe.tileX + d.dx;
      const ny = fe.tileY + d.dy;
      if (nx < 0 || ny < 0 || ny >= rows || nx >= cols) continue;
      if (!ENCOUNTER_TILES.has(tiles[ny][nx])) continue;
      if (this.fieldEnemies.some(e => e !== fe && e.tileX === nx && e.tileY === ny)) continue;
      fe.tileX = nx;
      fe.tileY = ny;
      break;
    }
  }

  private removeFieldEnemyById(id: string) {
    const idx = this.fieldEnemies.findIndex(e => e.id === id);
    if (idx >= 0) {
      this.renderer.removeFieldEnemy(id);
      this.fieldEnemies.splice(idx, 1);
    }
  }

  // ─── Minimap ───────────────────────────────────────────────────────────────

  private drawMinimap() {
    const ctx = this.minimapCtx; if (!ctx || !this.minimapCvs) return;
    const mapDef = getMapDef(this.mapId);
    const tiles = mapDef.tiles;
    const rows = tiles.length; const cols = tiles[0]?.length ?? 0;
    const sw = 80 / cols; const sh = 80 / rows;
    ctx.clearRect(0, 0, 80, 80);
    // Tile colors
    const TC: Record<number, string> = { 0:'#4CAF50',1:'#1565C0',2:'#555',3:'#8D6E63',4:'#2E7D32',5:'#F9A825',6:'#8D5',7:'#90A4AE',8:'#111',9:'#33691E',10:'#37474F',11:'#BCAAA4',12:'#5D4037',13:'#FFD700' };
    for (let ty=0;ty<rows;ty++) for (let tx=0;tx<cols;tx++) {
      ctx.fillStyle = TC[tiles[ty][tx]] ?? '#222';
      ctx.fillRect(tx*sw, ty*sh, Math.max(1,sw), Math.max(1,sh));
    }
    // Exits (cyan)
    ctx.fillStyle = '#00FFFF';
    for (const ex of mapDef.exits) ctx.fillRect(ex.tileX*sw-1, ex.tileY*sh-1, Math.max(2,sw+2), Math.max(2,sh+2));
    // Quest target exits (orange !)
    const activeQuestMaps = new Set<string>();
    if (this.save.completedQuests !== undefined || true) {
      const completed = this.save.completedQuests ?? [];
      for (const q of QUESTS) {
        if (completed.includes(q.id)) continue;
        const targets = QUEST_TARGET_MAPS[q.id] ?? [];
        for (const t of targets) activeQuestMaps.add(t);
      }
    }
    if (activeQuestMaps.size > 0) {
      ctx.fillStyle = '#FF8C00';
      ctx.font = `bold ${Math.max(6, Math.min(sw*2, 9))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const ex of mapDef.exits) {
        if (!activeQuestMaps.has(ex.targetMap)) continue;
        ctx.fillText('!', ex.tileX*sw + sw/2, ex.tileY*sh + sh/2);
      }
    }
    // Field enemies (red dot)
    ctx.fillStyle = '#FF3333';
    for (const fe of this.fieldEnemies) ctx.fillRect(fe.tileX*sw-1, fe.tileY*sh-1, Math.max(2,sw+1), Math.max(2,sh+1));
    // NPCs (yellow)
    ctx.fillStyle = '#FFD700';
    for (const npc of mapDef.npcs) ctx.fillRect(npc.tileX*sw-1, npc.tileY*sh-1, Math.max(2,sw+1), Math.max(2,sh+1));
    // Player (white, larger)
    const px = this.save.position.tileX; const py = this.save.position.tileY;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(px*sw-2, py*sh-2, Math.max(4,sw+3), Math.max(4,sh+3));
    // Border
    ctx.strokeStyle = 'rgba(212,175,55,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(0.5,0.5,79,79);
  }

  // ─── Shop labels ───────────────────────────────────────────────────────────

  private buildShopLabels() {
    // Remove old shop labels
    for (const sl of this.shopLabels) sl.el.remove();
    this.shopLabels = [];

    const mapDef = getMapDef(this.mapId);
    for (const npc of mapDef.npcs) {
      if (!npc.shopType && !npc.isInn) continue;

      let text = '';
      let borderColor = 'rgba(212,175,55,0.6)';
      if (npc.isInn) {
        text = '🏨 宿屋';
        borderColor = 'rgba(100,180,255,0.6)';
      } else if (npc.shopType === 'weapon') {
        text = '⚔ 武器屋';
        borderColor = 'rgba(255,120,80,0.6)';
      } else if (npc.shopType === 'armor') {
        text = '🛡 防具屋';
        borderColor = 'rgba(120,200,120,0.6)';
      } else if (npc.shopType === 'item') {
        text = '🌿 道具屋';
        borderColor = 'rgba(180,255,120,0.6)';
      } else {
        continue;
      }

      const el = document.createElement('div');
      el.style.cssText = `position:absolute;pointer-events:none;z-index:6;white-space:nowrap;font-size:11px;font-weight:bold;font-family:${FONT};background:rgba(10,10,30,0.82);border:1px solid ${borderColor};border-radius:4px;padding:2px 6px;color:#FFFDE7;display:none;`;
      el.textContent = text;
      this.uiRoot.appendChild(el);
      this.shopLabels.push({ el, worldX: npc.tileX + 0.5, worldZ: npc.tileY + 0.5 });
    }
  }

  // ─── Exit labels ───────────────────────────────────────────────────────────

  private buildExitLabels() {
    for (const el of this.exitLabels) el.el.remove();
    this.exitLabels = [];

    const mapDef = getMapDef(this.mapId);
    // De-duplicate exits that share the same tile area (e.g. two door tiles side by side)
    const seen = new Set<string>();
    for (const exit of mapDef.exits) {
      const key = exit.targetMap;
      if (seen.has(key)) continue;
      seen.add(key);

      // Direction-aware labels: going UP means returning to a shallower floor
      const deeper = ['dungeon2', 'dungeon3'];
      const isGoingUp = deeper.includes(this.mapId) && !deeper.includes(exit.targetMap) && exit.targetMap !== 'world';
      const MAP_TEXT: Record<string, string> = {
        world: '🌍 フィールドへ',
        village: '🏘 ハジメ村へ',
        castle: '🏰 アルデア城へ',
        dungeon: isGoingUp ? '⬆ 地下1階へ' : '⬇ 闇の洞窟へ',
        dungeon2: this.mapId === 'dungeon3' ? '⬆ 地下2階へ' : '⬇ 地下2階へ',
        dungeon3: '⬇ 地下3階へ',
        ruins:        this.mapId === 'world' ? '⬇ 古代遺跡へ' : '⬆ フィールドへ',
        ice_cave:     this.mapId === 'ruins' ? '⬇ 古代遺跡 深部へ' : '⬆ 古代遺跡 1Fへ',
        lava_cave:    this.mapId === 'world' ? '⬇ 溶岩洞窟へ' : '⬆ フィールドへ',
        sky_castle:   this.mapId === 'lava_cave' ? '⬇ 天空の試練場へ' : '⬆ 溶岩洞窟へ',
        sea_temple:   '⬇ 海底神殿へ',
        demon_castle: this.mapId === 'sea_temple' ? '⬇ 魔王の城へ' : '⬆ 海底神殿へ',
      };
      const text = MAP_TEXT[exit.targetMap] ?? `→ ${exit.targetMap}`;
      const label = document.createElement('div');
      label.style.cssText = `
        position:absolute;pointer-events:none;z-index:7;white-space:nowrap;
        font-size:11px;font-weight:bold;font-family:${FONT};
        background:rgba(0,20,40,0.88);
        border:1px solid rgba(0,220,255,0.75);
        border-radius:4px;padding:3px 7px;
        color:#00EEFF;display:none;
        text-shadow:0 0 6px rgba(0,200,255,0.8);
      `;
      label.textContent = text;
      this.uiRoot.appendChild(label);
      this.exitLabels.push({ el: label, worldX: exit.tileX + 0.5, worldZ: exit.tileY + 0.5 });
    }
  }

  // ─── Quest markers (world-space) ──────────────────────────────────────────

  private buildQuestMarkers() {
    for (const qm of this.questMarkers) qm.el.remove();
    this.questMarkers = [];

    const completed = this.save.completedQuests ?? [];
    const activeQuests = QUESTS.filter(q => !completed.includes(q.id));
    if (!activeQuests.length) return;

    const targetMaps = new Set<MapId>();
    for (const q of activeQuests) {
      for (const m of (QUEST_TARGET_MAPS[q.id] ?? [])) targetMaps.add(m as MapId);
    }

    const mapDef = getMapDef(this.mapId);
    const seen = new Set<string>();
    for (const exit of mapDef.exits) {
      if (!targetMaps.has(exit.targetMap as MapId) || seen.has(exit.targetMap)) continue;
      seen.add(exit.targetMap);

      const names = activeQuests
        .filter(q => (QUEST_TARGET_MAPS[q.id] ?? []).includes(exit.targetMap as MapId))
        .map(q => q.name)
        .join(' / ');

      const label = document.createElement('div');
      label.style.cssText = `
        position:absolute;pointer-events:none;z-index:8;white-space:nowrap;
        font-size:12px;font-weight:bold;font-family:${FONT};
        background:rgba(40,10,0,0.90);
        border:2px solid rgba(255,140,0,0.95);
        border-radius:6px;padding:3px 8px;
        color:#FFAA00;display:none;
        text-shadow:0 0 8px rgba(255,160,0,0.7);
      `;
      label.textContent = `❗ ${names}`;
      this.uiRoot.appendChild(label);
      this.questMarkers.push({ el: label, worldX: exit.tileX + 0.5, worldZ: exit.tileY + 0.5 });
    }

    // Also mark boss NPCs in current dungeon
    const questBossIds: Record<string, string> = {
      maou: 'boss_grosur', demon_lord: 'boss_demon',
    };
    for (const npc of mapDef.npcs) {
      const quest = activeQuests.find(q => questBossIds[q.id] === npc.id);
      if (!quest) continue;
      const label = document.createElement('div');
      label.style.cssText = `
        position:absolute;pointer-events:none;z-index:8;white-space:nowrap;
        font-size:12px;font-weight:bold;font-family:${FONT};
        background:rgba(40,0,0,0.92);
        border:2px solid rgba(255,50,50,0.95);
        border-radius:6px;padding:3px 8px;
        color:#FF6666;display:none;
        text-shadow:0 0 8px rgba(255,80,80,0.7);
      `;
      label.textContent = `⚔ ${quest.name}`;
      this.uiRoot.appendChild(label);
      this.questMarkers.push({ el: label, worldX: npc.tileX + 0.5, worldZ: npc.tileY + 0.5 });
    }
  }

  // ─── Quest panel (HUD overlay) ─────────────────────────────────────────────

  private buildQuestPanel() {
    this.questPanel?.remove();
    this.questPanel = null;

    const panel = document.createElement('div');
    panel.style.cssText = `
      position:absolute;left:8px;bottom:108px;
      background:rgba(8,8,24,0.88);
      border:1px solid rgba(255,140,0,0.5);
      border-radius:6px;padding:6px 10px;
      font-family:${FONT};pointer-events:auto;z-index:9;
      min-width:160px;max-width:200px;
    `;
    panel.id = 'quest-panel';

    const header = document.createElement('div');
    header.style.cssText = 'color:#FFAA00;font-size:11px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none;';
    header.innerHTML = '❗ クエスト <span id="quest-toggle" style="font-size:10px;color:#888;">▼</span>';

    const body = document.createElement('div');
    body.id = 'quest-panel-body';
    body.style.cssText = 'margin-top:5px;';

    let collapsed = false;
    header.addEventListener('click', () => {
      collapsed = !collapsed;
      body.style.display = collapsed ? 'none' : 'block';
      const tog = panel.querySelector('#quest-toggle') as HTMLElement;
      if (tog) tog.textContent = collapsed ? '▶' : '▼';
    });

    panel.appendChild(header);
    panel.appendChild(body);
    this.uiRoot.appendChild(panel);
    this.questPanel = panel;
    this.updateQuestPanel();
  }

  public updateQuestPanel() {
    const panel = this.questPanel;
    if (!panel) return;
    const body = panel.querySelector('#quest-panel-body') as HTMLElement;
    if (!body) return;

    const completed = this.save.completedQuests ?? [];
    const kills = this.save.questKills ?? {};
    const activeQuests = QUESTS.filter(q => !completed.includes(q.id));

    if (!activeQuests.length) {
      body.innerHTML = `<div style="color:#888;font-size:10px;">すべてのクエスト達成！</div>`;
      return;
    }

    body.innerHTML = '';
    for (const q of activeQuests) {
      const row = document.createElement('div');
      row.style.cssText = 'margin-bottom:5px;';

      const nameEl = document.createElement('div');
      nameEl.style.cssText = 'color:#FFD700;font-size:11px;font-weight:bold;';
      nameEl.textContent = q.name;

      const descEl = document.createElement('div');
      descEl.style.cssText = 'color:#AAAACC;font-size:10px;margin-top:1px;';
      descEl.textContent = q.desc;

      let progressEl: HTMLElement | null = null;
      if (q.killTarget && q.killTarget !== 'any' && q.killCount) {
        const current = kills[q.killTarget] ?? 0;
        const prog = document.createElement('div');
        prog.style.cssText = 'margin-top:2px;';
        const track = document.createElement('div');
        track.style.cssText = 'height:4px;background:rgba(255,255,255,0.12);border-radius:2px;overflow:hidden;';
        const fill = document.createElement('div');
        const pct = Math.min(100, (current / q.killCount) * 100);
        fill.style.cssText = `height:100%;width:${pct}%;background:#FF8C00;border-radius:2px;transition:width 0.3s;`;
        track.appendChild(fill);
        const label = document.createElement('div');
        label.style.cssText = 'color:#FF8C00;font-size:10px;text-align:right;margin-top:1px;';
        label.textContent = `${current} / ${q.killCount}`;
        prog.appendChild(track);
        prog.appendChild(label);
        progressEl = prog;
      } else if (q.killTarget === 'any' && q.killCount) {
        const total = Object.values(kills).reduce((s, n) => s + n, 0);
        const prog = document.createElement('div');
        prog.style.cssText = 'margin-top:2px;';
        const label = document.createElement('div');
        label.style.cssText = 'color:#FF8C00;font-size:10px;';
        label.textContent = `${total} / ${q.killCount}`;
        prog.appendChild(label);
        progressEl = prog;
      }

      row.appendChild(nameEl);
      row.appendChild(descEl);
      if (progressEl) row.appendChild(progressEl);
      body.appendChild(row);
    }
  }

  public notifyQuestComplete(questNames: string[]) {
    if (!questNames.length) return;
    const notif = document.createElement('div');
    notif.style.cssText = `
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%);
      background:rgba(10,10,30,0.97);
      border:2px solid #FFAA00;border-radius:10px;
      padding:18px 28px;text-align:center;
      color:#FFAA00;font-size:15px;font-family:${FONT};
      white-space:pre-line;line-height:1.8;
      pointer-events:none;z-index:30;
      animation:none;
    `;
    notif.textContent = `🎉 クエスト達成！\n${questNames.join('\n')}`;
    this.uiRoot.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  }

  // ─── Dialogue ──────────────────────────────────────────────────────────────

  private showDialogue(name: string, lines: string[]) {
    this.dialogLines = lines;
    this.dialogPage = 0;
    this.dialogOpen = true;
    this.dialogNameEl.textContent = name;
    this.renderDialoguePage();
    this.dialogEl.style.display = 'block';
  }

  private renderDialoguePage() {
    this.dialogBodyEl.textContent = this.dialogLines[this.dialogPage];
    const isLast = this.dialogPage >= this.dialogLines.length - 1;
    this.dialogPromptEl.textContent = isLast ? '✕ 閉じる' : '▼ 次へ';
  }

  private advanceDialog() {
    if (this.dialogPage < this.dialogLines.length - 1) {
      this.dialogPage++;
      this.renderDialoguePage();
    } else {
      this.dialogEl.style.display = 'none';
      this.dialogOpen = false;
      if (this.pendingBossBattle) {
        this.pendingBossBattle = false;
        this.pendingBossId = null;
        const boss = { ...ENEMY_MAP['grosur'] };
        this.triggerBattle([boss]);
      } else if (this.pendingBossId) {
        const bossId = this.pendingBossId;
        this.pendingBossId = null;
        const bossEnemy = ENEMY_MAP[bossId];
        if (bossEnemy) {
          const prog = (this.save.bossProgress ?? {})[bossId] ?? { count: 0, level: 1 };
          const scale = 1 + (prog.level - 1) * 0.3;
          const scaled = { ...bossEnemy, hp: Math.round(bossEnemy.hp * scale), atk: Math.round(bossEnemy.atk * scale) };
          this.triggerBattle([scaled], bossId);
        }
      } else if (this.pendingClassPick) {
        const pick = this.pendingClassPick;
        this.pendingClassPick = null;
        this.showClassPickDialog(pick.def);
      }
    }
  }

  private showClassPickDialog(def: PartyMemberDef) {
    this.dialogOpen = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.65);pointer-events:auto;z-index:20;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background:rgba(10,10,30,0.97);border:2px solid rgba(212,175,55,0.7);
      border-radius:8px;padding:20px 22px;width:280px;
      font-family:${FONT};
    `;

    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-size:15px;font-weight:bold;margin-bottom:6px;text-align:center;';
    title.textContent = `${def.name}の職業を選んでください`;

    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'color:#AAAACC;font-size:11px;margin-bottom:14px;text-align:center;';
    subtitle.textContent = '仲間の職業を決めると後から変更できません';

    box.appendChild(title);
    box.appendChild(subtitle);

    const classes: Array<{ name: string; desc: string }> = [
      { name: '戦士',   desc: 'HP・攻撃力が高い前衛タイプ' },
      { name: '魔法使い', desc: '強力な攻撃魔法を使える' },
      { name: '回復師',  desc: '仲間を回復して支援する' },
      { name: '盗賊',   desc: '素早く攻撃・スピードが高い' },
    ];

    for (const cls of classes) {
      const btn = document.createElement('button');
      btn.style.cssText = `
        display:block;width:100%;padding:8px 12px;margin-bottom:8px;
        background:rgba(26,26,46,0.9);
        border:1px solid rgba(212,175,55,0.4);border-radius:4px;
        text-align:left;cursor:pointer;pointer-events:auto;
      `;

      const clsName = document.createElement('div');
      clsName.style.cssText = 'color:#FFD700;font-size:14px;font-weight:bold;font-family:' + FONT + ';';
      clsName.textContent = cls.name;

      const clsDesc = document.createElement('div');
      clsDesc.style.cssText = 'color:#888899;font-size:11px;font-family:' + FONT + ';margin-top:2px;';
      clsDesc.textContent = cls.desc;

      btn.appendChild(clsName);
      btn.appendChild(clsDesc);

      btn.addEventListener('click', () => {
        const chosenClass = cls.name as import('../types').ClassName;
        recruitMember(this.save, def.id);
        const member = this.save.party.find(p => p.id === def.id);
        if (member) {
          const classDef = getClassDef(chosenClass);
          const s = calcStats(classDef, member.level);
          member.className = chosenClass;
          member.stats = { hp: s.maxHp, maxHp: s.maxHp, mp: s.maxMp, maxMp: s.maxMp, atk: s.atk, def: s.def, mag: s.mag, spd: s.spd };
        }
        writeSave(this.save);
        overlay.remove();
        this.dialogOpen = false;
        this.showDialogue(def.name, [`${def.name}は${cls.name}として仲間になった！`]);
      });

      box.appendChild(btn);
    }

    overlay.appendChild(box);
    this.uiRoot.appendChild(overlay);
  }

  private onActionButton() {
    if (this.dialogOpen) { this.advanceDialog(); return; }
    const tx = this.save.position.tileX;
    const ty = this.save.position.tileY;
    const fd = this.faceDir(this.playerDir);
    const [fx, fy] =
      fd === 'down' ? [tx,   ty+1] :
      fd === 'up'   ? [tx,   ty-1] :
      fd === 'left' ? [tx-1, ty  ] :
                      [tx+1, ty  ];
    const npc = getMapDef(this.mapId).npcs.find(n=>n.tileX===fx&&n.tileY===fy);
    if (npc) {
      if (npc.isChest) {
        this.showChestDialog(npc);
        return;
      }
      if (npc.isChurch) {
        this.showChurchDialog();
        return;
      }
      if (npc.id === 'medal_master') {
        this.showMedalMasterDialog();
        return;
      }
      if (npc.id === 'ship_merchant') {
        this.showShipMerchantDialog();
        return;
      }
      if (npc.id === 'dock_captain') {
        this.showDockDialog();
        return;
      }
      if (npc.shopType) {
        this.showShopDialog(npc);
        return;
      }
      if (npc.id === 'boss_grosur') {
        this.showDialogue(npc.name, npc.dialogue);
        this.pendingBossBattle = true;
        return;
      }
      if (npc.isInn) {
        this.showInnDialog();
      } else if (npc.recruitId) {
        this.handleRecruitNpc(npc);
      } else {
        this.showDialogue(npc.name, npc.dialogue);
      }
    }
  }

  private handleRecruitNpc(npc: NpcDef) {
    const def = getPartyMemberDef(npc.recruitId!);
    if (!def) { this.showDialogue(npc.name, npc.dialogue); return; }
    if (isRecruited(this.save, def.id)) {
      this.showDialogue(npc.name, def.postJoinDialogue);
    } else if (isRecruitable(this.save, def.id)) {
      this.showDialogue(def.name, def.joinDialogue);
      this.pendingClassPick = { def };
    } else {
      this.showDialogue(npc.name, def.preJoinDialogue);
    }
  }

  private openMenu() {
    if (this.dialogOpen) return;
    this.onMenu(
      this.save,
      (s) => { this.save = s; this.hudEl.update(s, getMapDef(this.mapId).name); },
      (action: string) => {
        if (action === 'rula') this.showRulaDialog();
        else if (action === 'releimito') this.showReleimitoDialog();
        else if (action === 'stealth') this.toggleStealth();
      },
      this.onOpenGacha,
      this.onOpenCraft,
      this.onEnterMap,
    );
  }

  private toggleStealth() {
    this.stealthMode = !this.stealthMode;
    this.save.flags['stealth_active'] = this.stealthMode;
    writeSave(this.save);
    this.updateStealthIndicator();
    this.showDialogue(
      'ステルス',
      this.stealthMode
        ? ['ステルスモードON！', 'ランダムエンカウントが抑制される。']
        : ['ステルスモードOFF。', '通常のエンカウント率に戻った。'],
    );
  }

  private updateStealthIndicator() {
    if (this.stealthMode) {
      if (!this.stealthIndicator) {
        const el = document.createElement('div');
        el.style.cssText = `
          position:absolute;top:8px;left:50%;transform:translateX(-50%);
          background:rgba(30,10,60,0.85);border:1px solid rgba(180,80,255,0.7);
          border-radius:20px;padding:4px 12px;
          color:#CC88FF;font-size:11px;pointer-events:none;z-index:10;
          font-family:"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif;
        `;
        el.textContent = '🌑 ステルス中';
        this.uiRoot.appendChild(el);
        this.stealthIndicator = el;
      }
    } else {
      this.stealthIndicator?.remove();
      this.stealthIndicator = null;
    }
  }

  // ─── ショップダイアログ ──────────────────────────────────────────────────────

  private showShopDialog(npc: NpcDef) {
    if (this.dialogOpen) return;
    this.dialogOpen = true;

    const SHOP_STOCK: Record<string, string[]> = {
      weapon: ['wood_sword','iron_sword','silver_sword','staff','crystal_staff','dagger','shadow_blade'],
      armor:  ['cloth','leather','chain_mail','plate_mail','robe','cloth_hat','leather_hat','iron_helm','leather_ring','silver_ring','guard_bracelet','speed_boots'],
      item:   ['herb','potion','elixir','mana_herb','ether','antidote','lantern'],
    };
    const stockIds = SHOP_STOCK[npc.shopType!] ?? [];
    const stockItems = stockIds.map(id => ITEM_MAP[id]).filter(Boolean) as ItemDef[];

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);pointer-events:auto;z-index:20;`;

    const box = document.createElement('div');
    box.style.cssText = `background:rgba(10,10,30,0.97);border:2px solid rgba(212,175,55,0.7);border-radius:8px;padding:16px 18px;width:300px;font-family:${FONT};max-height:90vh;display:flex;flex-direction:column;`;

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;';
    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'color:#FFD700;font-size:14px;font-weight:bold;';
    titleEl.textContent = npc.name;
    const goldEl = document.createElement('div');
    goldEl.style.cssText = 'color:#FFD700;font-size:13px;';
    const updateGold = () => { goldEl.textContent = `💰 ${this.save.gold}G`; };
    updateGold();
    header.appendChild(titleEl);
    header.appendChild(goldEl);
    box.appendChild(header);

    // Tabs
    let activeTab: 'buy' | 'sell' = 'buy';
    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;';
    const listArea = document.createElement('div');
    listArea.style.cssText = 'overflow-y:auto;flex:1;max-height:50vh;';

    const renderList = () => {
      listArea.innerHTML = '';
      if (activeTab === 'buy') {
        for (const item of stockItems) {
          const row = this.makeShopRow(item, 'buy', this.save.gold, () => {
            if (this.save.gold < item.price) return;
            this.save.gold -= item.price;
            const ex = this.save.inventory.find(e => e.itemId === item.id);
            if (ex) ex.qty++;
            else this.save.inventory.push({ itemId: item.id, qty: 1 });
            writeSave(this.save);
            updateGold();
            renderList();
            this.hudEl.update(this.save, getMapDef(this.mapId).name);
          });
          listArea.appendChild(row);
        }
      } else {
        const sellable = this.save.inventory.filter(e => {
          const it = ITEM_MAP[e.itemId];
          return it && it.price > 0 && e.qty > 0;
        });
        if (sellable.length === 0) {
          const empty = document.createElement('div');
          empty.style.cssText = `color:#888899;font-size:13px;text-align:center;padding:16px;font-family:${FONT};`;
          empty.textContent = '売れるものがない';
          listArea.appendChild(empty);
        }
        for (const entry of sellable) {
          const item = ITEM_MAP[entry.itemId]!;
          const sellPrice = Math.floor(item.price / 2);
          const row = this.makeShopRow(item, 'sell', 0, () => {
            entry.qty--;
            if (entry.qty <= 0) {
              const idx = this.save.inventory.indexOf(entry);
              if (idx >= 0) this.save.inventory.splice(idx, 1);
            }
            this.save.gold += sellPrice;
            writeSave(this.save);
            updateGold();
            renderList();
            this.hudEl.update(this.save, getMapDef(this.mapId).name);
          }, sellPrice);
          listArea.appendChild(row);
        }
      }
    };

    const mkTabBtn = (label: string, tab: 'buy' | 'sell') => {
      const btn = document.createElement('button');
      const style = (active: boolean) => `flex:1;padding:6px 0;border-radius:4px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;background:${active?'rgba(212,175,55,0.2)':'rgba(26,26,46,0.9)'};color:${active?'#FFD700':'#888899'};border:1px solid ${active?'rgba(212,175,55,0.6)':'rgba(68,68,102,0.5)'};`;
      btn.style.cssText = style(tab === 'buy');
      btn.textContent = label;
      btn.addEventListener('click', () => {
        activeTab = tab;
        tabBar.querySelectorAll('button').forEach((b, i) => {
          (b as HTMLButtonElement).style.cssText = style(i === (tab === 'buy' ? 0 : 1));
        });
        renderList();
      });
      return btn;
    };
    tabBar.appendChild(mkTabBtn('買う', 'buy'));
    tabBar.appendChild(mkTabBtn('売る', 'sell'));
    box.appendChild(tabBar);
    box.appendChild(listArea);
    renderList();

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `margin-top:10px;display:block;width:100%;padding:8px 0;background:rgba(16,16,28,0.9);color:#888899;border:1px solid rgba(51,68,102,0.5);border-radius:4px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    closeBtn.textContent = 'やめる';
    closeBtn.addEventListener('click', () => { overlay.remove(); this.dialogOpen = false; });
    box.appendChild(closeBtn);
    overlay.appendChild(box);
    this.uiRoot.appendChild(overlay);
  }

  private makeShopRow(item: ItemDef, mode: 'buy' | 'sell', gold: number, onAction: () => void, sellPrice?: number): HTMLElement {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:7px 6px;border-bottom:1px solid rgba(68,68,102,0.3);';

    const info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0;';
    const nameEl = document.createElement('div');
    nameEl.style.cssText = `color:#FFFDE7;font-size:13px;font-weight:bold;font-family:${FONT};`;
    nameEl.textContent = item.name;
    const statEl = document.createElement('div');
    statEl.style.cssText = `color:#AAAACC;font-size:10px;font-family:${FONT};`;
    const stats: string[] = [];
    if (item.atk)       stats.push(`攻+${item.atk}`);
    if (item.def)       stats.push(`防+${item.def}`);
    if (item.mag)       stats.push(`魔+${item.mag}`);
    if (item.spd)       stats.push(`速+${item.spd}`);
    if (item.mhp)       stats.push(`HP+${item.mhp}`);
    if (item.mmp)       stats.push(`MP+${item.mmp}`);
    if (item.hpRestore) stats.push(`HP${item.hpRestore}回復`);
    if (item.mpRestore) stats.push(`MP${item.mpRestore}回復`);
    statEl.textContent = stats.join(' ') || item.desc;
    info.appendChild(nameEl);
    info.appendChild(statEl);

    const right = document.createElement('div');
    right.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:3px;margin-left:8px;';
    const displayPrice = mode === 'buy' ? item.price : (sellPrice ?? Math.floor(item.price / 2));
    const priceEl = document.createElement('div');
    priceEl.style.cssText = 'color:#FFD700;font-size:12px;white-space:nowrap;';
    priceEl.textContent = `${displayPrice}G`;
    const canAfford = mode === 'sell' || gold >= item.price;
    const actionBtn = document.createElement('button');
    actionBtn.style.cssText = `padding:3px 10px;border-radius:3px;font-size:12px;font-family:${FONT};cursor:${canAfford?'pointer':'default'};pointer-events:auto;background:${canAfford?'rgba(26,46,26,0.9)':'rgba(26,26,26,0.7)'};color:${canAfford?'#AAFFAA':'#666677'};border:1px solid ${canAfford?'rgba(68,187,68,0.5)':'rgba(51,51,68,0.4)'};`;
    actionBtn.textContent = mode === 'buy' ? '買う' : '売る';
    actionBtn.disabled = !canAfford;
    if (canAfford) actionBtn.addEventListener('click', onAction);
    right.appendChild(priceEl);
    right.appendChild(actionBtn);
    row.appendChild(info);
    row.appendChild(right);
    return row;
  }

  // ─── 宿屋ダイアログ ──────────────────────────────────────────────────────────

  private showInnDialog() {
    if (this.dialogOpen) return;
    this.dialogOpen = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.55);pointer-events:auto;z-index:20;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background:rgba(10,10,30,0.97);border:2px solid rgba(212,175,55,0.7);
      border-radius:8px;padding:20px 22px;width:260px;
      font-family:${FONT};
    `;

    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-size:14px;margin-bottom:6px;';
    title.textContent = '宿屋のおかみ';
    const msg = document.createElement('div');
    msg.style.cssText = 'color:#FFFDE7;font-size:13px;margin-bottom:16px;line-height:1.5;';
    msg.textContent = 'いらっしゃい！\n何かご用ですか？';

    const btnStyle = (c = '#FFFDE7', bg = 'rgba(26,26,46,0.9)') => `
      display:block;width:100%;padding:10px 0;margin-bottom:8px;
      background:${bg};color:${c};
      border:1px solid rgba(212,175,55,0.5);border-radius:4px;
      font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;
    `;

    const close = () => { overlay.remove(); this.dialogOpen = false; };

    // 宿に泊まる
    const restBtn = document.createElement('button');
    restBtn.style.cssText = btnStyle('#AAFFAA','rgba(10,30,10,0.9)');
    restBtn.textContent = '宿に泊まる';
    restBtn.addEventListener('click', () => {
      this.save.stats.hp = this.save.stats.maxHp;
      this.save.stats.mp = this.save.stats.maxMp;
      // 仲間のHP/MPも回復
      for (const m of this.save.party) {
        m.stats.hp = m.stats.maxHp;
        m.stats.mp = m.stats.maxMp;
      }
      writeSave(this.save);
      close();
      this.showDialogue('宿屋のおかみ', ['ゆっくり休めましたか？', 'HPとMPが全回復しました！']);
    });

    // 仲間を募集する / 募集をやめる
    const recruitBtn = document.createElement('button');
    if (this.isHosting) {
      recruitBtn.style.cssText = btnStyle('#FFAAAA','rgba(30,10,10,0.9)');
      recruitBtn.textContent = `募集をやめる（合言葉: ${this.hostedRoomCode}）`;
      recruitBtn.addEventListener('click', () => {
        mpManager.closeWorld();
        this.isHosting = false;
        this.roomCodeOverlay?.remove();
        this.roomCodeOverlay = null;
        close();
        this.showDialogue('宿屋のおかみ', ['仲間の募集を終了しました。']);
      });
    } else {
      recruitBtn.style.cssText = btnStyle('#AADDFF','rgba(10,10,30,0.9)');
      recruitBtn.textContent = '仲間を募集する';
      recruitBtn.addEventListener('click', () => {
        close();
        this.startHosting();
      });
    }

    // 仲間の世界へ行く
    const guestBtn = document.createElement('button');
    guestBtn.style.cssText = btnStyle();
    guestBtn.textContent = '仲間の世界へ行く';
    guestBtn.addEventListener('click', () => {
      close();
      this.showGuestJoinDialog();
    });

    // やめる
    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = btnStyle('#888899','rgba(16,16,28,0.9)');
    cancelBtn.textContent = 'やめる';
    cancelBtn.addEventListener('click', close);

    box.appendChild(title);
    box.appendChild(msg);
    box.appendChild(restBtn);
    box.appendChild(recruitBtn);
    box.appendChild(guestBtn);
    box.appendChild(cancelBtn);
    overlay.appendChild(box);
    this.uiRoot.appendChild(overlay);
  }

  // ─── 宝箱ダイアログ ──────────────────────────────────────────────────────────

  private showChestDialog(npc: NpcDef) {
    const flagKey = `chest_${npc.id}`;
    if (this.save.flags[flagKey]) {
      this.showDialogue('宝箱', ['この宝箱はもう空だ…']);
      return;
    }
    const pool = npc.chestPool ?? ['herb'];
    const itemId = pool[Math.floor(Math.random() * pool.length)];
    const item = ITEM_MAP[itemId];
    if (!item) {
      this.showDialogue('宝箱', ['宝箱の中は空だった…']);
      return;
    }
    const ex = this.save.inventory.find(e => e.itemId === itemId);
    if (ex) ex.qty++;
    else this.save.inventory.push({ itemId, qty: 1 });
    this.save.flags[flagKey] = true;
    writeSave(this.save);
    this.hudEl.update(this.save, getMapDef(this.mapId).name);
    this.renderer.openChest(npc.id);
    this.showDialogue('✨ 宝箱', [`${item.name}を手に入れた！`]);
  }

  private startHosting() {
    const connectAndOpen = () => {
      const player: import('../types').NetPlayer = {
        id: mpManager.socketId,
        name: this.save.name, className: this.save.className,
        x: this.save.position.tileX, y: this.save.position.tileY,
        mapId: this.save.position.mapId,
        hp: this.save.stats.hp, maxHp: this.save.stats.maxHp,
        mp: this.save.stats.mp, maxMp: this.save.stats.maxMp,
        level: this.save.level, ready: true,
      };
      mpManager.openWorld(player);
      mpManager.on('world_opened', (data: unknown) => {
        const d = data as { roomId: string };
        this.isHosting = true;
        this.hostedRoomCode = d.roomId;
        this.isMultiplayer = true;
        this.isHost = true;
        this.showRoomCodeOverlay(d.roomId);
        this.setupGuestListeners();
        this.showDialogue('宿屋のおかみ', [
          `世界を開放しました！`,
          `合言葉は「${d.roomId}」です。`,
          '仲間に伝えてください！',
        ]);
      });
    };

    if (mpManager.connected) {
      connectAndOpen();
    } else {
      this.showDialogue('宿屋のおかみ', ['サーバーに接続中…']);
      mpManager.connect().then(() => {
        connectAndOpen();
      }).catch(() => {
        this.showDialogue('宿屋のおかみ', ['サーバーに接続できませんでした。']);
      });
    }
  }

  private showGuestJoinDialog() {
    this.dialogOpen = true;
    let code = '';

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.55);pointer-events:auto;z-index:20;
    `;
    const box = document.createElement('div');
    box.style.cssText = `
      background:rgba(10,10,30,0.97);border:2px solid rgba(212,175,55,0.7);
      border-radius:8px;padding:20px 22px;width:260px;font-family:${FONT};
    `;

    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-size:14px;margin-bottom:12px;';
    title.textContent = '仲間の合言葉を入力';

    const display = document.createElement('div');
    display.style.cssText = `
      background:rgba(10,26,58,0.95);border:2px solid rgba(212,175,55,0.7);
      border-radius:4px;padding:10px;font-size:24px;color:#FFD700;
      font-family:monospace;letter-spacing:8px;text-align:center;margin-bottom:8px;
    `;
    display.textContent = '____';

    const status = document.createElement('div');
    status.style.cssText = 'color:#FF8888;font-size:12px;height:16px;margin-bottom:10px;';

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'text'; hiddenInput.maxLength = 4;
    hiddenInput.style.cssText = 'position:fixed;opacity:0;top:0;left:0;width:1px;height:1px;';
    document.body.appendChild(hiddenInput);
    setTimeout(() => hiddenInput.focus(), 100);
    hiddenInput.addEventListener('input', () => {
      code = hiddenInput.value.toUpperCase().slice(0, 4);
      display.textContent = (code + '____').slice(0, 4);
    });

    const close = () => { hiddenInput.remove(); overlay.remove(); this.dialogOpen = false; };

    const joinBtn = document.createElement('button');
    joinBtn.style.cssText = `
      display:block;width:100%;padding:10px 0;margin-bottom:8px;
      background:rgba(10,30,10,0.9);color:#AAFFAA;
      border:1px solid rgba(68,187,68,0.5);border-radius:4px;
      font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;
    `;
    joinBtn.textContent = '行く！';
    joinBtn.addEventListener('click', () => {
      if (code.length < 4) { status.textContent = '4文字の合言葉を入力してください'; return; }
      status.style.color = '#AAAACC';
      status.textContent = '接続中…';
      const doJoin = () => {
        const player: import('../types').NetPlayer = {
          id: mpManager.socketId,
          name: this.save.name, className: this.save.className,
          x: this.save.position.tileX, y: this.save.position.tileY,
          mapId: this.save.position.mapId,
          hp: this.save.stats.hp, maxHp: this.save.stats.maxHp,
          mp: this.save.stats.mp, maxMp: this.save.stats.maxMp,
          level: this.save.level, ready: true,
        };
        mpManager.guestJoin(code, player);
        mpManager.on('world_joined', (data: unknown) => {
          const d = data as { roomId: string; mapId: MapId; hostX: number; hostY: number; players: import('../types').NetPlayer[] };
          close();
          this.isMultiplayer = true;
          this.isHost = false;
          this.changeMap(d.mapId, d.hostX, d.hostY);
          for (const p of d.players) {
            if (p.id !== mpManager.socketId) this.addOtherPlayer(p);
          }
          this.setupMultiplayer();
          this.showDialogue('システム', [`${d.mapId === 'village' ? 'ハジメ村' : d.mapId}に来ました！`]);
        });
        mpManager.on('error', (data: unknown) => {
          status.textContent = (data as { msg: string }).msg;
        });
      };
      if (mpManager.connected) doJoin();
      else mpManager.connect().then(doJoin).catch(() => { status.textContent = 'サーバーに接続できません'; });
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = `
      display:block;width:100%;padding:8px 0;
      background:rgba(16,16,28,0.9);color:#888899;
      border:1px solid rgba(51,68,102,0.5);border-radius:4px;
      font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;
    `;
    cancelBtn.textContent = 'やめる';
    cancelBtn.addEventListener('click', close);

    box.appendChild(title);
    box.appendChild(display);
    box.appendChild(status);
    box.appendChild(joinBtn);
    box.appendChild(cancelBtn);
    overlay.appendChild(box);
    this.uiRoot.appendChild(overlay);
  }

  private showRoomCodeOverlay(code: string) {
    this.roomCodeOverlay?.remove();
    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;top:8px;right:8px;
      background:rgba(10,10,30,0.92);border:1px solid rgba(212,175,55,0.6);
      border-radius:6px;padding:6px 10px;pointer-events:none;z-index:10;
      font-family:monospace;
    `;
    el.innerHTML = `
      <div style="color:#AAAACC;font-size:9px;">募集中</div>
      <div style="color:#FFD700;font-size:16px;letter-spacing:4px;">${code}</div>
      <div style="color:#888899;font-size:9px;">ゲスト${this.guestCount}/3</div>
    `;
    this.uiRoot.appendChild(el);
    this.roomCodeOverlay = el;
  }

  private setupGuestListeners() {
    mpManager.on('guest_arrived', (data: unknown) => {
      const d = data as { player: import('../types').NetPlayer };
      this.guestCount++;
      this.syncPartyForGuests();
      this.addOtherPlayer(d.player);
      this.showDialogue('システム', [`${d.player.name}が来た！`]);
      if (this.roomCodeOverlay) {
        const countEl = this.roomCodeOverlay.querySelector('div:last-child') as HTMLElement | null;
        if (countEl) countEl.textContent = `ゲスト${this.guestCount}/3`;
      }
    });

    mpManager.on('player_left', (data: unknown) => {
      const d = data as { playerId: string; name?: string };
      const op = this.otherPlayers.get(d.playerId);
      if (op) {
        op.sprite.removeFrom(this.renderer.scene);
        this.otherPlayers.delete(d.playerId);
        if (!op.data.id.startsWith('party_')) {
          this.guestCount = Math.max(0, this.guestCount - 1);
          this.restorePartyAfterGuests();
        }
      }
    });
  }

  private syncPartyForGuests() {
    // ゲスト数に応じて仲間をベンチに移す（合計4人以内）
    const maxCompanions = 3 - this.guestCount;
    while (this.save.activeMemberIds.length > maxCompanions) {
      const last = this.save.activeMemberIds[this.save.activeMemberIds.length - 1];
      this.save.activeMemberIds.pop();
      console.log(`[party] Benched ${last} for guest`);
    }
    writeSave(this.save);
  }

  private restorePartyAfterGuests() {
    const maxCompanions = 3 - this.guestCount;
    for (const m of this.save.party) {
      if (this.save.activeMemberIds.length >= maxCompanions) break;
      if (!this.save.activeMemberIds.includes(m.id)) {
        this.save.activeMemberIds.push(m.id);
      }
    }
    writeSave(this.save);
  }

  // ─── Keyboard ──────────────────────────────────────────────────────────────

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.active) return;
    switch (e.code) {
      case 'ArrowUp':   case 'KeyW': this.inputKeys.up    = true; break;
      case 'ArrowDown': case 'KeyS': this.inputKeys.down  = true; break;
      case 'ArrowLeft': case 'KeyA': this.inputKeys.left  = true; break;
      case 'ArrowRight':case 'KeyD': this.inputKeys.right = true; break;
      case 'Space': case 'Enter': this.onActionButton(); break;
      case 'Escape': case 'KeyM': this.openMenu(); break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':   case 'KeyW': this.inputKeys.up    = false; break;
      case 'ArrowDown': case 'KeyS': this.inputKeys.down  = false; break;
      case 'ArrowLeft': case 'KeyA': this.inputKeys.left  = false; break;
      case 'ArrowRight':case 'KeyD': this.inputKeys.right = false; break;
    }
  };

  // ─── Multiplayer ────────────────────────────────────────────────────────────

  private setupMultiplayer() {
    mpManager.on('player_joined', (data: unknown) => {
      const d = data as { player: NetPlayer };
      this.addOtherPlayer(d.player);
    });
    mpManager.on('player_left', (data: unknown) => {
      const d = data as { playerId: string };
      const op = this.otherPlayers.get(d.playerId);
      if (op) { op.sprite.removeFrom(this.renderer.scene); this.otherPlayers.delete(d.playerId); }
    });
    mpManager.on('player_moved', (data: unknown) => {
      const d = data as { playerId: string; x: number; y: number; mapId: string };
      const op = this.otherPlayers.get(d.playerId);
      if (!op) return;
      op.data.x = d.x; op.data.y = d.y;
      const visible = d.mapId === this.mapId;
      this.renderer.updateOtherPlayer(d.playerId, d.x, d.y, visible);
    });
    mpManager.on('battle_started', (data: unknown) => {
      const d = data as { enemies: EnemyDef[] };
      this.onBattle({
        save: this.save,
        enemies: d.enemies,
        isMultiplayer: true,
        isHost: this.isHost,
        returnMap: this.mapId,
        onDefeat: () => this.handleDefeat(),
      });
    });
  }

  private addOtherPlayer(data: NetPlayer) {
    if (this.otherPlayers.has(data.id)) return;
    const ci = ['戦士','魔法使い','回復師','盗賊'].indexOf(data.className);
    const sprite = this.renderer.addOtherPlayer(data.id, ci >= 0 ? ci : 0, data.x, data.y);
    if (!sprite) return;
    this.otherPlayers.set(data.id, { sprite, data });
  }

  // ─── 全滅ペナルティ ────────────────────────────────────────────────────────

  private handleDefeat() {
    // Halve gold (classic DQ death penalty)
    this.save.gold = Math.floor(this.save.gold / 2);
    // Restore 1 HP to all party members
    this.save.stats.hp = 1;
    for (const m of this.save.party) m.stats.hp = 1;
    writeSave(this.save);
    // Re-activate world screen (was deactivated when battle started)
    this.active = true;
    this.uiRoot.style.display = 'block';
    this.hudEl.show();
    this.moving = false;
    this.dialogOpen = false;
    this.dialogEl.style.display = 'none';
    this.lastTime = performance.now();
    this.loop(this.lastTime);
    this.changeMap('village', 9, 11);
    setTimeout(() => {
      this.showDialogue('システム', ['全滅してしまった…', 'ゴールドが半分になってしまった…', 'ハジメ村に戻されました。']);
    }, 300);
  }

  // ─── 船商人 / 港の船頭 ───────────────────────────────────────────────────

  private showShipMerchantDialog() {
    if (this.save.flags['has_ship']) {
      this.showDialogue('⛵ 船商人', ['すでに船をお持ちです。', '港の船頭に話しかければ出航できますよ。']);
      return;
    }
    if (this.dialogOpen) return;
    this.dialogOpen = true;
    const SHIP_COST = 5000;

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);pointer-events:auto;z-index:20;`;
    const box = document.createElement('div');
    box.style.cssText = `background:rgba(10,10,30,0.97);border:2px solid rgba(212,175,55,0.7);border-radius:8px;padding:20px 22px;width:270px;font-family:${FONT};`;

    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-size:14px;margin-bottom:6px;';
    title.textContent = '⛵ 船商人';
    const msg = document.createElement('div');
    msg.style.cssText = 'color:#FFFDE7;font-size:13px;margin-bottom:14px;line-height:1.5;';
    msg.textContent = `船を売ります。\n${SHIP_COST} ゴールドですがよろしいですか？\n（所持金: ${this.save.gold} G）`;
    box.appendChild(title); box.appendChild(msg);

    const close = () => { overlay.remove(); this.dialogOpen = false; };
    const canBuy = this.save.gold >= SHIP_COST;

    const yesBtn = document.createElement('button');
    yesBtn.style.cssText = `display:block;width:100%;padding:10px 0;margin-bottom:8px;background:${canBuy?'rgba(10,30,10,0.9)':'rgba(16,16,28,0.9)'};color:${canBuy?'#AAFFAA':'#666677'};border:1px solid ${canBuy?'rgba(68,187,68,0.5)':'rgba(51,68,102,0.5)'};border-radius:4px;font-size:14px;font-family:${FONT};cursor:${canBuy?'pointer':'default'};pointer-events:auto;`;
    yesBtn.textContent = canBuy ? 'はい（購入する）' : 'ゴールドが足りない';
    if (canBuy) {
      yesBtn.addEventListener('click', () => {
        this.save.gold -= SHIP_COST;
        this.save.flags['has_ship'] = true;
        writeSave(this.save);
        this.hudEl.update(this.save, getMapDef(this.mapId).name);
        close();
        this.showDialogue('⛵ 船商人', ['ありがとうございます！', '船を手に入れました！⛵', '港の船頭に話しかければ出航できますよ。']);
      });
    }
    box.appendChild(yesBtn);

    const noBtn = document.createElement('button');
    noBtn.style.cssText = `display:block;width:100%;padding:8px 0;background:rgba(16,16,28,0.9);color:#888899;border:1px solid rgba(51,68,102,0.5);border-radius:4px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    noBtn.textContent = 'いいえ';
    noBtn.addEventListener('click', close);
    box.appendChild(noBtn);
    overlay.appendChild(box);
    this.uiRoot.appendChild(overlay);
  }

  private showDockDialog() {
    if (!this.save.flags['has_ship']) {
      this.showDialogue('⚓ 港の船頭', ['船がなければ出航できません。', '村の船商人から船を購入してください。']);
      return;
    }
    if (this.dialogOpen) return;
    this.dialogOpen = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);pointer-events:auto;z-index:20;`;
    const box = document.createElement('div');
    box.style.cssText = `background:rgba(10,10,30,0.97);border:2px solid rgba(212,175,55,0.7);border-radius:8px;padding:20px 22px;width:270px;font-family:${FONT};`;

    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-size:14px;margin-bottom:6px;';
    title.textContent = '⚓ 港の船頭';
    const msg = document.createElement('div');
    msg.style.cssText = 'color:#FFFDE7;font-size:13px;margin-bottom:14px;line-height:1.5;';
    msg.textContent = '海の向こうの神殿へ出航しますか？';
    box.appendChild(title); box.appendChild(msg);

    const close = () => { overlay.remove(); this.dialogOpen = false; };

    const yesBtn = document.createElement('button');
    yesBtn.style.cssText = `display:block;width:100%;padding:10px 0;margin-bottom:8px;background:rgba(10,20,40,0.9);color:#88CCFF;border:1px solid rgba(68,136,255,0.5);border-radius:4px;font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    yesBtn.textContent = 'はい（出航する）';
    yesBtn.addEventListener('click', () => { close(); this.changeMap('sea_temple', 9, 11); });
    box.appendChild(yesBtn);

    const noBtn = document.createElement('button');
    noBtn.style.cssText = `display:block;width:100%;padding:8px 0;background:rgba(16,16,28,0.9);color:#888899;border:1px solid rgba(51,68,102,0.5);border-radius:4px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    noBtn.textContent = 'いいえ';
    noBtn.addEventListener('click', close);
    box.appendChild(noBtn);
    overlay.appendChild(box);
    this.uiRoot.appendChild(overlay);
  }

  // ─── ルーラ (ワープ) ─────────────────────────────────────────────────────

  // ─── 宝の地図ガチャ ──────────────────────────────────────────────────────────

  private showGachaDialog() {
    if (this.dialogOpen) return;
    this.dialogOpen = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.88);z-index:30;display:flex;align-items:center;justify-content:center;pointer-events:auto;';

    const box = document.createElement('div');
    box.style.cssText = `background:rgba(10,5,30,0.97);border:2px solid rgba(212,175,55,0.8);border-radius:8px;padding:24px 20px;max-width:320px;width:90%;text-align:center;font-family:${FONT};`;

    const close = () => { overlay.remove(); this.dialogOpen = false; };

    const rebuild = () => {
      box.innerHTML = '';
      const title = document.createElement('div');
      title.style.cssText = 'color:#FFD700;font-size:16px;font-weight:bold;margin-bottom:14px;';
      title.textContent = '✨ 宝の地図ガチャ';
      box.appendChild(title);

      if (!hasItem(this.save, 'gacha_ticket')) {
        const msg = document.createElement('div');
        msg.style.cssText = 'color:#FFFDE7;font-size:13px;line-height:1.6;margin-bottom:18px;';
        msg.textContent = 'ガチャ券がありません。\n敵を倒して入手しましょう！';
        box.appendChild(msg);
        const btn = document.createElement('button');
        btn.textContent = '閉じる';
        btn.style.cssText = `padding:8px 28px;background:rgba(60,50,20,0.9);color:#FFD700;border:1px solid rgba(212,175,55,0.5);border-radius:4px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
        btn.addEventListener('click', close);
        box.appendChild(btn);
        return;
      }

      const qty = this.save.inventory.find(e => e.itemId === 'gacha_ticket')?.qty ?? 0;
      const owned = this.save.ownedMaps ?? [];
      const unowned = TREASURE_MAPS.filter(m => !owned.includes(m.id));

      const info = document.createElement('div');
      info.style.cssText = 'color:#FFFDE7;font-size:13px;margin-bottom:4px;';
      info.textContent = `ガチャ券: ${qty}枚`;
      box.appendChild(info);

      const sub = document.createElement('div');
      sub.style.cssText = 'color:#88AAFF;font-size:11px;margin-bottom:18px;';
      sub.textContent = unowned.length > 0
        ? `未入手の地図: ${unowned.length}/${TREASURE_MAPS.length}種`
        : '全ての地図を入手済み！引いても重複します';
      box.appendChild(sub);

      const pullBtn = document.createElement('button');
      pullBtn.textContent = '🎲 ガチャを引く！（券1枚）';
      pullBtn.style.cssText = `display:block;width:100%;padding:12px;background:rgba(100,70,0,0.9);color:#FFD700;border:1px solid rgba(212,175,55,0.8);border-radius:6px;font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;margin-bottom:8px;`;
      pullBtn.addEventListener('click', () => {
        removeItem(this.save, 'gacha_ticket', 1);
        const pool = unowned.length > 0 ? unowned : TREASURE_MAPS;
        const won = pool[Math.floor(Math.random() * pool.length)];
        if (!this.save.ownedMaps) this.save.ownedMaps = [];
        const isNew = !this.save.ownedMaps.includes(won.id);
        if (isNew) this.save.ownedMaps.push(won.id);
        writeSave(this.save);

        box.innerHTML = '';
        const rt = document.createElement('div');
        rt.style.cssText = 'color:#FFD700;font-size:15px;font-weight:bold;margin-bottom:14px;';
        rt.textContent = isNew ? '🗺 新しい地図を入手！' : '✨ すでに持っている地図';
        const rn = document.createElement('div');
        rn.style.cssText = 'color:#FFFDE7;font-size:20px;font-weight:bold;margin-bottom:8px;';
        rn.textContent = won.name;
        const rs = document.createElement('div');
        rs.style.cssText = `color:${isNew ? '#88FF88' : '#FF8888'};font-size:12px;margin-bottom:20px;`;
        rs.textContent = isNew ? 'メニューの「宝の地図」から入れます！' : 'この地図はすでに持っています';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '閉じる';
        closeBtn.style.cssText = `padding:8px 28px;background:rgba(60,50,20,0.9);color:#FFD700;border:1px solid rgba(212,175,55,0.5);border-radius:4px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
        closeBtn.addEventListener('click', close);
        box.appendChild(rt); box.appendChild(rn); box.appendChild(rs); box.appendChild(closeBtn);
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'キャンセル';
      cancelBtn.style.cssText = `display:block;width:100%;padding:8px;background:transparent;color:#888899;border:1px solid rgba(100,100,150,0.3);border-radius:4px;font-size:12px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
      cancelBtn.addEventListener('click', close);

      box.appendChild(pullBtn);
      box.appendChild(cancelBtn);
    };

    rebuild();
    overlay.appendChild(box);
    this.uiRoot.appendChild(overlay);
  }

  private enterTreasureMap(mapId: MapId) {
    this.changeMap(mapId, 9, 12);
  }

  showRulaDialog() {
    if (this.dialogOpen) return;
    this.dialogOpen = true;

    const destinations = [
      { mapId: 'village'     as MapId, name: 'ハジメ村',     flag: 'village_visited',     x: 9,  y: 11 },
      { mapId: 'castle'      as MapId, name: 'アルデア城',   flag: 'castle_visited',      x: 9,  y: 11 },
      { mapId: 'dungeon'     as MapId, name: '地下ダンジョン', flag: 'dungeon_entered',   x: 3,  y: 3  },
      { mapId: 'ruins'       as MapId, name: '古代遺跡',     flag: 'ruins_visited',       x: 5,  y: 5  },
      { mapId: 'ice_cave'    as MapId, name: '氷の洞窟',     flag: 'ice_cave_visited',    x: 5,  y: 5  },
      { mapId: 'lava_cave'   as MapId, name: '溶岩洞窟',     flag: 'lava_cave_visited',   x: 5,  y: 5  },
      { mapId: 'sea_temple'  as MapId, name: '海底神殿',     flag: 'sea_temple_visited',  x: 5,  y: 5  },
      { mapId: 'sky_castle'  as MapId, name: '天空城',       flag: 'sky_castle_visited',  x: 5,  y: 5  },
      { mapId: 'demon_castle'as MapId, name: '魔王の城',     flag: 'demon_castle_visited',x: 5,  y: 5  },
    ].filter(d => this.save.flags[d.flag]);

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);pointer-events:auto;z-index:20;`;

    const box = document.createElement('div');
    box.style.cssText = `background:rgba(10,10,30,0.97);border:2px solid rgba(212,175,55,0.7);border-radius:8px;padding:20px 22px;width:260px;font-family:${FONT};`;

    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-size:14px;margin-bottom:12px;text-align:center;';
    title.textContent = '✨ ルーラ — どこへ行く？';
    box.appendChild(title);

    const close = () => { overlay.remove(); this.dialogOpen = false; };

    if (destinations.length === 0) {
      const msg = document.createElement('div');
      msg.style.cssText = `color:#AAAACC;font-size:13px;text-align:center;margin-bottom:12px;font-family:${FONT};`;
      msg.textContent = '訪れた場所がない';
      box.appendChild(msg);
    } else {
      destinations.forEach(dest => {
        const btn = document.createElement('button');
        btn.style.cssText = `display:block;width:100%;padding:10px 0;margin-bottom:8px;background:rgba(16,26,56,0.9);color:#FFFDE7;border:1px solid rgba(212,175,55,0.5);border-radius:4px;font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
        btn.textContent = dest.name;
        btn.addEventListener('click', () => {
          close();
          this.changeMap(dest.mapId, dest.x, dest.y);
        });
        box.appendChild(btn);
      });
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = `display:block;width:100%;padding:8px 0;background:rgba(16,16,28,0.9);color:#888899;border:1px solid rgba(51,68,102,0.5);border-radius:4px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    cancelBtn.textContent = 'やめる';
    cancelBtn.addEventListener('click', close);
    box.appendChild(cancelBtn);
    overlay.appendChild(box);
    this.uiRoot.appendChild(overlay);
  }

  // ─── リレミト (ダンジョン脱出) ───────────────────────────────────────────

  showReleimitoDialog() {
    const dungeonMaps: string[] = [
      'dungeon', 'dungeon2', 'dungeon3',
      'ruins', 'ice_cave', 'lava_cave', 'sea_temple', 'sky_castle', 'demon_castle',
      'tmap_1', 'tmap_2', 'tmap_3', 'tmap_4', 'tmap_5',
      'house1', 'house2', 'house3',
    ];
    if (!dungeonMaps.includes(this.mapId)) {
      this.showDialogue('リレミト', ['屋外では使えない。\nダンジョン内でのみ使えるぞ。']);
      return;
    }
    if (this.dialogOpen) return;
    this.dialogOpen = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);pointer-events:auto;z-index:20;`;

    const box = document.createElement('div');
    box.style.cssText = `background:rgba(10,10,30,0.97);border:2px solid rgba(212,175,55,0.7);border-radius:8px;padding:20px 22px;width:260px;font-family:${FONT};`;

    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-size:14px;margin-bottom:12px;text-align:center;';
    title.textContent = '⬆ リレミト — 洞窟から脱出する？';
    box.appendChild(title);

    const close = () => { overlay.remove(); this.dialogOpen = false; };

    const yesBtn = document.createElement('button');
    yesBtn.style.cssText = `display:block;width:100%;padding:10px 0;margin-bottom:8px;background:rgba(10,30,10,0.9);color:#AAFFAA;border:1px solid rgba(68,187,68,0.5);border-radius:4px;font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    yesBtn.textContent = 'はい';
    yesBtn.addEventListener('click', () => {
      close();
      this.changeMap('world', 19, 18);
    });
    box.appendChild(yesBtn);

    const noBtn = document.createElement('button');
    noBtn.style.cssText = `display:block;width:100%;padding:8px 0;background:rgba(16,16,28,0.9);color:#888899;border:1px solid rgba(51,68,102,0.5);border-radius:4px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    noBtn.textContent = 'いいえ';
    noBtn.addEventListener('click', close);
    box.appendChild(noBtn);
    overlay.appendChild(box);
    this.uiRoot.appendChild(overlay);
  }

  // ─── 教会ダイアログ ───────────────────────────────────────────────────────

  private showChurchDialog() {
    if (this.dialogOpen) return;
    this.dialogOpen = true;

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);pointer-events:auto;z-index:20;`;

    const box = document.createElement('div');
    box.style.cssText = `background:rgba(10,10,30,0.97);border:2px solid rgba(212,175,55,0.7);border-radius:8px;padding:20px 22px;width:270px;font-family:${FONT};`;

    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-size:14px;margin-bottom:6px;';
    title.textContent = '神父';
    const msg = document.createElement('div');
    msg.style.cssText = 'color:#FFFDE7;font-size:13px;margin-bottom:16px;line-height:1.5;';
    msg.textContent = '神の祝福を。\n何をご希望ですか？';
    box.appendChild(title);
    box.appendChild(msg);

    const btnStyle = (c = '#FFFDE7', bg = 'rgba(26,26,46,0.9)') => `display:block;width:100%;padding:10px 0;margin-bottom:8px;background:${bg};color:${c};border:1px solid rgba(212,175,55,0.5);border-radius:4px;font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    const close = () => { overlay.remove(); this.dialogOpen = false; };

    // 祈る: restore all HP/MP for free
    const prayBtn = document.createElement('button');
    prayBtn.style.cssText = btnStyle('#AAFFAA', 'rgba(10,30,10,0.9)');
    prayBtn.textContent = '祈る（無料でHP/MP全回復）';
    prayBtn.addEventListener('click', () => {
      this.save.stats.hp = this.save.stats.maxHp;
      this.save.stats.mp = this.save.stats.maxMp;
      for (const m of this.save.party) { m.stats.hp = m.stats.maxHp; m.stats.mp = m.stats.maxMp; }
      writeSave(this.save);
      this.hudEl.update(this.save, getMapDef(this.mapId).name);
      close();
      this.showDialogue('神父', ['神の御加護があなたに。', 'HPとMPが全回復しました！']);
    });
    box.appendChild(prayBtn);

    // 呪いを解く: cure all status effects, 100G
    const curseBtn = document.createElement('button');
    curseBtn.style.cssText = btnStyle('#AADDFF', 'rgba(10,10,30,0.9)');
    curseBtn.textContent = `呪いを解く（100G）`;
    curseBtn.addEventListener('click', () => {
      if (this.save.gold < 100) { close(); this.showDialogue('神父', ['ゴールドが足りません。']); return; }
      this.save.gold -= 100;
      writeSave(this.save);
      this.hudEl.update(this.save, getMapDef(this.mapId).name);
      close();
      this.showDialogue('神父', ['全ての呪いを解きました！']);
    });
    box.appendChild(curseBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = btnStyle('#888899', 'rgba(16,16,28,0.9)');
    cancelBtn.textContent = '帰る';
    cancelBtn.addEventListener('click', close);
    box.appendChild(cancelBtn);
    overlay.appendChild(box);
    this.uiRoot.appendChild(overlay);
  }

  // ─── モンスター図鑑 ──────────────────────────────────────────────────────

  updateMonsterBook(enemies: EnemyDef[], defeated: boolean) {
    if (!this.save.monsterBook) this.save.monsterBook = {};
    for (const e of enemies) {
      if (!this.save.monsterBook[e.id]) this.save.monsterBook[e.id] = { seen: 0, defeated: 0 };
      this.save.monsterBook[e.id].seen++;
      if (defeated) this.save.monsterBook[e.id].defeated++;
    }
  }

  // ─── メダル親父 ──────────────────────────────────────────────────────────

  private showMedalMasterDialog() {
    const medals = this.save.medals ?? 0;
    if (this.dialogOpen) return;
    const lines: string[] = [`現在のメダル数: ${medals}枚`];
    if (medals >= 20) lines.push('10枚で聖水、20枚でエリクサーと交換できます。20枚あります！');
    else if (medals >= 10) lines.push('10枚で聖水と交換できます！');
    else lines.push('10枚で聖水、20枚でエリクサーと交換してやろう。');
    this.showDialogue('メダル親父', lines);
  }
}
