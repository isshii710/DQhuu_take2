import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { hasSave, loadSave, defaultSave, writeSave } from '../systems/SaveSystem';
import type { CharacterSave, ClassName } from '../types';
import { CLASS_DEFS } from '../data/characters';
import { mpManager } from '../systems/MultiplayerManager';

type Screen = 'main' | 'new_game' | 'class_select' | 'name_input' | 'multiplayer' | 'mp_create' | 'mp_join';

export default class TitleScene extends Phaser.Scene {
  private screen: Screen = 'main';
  private selectedClass = 0;
  private playerName = '主人公';
  private roomInput = '';
  private containers: Phaser.GameObjects.Container[] = [];

  constructor() { super('TitleScene'); }

  create() {
    this.screen = 'main';
    this.renderTitle();
    this.renderScreen();
  }

  private clear() {
    this.containers.forEach(c => c.destroy());
    this.containers = [];
    this.children.list.slice().forEach(obj => {
      if ((obj as Phaser.GameObjects.GameObject).type !== 'Text' || (obj as Phaser.GameObjects.Text).text !== 'アルデア伝説') return;
    });
  }

  private renderTitle() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;

    // Starfield background
    this.add.rectangle(W/2, H/2, W, H, COLORS.SKY);
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H * 0.6);
      const alpha = Math.random() * 0.7 + 0.3;
      this.add.rectangle(x, y, Phaser.Math.Between(1,2), Phaser.Math.Between(1,2), 0xFFFFFF, alpha);
    }

    // Title text
    this.add.text(W/2, 90, 'アルデア伝説', {
      fontSize: '36px',
      color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      stroke: '#000',
      strokeThickness: 6,
      shadow: { offsetX: 2, offsetY: 2, color: '#FF6600', blur: 4, fill: true },
    }).setOrigin(0.5);

    this.add.text(W/2, 136, '～失われた聖石を求めて～', {
      fontSize: '14px',
      color: '#AAAAFF',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    // Decorative divider
    this.add.rectangle(W/2, 158, 220, 2, COLORS.BORDER, 0.6);
  }

  private renderScreen() {
    this.clear();
    const container = this.add.container(0, 0);
    this.containers.push(container);

    switch (this.screen) {
      case 'main':        this.buildMain(container);       break;
      case 'new_game':    this.buildClassSelect(container); break;
      case 'name_input':  this.buildNameInput(container);   break;
      case 'multiplayer': this.buildMultiplayer(container); break;
      case 'mp_create':   this.buildMpCreate(container);    break;
      case 'mp_join':     this.buildMpJoin(container);      break;
    }
  }

  private buildMain(c: Phaser.GameObjects.Container) {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const cx = W / 2;
    const sy = 220;

    const items: { label: string; action: () => void; enabled?: boolean }[] = [
      { label: 'はじめから', action: () => { this.screen = 'new_game'; this.renderScreen(); } },
      { label: 'つづきから', action: () => this.continueGame(), enabled: hasSave() },
      { label: 'マルチプレイ', action: () => { this.screen = 'multiplayer'; this.renderScreen(); } },
    ];

    items.forEach((item, i) => {
      const enabled = item.enabled !== false;
      const y = sy + i * 64;
      const panel = this.add.rectangle(cx, y, 220, 48, enabled ? COLORS.PANEL : 0x111122, 0.9)
        .setInteractive(enabled ? { useHandCursor: true } : undefined);
      const text = this.add.text(cx, y, item.label, {
        fontSize: '20px',
        color: enabled ? '#FFFDE7' : '#555566',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0.5);
      const border = this.add.rectangle(cx, y, 222, 50, COLORS.BORDER, enabled ? 0.8 : 0.2).setDepth(-1);

      if (enabled) {
        panel.on('pointerover',  () => { panel.setFillStyle(0x334488); text.setColor('#FFD700'); });
        panel.on('pointerout',   () => { panel.setFillStyle(COLORS.PANEL); text.setColor('#FFFDE7'); });
        panel.on('pointerdown',  () => item.action());
      }
      c.add([border, panel, text]);
    });

    // Version
    const ver = this.add.text(W/2, H - 20, 'v1.0.0  ©2026 Aldea Legend', {
      fontSize: '10px', color: '#555577',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    c.add(ver);
  }

  private buildClassSelect(c: Phaser.GameObjects.Container) {
    const W = GAME_WIDTH;
    this.add.text(W/2, 180, '職業を選んでください', {
      fontSize: '18px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    CLASS_DEFS.forEach((cls, i) => {
      const row = i < 2 ? 0 : 1;
      const col = i % 2;
      const x = 90 + col * 180;
      const y = 260 + row * 130;
      const sel = this.selectedClass === i;

      const panel = this.add.rectangle(x, y, 158, 110, sel ? 0x1a2a5a : COLORS.PANEL, 0.95)
        .setInteractive({ useHandCursor: true });
      const border = this.add.rectangle(x, y, 160, 112, sel ? COLORS.BORDER : 0x334466, 0.9).setDepth(-1);

      // Class sprite preview
      const classIndex = i;
      const sprite = this.add.image(x - 48, y - 20, `hero_${classIndex}`)
        .setFrame(0)
        .setScale(2);

      const nameText = this.add.text(x + 10, y - 34, cls.name, {
        fontSize: '18px', color: sel ? '#FFD700' : '#FFFDE7',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0.5);

      const descText = this.add.text(x, y + 2, cls.desc, {
        fontSize: '10px', color: '#AAAACC', wordWrap: { width: 148 },
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0.5);

      panel.on('pointerdown', () => {
        this.selectedClass = i;
        this.renderScreen();
      });

      c.add([border, panel, sprite, nameText, descText]);
    });

    // Confirm button
    const btn = this.add.rectangle(W/2, 540, 200, 48, 0x1a4a1a, 0.95)
      .setInteractive({ useHandCursor: true });
    const btnBorder = this.add.rectangle(W/2, 540, 202, 50, 0x44BB44, 0.8).setDepth(-1);
    const btnText = this.add.text(W/2, 540, '決定', {
      fontSize: '20px', color: '#AAFFAA',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);
    btn.on('pointerover', () => { btn.setFillStyle(0x224422); btnText.setColor('#FFD700'); });
    btn.on('pointerout',  () => { btn.setFillStyle(0x1a4a1a); btnText.setColor('#AAFFAA'); });
    btn.on('pointerdown', () => { this.screen = 'name_input'; this.renderScreen(); });

    const backBtn = this.add.text(W/2, 590, '← 戻る', {
      fontSize: '14px', color: '#8888AA',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => { this.screen = 'main'; this.renderScreen(); });

    c.add([btn, btnBorder, btnText, backBtn]);
  }

  private buildNameInput(c: Phaser.GameObjects.Container) {
    const W = GAME_WIDTH;
    const cx = W / 2;

    this.add.text(cx, 180, '名前を入力', {
      fontSize: '20px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    this.add.text(cx, 216, CLASS_DEFS[this.selectedClass].name + 'として旅立つ', {
      fontSize: '14px', color: '#AAAACC',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    // Name display box
    const box = this.add.rectangle(cx, 280, 220, 48, 0x0a1a3a).setStrokeStyle(2, COLORS.BORDER);
    const nameDisplay = this.add.text(cx, 280, this.playerName + '▌', {
      fontSize: '22px', color: '#FFFDE7',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    // Cursor blink
    this.time.addEvent({ delay: 500, loop: true, callback: () => {
      const s = nameDisplay.text;
      if (s.endsWith('▌')) nameDisplay.setText(s.slice(0,-1));
      else nameDisplay.setText(s + '▌');
    }});

    c.add([box, nameDisplay]);

    // Virtual keyboard - preset names
    const presets = ['主人公', 'アルテ', 'ライア', 'セイン', 'ルーカ', 'ミア'];
    presets.forEach((name, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = cx - 90 + col * 94;
      const y = 340 + row * 52;
      const btn = this.add.rectangle(x, y, 86, 40, COLORS.PANEL).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, name, {
        fontSize: '14px', color: '#FFFDE7',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => {
        this.playerName = name;
        nameDisplay.setText(name + '▌');
      });
      btn.on('pointerover', () => btn.setFillStyle(0x334488));
      btn.on('pointerout', () => btn.setFillStyle(COLORS.PANEL));
      c.add([btn, t]);
    });

    // Native keyboard via DOM input
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 8;
    input.value = this.playerName;
    input.style.cssText = 'position:fixed;opacity:0;top:0;left:0;width:1px;height:1px';
    document.body.appendChild(input);
    input.focus();
    input.addEventListener('input', () => {
      this.playerName = input.value || '主人公';
      const txt = nameDisplay.text.replace('▌','');
      nameDisplay.setText(this.playerName + '▌');
    });
    this.events.once('shutdown', () => input.remove());
    this.events.once('sleep', () => input.remove());

    // Start button
    const startBtn = this.add.rectangle(cx, 480, 200, 50, 0x1a4a1a)
      .setStrokeStyle(2, 0x44BB44)
      .setInteractive({ useHandCursor: true });
    const startText = this.add.text(cx, 480, '冒険を始める！', {
      fontSize: '20px', color: '#AAFFAA',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);
    startBtn.on('pointerdown', () => {
      input.remove();
      this.startNewGame();
    });
    startBtn.on('pointerover', () => { startBtn.setFillStyle(0x224422); startText.setColor('#FFD700'); });
    startBtn.on('pointerout',  () => { startBtn.setFillStyle(0x1a4a1a); startText.setColor('#AAFFAA'); });

    const backBtn = this.add.text(cx, 540, '← 戻る', {
      fontSize: '14px', color: '#8888AA',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => { input.remove(); this.screen = 'new_game'; this.renderScreen(); });

    c.add([startBtn, startText, backBtn]);
  }

  private buildMultiplayer(c: Phaser.GameObjects.Container) {
    const W = GAME_WIDTH, cx = W/2;

    this.add.text(cx, 190, 'マルチプレイ', {
      fontSize: '22px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    this.add.text(cx, 228, '最大4人でパーティを組んで冒険！', {
      fontSize: '13px', color: '#AAAACC',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    const buttons = [
      { label: 'ルームを作る', sub: 'ホストとして新しいルームを作成', action: () => { this.screen = 'mp_create'; this.renderScreen(); } },
      { label: 'ルームに参加', sub: 'ルームIDを入力して参加', action: () => { this.screen = 'mp_join'; this.renderScreen(); } },
    ];

    buttons.forEach((btn, i) => {
      const y = 320 + i * 110;
      const panel = this.add.rectangle(cx, y, 280, 80, COLORS.PANEL)
        .setStrokeStyle(2, COLORS.BORDER)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(cx, y - 14, btn.label, {
        fontSize: '20px', color: '#FFFDE7',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0.5);
      const sub = this.add.text(cx, y + 16, btn.sub, {
        fontSize: '12px', color: '#8888AA',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0.5);
      panel.on('pointerover', () => { panel.setFillStyle(0x334488); label.setColor('#FFD700'); });
      panel.on('pointerout', () => { panel.setFillStyle(COLORS.PANEL); label.setColor('#FFFDE7'); });
      panel.on('pointerdown', () => btn.action());
      c.add([panel, label, sub]);
    });

    const backBtn = this.add.text(cx, 560, '← 戻る', {
      fontSize: '14px', color: '#8888AA',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => { this.screen = 'main'; this.renderScreen(); });
    c.add(backBtn);
  }

  private buildMpCreate(c: Phaser.GameObjects.Container) {
    const W = GAME_WIDTH, cx = W/2;
    this.add.text(cx, 190, 'ルームを作る', {
      fontSize: '22px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    const statusText = this.add.text(cx, 300, 'サーバーに接続中…', {
      fontSize: '14px', color: '#AAAACC',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);
    c.add(statusText);

    const save = loadSave() ?? defaultSave(this.playerName || '勇者', CLASS_DEFS[this.selectedClass].name as ClassName);

    mpManager.connect().then(() => {
      statusText.setText('接続完了！ルームを作成中…');
      const player = {
        id: mpManager.socketId,
        name: save.name,
        className: save.className,
        x: save.position.tileX,
        y: save.position.tileY,
        mapId: save.position.mapId,
        hp: save.stats.hp,
        maxHp: save.stats.maxHp,
        mp: save.stats.mp,
        maxMp: save.stats.maxMp,
        level: save.level,
        ready: false,
      };
      mpManager.createRoom(player as never);
      mpManager.on('room_created', (data: unknown) => {
        const d = data as { roomId: string };
        statusText.setText('');
        const panel = this.add.rectangle(cx, 300, 260, 80, 0x0a1a3a).setStrokeStyle(2, COLORS.BORDER);
        const idLabel = this.add.text(cx, 284, 'ルームID', {
          fontSize: '13px', color: '#AAAACC',
          fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }).setOrigin(0.5);
        const idText = this.add.text(cx, 308, d.roomId, {
          fontSize: '28px', color: '#FFD700',
          fontFamily: 'monospace',
          letterSpacing: 8,
        }).setOrigin(0.5);
        const hint = this.add.text(cx, 360, '友達にこのIDを伝えてください', {
          fontSize: '13px', color: '#8888AA',
          fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }).setOrigin(0.5);
        const startBtn = this.add.rectangle(cx, 430, 200, 50, 0x1a4a1a)
          .setStrokeStyle(2, 0x44BB44).setInteractive({ useHandCursor: true });
        const startT = this.add.text(cx, 430, 'ゲームを開始！', {
          fontSize: '18px', color: '#AAFFAA',
          fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }).setOrigin(0.5);
        startBtn.on('pointerdown', () => {
          mpManager.setReady();
          this.scene.start('WorldScene', { save, isMultiplayer: true, isHost: true, roomId: d.roomId });
        });
        c.add([panel, idLabel, idText, hint, startBtn, startT]);
      });
    }).catch(() => {
      statusText.setText('接続に失敗しました。\nシングルプレイで開始します。');
      this.time.delayedCall(2000, () => {
        const s = loadSave() ?? defaultSave(this.playerName || '勇者', CLASS_DEFS[this.selectedClass].name as ClassName);
        writeSave(s);
        this.scene.start('WorldScene', { save: s, isMultiplayer: false });
      });
    });

    const backBtn = this.add.text(cx, 560, '← 戻る', {
      fontSize: '14px', color: '#8888AA',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => { mpManager.disconnect(); this.screen = 'multiplayer'; this.renderScreen(); });
    c.add(backBtn);
  }

  private buildMpJoin(c: Phaser.GameObjects.Container) {
    const W = GAME_WIDTH, cx = W/2;
    this.add.text(cx, 190, 'ルームに参加', {
      fontSize: '22px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    const box = this.add.rectangle(cx, 290, 220, 52, 0x0a1a3a).setStrokeStyle(2, COLORS.BORDER);
    const idDisplay = this.add.text(cx, 290, this.roomInput + '▌', {
      fontSize: '26px', color: '#FFD700', fontFamily: 'monospace', letterSpacing: 8,
    }).setOrigin(0.5);

    // DOM input
    const input = document.createElement('input');
    input.type = 'text'; input.maxLength = 4;
    input.placeholder = 'XXXX';
    input.style.cssText = 'position:fixed;opacity:0;top:0;left:0;width:1px;height:1px';
    document.body.appendChild(input);
    input.focus();
    input.addEventListener('input', () => {
      this.roomInput = input.value.toUpperCase();
      idDisplay.setText(this.roomInput + '▌');
    });
    this.events.once('shutdown', () => input.remove());

    const statusText = this.add.text(cx, 360, '', {
      fontSize: '13px', color: '#FF8888',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    const joinBtn = this.add.rectangle(cx, 430, 200, 50, 0x1a4a1a)
      .setStrokeStyle(2, 0x44BB44).setInteractive({ useHandCursor: true });
    const joinT = this.add.text(cx, 430, '参加する', {
      fontSize: '20px', color: '#AAFFAA',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    joinBtn.on('pointerdown', () => {
      if (this.roomInput.length < 4) { statusText.setText('4文字のIDを入力してください'); return; }
      input.remove();
      statusText.setText('接続中…');
      const save = loadSave() ?? defaultSave(this.playerName || '旅人', CLASS_DEFS[this.selectedClass].name as ClassName);
      mpManager.connect().then(() => {
        const player = {
          id: mpManager.socketId,
          name: save.name, className: save.className,
          x: save.position.tileX, y: save.position.tileY,
          mapId: save.position.mapId,
          hp: save.stats.hp, maxHp: save.stats.maxHp,
          mp: save.stats.mp, maxMp: save.stats.maxMp,
          level: save.level, ready: false,
        };
        mpManager.joinRoom(this.roomInput, player as never);
        mpManager.on('room_joined', (data: unknown) => {
          const d = data as { roomId: string };
          mpManager.setReady();
          this.scene.start('WorldScene', { save, isMultiplayer: true, isHost: false, roomId: d.roomId });
        });
        mpManager.on('error', (data: unknown) => {
          statusText.setText((data as { msg: string }).msg);
        });
      }).catch(() => statusText.setText('サーバーに接続できません'));
    });

    const backBtn = this.add.text(cx, 550, '← 戻る', {
      fontSize: '14px', color: '#8888AA',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => { input.remove(); this.screen = 'multiplayer'; this.renderScreen(); });

    c.add([box, idDisplay, statusText, joinBtn, joinT, backBtn]);
  }

  private continueGame() {
    const save = loadSave();
    if (!save) return;
    this.scene.start('WorldScene', { save, isMultiplayer: false });
  }

  private startNewGame() {
    const className = CLASS_DEFS[this.selectedClass].name as ClassName;
    const name = this.playerName.replace('▌', '').trim() || '主人公';
    const save = defaultSave(name, className);
    writeSave(save);
    this.scene.start('WorldScene', { save, isMultiplayer: false });
  }
}
