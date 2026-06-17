import type { CharacterSave, MapId, Direction } from '../types';
import { TILE_SIZE, WALKABLE, ENCOUNTER_TILES, ENCOUNTER_RATE } from '../config';
import { getMapDef } from '../data/maps';
import { writeSave } from '../systems/SaveSystem';
import { randomEncounter } from '../data/enemies';
import { mpManager } from '../systems/MultiplayerManager';
import type { NetPlayer, EnemyDef } from '../types';
import { WorldRenderer } from '../renderer/WorldRenderer';
import { BillboardSprite } from '../renderer/BillboardSprite';
import { HUD } from '../ui/HUD';
import { VirtualJoystick } from '../ui/VirtualJoystick';

const FONT = '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';
const MOVE_DURATION = 140; // ms per tile move

export interface BattleOpts { save: CharacterSave; enemies: EnemyDef[]; isMultiplayer: boolean; isHost: boolean; returnMap: MapId; }

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

  private onBattle!: (opts: BattleOpts) => void;
  private onMenu!:   (save: CharacterSave, onClose: (s: CharacterSave)=>void) => void;

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

    // VirtualJoystick (left side)
    const joyWrap = document.createElement('div');
    joyWrap.style.cssText = 'position:absolute;bottom:0;left:0;width:50%;height:100px;pointer-events:auto;';
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
    this.actionBtn = this.makeBtn('A', '#FFD700', '#FFDD66', () => this.onActionButton());
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
      width:48px;height:48px;border-radius:50%;
      background:rgba(255,255,255,0.12);
      border:2px solid ${border}88;
      color:${color};font-size:18px;font-weight:bold;
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
    onMenu:   (s: CharacterSave, onClose: (s:CharacterSave)=>void)=>void
  ) {
    this.save = save;
    this.mapId = save.position.mapId;
    this.isMultiplayer = opts.isMultiplayer;
    this.isHost = opts.isHost ?? false;
    this.onBattle = onBattle;
    this.onMenu   = onMenu;
    this.moving = false;
    this.dialogOpen = false;
    this.dialogEl.style.display = 'none';

    const classIdx = ['戦士','魔法使い','回復師','盗賊'].indexOf(save.className);
    const ci = classIdx >= 0 ? classIdx : 0;

    // Load map and spawn player
    const mapDef = getMapDef(this.mapId);
    this.renderer.loadMap(mapDef);
    this.playerSprite = this.renderer.spawnPlayer(ci, save.position.tileX, save.position.tileY);

    this.uiRoot.style.display = 'block';
    this.hudEl.show();
    this.hudEl.update(save, mapDef.name);
    this.hudEl.showMapBanner(mapDef.name);

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
      const dirIndex = {down:0,up:3,left:2,right:1}[this.playerDir];
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

  private pressedDir(): Direction | null {
    if (this.inputKeys.up)    return 'up';
    if (this.inputKeys.down)  return 'down';
    if (this.inputKeys.left)  return 'left';
    if (this.inputKeys.right) return 'right';
    return null;
  }

  // ─── Movement ──────────────────────────────────────────────────────────────

  private tryMove(dir: Direction) {
    if (this.moving || this.dialogOpen) return;

    const mapDef = getMapDef(this.mapId);
    const tiles = mapDef.tiles;
    const tx = this.save.position.tileX;
    const ty = this.save.position.tileY;

    const [nx, ny] =
      dir==='down'  ? [tx,   ty+1] :
      dir==='up'    ? [tx,   ty-1] :
      dir==='left'  ? [tx-1, ty  ] :
                      [tx+1, ty  ];

    this.playerDir = dir;
    const dirIndex = {down:0,up:3,left:2,right:1}[dir];
    this.playerSprite?.setFrame(dirIndex * 2);

    if (ny<0||ny>=tiles.length||nx<0||nx>=tiles[0].length) return;

    const tileId = tiles[ny][nx];
    if (!WALKABLE.has(tileId)) return;

    // Check exit
    const exit = mapDef.exits.find(e=>e.tileX===nx&&e.tileY===ny);
    if (exit) { this.changeMap(exit.targetMap, exit.targetX, exit.targetY); return; }

    // Check NPC
    const npc = mapDef.npcs.find(n=>n.tileX===nx&&n.tileY===ny);
    if (npc) { this.showDialogue(npc.name, npc.dialogue); return; }

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
      this.checkEncounter(tileId);
      writeSave(this.save);
      if (this.isMultiplayer) {
        mpManager.movePlayer(nx, ny, this.mapId, dir);
      }
      this.hudEl.update(this.save, getMapDef(this.mapId).name);
    };
  }

  private changeMap(targetMap: MapId, targetX: number, targetY: number) {
    this.save.position = { mapId: targetMap, tileX: targetX, tileY: targetY };
    this.mapId = targetMap;
    writeSave(this.save);

    const mapDef = getMapDef(targetMap);
    this.renderer.loadMap(mapDef);
    this.playerSprite = this.renderer.spawnPlayer(
      ['戦士','魔法使い','回復師','盗賊'].indexOf(this.save.className),
      targetX, targetY
    );

    this.hudEl.update(this.save, mapDef.name);
    this.hudEl.showMapBanner(mapDef.name);
  }

  // ─── Encounter ─────────────────────────────────────────────────────────────

  private checkEncounter(tileId: number) {
    if (!ENCOUNTER_TILES.has(tileId)) { this.stepsSinceEncounter = 0; return; }
    this.stepsSinceEncounter++;
    if (this.stepsSinceEncounter < 5) return;
    if (Math.random() < ENCOUNTER_RATE) {
      this.stepsSinceEncounter = 0;
      this.triggerBattle();
    }
  }

  private triggerBattle() {
    const mapDef = getMapDef(this.mapId);
    const enemies = randomEncounter(mapDef.encounterGroup ?? 'world_field');
    this.onBattle({
      save: this.save,
      enemies,
      isMultiplayer: this.isMultiplayer,
      isHost: this.isHost,
      returnMap: this.mapId,
    });
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
    }
  }

  private onActionButton() {
    if (this.dialogOpen) { this.advanceDialog(); return; }
    const tx = this.save.position.tileX;
    const ty = this.save.position.tileY;
    const [fx, fy] =
      this.playerDir==='down'  ? [tx,   ty+1] :
      this.playerDir==='up'    ? [tx,   ty-1] :
      this.playerDir==='left'  ? [tx-1, ty  ] :
                                 [tx+1, ty  ];
    const npc = getMapDef(this.mapId).npcs.find(n=>n.tileX===fx&&n.tileY===fy);
    if (npc) this.showDialogue(npc.name, npc.dialogue);
  }

  private openMenu() {
    if (this.dialogOpen) return;
    this.onMenu(this.save, (s) => {
      this.save = s;
      this.hudEl.update(s, getMapDef(this.mapId).name);
    });
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
}
