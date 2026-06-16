import Phaser from 'phaser';
import { TILE_SIZE, COLORS, WALKABLE, ENCOUNTER_TILES, ENCOUNTER_RATE, MAP, UI_HEIGHT, VIEWPORT_H } from '../config';
import type { CharacterSave, MapId, Direction } from '../types';
import { getMapDef } from '../data/maps';
import { writeSave } from '../systems/SaveSystem';
import { randomEncounter } from '../data/enemies';
import { mpManager } from '../systems/MultiplayerManager';
import type { NetPlayer } from '../types';

interface SceneData {
  save: CharacterSave;
  isMultiplayer: boolean;
  isHost?: boolean;
  roomId?: string;
  fromBattle?: boolean;
}

export default class WorldScene extends Phaser.Scene {
  private save!: CharacterSave;
  private isMultiplayer = false;
  private isHost = false;

  // Map
  private mapId: MapId = 'village';
  private tiles: Phaser.GameObjects.Image[][] = [];
  private mapContainer!: Phaser.GameObjects.Container;

  // Player
  private playerSprite!: Phaser.GameObjects.Image;
  private playerDir: Direction = 'down';
  private moving = false;
  private stepsSinceEncounter = 0;

  // Touch controls
  private dpad!: { up: Phaser.GameObjects.Rectangle; down: Phaser.GameObjects.Rectangle; left: Phaser.GameObjects.Rectangle; right: Phaser.GameObjects.Rectangle };
  private actionBtn!: Phaser.GameObjects.Rectangle;
  private menuBtn!: Phaser.GameObjects.Rectangle;

