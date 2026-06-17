import type { CharacterSave, EnemyDef } from '../types';
import { COLORS } from '../config';
import { getClassDef } from '../data/characters';
import {
  buildCombatant, buildEnemyCombatant, buildPartyMemberCombatant, resolveAction,
  enemyAI, applyExpGain, type Combatant,
} from '../systems/BattleSystem';
import { effectiveStats } from '../systems/InventorySystem';
import { writeSave } from '../systems/SaveSystem';
import { mpManager } from '../systems/MultiplayerManager';
import { getEnemyCanvas, getHeroCanvas } from '../engine/TextureCache';
import type { BattleRoundResult } from '../types';
import { getActiveCompanions, givePartyExp } from '../systems/PartySystem';

type Phase = 'intro'|'command'|'executing'|'victory'|'defeat';

const FONT = '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag); e.style.cssText = css; return e;
}

export class BattleScreen {
  private root: HTMLElement;
  private save!: CharacterSave;
  private enemies!: EnemyDef[];
  private isMultiplayer = false;
  private isHost = false;
  private returnMap!: string;

  private playerC!: Combatant;
  private companionCs: Combatant[] = [];
  private enemyCs: Combatant[] = [];
  private phase: Phase = 'intro';

  private logEl!: HTMLElement;
  private commandEl!: HTMLElement;
  private playerHpFill!: HTMLElement;
  private playerMpFill!: HTMLElement;
  private playerHpLabel!: HTMLElement;
  private playerMpLabel!: HTMLElement;
  private enemyPanels: { wrap: HTMLElement; hpFill: HTMLElement; hpLabel: HTMLElement }[] = [];
  private companionPanels: { hpFill: HTMLElement; hpLabel: HTMLElement }[] = [];
  private selectedEnemy = 0;
  private targetRings: HTMLElement[] = [];
  private playerMarker!: HTMLElement;

  private onEnd!: (save: CharacterSave, mapId: string) => void;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(container: HTMLElement) {
    this.root = el('div', `
      position:absolute;inset:0;
      display:none;flex-direction:column;
      background:#0a1a44;
      font-family:${FONT};
      overflow:hidden;
    `);
    container.appendChild(this.root);
  }

  start(
    save: CharacterSave,
    enemies: EnemyDef[],
    opts: { isMultiplayer: boolean; isHost: boolean; returnMap: string },
    onEnd: (save: CharacterSave, mapId: string) => void
  ) {
    this.save = save;
    this.enemies = enemies;
    this.isMultiplayer = opts.isMultiplayer;
    this.isHost = opts.isHost;
    this.returnMap = opts.returnMap;
    this.onEnd = onEnd;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.enemyPanels = [];
    this.companionPanels = [];
    this.targetRings = [];

    const stats = effectiveStats(save);
    this.playerC = buildCombatant({ ...save, stats: { ...save.stats, ...stats } });
    this.enemyCs = enemies.map((e, i) => buildEnemyCombatant(e, i));
    this.companionCs = getActiveCompanions(save).map((m, i) => buildPartyMemberCombatant(m, i));
    this.selectedEnemy = this.enemyCs.findIndex(e => e.hp > 0);

    this.buildUI();
    this.root.style.display = 'flex';
    this.phase = 'intro';
    this.updateTargetHighlight();
    this.addBattleFlash();
    this.playIntro();
    if (this.isMultiplayer) this.setupMp();
  }

