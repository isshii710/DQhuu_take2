import type { CharacterSave, MapId, Direction, NpcDef } from '../types';
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
import { getPartyMemberDef } from '../data/partyMembers';
import { isRecruited, isRecruitable, recruitMember } from '../systems/PartySystem';

const MAP_FLAGS: Partial<Record<MapId, string>> = {
  village: 'village_visited',
  world: 'world_visited',
  castle: 'castle_visited',
  dungeon: 'dungeon_entered',
};

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
    joyWrap.style.cssText = 'position:absolute;bottom:0;left:0;width:50%;height:140px;pointer-events:auto;';
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

    // Check exit
    const exit = mapDef.exits.find(e=>e.tileX===nx&&e.tileY===ny);
    if (exit) { this.changeMap(exit.targetMap, exit.targetX, exit.targetY); return; }

    // Check NPC
    const npc = mapDef.npcs.find(n=>n.tileX===nx&&n.tileY===ny);
    if (npc) {
      if (npc.recruitId) {
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
      this.checkEncounter(tileId);
      writeSave(this.save);
      if (this.isMultiplayer) {
        mpManager.movePlayer(nx, ny, this.mapId, this.faceDir(dir));
      }
      this.hudEl.update(this.save, getMapDef(this.mapId).name);
    };
  }

  private changeMap(targetMap: MapId, targetX: number, targetY: number) {
    this.save.position = { mapId: targetMap, tileX: targetX, tileY: targetY };
    this.mapId = targetMap;

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
    const fd = this.faceDir(this.playerDir);
    const [fx, fy] =
      fd === 'down' ? [tx,   ty+1] :
      fd === 'up'   ? [tx,   ty-1] :
      fd === 'left' ? [tx-1, ty  ] :
                      [tx+1, ty  ];
    const npc = getMapDef(this.mapId).npcs.find(n=>n.tileX===fx&&n.tileY===fy);
    if (npc) {
      if (npc.recruitId) {
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
      recruitMember(this.save, def.id);
      writeSave(this.save);
      this.showDialogue(def.name, def.joinDialogue);
    } else {
      this.showDialogue(npc.name, def.preJoinDialogue);
    }
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
