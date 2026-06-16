import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import type { CharacterSave, Equipment } from '../types';
import { ITEMS } from '../data/items';
import { effectiveStats, equipItem, unequipSlot } from '../systems/InventorySystem';
import { writeSave } from '../systems/SaveSystem';

type MenuTab = 'status' | 'equipment' | 'items';

interface SceneData {
  save: CharacterSave;
}

export default class MenuScene extends Phaser.Scene {
  private save!: CharacterSave;
  private tab: MenuTab = 'status';
  private container!: Phaser.GameObjects.Container;

  constructor() { super('MenuScene'); }

  init(data: SceneData) {
    this.save = data.save;
  }

  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;

    // Dimmed overlay
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6)
      .setInteractive()
      .on('pointerdown', () => this.closeMenu());

    this.buildMenu();
  }

  private buildMenu() {
    this.container?.destroy();
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this.container = this.add.container(0, 0);

    // Panel
    const panel = this.add.rectangle(W/2, H/2, W - 20, H - 60, COLORS.PANEL_DARK, 0.97)
      .setStrokeStyle(2, COLORS.BORDER);
    this.container.add(panel);

    // Title
    const title = this.add.text(W/2, 36, 'メニュー', {
      fontSize: '20px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);
    this.container.add(title);

    // Close button
    const closeBtn = this.add.text(W - 20, 14, '✕', {
      fontSize: '20px', color: '#AAAACC',
      fontFamily: 'monospace',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeMenu());
    this.container.add(closeBtn);

    // Tabs
    const tabs: { label: string; id: MenuTab }[] = [
      { label: 'ステータス', id: 'status' },
      { label: '装備',       id: 'equipment' },
      { label: 'アイテム',   id: 'items' },
    ];
    tabs.forEach((t, i) => {
      const x = 60 + i * 110;
      const active = t.id === this.tab;
      const btn = this.add.rectangle(x, 66, 100, 28, active ? 0x334488 : COLORS.PANEL)
        .setStrokeStyle(1, active ? COLORS.BORDER : 0x334466)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, 66, t.label, {
        fontSize: '13px', color: active ? '#FFD700' : '#AAAACC',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => { this.tab = t.id; this.buildMenu(); });
      this.container.add([btn, txt]);
    });

    // Divider
    this.container.add(this.add.rectangle(W/2, 82, W - 30, 1, COLORS.BORDER, 0.3));

    // Content
    switch (this.tab) {
      case 'status':    this.buildStatus();    break;
      case 'equipment': this.buildEquipment(); break;
      case 'items':     this.buildItems();     break;
    }
  }

  private buildStatus() {
    const W = GAME_WIDTH;
    const stats = effectiveStats(this.save);
    const y0 = 100;
    const col = (i: number) => ({ x: i % 2 === 0 ? 20 : W/2, y: y0 + Math.floor(i / 2) * 36 });

    const rows: [string, string][] = [
      ['名前',   this.save.name],
      ['職業',   this.save.className],
      ['レベル', String(this.save.level)],
      ['経験値', String(this.save.exp)],
      ['HP',     `${stats.hp} / ${stats.maxHp}`],
      ['MP',     `${stats.mp} / ${stats.maxMp}`],
      ['攻撃力', String(stats.atk)],
      ['防御力', String(stats.def)],
      ['魔力',   String(stats.mag)],
      ['素早さ', String(stats.spd)],
      ['ゴールド', `${this.save.gold} G`],
    ];

    rows.forEach(([label, value], i) => {
      const { x, y } = col(i);
      const lbl = this.add.text(x + 4, y, label, {
        fontSize: '13px', color: '#AAAACC',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      });
      const val = this.add.text(x + 76, y, value, {
        fontSize: '13px', color: '#FFFDE7',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      });
      this.container.add([lbl, val]);
    });
  }

  private buildEquipment() {
    const W = GAME_WIDTH;
    const slots: { key: keyof Equipment; label: string }[] = [
      { key: 'weapon',    label: '武器' },
      { key: 'armor',     label: '防具' },
      { key: 'helmet',    label: '兜  ' },
      { key: 'accessory', label: 'アクセ' },
    ];

    slots.forEach(({ key, label }, i) => {
      const y = 100 + i * 52;
      const equippedId = this.save.equipment[key];
      const item = equippedId ? ITEMS.find(it => it.id === equippedId) : null;

      const bg = this.add.rectangle(W/2, y, W - 40, 42, COLORS.PANEL)
        .setStrokeStyle(1, 0x334466);
      const lbl = this.add.text(16, y - 10, label, {
        fontSize: '12px', color: '#AAAACC',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0, 0.5);
      const val = this.add.text(80, y, item ? item.name : '─ 未装備 ─', {
        fontSize: '14px', color: item ? '#FFFDE7' : '#555577',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0, 0.5);

      this.container.add([bg, lbl, val]);

      if (equippedId) {
        const unBtn = this.add.text(W - 20, y, '外す', {
          fontSize: '13px', color: '#FF8888',
          fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        unBtn.on('pointerdown', () => { unequipSlot(this.save, key); writeSave(this.save); this.buildMenu(); });
        this.container.add(unBtn);
      }
    });

    // Inventory equippable items
    const equipY = 320;
    this.add.text(W/2, equipY, '─── 所持品から装備 ───', {
      fontSize: '12px', color: '#AAAACC',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    const equippables = this.save.inventory.filter(entry => {
      const item = ITEMS.find(it => it.id === entry.itemId);
      return item && item.type !== 'consumable';
    });

    equippables.slice(0, 4).forEach((entry, i) => {
      const item = ITEMS.find(it => it.id === entry.itemId)!;
      const y = equipY + 28 + i * 44;
      const btn = this.add.rectangle(W/2, y, W - 40, 36, COLORS.PANEL)
        .setStrokeStyle(1, 0x334466).setInteractive({ useHandCursor: true });
      const t = this.add.text(20, y, item.name, {
        fontSize: '14px', color: '#FFFDE7',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0, 0.5);
      btn.on('pointerdown', () => { equipItem(this.save, entry.itemId); writeSave(this.save); this.buildMenu(); });
      btn.on('pointerover', () => { btn.setStrokeStyle(1, COLORS.BORDER); t.setColor('#FFD700'); });
      btn.on('pointerout', () => { btn.setStrokeStyle(1, 0x334466); t.setColor('#FFFDE7'); });
      this.container.add([btn, t]);
    });
  }

  private buildItems() {
    const W = GAME_WIDTH;
    const items = this.save.inventory;

    if (items.length === 0) {
      this.add.text(W/2, 200, 'アイテムを持っていない', {
        fontSize: '14px', color: '#555577',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0.5);
      return;
    }

    items.forEach((entry, i) => {
      const item = ITEMS.find(it => it.id === entry.itemId);
      if (!item) return;
      const y = 104 + i * 48;
      const bg = this.add.rectangle(W/2, y, W - 40, 40, COLORS.PANEL)
        .setStrokeStyle(1, 0x334466);
      const nameT = this.add.text(20, y - 8, item.name, {
        fontSize: '14px', color: '#FFFDE7',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0, 0.5);
      const qtyT = this.add.text(W - 50, y, `× ${entry.qty}`, {
        fontSize: '13px', color: '#AAAACC', fontFamily: 'monospace',
      }).setOrigin(1, 0.5);
      const descT = this.add.text(20, y + 8, item.desc, {
        fontSize: '11px', color: '#888899',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0, 0.5);
      this.container.add([bg, nameT, qtyT, descT]);
    });
  }

  private closeMenu() {
    writeSave(this.save);
    this.scene.stop();
    this.scene.resume('WorldScene');
  }
}