  private buildUI() {
    this.root.innerHTML = '';

    // ── Sky + ground background ──
    const bg = el('div', `
      position:absolute;inset:0;
      background:linear-gradient(180deg,#0a1a44 50%,#1a0a0a 100%);
    `);
    // Stars
    for (let i = 0; i < 40; i++) {
      const s = el('div','position:absolute;border-radius:50%;');
      s.style.cssText += `
        width:${Math.random()<0.3?2:1}px;height:${Math.random()<0.3?2:1}px;
        left:${Math.random()*100}%;top:${Math.random()*45}%;
        background:rgba(255,255,255,${0.3+Math.random()*0.7});
      `;
      bg.appendChild(s);
    }
    this.root.appendChild(bg);

    // ── Enemy area ──
    const enemyArea = el('div','position:relative;z-index:1;flex:0 0 38%;display:flex;align-items:center;justify-content:center;gap:24px;');
    const count = this.enemies.length;
    this.enemies.forEach((enemy, i) => {
      const wrap = el('div','display:flex;flex-direction:column;align-items:center;gap:6px;');

      // Selection ring
      wrap.style.position = 'relative';
      const ring = el('div', 'position:absolute;inset:-4px;border:2px solid #FFD700;border-radius:8px;display:none;pointer-events:none;');
      wrap.appendChild(ring);
      this.targetRings.push(ring);

      // Click to select
      wrap.style.cursor = 'pointer';
      wrap.style.pointerEvents = 'auto';
      wrap.addEventListener('click', () => {
        if (this.phase !== 'command') return;
        if (this.enemyCs[i]?.hp > 0) { this.selectedEnemy = i; this.updateTargetHighlight(); }
      });

      const nameEl = el('div',`color:#FFDDDD;font-size:12px;text-align:center;text-shadow:0 1px 3px #000;`);
      nameEl.textContent = enemy.name;

      // Enemy sprite canvas (scale × 1.2)
      const src = getEnemyCanvas(enemy.sprite);
      const cvs = el('canvas','') as HTMLCanvasElement;
      cvs.width = 80; cvs.height = 80;
      cvs.style.cssText = `width:${Math.floor(80/count*1.8)}px;height:${Math.floor(80/count*1.8)}px;image-rendering:pixelated;`;
      const cc = cvs.getContext('2d')!;
      cc.drawImage(src, 0, 0);

      const hpTrack = el('div','width:70px;height:7px;background:rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;');
      const hpFill = el('div','height:100%;background:#dd3322;border-radius:4px;transition:width 0.3s;width:100%;');
      const hpLabel = el('div','font-size:9px;color:#FFAAAA;font-family:monospace;');
      hpLabel.textContent = `HP ${enemy.hp}`;
      hpTrack.appendChild(hpFill);

      // Float animation
      let t = i * 0.4;
      const animFloat = () => {
        t += 0.016;
        cvs.style.marginTop = `${Math.sin(t*1.5)*5}px`;
        requestAnimationFrame(animFloat);
      };
      requestAnimationFrame(animFloat);

      wrap.appendChild(nameEl);
      wrap.appendChild(cvs);
      wrap.appendChild(hpTrack);
      wrap.appendChild(hpLabel);
      enemyArea.appendChild(wrap);
      this.enemyPanels.push({ wrap, hpFill, hpLabel });
    });
    this.root.appendChild(enemyArea);

    // ── Horizon line ──
    const horizon = el('div','position:relative;z-index:1;height:2px;background:rgba(68,34,34,0.7);flex-shrink:0;');
    this.root.appendChild(horizon);

    // ── Party sprites (DQ Monsters style) ──
    const ci = Math.max(0, ['戦士','魔法使い','回復師','盗賊'].indexOf(this.save.className));
    this.playerMarker = el('div', `
      position:absolute;
      bottom:128px;left:50%;transform:translateX(-50%);
      z-index:5;pointer-events:none;
      display:flex;gap:6px;align-items:flex-end;
      transition:transform 0.18s ease-in, opacity 0.18s;
    `);

    // Companion sprites (left of hero, smaller)
    for (const comp of this.companionCs) {
      const memberId = comp.id.replace('party_', '');
      const member = this.save.party.find(p => p.id === memberId);
      const compCi = Math.max(0, ['戦士','魔法使い','回復師','盗賊'].indexOf(member?.className ?? '戦士'));
      const compCvs = document.createElement('canvas');
      compCvs.width = 32; compCvs.height = 32;
      compCvs.style.cssText = 'width:54px;height:54px;image-rendering:pixelated;';
      const cc2 = compCvs.getContext('2d')!;
      cc2.drawImage(getHeroCanvas(compCi), 6*32, 0, 32, 32, 0, 0, 32, 32);
      this.playerMarker.appendChild(compCvs);
    }

    // Hero sprite (main, facing enemies = frame 6 = up-facing)
    const heroCvs = document.createElement('canvas');
    heroCvs.width = 32; heroCvs.height = 32;
    heroCvs.style.cssText = 'width:72px;height:72px;image-rendering:pixelated;';
    const hcc = heroCvs.getContext('2d')!;
    hcc.drawImage(getHeroCanvas(ci), 6*32, 0, 32, 32, 0, 0, 32, 32);
    this.playerMarker.appendChild(heroCvs);

    this.root.appendChild(this.playerMarker);

    // ── Player panel ──
    const panel = el('div',`
      position:relative;z-index:1;
      flex:0 0 auto;padding:10px 12px 6px;
      background:rgba(10,10,30,0.95);
      border-top:1px solid rgba(212,175,55,0.4);
    `);

    const nameRow = el('div','display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;');
    const nameLabel = el('div',`color:#FFD700;font-size:13px;font-family:${FONT};`);
    nameLabel.textContent = `${this.save.name} (${this.save.className}) Lv.${this.save.level}`;
    nameRow.appendChild(nameLabel);
    panel.appendChild(nameRow);

    const bars = el('div','display:flex;gap:12px;margin-bottom:6px;');
    const hpRow = this.makeBarRow('#44FF88','HP',this.playerC.hp,this.playerC.maxHp);
    const mpRow = this.makeBarRow('#6688FF','MP',this.playerC.mp,this.playerC.maxMp);
    this.playerHpFill  = hpRow.fill;
    this.playerMpFill  = mpRow.fill;
    this.playerHpLabel = hpRow.label;
    this.playerMpLabel = mpRow.label;
    bars.appendChild(hpRow.row);
    bars.appendChild(mpRow.row);
    panel.appendChild(bars);

    // ── Companion HP bars ──
    if (this.companionCs.length > 0) {
      const compArea = el('div','margin-bottom:6px;display:flex;flex-direction:column;gap:3px;');
      this.companionPanels = [];
      this.companionCs.forEach(comp => {
        const row = el('div','display:flex;align-items:center;gap:6px;');
        const nameLbl = el('div',`color:#BBDDFF;font-size:10px;font-family:monospace;min-width:60px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;`);
        nameLbl.textContent = comp.name;
        const track = el('div','flex:1;height:4px;background:rgba(255,255,255,0.15);border-radius:3px;overflow:hidden;');
        const fill = el('div','height:100%;background:#44AAFF;border-radius:3px;width:100%;transition:width 0.3s;');
        const hpLbl = el('div','font-size:9px;color:#AACCFF;font-family:monospace;min-width:50px;text-align:right;');
        hpLbl.textContent = `${comp.hp}/${comp.maxHp}`;
        track.appendChild(fill);
        row.appendChild(nameLbl);
        row.appendChild(track);
        row.appendChild(hpLbl);
        compArea.appendChild(row);
        this.companionPanels.push({ hpFill: fill, hpLabel: hpLbl });
      });
      panel.appendChild(compArea);
    }

    // ── Log ──
    this.logEl = el('div',`color:#FFFDE7;font-size:13px;min-height:36px;line-height:1.4;font-family:${FONT};`);
    panel.appendChild(this.logEl);

    // ── Command area ──
    this.commandEl = el('div','margin-top:6px;');
    panel.appendChild(this.commandEl);

    this.root.appendChild(panel);
  }

