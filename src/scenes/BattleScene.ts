import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import type { CharacterSave, EnemyDef } from '../types';
import { getClassDef } from '../data/characters';
import { buildCombatant, buildEnemyCombatant, resolveAction, enemyAI, sortBySpeed, applyExpGain, type Combatant } from '../systems/BattleSystem';
import { effectiveStats } from '../systems/InventorySystem';
import { writeSave } from '../systems/SaveSystem';
import { mpManager } from '../systems/MultiplayerManager';
import type { BattleRoundResult } from '../types';

type BattlePhase = 'intro' | 'command' | 'executing' | 'result' | 'victory' | 'defeat' | 'run';

interface SceneData {
  save: CharacterSave;
  enemies: EnemyDef[];
  isMultiplayer: boolean;
  isHost: boolean;
  returnMap: string;
}

export default class BattleScene extends Phaser.Scene {
  private save!: CharacterSave;
  private enemies!: EnemyDef[];
  private isMultiplayer = false;
  private isHost = false;
  private returnMap!: string;

  private playerCombatant!: Combatant;
  private enemyCombatants: Combatant[] = [];

  private phase: BattlePhase = 'intro';
  private selectedEnemy = 0;
  private selectedCommand = 0;
  private selectedSkill = 0;

  // UI containers
  private bgRect!: Phaser.GameObjects.Rectangle;
  private enemySprites: Phaser.GameObjects.Image[] = [];
  private enemyHpBars: Phaser.GameObjects.Rectangle[] = [];
  private enemyHpBarBgs: Phaser.GameObjects.Rectangle[] = [];
  private logText!: Phaser.GameObjects.Text;
  private commandContainer!: Phaser.GameObjects.Container;
  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private playerMpBar!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private playerMpText!: Phaser.GameObjects.Text;
  private bgOverlay!: Phaser.GameObjects.Rectangle;

  // Multiplayer result queue
  private mpResultQueue: BattleRoundResult[] = [];

  constructor() { super('BattleScene'); }

  init(data: SceneData) {
    this.save = data.save;
    this.enemies = data.enemies;
    this.isMultiplayer = data.isMultiplayer ?? false;
    this.isHost = data.isHost ?? false;
    this.returnMap = data.returnMap;
  }

  create() {
    const stats = effectiveStats(this.save);
    this.playerCombatant = buildCombatant({
      ...this.save,
      stats: { ...this.save.stats, ...stats },
    });
    this.enemyCombatants = this.enemies.map((e, i) => buildEnemyCombatant(e, i));

    this.buildBackground();
    this.buildEnemySprites();
    this.buildPlayerPanel();
    this.buildLogPanel();

    this.phase = 'intro';
    this.playIntro();

    if (this.isMultiplayer) {
      this.setupMpListeners();
    }
  }

  // ─── Background ──────────────────────────────────────────────────────────

  private buildBackground() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;

    // Gradient sky
    this.add.rectangle(W/2, H * 0.3, W, H * 0.6, 0x0a1a44);
    // Ground
    this.add.rectangle(W/2, H * 0.75, W, H * 0.5, 0x1a0a0a);
    // Ground line
    this.add.rectangle(W/2, H * 0.5, W, 4, 0x442222);