  // Keyboard
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };

  // UI
  private hpText!: Phaser.GameObjects.Text;
  private mpText!: Phaser.GameObjects.Text;
  private locationText!: Phaser.GameObjects.Text;
  private dialogContainer!: Phaser.GameObjects.Container;
  private dialogOpen = false;

  // Multiplayer
  private otherPlayers = new Map<string, { sprite: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text; data: NetPlayer }>();
  private moveThrottle = 0;

  constructor() { super('WorldScene'); }

  init(data: SceneData) {
    this.save = data.save;
    this.isMultiplayer = data.isMultiplayer ?? false;
    this.isHost = data.isHost ?? false;
    this.mapId = this.save.position.mapId;
  }

  create() {
    this.buildMap();
    this.buildPlayer();
    this.buildUI();
    this.buildTouchControls();
    this.setupKeyboard();

    if (this.isMultiplayer) {
      this.setupMultiplayer();
    }

    this.cameras.main.startFollow(this.playerSprite, true, 0.12, 0.12);
    this.cameras.main.setViewport(0, 0, this.scale.width, VIEWPORT_H);

    this.showMapName();
  }

  // ─── Map ─────────────────────────────────────────────────────────────────

  private buildMap() {
    const mapDef = getMapDef(this.mapId);
    this.mapContainer?.destroy();
    this.tiles = [];

    this.mapContainer = this.add.container(0, 0);

    mapDef.tiles.forEach((row, ty) => {
      this.tiles[ty] = [];
      row.forEach((tileId, tx) => {
        const img = this.add.image(tx * TILE_SIZE + TILE_SIZE/2, ty * TILE_SIZE + TILE_SIZE/2, `tile_${tileId}`);
        this.tiles[ty][tx] = img;
        this.mapContainer.add(img);
      });
    });

    // NPCs
    mapDef.npcs.forEach(npc => {
      const sprite = this.add.image(
        npc.tileX * TILE_SIZE + TILE_SIZE/2,
        npc.tileY * TILE_SIZE + TILE_SIZE/2,
        'npc_base'
      ).setTintFill(npc.spriteColor);
      const nameLabel = this.add.text(
        npc.tileX * TILE_SIZE + TILE_SIZE/2,
        npc.tileY * TILE_SIZE - 4,
        npc.name,
        { fontSize: '9px', color: '#FFFDE7', fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif', stroke: '#000', strokeThickness: 2 }
      ).setOrigin(0.5, 1);
      this.mapContainer.add([sprite, nameLabel]);
    });

    // Set camera bounds
    const mapW = mapDef.tiles[0].length * TILE_SIZE;
    const mapH = mapDef.tiles.length * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
  }

  // ─── Player ──────────────────────────────────────────────────────────────

  private buildPlayer() {
    const classIndex = ['戦士','魔法使い','回復師','盗賊'].indexOf(this.save.className);
    const ci = classIndex >= 0 ? classIndex : 0;
    const px = this.save.position.tileX * TILE_SIZE + TILE_SIZE/2;
    const py = this.save.position.tileY * TILE_SIZE + TILE_SIZE/2;

    this.playerSprite = this.add.image(px, py, `hero_${ci}`).setFrame(0).setDepth(10);

    // Player name label
    this.add.text(px, py - TILE_SIZE/2 - 2, this.save.name, {
      fontSize: '9px', color: '#FFFFFF',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(11);
  }

  // ─── Move player ─────────────────────────────────────────────────────────

  private movePlayer(dir: Direction) {
    if (this.moving || this.dialogOpen) return;

    const mapDef = getMapDef(this.mapId);
    const tiles = mapDef.tiles;

    const tx = this.save.position.tileX;
    const ty = this.save.position.tileY;
    const [nx, ny] = dir === 'down'  ? [tx,   ty+1]
                   : dir === 'up'    ? [tx,   ty-1]
                   : dir === 'left'  ? [tx-1, ty  ]
                   :                   [tx+1, ty  ];

    // Bounds check
    if (ny < 0 || ny >= tiles.length || nx < 0 || nx >= tiles[0].length) return;

    const tileId = tiles[ny][nx];
    if (!WALKABLE.has(tileId)) {
      this.playerDir = dir;
      this.updatePlayerFrame();
      return;
    }

    // Check exit
    const exit = mapDef.exits.find(e => e.tileX === nx && e.tileY === ny);
    if (exit) {
      this.changeMap(exit.targetMap, exit.targetX, exit.targetY);
      return;
    }

    // Check NPC collision
    const npc = mapDef.npcs.find(n => n.tileX === nx && n.tileY === ny);
    if (npc) {
      this.playerDir = dir;
      this.updatePlayerFrame();
      this.showDialogue(npc.name, npc.dialogue);
      return;
    }

    this.playerDir = dir;
    this.moving = true;
    this.save.position.tileX = nx;
    this.save.position.tileY = ny;

    const px = nx * TILE_SIZE + TILE_SIZE/2;
    const py = ny * TILE_SIZE + TILE_SIZE/2;

    this.tweens.add({
      targets: this.playerSprite,
      x: px, y: py,
      duration: 140,
      onUpdate: (tween) => {
        this.updatePlayerFrame(Math.floor(tween.progress * 2) % 2);
      },
      onComplete: () => {
        this.moving = false;
        this.checkEncounter(tileId);
        this.savePosition();

        if (this.isMultiplayer) {
          this.moveThrottle++;
          if (this.moveThrottle % 1 === 0) {
            mpManager.movePlayer(nx, ny, this.mapId, dir);
          }
        }
      },
    });
  }

  private updatePlayerFrame(walkFrame = 0) {
    const dirIndex = { down: 0, up: 3, left: 2, right: 1 }[this.playerDir];
    this.playerSprite.setFrame(dirIndex * 2 + walkFrame);
  }

  private savePosition() {
    this.save.position = { mapId: this.mapId, tileX: this.save.position.tileX, tileY: this.save.position.tileY };
    writeSave(this.save);
  }

  // ─── Encounter ───────────────────────────────────────────────────────────

  private checkEncounter(tileId: number) {
    if (!ENCOUNTER_TILES.has(tileId)) { this.stepsSinceEncounter = 0; return; }
    this.stepsSinceEncounter++;
    // Minimum 5 steps before encounter
    if (this.stepsSinceEncounter < 5) return;
    if (Math.random() < ENCOUNTER_RATE) {
      this.stepsSinceEncounter = 0;
      this.triggerBattle();
    }
  }

  private triggerBattle() {
    const mapDef = getMapDef(this.mapId);
    const group = mapDef.encounterGroup ?? 'world_field';
    const enemies = randomEncounter(group);

    this.cameras.main.flash(200, 255, 255, 255);
    this.time.delayedCall(220, () => {
      this.scene.start('BattleScene', {
        save: this.save,
        enemies,
        isMultiplayer: this.isMultiplayer,
        isHost: this.isHost,
        returnMap: this.mapId,
      });
    });
  }

  // ─── Map change ──────────────────────────────────────────────────────────

  private changeMap(targetMap: MapId, targetX: number, targetY: number) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, () => {
      this.mapId = targetMap;
      this.save.position = { mapId: targetMap, tileX: targetX, tileY: targetY };
      writeSave(this.save);
      this.buildMap();

      const px = targetX * TILE_SIZE + TILE_SIZE/2;
      const py = targetY * TILE_SIZE + TILE_SIZE/2;
      this.playerSprite.setPosition(px, py);
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this.locationText.setText(getMapDef(targetMap).name);
      this.showMapName();
    });
  }

  // ─── Dialogue ────────────────────────────────────────────────────────────

  private dialogPage = 0;
  private dialogLines: string[] = [];
  private dialogName = '';

  showDialogue(name: string, lines: string[]) {
    this.dialogOpen = true;
    this.dialogName = name;
    this.dialogLines = lines;
    this.dialogPage = 0;
    this.renderDialogue();
  }

  private renderDialogue() {
    this.dialogContainer?.destroy();
    const W = this.scale.width;
    const H = this.scale.height;
    this.dialogContainer = this.add.container(0, H - 160).setDepth(50);

    const bg = this.add.rectangle(W/2, 70, W - 10, 130, COLORS.PANEL_DARK, 0.95)
      .setStrokeStyle(2, COLORS.BORDER);
    const nameBox = this.add.rectangle(50, 12, 90, 22, COLORS.PANEL)
      .setStrokeStyle(1, COLORS.BORDER);
    const nameText = this.add.text(50, 12, this.dialogName, {
      fontSize: '12px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    const lines = this.dialogLines[this.dialogPage];
    const bodyText = this.add.text(14, 30, lines, {
      fontSize: '14px', color: COLORS.TEXT.toString(16).padStart(6,'0').replace(/^/, '#'),
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      wordWrap: { width: W - 30 },
      lineSpacing: 4,
    });

    const isLast = this.dialogPage >= this.dialogLines.length - 1;
    const prompt = this.add.text(W - 20, 120, isLast ? '✕' : '▼', {
      fontSize: '16px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(1, 1);

    this.tweens.add({ targets: prompt, y: prompt.y + 4, duration: 400, yoyo: true, repeat: -1 });

    const hitArea = this.add.rectangle(W/2, 70, W, 130, 0, 0).setInteractive();
    hitArea.on('pointerdown', () => {
      if (this.dialogPage < this.dialogLines.length - 1) {
        this.dialogPage++;
        this.renderDialogue();
      } else {
        this.closeDialogue();
      }
    });

    this.dialogContainer.add([bg, nameBox, nameText, bodyText, prompt, hitArea]);
  }

  private closeDialogue() {
    this.dialogContainer?.destroy();
    this.dialogOpen = false;
  }

  // ─── UI ──────────────────────────────────────────────────────────────────

  private buildUI() {
    const W = this.scale.width;
    const H = this.scale.height;
    const uiY = H - UI_HEIGHT;

    // Background panel
    const uiBg = this.add.rectangle(W/2, H - UI_HEIGHT/2, W, UI_HEIGHT, COLORS.PANEL_DARK, 0.95)
      .setScrollFactor(0).setDepth(20).setStrokeStyle(1, COLORS.BORDER);

    // HP / MP
    this.hpText = this.add.text(10, uiY + 8, this.hpString(), {
      fontSize: '14px', color: '#44FF88',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setScrollFactor(0).setDepth(21);

    this.mpText = this.add.text(10, uiY + 28, this.mpString(), {
      fontSize: '14px', color: '#6688FF',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setScrollFactor(0).setDepth(21);

    // Location
    this.locationText = this.add.text(W/2, uiY + 8, getMapDef(this.mapId).name, {
      fontSize: '12px', color: '#AAAACC',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(21);

    // Level
    this.add.text(W - 10, uiY + 8, `Lv.${this.save.level}`, {
      fontSize: '14px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(21);
  }

  private hpString() { return `HP  ${this.save.stats.hp}/${this.save.stats.maxHp}`; }
  private mpString() { return `MP  ${this.save.stats.mp}/${this.save.stats.maxMp}`; }

  private updateUI() {
    this.hpText.setText(this.hpString());
    this.mpText.setText(this.mpString());
  }

  private showMapName() {
    const name = getMapDef(this.mapId).name;
    const W = this.scale.width;
    const banner = this.add.text(W/2, VIEWPORT_H/2, name, {
      fontSize: '24px', color: '#FFFDE7',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0);

    this.tweens.add({ targets: banner, alpha: 1, duration: 400, ease: 'Linear',
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.tweens.add({ targets: banner, alpha: 0, duration: 600, onComplete: () => banner.destroy() });
        });
      }
    });
  }

  // ─── Touch controls ───────────────────────────────────────────────────────

  private buildTouchControls() {
    const W = this.scale.width;
    const H = this.scale.height;
    const uiY = H - UI_HEIGHT;

    const dpadX = 72, dpadY = uiY + 52;
    const btnSize = 36;
    const gap = 38;

    const mkBtn = (x: number, y: number, label: string) => {
      const r = this.add.rectangle(x, y, btnSize, btnSize, 0xFFFFFF, 0.15)
        .setScrollFactor(0).setDepth(22).setInteractive()
        .setStrokeStyle(1, 0xFFFFFF, 0.3);
      this.add.text(x, y, label, { fontSize: '16px', color: '#FFFFFF' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(23);
      return r;
    };

    this.dpad = {
      up:    mkBtn(dpadX,      dpadY - gap, '▲'),
      down:  mkBtn(dpadX,      dpadY + gap, '▼'),
      left:  mkBtn(dpadX-gap,  dpadY,       '◀'),
      right: mkBtn(dpadX+gap,  dpadY,       '▶'),
    };

    // Action button (A)
    this.actionBtn = mkBtn(W - 44, uiY + 52, 'A');
    // Menu button
    this.menuBtn = mkBtn(W - 86, uiY + 52, 'M');

    // D-pad events
    const dirs: [Phaser.GameObjects.Rectangle, Direction][] = [
      [this.dpad.up, 'up'], [this.dpad.down, 'down'],
      [this.dpad.left, 'left'], [this.dpad.right, 'right'],
    ];
    dirs.forEach(([btn, dir]) => {
      let interval: ReturnType<typeof setInterval> | null = null;
      btn.on('pointerdown', () => {
        this.movePlayer(dir);
        interval = setInterval(() => this.movePlayer(dir), 150);
      });
      btn.on('pointerup', () => { if (interval) clearInterval(interval); });
      btn.on('pointerout', () => { if (interval) clearInterval(interval); });
    });

    // Action (interact / confirm)
    this.actionBtn.on('pointerdown', () => this.onActionButton());
    this.menuBtn.on('pointerdown', () => this.openMenu());
  }

  private onActionButton() {
    if (this.dialogOpen) {
      if (this.dialogPage < this.dialogLines.length - 1) {
        this.dialogPage++;
        this.renderDialogue();
      } else {
        this.closeDialogue();
      }
      return;
    }
    // Check facing NPC
    const tx = this.save.position.tileX;
    const ty = this.save.position.tileY;
    const [fx, fy] = this.playerDir === 'down'  ? [tx,   ty+1]
                   : this.playerDir === 'up'    ? [tx,   ty-1]
                   : this.playerDir === 'left'  ? [tx-1, ty  ]
                   :                              [tx+1, ty  ];
    const npc = getMapDef(this.mapId).npcs.find(n => n.tileX === fx && n.tileY === fy);
    if (npc) this.showDialogue(npc.name, npc.dialogue);
  }

  private openMenu() {
    this.scene.launch('MenuScene', { save: this.save });
    this.scene.pause();
  }

  // ─── Keyboard ─────────────────────────────────────────────────────────────

  private setupKeyboard() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.openMenu());
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => this.onActionButton());
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => this.onActionButton());
  }

  // ─── Multiplayer ──────────────────────────────────────────────────────────

  private setupMultiplayer() {
    mpManager.on('player_joined', (data: unknown) => {
      const d = data as { player: NetPlayer };
      this.addOtherPlayer(d.player);
    });

    mpManager.on('player_left', (data: unknown) => {
      const d = data as { playerId: string };
      this.removeOtherPlayer(d.playerId);
    });

    mpManager.on('player_moved', (data: unknown) => {
      const d = data as { playerId: string; x: number; y: number; mapId: string };
      const op = this.otherPlayers.get(d.playerId);
      if (!op) return;
      op.data.x = d.x; op.data.y = d.y;
      if (d.mapId === this.mapId) {
        this.tweens.add({
          targets: [op.sprite, op.label],
          x: d.x * TILE_SIZE + TILE_SIZE/2,
          y: d.y * TILE_SIZE + TILE_SIZE/2,
          duration: 140,
        });
        op.sprite.setVisible(true);
        op.label.setVisible(true);
      } else {
        op.sprite.setVisible(false);
        op.label.setVisible(false);
      }
    });

    mpManager.on('battle_started', (data: unknown) => {
      const d = data as { enemies: { id: string; name: string; hp: number; maxHp: number; atk: number; def: number }[] };
      this.cameras.main.flash(200, 255, 255, 255);
      this.time.delayedCall(220, () => {
        // Convert to EnemyDef format
        const enemies = d.enemies.map(e => ({
          id: e.id, name: e.name, hp: e.hp, atk: e.atk, def: e.def,
          mag: 0, spd: 5, exp: 0, gold: 0, drops: [], sprite: 'slime',
        }));
        this.scene.start('BattleScene', {
          save: this.save,
          enemies,
          isMultiplayer: true,
          isHost: this.isHost,
          returnMap: this.mapId,
        });
      });
    });
  }

  private addOtherPlayer(data: NetPlayer) {
    if (this.otherPlayers.has(data.id)) return;
    const ci = ['戦士','魔法使い','回復師','盗賊'].indexOf(data.className);
    const sprite = this.add.image(
      data.x * TILE_SIZE + TILE_SIZE/2,
      data.y * TILE_SIZE + TILE_SIZE/2,
      `hero_${ci >= 0 ? ci : 0}`
    ).setTint(0xAADDFF).setDepth(10);
    const label = this.add.text(
      data.x * TILE_SIZE + TILE_SIZE/2,
      data.y * TILE_SIZE - 4,
      data.name,
      { fontSize: '9px', color: '#AADDFF', stroke: '#000', strokeThickness: 2,
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif' }
    ).setOrigin(0.5, 1).setDepth(11);
    this.otherPlayers.set(data.id, { sprite, label, data });
  }

  private removeOtherPlayer(id: string) {
    const op = this.otherPlayers.get(id);
    if (!op) return;
    op.sprite.destroy();
    op.label.destroy();
    this.otherPlayers.delete(id);
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  update(_time: number, _delta: number) {
    if (this.dialogOpen) return;

    if      (Phaser.Input.Keyboard.JustDown(this.cursors.up!)   || Phaser.Input.Keyboard.JustDown(this.wasd.up))    this.movePlayer('up');
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!) || Phaser.Input.Keyboard.JustDown(this.wasd.down))  this.movePlayer('down');
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.left!) || Phaser.Input.Keyboard.JustDown(this.wasd.left))  this.movePlayer('left');
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)|| Phaser.Input.Keyboard.JustDown(this.wasd.right)) this.movePlayer('right');
  }
}