  private makeBarRow(color: string, label: string, cur: number, max: number) {
    const row   = el('div','display:flex;flex-direction:column;flex:1;gap:2px;');
    const lbl   = el('div',`font-size:10px;color:${color};font-family:monospace;`);
    lbl.textContent = `${label} ${cur}/${max}`;
    const track = el('div','height:5px;background:rgba(255,255,255,0.15);border-radius:3px;overflow:hidden;');
    const fill  = el('div',`height:100%;background:${color};border-radius:3px;width:${(cur/max*100).toFixed(1)}%;`);
    track.appendChild(fill);
    row.appendChild(lbl); row.appendChild(track);
    return { row, fill, label: lbl };
  }

  // ─── Battle flash transition ────────────────────────────────────────────────

  private addBattleFlash() {
    const flash = el('div', 'position:absolute;inset:0;background:#fff;z-index:50;pointer-events:none;opacity:1;');
    this.root.appendChild(flash);
    requestAnimationFrame(() => {
      flash.style.transition = 'opacity 0.38s ease-out';
      requestAnimationFrame(() => { flash.style.opacity = '0'; });
    });
    setTimeout(() => flash.remove(), 450);
  }

  // ─── Log ────────────────────────────────────────────────────────────────────

  private log(msg: string) { this.logEl.textContent = msg; }