    // Stars
    for (let i = 0; i < 40; i++) {
      this.add.rectangle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.45),
        1, 1, 0xFFFFFF, Math.random() * 0.8 + 0.2
      );
    }

    this.bgOverlay = this.add.rectangle(W/2, H/2, W, H, 0xFFFFFF, 0).setDepth(99);
  }

  // ─── Enemy sprites ────────────────────────────────────────────────────────

  private buildEnemySprites() {
    const W = GAME_WIDTH;
    const count = this.enemies.length;
    const spacing = Math.min(120, (W - 40) / count);
    const startX = W/2 - (count-1) * spacing / 2;

    this.enemies.forEach((enemy, i) => {
      const x = startX + i * spacing;
      const y = 200;

      const sprite = this.add.image(x, y, `enemy_${enemy.sprite}`).setScale(0.8).setDepth(5);
      this.enemySprites.push(sprite);

      // Float animation
      this.tweens.add({ targets: sprite, y: y - 8, duration: 1200 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      // HP bar bg
      const barBg = this.add.rectangle(x, y + 52, 72, 8, 0x222222).setDepth(6);
      this.enemyHpBarBgs.push(barBg);

      // HP bar
      const bar = this.add.rectangle(x - 35, y + 52, 70, 6, COLORS.ENEMY_HP).setOrigin(0, 0.5).setDepth(7);
      this.enemyHpBars.push(bar);

      // Name label
      this.add.text(x, y - 46, enemy.name, {
        fontSize: '12px', color: '#FFDDDD',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(6);

      // HP number
      this.add.text(x, y + 62, `HP ${enemy.hp}`, {
        fontSize: '10px', color: '#FFAAAA',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(7).setName(`enemy_hp_${i}`);
    });
  }

  private updateEnemyHpBar(i: number) {
    const enemy = this.enemyCombatants[i];
    const bar = this.enemyHpBars[i];
    if (!bar) return;
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    bar.width = 70 * ratio;
    bar.setFillStyle(ratio > 0.5 ? COLORS.HP_BAR : COLORS.HP_LOW);

    // Update HP text
    const t = this.children.getByName(`enemy_hp_${i}`) as Phaser.GameObjects.Text;
    if (t) t.setText(`HP ${enemy.hp}`);

    if (enemy.hp <= 0) {
      this.tweens.add({ targets: this.enemySprites[i], alpha: 0, duration: 400 });
    }
  }

  // ─── Player panel ─────────────────────────────────────────────────────────

  private buildPlayerPanel() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const panelY = H - 170;

    const panel = this.add.rectangle(W/2, panelY + 60, W, 140, COLORS.PANEL_DARK, 0.95).setDepth(10);
    this.add.rectangle(W/2, panelY, W, 2, COLORS.BORDER, 0.7).setDepth(10);

    // Player name & class
    this.add.text(12, panelY + 10, `${this.save.name} (${this.save.className}) Lv.${this.save.level}`, {
      fontSize: '13px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setDepth(11);

    // HP bar
    this.add.rectangle(12, panelY + 38, 100, 10, 0x222222).setOrigin(0, 0.5).setDepth(11);
    this.playerHpBar = this.add.rectangle(12, panelY + 38, 100, 8, COLORS.HP_BAR).setOrigin(0, 0.5).setDepth(12);
    this.playerHpText = this.add.text(120, panelY + 38, this.hpStr(), {
      fontSize: '12px', color: '#88FFAA', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(11);

    // MP bar
    this.add.rectangle(12, panelY + 56, 100, 10, 0x222222).setOrigin(0, 0.5).setDepth(11);
    this.playerMpBar = this.add.rectangle(12, panelY + 56, 100, 8, COLORS.MP_BAR).setOrigin(0, 0.5).setDepth(12);
    this.playerMpText = this.add.text(120, panelY + 56, this.mpStr(), {
      fontSize: '12px', color: '#8888FF', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(11);

    this.updatePlayerPanel();
  }

  private updatePlayerPanel() {
    const p = this.playerCombatant;
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    const mpRatio = Math.max(0, p.mp / p.maxMp);
    this.playerHpBar.width = 100 * hpRatio;
    this.playerHpBar.setFillStyle(hpRatio > 0.3 ? COLORS.HP_BAR : COLORS.HP_LOW);
    this.playerMpBar.width = 100 * mpRatio;
    this.playerHpText.setText(this.hpStr());
    this.playerMpText.setText(this.mpStr());
  }

  private hpStr() { return `HP ${this.playerCombatant.hp}/${this.playerCombatant.maxHp}`; }
  private mpStr() { return `MP ${this.playerCombatant.mp}/${this.playerCombatant.maxMp}`; }

  // ─── Log panel ────────────────────────────────────────────────────────────

  private buildLogPanel() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const logY = H - 90;
    this.logText = this.add.text(12, logY, '', {
      fontSize: '13px', color: '#FFFDE7',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      wordWrap: { width: W - 24 },
      lineSpacing: 2,
    }).setDepth(11);
  }

  private log(msg: string) {
    this.logText.setText(msg);
  }

  // ─── Command menu ─────────────────────────────────────────────────────────

  private buildCommandMenu() {
    this.commandContainer?.destroy();
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const menuY = H - 170;

    this.commandContainer = this.add.container(0, 0).setDepth(15);

    const commands = ['⚔ 攻撃', '✨ 魔法', '💊 アイテム', '🏃 逃げる'];
    commands.forEach((label, i) => {
      const x = 60 + (i % 2) * 140;
      const y = menuY + 24 + Math.floor(i / 2) * 44;
      const btn = this.add.rectangle(x, y, 126, 36, COLORS.PANEL)
        .setStrokeStyle(2, i === this.selectedCommand ? COLORS.BORDER : 0x334466)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(x, y, label, {
        fontSize: '15px',
        color: i === this.selectedCommand ? '#FFD700' : '#FFFDE7',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0.5);
      btn.on('pointerover', () => { btn.setStrokeStyle(2, COLORS.BORDER); text.setColor('#FFD700'); });
      btn.on('pointerout', () => { btn.setStrokeStyle(2, i === this.selectedCommand ? COLORS.BORDER : 0x334466); text.setColor(i === this.selectedCommand ? '#FFD700' : '#FFFDE7'); });
      btn.on('pointerdown', () => this.onCommandSelect(i));
      this.commandContainer.add([btn, text]);
    });
  }

  private buildSkillMenu() {
    this.commandContainer?.destroy();
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const menuY = H - 170;

    this.commandContainer = this.add.container(0, 0).setDepth(15);

    const cls = getClassDef(this.save.className);
    const skills = cls.skills.filter(s => s.level <= this.save.level);

    if (skills.length === 0) {
      this.log('まだ使える魔法がない！');
      this.time.delayedCall(1000, () => this.buildCommandMenu());
      return;
    }

    const backBtn = this.add.text(W - 16, menuY + 14, '← 戻る', {
      fontSize: '13px', color: '#AAAACC',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setDepth(16);
    backBtn.on('pointerdown', () => this.buildCommandMenu());
    this.commandContainer.add(backBtn);

    skills.forEach((skill, i) => {
      const y = menuY + 20 + i * 36;
      const btn = this.add.rectangle(W/2, y + 8, W - 30, 30, COLORS.PANEL)
        .setStrokeStyle(1, 0x334466).setInteractive({ useHandCursor: true });
      const nameT = this.add.text(20, y + 8, skill.name, {
        fontSize: '14px', color: '#FFFDE7',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0, 0.5);
      const mpT = this.add.text(W - 50, y + 8, `MP${skill.mpCost}`, {
        fontSize: '12px', color: '#8888FF',
        fontFamily: 'monospace',
      }).setOrigin(1, 0.5);
      btn.on('pointerover', () => { btn.setStrokeStyle(1, COLORS.BORDER); nameT.setColor('#FFD700'); });
      btn.on('pointerout', () => { btn.setStrokeStyle(1, 0x334466); nameT.setColor('#FFFDE7'); });
      btn.on('pointerdown', () => this.onSkillSelect(skill.name, skill.mpCost));
      this.commandContainer.add([btn, nameT, mpT]);
    });
  }

  private buildItemMenu() {
    this.commandContainer?.destroy();
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const menuY = H - 170;

    this.commandContainer = this.add.container(0, 0).setDepth(15);

    const consumables = this.save.inventory.filter(e => {
      // We need to check item type but we import lazily
      return true; // show all; only herbs/potions usable in battle
    });

    const backBtn = this.add.text(W - 16, menuY + 14, '← 戻る', {
      fontSize: '13px', color: '#AAAACC',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setDepth(16);
    backBtn.on('pointerdown', () => this.buildCommandMenu());
    this.commandContainer.add(backBtn);

    if (consumables.length === 0) {
      this.add.text(W/2, menuY + 60, 'アイテムがない', {
        fontSize: '14px', color: '#AAAACC',
        fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      }).setOrigin(0.5).setDepth(16);
    } else {
      consumables.slice(0, 4).forEach((entry, i) => {
        const y = menuY + 20 + i * 36;
        const btn = this.add.rectangle(W/2, y + 8, W - 30, 30, COLORS.PANEL)
          .setStrokeStyle(1, 0x334466).setInteractive({ useHandCursor: true });
        const nameT = this.add.text(20, y + 8, entry.itemId, {
          fontSize: '14px', color: '#FFFDE7',
          fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        }).setOrigin(0, 0.5);
        const qtyT = this.add.text(W - 50, y + 8, `×${entry.qty}`, {
          fontSize: '13px', color: '#AAAACC', fontFamily: 'monospace',
        }).setOrigin(1, 0.5);
        btn.on('pointerdown', () => this.onItemUse(entry.itemId));
        this.commandContainer.add([btn, nameT, qtyT]);
      });
    }
  }

  // ─── Command handlers ─────────────────────────────────────────────────────

  private onCommandSelect(index: number) {
    if (this.phase !== 'command') return;
    this.selectedCommand = index;

    if (index === 0) { // Attack
      this.selectedEnemy = this.enemyCombatants.findIndex(e => e.hp > 0);
      this.executePlayerAction('attack');
    } else if (index === 1) { // Magic
      this.buildSkillMenu();
    } else if (index === 2) { // Item
      this.buildItemMenu();
    } else if (index === 3) { // Run
      this.executePlayerAction('run');
    }
  }

  private onSkillSelect(name: string, mpCost: number) {
    if (this.playerCombatant.mp < mpCost) {
      this.log('MPが足りない！');
      this.time.delayedCall(1000, () => this.buildCommandMenu());
      return;
    }
    this.selectedEnemy = this.enemyCombatants.findIndex(e => e.hp > 0);
    this.executePlayerAction('magic', name);
  }

  private onItemUse(itemId: string) {
    this.executePlayerAction('item', undefined, itemId);
  }

  private executePlayerAction(type: 'attack' | 'magic' | 'item' | 'run', spellName?: string, itemId?: string) {
    if (this.isMultiplayer) {
      // Send to server; wait for battle_round_result
      mpManager.submitAction({ type, targetIndex: this.selectedEnemy, spellId: spellName, itemId });
      this.phase = 'executing';
      this.commandContainer?.destroy();
      this.log('行動を送信中…');
      return;
    }

    // Single player: resolve locally
    this.phase = 'executing';
    this.commandContainer?.destroy();

    const target = this.enemyCombatants[this.selectedEnemy];
    const action = { actorId: this.playerCombatant.id, type, targetId: target?.id, spellName, itemId };
    const result = resolveAction(this.playerCombatant, action, target ?? this.playerCombatant);

    this.log(result.text);
    if (result.damage) this.showDamageNumber(this.selectedEnemy, result.damage);
    this.updateEnemyHpBar(this.selectedEnemy);
    this.updatePlayerPanel();

    if (type === 'run') {
      this.time.delayedCall(1000, () => this.endBattle(false, true));
      return;
    }

    this.time.delayedCall(1000, () => {
      const allDead = this.enemyCombatants.every(e => e.hp <= 0);
      if (allDead) { this.phase = 'victory'; this.doVictory(); return; }
      this.doEnemyTurn();
    });
  }

  private doEnemyTurn() {
    const livingEnemies = this.enemyCombatants.filter(e => e.hp > 0);
    let delay = 0;
    livingEnemies.forEach(enemy => {
      this.time.delayedCall(delay, () => {
        const action = enemyAI(enemy, [this.playerCombatant]);
        const result = resolveAction(enemy, action, this.playerCombatant);
        this.log(result.text);
        if (result.damage) {
          this.showPlayerDamage(result.damage);
        }
        this.updatePlayerPanel();
        this.save.stats.hp = this.playerCombatant.hp;
      });
      delay += 800;
    });

    this.time.delayedCall(delay + 400, () => {
      if (this.playerCombatant.hp <= 0) {
        this.phase = 'defeat';
        this.doDefeat();
      } else {
        this.phase = 'command';
        this.log('コマンドを選んでください');
        this.buildCommandMenu();
      }
    });
  }

  // ─── Damage numbers ──────────────────────────────────────────────────────

  private showDamageNumber(enemyIndex: number, dmg: number) {
    const sprite = this.enemySprites[enemyIndex];
    if (!sprite) return;
    const txt = this.add.text(sprite.x, sprite.y - 20, `-${dmg}`, {
      fontSize: '22px', color: '#FF4444',
      fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
    this.tweens.add({ targets: sprite, x: sprite.x + 6, duration: 50, yoyo: true, repeat: 3 });
  }

  private showPlayerDamage(dmg: number) {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const txt = this.add.text(W - 100, H - 200, `-${dmg}`, {
      fontSize: '22px', color: '#FF8888',
      fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
    this.cameras.main.shake(150, 0.008);
  }

  // ─── Victory / Defeat ─────────────────────────────────────────────────────

  private doVictory() {
    const totalExp = this.enemies.reduce((s, e) => s + e.exp, 0);
    const totalGold = this.enemies.reduce((s, e) => s + e.gold, 0);
    const levelResult = applyExpGain(this.save, totalExp);
    this.save.stats.hp = this.playerCombatant.hp;
    this.save.stats.mp = this.playerCombatant.mp;
    this.save.gold += totalGold;
    writeSave(this.save);

    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const panel = this.add.rectangle(W/2, H/2, 300, 200, COLORS.PANEL_DARK, 0.97)
      .setStrokeStyle(3, COLORS.BORDER).setDepth(50);

    let msg = `★ 勝利！ ★\n\n${totalExp} EXP 獲得！\n${totalGold} G 獲得！`;
    if (levelResult.leveled) {
      msg += `\n\nレベルアップ！ Lv.${levelResult.newLevel}`;
    }

    this.add.text(W/2, H/2, msg, {
      fontSize: '18px', color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setDepth(51);

    this.time.delayedCall(2800, () => this.endBattle(true, false));
  }

  private doDefeat() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this.add.rectangle(W/2, H/2, 300, 140, COLORS.PANEL_DARK, 0.97)
      .setStrokeStyle(3, 0xCC2222).setDepth(50);
    this.add.text(W/2, H/2, '全滅してしまった…\n\n村へ戻る', {
      fontSize: '18px', color: '#FF8888', align: 'center',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5).setDepth(51);

    this.save.stats.hp = Math.floor(this.save.stats.maxHp / 4);
    this.save.position = { mapId: 'village', tileX: 9, tileY: 13 };
    writeSave(this.save);

    this.time.delayedCall(2500, () => this.endBattle(false, false));
  }

  private endBattle(victory: boolean, ran: boolean) {
    if (this.isMultiplayer && this.isHost) {
      mpManager.endBattle(victory ? 'win' : 'lose');
    }
    const targetMap = ran || victory ? this.returnMap : 'village';
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => {
      this.scene.start('WorldScene', {
        save: this.save,
        isMultiplayer: this.isMultiplayer,
        isHost: this.isHost,
        fromBattle: true,
      });
    });
  }

  // ─── Intro ────────────────────────────────────────────────────────────────

  private playIntro() {
    const W = GAME_WIDTH;
    const enemyNames = this.enemies.map(e => e.name).join('と');
    const text = this.add.text(W/2, 20, `${enemyNames}が\n現れた！`, {
      fontSize: '18px', color: '#FFDDDD',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      align: 'center', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(20);

    // Flash in
    this.tweens.add({
      targets: this.bgOverlay,
      alpha: { from: 1, to: 0 },
      duration: 500,
    });

    this.time.delayedCall(1600, () => {
      text.destroy();
      this.phase = 'command';
      this.log('コマンドを選んでください');
      this.buildCommandMenu();
    });
  }

  // ─── Multiplayer sync ─────────────────────────────────────────────────────

  private setupMpListeners() {
    mpManager.on('battle_round_result', (data: unknown) => {
      const result = data as BattleRoundResult;
      this.processMpResult(result);
    });
  }

  private processMpResult(result: BattleRoundResult) {
    let delay = 0;
    result.results.forEach(r => {
      this.time.delayedCall(delay, () => {
        this.log(r.text);
        if (r.enemyIndex !== undefined && r.damage) {
          this.enemyCombatants[r.enemyIndex].hp = result.enemyHps[r.enemyIndex];
          this.showDamageNumber(r.enemyIndex, r.damage);
          this.updateEnemyHpBar(r.enemyIndex);
        }
        if (r.type === 'enemy_attack' && r.damage) {
          this.playerCombatant.hp = result.playerHps[this.playerCombatant.id] ?? this.playerCombatant.hp;
          this.showPlayerDamage(r.damage);
          this.updatePlayerPanel();
        }
      });
      delay += 1000;
    });

    this.time.delayedCall(delay + 400, () => {
      mpManager.updateHp(this.playerCombatant.hp);
      if (result.battleOver) {
        if (result.victory) { this.phase = 'victory'; this.doVictory(); }
        else if (this.playerCombatant.hp <= 0) { this.phase = 'defeat'; this.doDefeat(); }
        else { this.endBattle(false, true); }
      } else {
        this.phase = 'command';
        this.log('コマンドを選んでください');
        this.buildCommandMenu();
      }
    });
  }
}