  // ─── Intro ──────────────────────────────────────────────────────────────────

  private playIntro() {
    const names = this.enemies.map(e=>e.name).join('と');
    this.log(`${names}が\n現れた！`);
    this.delay(1400, () => {
      this.phase = 'command';
      this.log('コマンドを選んでください');
      this.buildCommandMenu();
    });
  }

  // ─── Command menu ────────────────────────────────────────────────────────────

  private buildCommandMenu() {
    this.commandEl.innerHTML = '';
    const cmds = [['⚔ 攻撃','attack'],['✨ 魔法','magic'],['💊 アイテム','item'],['🏃 逃げる','run']] as const;
    const grid = el('div','display:grid;grid-template-columns:1fr 1fr;gap:6px;');
    cmds.forEach(([label,type]) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = `
        padding:8px 4px;background:rgba(26,26,46,0.9);
        color:#FFFDE7;border:1px solid rgba(51,68,102,0.7);
        border-radius:3px;font-size:13px;font-family:${FONT};
        cursor:pointer;pointer-events:auto;
      `;
      b.addEventListener('click', () => {
        if (this.phase !== 'command') return;
        if (type==='attack') this.executeAction('attack');
        else if (type==='magic')  this.buildSkillMenu();
        else if (type==='item')   this.buildItemMenu();
        else if (type==='run')    this.executeAction('run');
      });
      grid.appendChild(b);
    });
    this.commandEl.appendChild(grid);
    this.updateTargetHighlight();
  }

  private buildSkillMenu() {
    this.commandEl.innerHTML = '';
    const cls = getClassDef(this.save.className);
    const skills = cls.skills.filter(s => s.level <= this.save.level);
    if (!skills.length) {
      this.log('まだ使える魔法がない！');
      this.delay(1000, () => { this.log('コマンドを選んでください'); this.buildCommandMenu(); });
      return;
    }
    const list = el('div','display:flex;flex-direction:column;gap:4px;');
    const back = document.createElement('button');
    back.textContent='← 戻る';
    back.style.cssText=`margin-bottom:4px;padding:4px 10px;background:transparent;color:#8888AA;border:none;font-size:12px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    back.addEventListener('click',()=>{ this.log('コマンドを選んでください'); this.buildCommandMenu(); });
    list.appendChild(back);
    skills.forEach(s => {
      const b = document.createElement('button');
      b.textContent=`${s.name}  MP${s.mpCost}`;
      b.style.cssText=`padding:6px 8px;background:rgba(16,16,30,0.9);color:#FFFDE7;border:1px solid rgba(51,68,102,0.7);border-radius:3px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;text-align:left;`;
      b.addEventListener('click', () => {
        if (this.playerC.mp < s.mpCost) { this.log('MPが足りない！'); return; }
        this.executeAction('magic', s.name);
      });
      list.appendChild(b);
    });
    this.commandEl.appendChild(list);
  }

  private buildItemMenu() {
    this.commandEl.innerHTML = '';
    const list = el('div','display:flex;flex-direction:column;gap:4px;');
    const back = document.createElement('button');
    back.textContent='← 戻る';
    back.style.cssText=`margin-bottom:4px;padding:4px 10px;background:transparent;color:#8888AA;border:none;font-size:12px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    back.addEventListener('click',()=>{ this.log('コマンドを選んでください'); this.buildCommandMenu(); });
    list.appendChild(back);
    const inv = this.save.inventory.slice(0,5);
    if (!inv.length) {
      const msg=el('div','color:#555577;font-size:13px;padding:6px;font-family:'+FONT+';');
      msg.textContent='アイテムがない';
      list.appendChild(msg);
    } else {
      inv.forEach(entry => {
        const b=document.createElement('button');
        b.textContent=`${entry.itemId} ×${entry.qty}`;
        b.style.cssText=`padding:6px 8px;background:rgba(16,16,30,0.9);color:#FFFDE7;border:1px solid rgba(51,68,102,0.7);border-radius:3px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;text-align:left;`;
        b.addEventListener('click',()=>this.executeAction('item',undefined,entry.itemId));
        list.appendChild(b);
      });
    }
    this.commandEl.appendChild(list);
  }

  // ─── Battle logic ───────────────────────────────────────────────────────────

  private executeAction(type: 'attack'|'magic'|'item'|'run', spellName?: string, itemId?: string) {
    if (this.phase !== 'command') return;
    this.phase = 'executing';
    this.commandEl.innerHTML = '';

    if (this.isMultiplayer) {
      mpManager.submitAction({ type, targetIndex: this.selectedEnemy, spellId: spellName, itemId });
      this.log('行動を送信中…');
      return;
    }

    const target = this.enemyCs[this.selectedEnemy];
    const action = { actorId: this.playerC.id, type, targetId: target?.id, spellName, itemId };

    const doResolve = () => {
      const result = resolveAction(this.playerC, action, target ?? this.playerC);
      this.log(result.text);
      if (result.damage) this.showDmg(this.selectedEnemy, result.damage, false);
      this.refreshEnemyBar(this.selectedEnemy);
      this.refreshPlayerBar();

      // Auto-switch target to next living enemy
      if (this.enemyCs[this.selectedEnemy]?.hp <= 0) {
        const next = this.enemyCs.findIndex(e => e.hp > 0);
        if (next >= 0) { this.selectedEnemy = next; this.updateTargetHighlight(); }
      }

      if (type === 'run') { this.delay(800, () => this.finish(false, true)); return; }

      this.delay(900, () => {
        if (this.enemyCs.every(e => e.hp <= 0)) { this.doVictory(); return; }
        this.doCompanionTurns(() => {
          if (this.enemyCs.every(e => e.hp <= 0)) { this.doVictory(); return; }
          this.doEnemyTurns();
        });
      });
    };

    if ((type === 'attack' || type === 'magic') && target && target.hp > 0) {
      this.animateStepIn(this.selectedEnemy, type === 'magic').then(doResolve);
    } else {
      doResolve();
    }
  }

  // ─── Step-in animation ──────────────────────────────────────────────────────

  private animateStepIn(enemyIndex: number, isMagic: boolean): Promise<void> {
    return new Promise(resolve => {
      const panel = this.enemyPanels[enemyIndex];
      if (!panel || !this.playerMarker) { resolve(); return; }

      const rootRect = this.root.getBoundingClientRect();
      const enemyRect = panel.wrap.getBoundingClientRect();

      const dx = enemyRect.left - rootRect.left + enemyRect.width/2 - rootRect.width/2;
      const dy = -(rootRect.height - 130 - (rootRect.height - (enemyRect.top - rootRect.top) - enemyRect.height/2));

      // Step toward enemy
      this.playerMarker.style.transition = 'transform 0.18s ease-in';
      this.playerMarker.style.transform = `translateX(calc(-50% + ${dx}px)) translateY(${dy * 0.7}px)`;

      setTimeout(() => {
        // Flash enemy red
        panel.wrap.style.filter = 'brightness(3) saturate(0) sepia(1) hue-rotate(-10deg)';

        // Shake
        panel.wrap.style.transition = 'transform 0.05s';
        panel.wrap.style.transform = 'translateX(-8px)';
        setTimeout(() => panel.wrap.style.transform = 'translateX(8px)', 60);
        setTimeout(() => panel.wrap.style.transform = 'translateX(-5px)', 120);
        setTimeout(() => { panel.wrap.style.transform = 'translateX(0)'; panel.wrap.style.filter = ''; }, 200);

        // For magic: shoot a projectile
        if (isMagic) {
          const orb = el('div', `
            position:absolute;width:14px;height:14px;border-radius:50%;
            background:#AACCFF;box-shadow:0 0 12px #88AAFF;
            pointer-events:none;z-index:15;
            transition:all 0.15s linear;
          `);
          const px = rootRect.width/2 - 7;
          const py = rootRect.height - 130 - 26;
          orb.style.left = px + 'px';
          orb.style.top = py + 'px';
          this.root.appendChild(orb);
          requestAnimationFrame(() => {
            orb.style.left = (enemyRect.left - rootRect.left + enemyRect.width/2 - 7) + 'px';
            orb.style.top = (enemyRect.top - rootRect.top + enemyRect.height/2 - 7) + 'px';
          });
          setTimeout(() => orb.remove(), 200);
        }

        // Step back
        setTimeout(() => {
          this.playerMarker.style.transition = 'transform 0.15s ease-out';
          this.playerMarker.style.transform = 'translateX(-50%)';
          setTimeout(resolve, 180);
        }, 220);
      }, 200);
    });
  }

  private doCompanionTurns(onDone: () => void) {
    const livingCompanions = this.companionCs.filter(c => c.hp > 0);
    if (!livingCompanions.length) { onDone(); return; }

    let d = 0;
    livingCompanions.forEach(comp => {
      this.delay(d, () => {
        const livingEnemies = this.enemyCs.filter(e => e.hp > 0);
        if (!livingEnemies.length) return;
        const target = livingEnemies[0];

        // 30%の確率でスキルを使う
        const cls = getClassDef(comp.isEnemy ? '戦士' : (() => {
          // Find className from save
          const m = this.save.party.find(p => `party_${p.id}` === comp.id);
          return m ? m.className : '戦士';
        })());
        const availableSkills = cls.skills.filter(s => s.level <= (this.save.party.find(p => `party_${p.id}` === comp.id)?.level ?? 1));
        const useSkill = availableSkills.length > 0 && Math.random() < 0.3 && comp.mp >= availableSkills[0].mpCost;

        let result;
        if (useSkill) {
          const skill = availableSkills[0];
          result = resolveAction(comp, { actorId: comp.id, type: 'magic', targetId: target.id, spellName: skill.name }, target);
        } else {
          result = resolveAction(comp, { actorId: comp.id, type: 'attack', targetId: target.id }, target);
        }
        this.log(result.text);
        const ei = this.enemyCs.indexOf(target);
        if (result.damage && ei >= 0) this.showDmg(ei, result.damage, false);
        this.refreshEnemyBar(ei);
      });
      d += 650;
    });

    this.delay(d + 200, onDone);
  }

  private doEnemyTurns() {
    const living = this.enemyCs.filter(e => e.hp > 0);
    const alliedTargets = [this.playerC, ...this.companionCs.filter(c => c.hp > 0)];
    let d = 0;
    living.forEach(enemy => {
      this.delay(d, () => {
        const action = enemyAI(enemy, alliedTargets);
        const target = alliedTargets.find(t => t.id === action.targetId) ?? this.playerC;
        const result = resolveAction(enemy, action, target);
        this.log(result.text);
        if (result.damage) {
          if (target.id === this.playerC.id) {
            this.showDmg(-1, result.damage, true);
            this.save.stats.hp = this.playerC.hp;
            this.refreshPlayerBar();
          } else {
            // 仲間がダメージを受けた場合
            const ci = this.companionCs.indexOf(target);
            if (ci >= 0) this.refreshCompanionBar(ci);
            // sync hp back to save
            const m = this.save.party.find(p => `party_${p.id}` === target.id);
            if (m) m.stats.hp = target.hp;
          }
        }
      });
      d += 750;
    });
    this.delay(d + 350, () => {
      if (this.playerC.hp <= 0) { this.doDefeat(); return; }
      this.phase = 'command';
      this.log('コマンドを選んでください');
      this.buildCommandMenu();
    });
  }

  // ─── HP bar updates ─────────────────────────────────────────────────────────

  private refreshEnemyBar(i: number) {
    const p = this.enemyPanels[i];
    const e = this.enemyCs[i];
    if (!p) return;
    const pct = Math.max(0, e.hp / e.maxHp) * 100;
    p.hpFill.style.width = pct + '%';
    p.hpFill.style.background = pct > 50 ? '#dd3322' : '#ff5500';
    p.hpLabel.textContent = `HP ${e.hp}`;
    if (e.hp <= 0) {
      p.wrap.style.opacity = '0';
      p.wrap.style.pointerEvents = 'none';
    }
  }

  private refreshCompanionBar(i: number) {
    const p = this.companionPanels[i];
    const c = this.companionCs[i];
    if (!p || !c) return;
    const pct = Math.max(0, c.hp / c.maxHp) * 100;
    p.hpFill.style.width = pct + '%';
    p.hpFill.style.background = pct < 25 ? '#FF4444' : '#44AAFF';
    p.hpLabel.textContent = `${c.hp}/${c.maxHp}`;
  }

  private refreshPlayerBar() {
    const p = this.playerC;
    const hp = Math.max(0, p.hp/p.maxHp)*100;
    const mp = Math.max(0, p.mp/p.maxMp)*100;
    this.playerHpFill.style.width = hp + '%';
    this.playerHpFill.style.background = hp<25 ? '#FF4444':'#44FF88';
    this.playerMpFill.style.width = mp + '%';
    this.playerHpLabel.textContent = `HP ${p.hp}/${p.maxHp}`;
    this.playerMpLabel.textContent = `MP ${p.mp}/${p.maxMp}`;
  }

  // ─── Target highlight ───────────────────────────────────────────────────────

  private updateTargetHighlight() {
    this.targetRings.forEach((ring, i) => {
      ring.style.display = (i === this.selectedEnemy && this.enemyCs[i]?.hp > 0) ? 'block' : 'none';
    });
  }

  // ─── Floating damage numbers ─────────────────────────────────────────────────

  private showDmg(enemyIndex: number, dmg: number, toPlayer: boolean) {
    const num = el('div',`
      position:absolute;pointer-events:none;
      font-size:22px;font-family:monospace;font-weight:bold;
      text-shadow:0 1px 4px #000;
      transition:opacity 0.8s, top 0.8s;
    `);
    num.textContent = `-${dmg}`;
    num.style.color = toPlayer ? '#FF8888' : '#FF4444';
    const panel = this.enemyPanels[enemyIndex];
    const rect = (panel ? panel.wrap : this.root).getBoundingClientRect();
    const rootRect = this.root.getBoundingClientRect();
    num.style.left = (rect.left - rootRect.left + rect.width/2 - 20) + 'px';
    num.style.top  = (rect.top  - rootRect.top + 10) + 'px';
    this.root.appendChild(num);
    requestAnimationFrame(() => {
      num.style.top = (parseFloat(num.style.top) - 40) + 'px';
      num.style.opacity = '0';
    });
    setTimeout(() => num.remove(), 900);
  }

  // ─── Victory / Defeat ───────────────────────────────────────────────────────

  private doVictory() {
    this.phase = 'victory';
    const totalExp  = this.enemies.reduce((s,e) => s+e.exp,  0);
    const totalGold = this.enemies.reduce((s,e) => s+e.gold, 0);
    const levelResult = applyExpGain(this.save, totalExp);
    const partyLevelUps = givePartyExp(this.save, totalExp);
    this.save.stats.hp = this.playerC.hp;
    this.save.stats.mp = this.playerC.mp;
    this.save.gold += totalGold;
    writeSave(this.save);

    let msg = `★ 勝利！ ★\n\n${totalExp} EXP 獲得！\n${totalGold} G 獲得！`;
    if (levelResult.leveled) msg += `\n\n${this.save.name} レベルアップ！ Lv.${levelResult.newLevel}`;
    for (const lu of partyLevelUps) {
      msg += `\n${lu.name} レベルアップ！ Lv.${lu.newLevel}`;
    }
    this.showModal(msg, '#FFD700');
    this.delay(2800, () => this.finish(true, false));
  }

  private doDefeat() {
    this.phase = 'defeat';
    this.save.stats.hp = Math.max(1, Math.floor(this.save.stats.maxHp/4));
    this.save.position = { mapId: 'village', tileX: 9, tileY: 13 };
    writeSave(this.save);
    this.showModal('全滅してしまった…\n\n村へ戻る', '#FF8888');
    this.delay(2500, () => this.finish(false, false));
  }

  private showModal(msg: string, color: string) {
    const modal = el('div',`
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%);
      background:rgba(10,10,30,0.97);
      border:2px solid ${color};border-radius:8px;
      padding:24px 28px;text-align:center;
      color:${color};font-size:16px;font-family:${FONT};
      white-space:pre-line;line-height:1.7;
      pointer-events:none;
    `);
    modal.textContent = msg;
    this.root.appendChild(modal);
  }

  private finish(victory: boolean, ran: boolean) {
    if (this.isMultiplayer && this.isHost) {
      mpManager.endBattle(victory ? 'win' : 'lose');
    }
    const map = victory || ran ? this.returnMap : 'village';
    this.root.style.display = 'none';
    this.onEnd(this.save, map);
  }

  // ─── Multiplayer ────────────────────────────────────────────────────────────

  private setupMp() {
    mpManager.on('battle_round_result', (data: unknown) => {
      const r = data as BattleRoundResult;
      this.processMpResult(r);
    });
  }

  private processMpResult(result: BattleRoundResult) {
    let d = 0;
    result.results.forEach(r => {
      this.delay(d, () => {
        this.log(r.text);
        if (r.enemyIndex !== undefined && r.damage) {
          this.enemyCs[r.enemyIndex].hp = result.enemyHps[r.enemyIndex];
          this.showDmg(r.enemyIndex, r.damage, false);
          this.refreshEnemyBar(r.enemyIndex);
        }
        if (r.type==='enemy_attack' && r.damage) {
          this.playerC.hp = result.playerHps[this.playerC.id] ?? this.playerC.hp;
          this.showDmg(-1, r.damage, true);
          this.refreshPlayerBar();
        }
      });
      d += 900;
    });
    this.delay(d+300, () => {
      mpManager.updateHp(this.playerC.hp);
      if (result.battleOver) {
        if (result.victory) this.doVictory();
        else if (this.playerC.hp<=0) this.doDefeat();
        else this.finish(false, true);
      } else {
        this.phase='command';
        this.log('コマンドを選んでください');
        this.buildCommandMenu();
      }
    });
  }

  private delay(ms: number, fn: ()=>void) {
    this.timers.push(setTimeout(fn, ms));
  }

  hide() { this.root.style.display = 'none'; }
}
