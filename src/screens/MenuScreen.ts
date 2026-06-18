import type { CharacterSave, PartyMember } from '../types';
import type { Equipment, ClassName } from '../types';
import { ITEMS } from '../data/items';
import { ENEMIES } from '../data/enemies';
import { CLASS_DEFS, calcStats } from '../data/characters';
import { TREASURE_MAPS, BOSS_LEVEL_THRESHOLDS, getBossDropRate } from '../data/treasureMaps';
import { effectiveStats, equipItem, unequipSlot, memberEquipItem, memberUnequipSlot } from '../systems/InventorySystem';
import { writeSave } from '../systems/SaveSystem';
import { setActive, setBench, MAX_ACTIVE_COMPANIONS } from '../systems/PartySystem';
import type { MapId } from '../types';

type Tab = 'status'|'equipment'|'items'|'party'|'field'|'book'|'job'|'maps';
type EquipTarget = 'hero' | string; // 'hero' or member.id

const FONT = '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';

export class MenuScreen {
  private root: HTMLElement;
  private content!: HTMLElement;
  private tab: Tab = 'status';
  private equipTarget: EquipTarget = 'hero';
  private save!: CharacterSave;
  private onClose!: (save: CharacterSave) => void;
  private onFieldAction?: (action: string) => void;
  private onOpenGacha?: () => void;
  private onOpenCraft?: () => void;
  private onEnterMap?: (mapId: MapId) => void;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.style.cssText = `
      position:absolute;inset:0;
      background:rgba(0,0,0,0.7);
      display:none;align-items:center;justify-content:center;
      pointer-events:auto;
    `;
    container.appendChild(this.root);
    this.root.addEventListener('click', e => { if (e.target===this.root) this.close(); });
  }

  open(save: CharacterSave, onClose: (save: CharacterSave)=>void, onFieldAction?: (action: string) => void,
       onOpenGacha?: () => void, onOpenCraft?: () => void, onEnterMap?: (mapId: MapId) => void) {
    this.save = save;
    this.onClose = onClose;
    this.onFieldAction = onFieldAction;
    this.onOpenGacha = onOpenGacha;
    this.onOpenCraft = onOpenCraft;
    this.onEnterMap = onEnterMap;
    this.tab = 'status';
    this.render();
    this.root.style.display = 'flex';
  }

  private render() {
    this.root.innerHTML = '';
    const panel = document.createElement('div');
    panel.style.cssText = `
      background:rgba(10,10,30,0.97);
      border:2px solid rgba(212,175,55,0.6);
      border-radius:8px;
      width:calc(100% - 24px);max-width:340px;
      max-height:85vh;overflow:hidden;
      display:flex;flex-direction:column;
      font-family:${FONT};
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText='display:flex;align-items:center;padding:10px 14px 0;justify-content:space-between;';
    const title = document.createElement('div');
    title.style.cssText='color:#FFD700;font-size:18px;';
    title.textContent='メニュー';
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText='background:none;border:none;color:#AAAACC;font-size:20px;cursor:pointer;padding:0 4px;pointer-events:auto;';
    closeBtn.textContent='✕';
    closeBtn.addEventListener('click',()=>this.close());
    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Tabs
    const tabBar = document.createElement('div');
    tabBar.style.cssText='display:flex;gap:4px;padding:8px 12px 0;';
    const tabs: {id:Tab;label:string}[] = [{id:'status',label:'ステータス'},{id:'equipment',label:'装備'},{id:'items',label:'アイテム'},{id:'party',label:'パーティ'},{id:'job',label:'転職'},{id:'maps',label:'地図'},{id:'field',label:'フィールド'},{id:'book',label:'図鑑'}];
    tabs.forEach(t => {
      const b = document.createElement('button');
      const active = t.id===this.tab;
      b.textContent=t.label;
      b.style.cssText=`
        flex:1;padding:6px 4px;font-size:12px;font-family:${FONT};cursor:pointer;pointer-events:auto;
        background:${active?'rgba(51,68,136,0.9)':'rgba(16,16,30,0.9)'};
        color:${active?'#FFD700':'#AAAACC'};
        border:1px solid ${active?'rgba(212,175,55,0.6)':'rgba(51,68,102,0.5)'};
        border-radius:3px;
      `;
      b.addEventListener('click',()=>{this.tab=t.id;this.render();});
      tabBar.appendChild(b);
    });
    panel.appendChild(tabBar);

    // Divider
    const div=document.createElement('div');
    div.style.cssText='height:1px;background:rgba(212,175,55,0.2);margin:8px 12px 0;';
    panel.appendChild(div);

    // Content
    this.content = document.createElement('div');
    this.content.style.cssText='overflow-y:auto;padding:10px 14px 14px;flex:1;';
    panel.appendChild(this.content);

    this.root.appendChild(panel);

    if (this.tab==='status')    this.buildStatus();
    else if (this.tab==='equipment') this.buildEquipment();
    else if (this.tab==='items') this.buildItems();
    else if (this.tab==='party') this.buildParty();
    else if (this.tab==='job')   this.buildJob();
    else if (this.tab==='maps')  this.buildMaps();
    else if (this.tab==='field') this.buildField();
    else this.buildBook();
  }

  private buildStatus() {
    const stats = effectiveStats(this.save);
    const rows: [string,string][] = [
      ['名前',this.save.name],['職業',this.save.className],
      ['レベル',String(this.save.level)],['経験値',String(this.save.exp)],
      ['HP',`${stats.hp}/${stats.maxHp}`],['MP',`${stats.mp}/${stats.maxMp}`],
      ['攻撃力',String(stats.atk)],['防御力',String(stats.def)],
      ['魔力',String(stats.mag)],['素早さ',String(stats.spd)],
      ['ゴールド',`${this.save.gold} G`],
    ];
    const grid = document.createElement('div');
    grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px 0;';
    rows.forEach(([label,value])=>{
      const row=document.createElement('div');
      row.style.cssText='display:flex;justify-content:space-between;padding:4px 6px;background:rgba(255,255,255,0.04);border-radius:3px;';
      row.innerHTML=`<span style="color:#AAAACC;font-size:12px;">${label}</span><span style="color:#FFFDE7;font-size:12px;">${value}</span>`;
      grid.appendChild(row);
    });
    this.content.appendChild(grid);
  }

  private buildEquipment() {
    // ─── Character selector ───────────────────────────────────────────────────
    const allChars: { id: EquipTarget; name: string }[] = [
      { id: 'hero', name: this.save.name },
      ...this.save.party.map(m => ({ id: m.id, name: m.name })),
    ];

    // Validate equipTarget still exists (party member may have been removed)
    if (this.equipTarget !== 'hero' && !this.save.party.find(m => m.id === this.equipTarget)) {
      this.equipTarget = 'hero';
    }

    const selectorRow = document.createElement('div');
    selectorRow.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;';
    allChars.forEach(({ id, name }) => {
      const b = document.createElement('button');
      const active = id === this.equipTarget;
      b.textContent = name;
      b.style.cssText = `
        padding:5px 10px;font-size:11px;font-family:${FONT};cursor:pointer;pointer-events:auto;
        background:${active ? 'rgba(51,68,136,0.9)' : 'rgba(16,16,30,0.9)'};
        color:${active ? '#FFD700' : '#AAAACC'};
        border:1px solid ${active ? 'rgba(212,175,55,0.6)' : 'rgba(51,68,102,0.5)'};
        border-radius:3px;white-space:nowrap;
      `;
      b.addEventListener('click', () => { this.equipTarget = id; this.render(); });
      selectorRow.appendChild(b);
    });
    this.content.appendChild(selectorRow);

    // ─── Determine current equipment and equip/unequip callbacks ─────────────
    const member: PartyMember | null =
      this.equipTarget === 'hero' ? null
      : this.save.party.find(m => m.id === this.equipTarget) ?? null;

    const getCurrentEquip = (key: keyof Equipment): string | null =>
      member ? member.equipment[key] : this.save.equipment[key];

    const doUnequip = (key: keyof Equipment) => {
      if (member) memberUnequipSlot(this.save, member, key);
      else unequipSlot(this.save, key);
      writeSave(this.save);
      this.render();
    };

    const doEquip = (itemId: string) => {
      if (member) memberEquipItem(this.save, member, itemId);
      else equipItem(this.save, itemId);
      writeSave(this.save);
      this.render();
    };

    // ─── Equipment slots ──────────────────────────────────────────────────────
    const slots: {key:keyof Equipment;label:string}[] = [
      {key:'weapon',label:'武器'},{key:'armor',label:'防具'},
      {key:'helmet',label:'兜'},{key:'accessory',label:'アクセ'},
    ];
    slots.forEach(({key,label})=>{
      const equippedId = getCurrentEquip(key);
      const item = equippedId ? ITEMS.find(i=>i.id===equippedId) : null;
      const row = document.createElement('div');
      row.style.cssText='display:flex;align-items:center;padding:8px 6px;background:rgba(255,255,255,0.04);border-radius:4px;margin-bottom:6px;';
      const labelEl=document.createElement('div');
      labelEl.style.cssText='color:#AAAACC;font-size:11px;min-width:36px;';
      labelEl.textContent=label;
      const nameEl=document.createElement('div');
      nameEl.style.cssText='color:'+(item?'#FFFDE7':'#444466')+';font-size:13px;flex:1;';
      nameEl.textContent=item?item.name:'─ 未装備 ─';
      row.appendChild(labelEl);
      row.appendChild(nameEl);
      if(equippedId){
        const unBtn=document.createElement('button');
        unBtn.textContent='外す';
        unBtn.style.cssText='background:none;border:1px solid rgba(255,100,100,0.5);color:#FF8888;font-size:11px;padding:3px 8px;border-radius:3px;cursor:pointer;pointer-events:auto;font-family:'+FONT+';';
        unBtn.addEventListener('click', () => doUnequip(key));
        row.appendChild(unBtn);
      }
      this.content.appendChild(row);
    });

    // ─── Inventory: equippable items ──────────────────────────────────────────
    const sep=document.createElement('div');
    sep.style.cssText='color:#AAAACC;font-size:11px;text-align:center;margin:10px 0 6px;';
    sep.textContent='─── 所持品から装備 ───';
    this.content.appendChild(sep);

    const equippables = this.save.inventory.filter(entry=>{
      const item=ITEMS.find(i=>i.id===entry.itemId);
      return item&&item.type!=='consumable';
    });
    if(!equippables.length){
      const empty=document.createElement('div');
      empty.style.cssText='color:#444466;font-size:12px;text-align:center;padding:8px;';
      empty.textContent='装備できるアイテムがない';
      this.content.appendChild(empty);
    } else {
      equippables.forEach(entry=>{
        const item=ITEMS.find(i=>i.id===entry.itemId)!;
        const row=document.createElement('div');
        row.style.cssText='display:flex;align-items:center;padding:7px 6px;background:rgba(255,255,255,0.04);border-radius:4px;margin-bottom:4px;cursor:pointer;pointer-events:auto;';
        const typeLabel = item.type === 'weapon' ? '武' : item.type === 'armor' ? '防' : item.type === 'helmet' ? '兜' : 'アク';
        row.innerHTML=`
          <div style="color:#888899;font-size:10px;min-width:22px;font-family:${FONT};">[${typeLabel}]</div>
          <div style="color:#FFFDE7;font-size:13px;flex:1;font-family:${FONT};">${item.name}</div>
          <div style="color:#AAAACC;font-size:10px;font-family:monospace;">×${entry.qty}</div>
        `;
        row.addEventListener('click', () => doEquip(entry.itemId));
        this.content.appendChild(row);
      });
    }
  }

  private buildItems() {
    if(!this.save.inventory.length){
      const empty=document.createElement('div');
      empty.style.cssText='color:#444466;font-size:14px;text-align:center;padding:20px;font-family:'+FONT+';';
      empty.textContent='アイテムを持っていない';
      this.content.appendChild(empty);
      return;
    }
    this.save.inventory.forEach(entry=>{
      const item=ITEMS.find(i=>i.id===entry.itemId);
      if(!item) return;
      const row=document.createElement('div');
      row.style.cssText='padding:8px 6px;background:rgba(255,255,255,0.04);border-radius:4px;margin-bottom:6px;';
      row.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="color:#FFFDE7;font-size:13px;font-family:${FONT};">${item.name}</div>
          <div style="color:#AAAACC;font-size:12px;font-family:monospace;">×${entry.qty}</div>
        </div>
        <div style="color:#888899;font-size:11px;font-family:${FONT};margin-top:2px;">${item.desc}</div>
      `;
      this.content.appendChild(row);
    });
  }

  private buildParty() {
    const party = this.save.party;
    if (!party.length) {
      const empty = document.createElement('div');
      empty.style.cssText = `color:#444466;font-size:14px;text-align:center;padding:20px;font-family:${FONT};`;
      empty.textContent = 'まだ仲間がいない';
      this.content.appendChild(empty);
      return;
    }

    // アクティブ枠セクション
    const activeHeader = document.createElement('div');
    activeHeader.style.cssText = `color:#FFD700;font-size:11px;text-align:center;margin-bottom:6px;font-family:${FONT};`;
    activeHeader.textContent = '─── 出撃メンバー（プレイヤー含め最大4人）───';
    this.content.appendChild(activeHeader);

    // プレイヤー自身（常に出撃）
    const playerRow = document.createElement('div');
    playerRow.style.cssText = 'display:flex;align-items:center;padding:7px 6px;background:rgba(212,175,55,0.12);border-radius:4px;margin-bottom:4px;';
    playerRow.innerHTML = `
      <div style="flex:1;">
        <div style="color:#FFD700;font-size:13px;font-family:${FONT};">${this.save.name}（プレイヤー）</div>
        <div style="color:#AAAACC;font-size:10px;font-family:${FONT};">${this.save.className} Lv.${this.save.level} HP ${this.save.stats.hp}/${this.save.stats.maxHp}</div>
      </div>
      <div style="color:#44FF88;font-size:11px;font-family:${FONT};padding:3px 8px;border:1px solid rgba(68,255,136,0.4);border-radius:3px;">出撃中</div>
    `;
    this.content.appendChild(playerRow);

    // アクティブな仲間
    const activeMembers = party.filter(m => this.save.activeMemberIds.includes(m.id));
    activeMembers.forEach(member => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;padding:7px 6px;background:rgba(51,68,136,0.3);border-radius:4px;margin-bottom:4px;';
      const info = document.createElement('div');
      info.style.cssText = 'flex:1;';
      info.innerHTML = `
        <div style="color:#FFFDE7;font-size:13px;font-family:${FONT};">${member.name}</div>
        <div style="color:#AAAACC;font-size:10px;font-family:${FONT};">${member.className} Lv.${member.level} HP ${member.stats.hp}/${member.stats.maxHp}</div>
      `;
      const benchBtn = document.createElement('button');
      benchBtn.textContent = '控え';
      benchBtn.style.cssText = `background:none;border:1px solid rgba(255,150,100,0.5);color:#FFAA88;font-size:11px;padding:3px 8px;border-radius:3px;cursor:pointer;pointer-events:auto;font-family:${FONT};`;
      benchBtn.addEventListener('click', () => {
        setBench(this.save, member.id);
        writeSave(this.save);
        this.render();
      });
      row.appendChild(info);
      row.appendChild(benchBtn);
      this.content.appendChild(row);
    });

    // 控えセクション
    const benchMembers = party.filter(m => !this.save.activeMemberIds.includes(m.id));
    if (benchMembers.length > 0) {
      const benchHeader = document.createElement('div');
      benchHeader.style.cssText = `color:#AAAACC;font-size:11px;text-align:center;margin:10px 0 6px;font-family:${FONT};`;
      benchHeader.textContent = '─── 控えメンバー ───';
      this.content.appendChild(benchHeader);

      const canActivate = this.save.activeMemberIds.length < MAX_ACTIVE_COMPANIONS;

      benchMembers.forEach(member => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;padding:7px 6px;background:rgba(255,255,255,0.04);border-radius:4px;margin-bottom:4px;';
        const info = document.createElement('div');
        info.style.cssText = 'flex:1;';
        info.innerHTML = `
          <div style="color:#FFFDE7;font-size:13px;font-family:${FONT};">${member.name}</div>
          <div style="color:#AAAACC;font-size:10px;font-family:${FONT};">${member.className} Lv.${member.level} HP ${member.stats.hp}/${member.stats.maxHp}</div>
        `;
        const activeBtn = document.createElement('button');
        activeBtn.textContent = '出撃';
        if (canActivate) {
          activeBtn.style.cssText = `background:none;border:1px solid rgba(68,255,136,0.5);color:#44FF88;font-size:11px;padding:3px 8px;border-radius:3px;cursor:pointer;pointer-events:auto;font-family:${FONT};`;
          activeBtn.addEventListener('click', () => {
            setActive(this.save, member.id);
            writeSave(this.save);
            this.render();
          });
        } else {
          activeBtn.style.cssText = `background:none;border:1px solid rgba(100,100,100,0.4);color:#666688;font-size:11px;padding:3px 8px;border-radius:3px;cursor:default;pointer-events:none;font-family:${FONT};`;
        }
        row.appendChild(info);
        row.appendChild(activeBtn);
        this.content.appendChild(row);
      });
    }
  }

  private buildJob() {
    const JOB_COST = 500;
    const header = document.createElement('div');
    header.style.cssText = `color:#AAAACC;font-size:11px;margin-bottom:8px;font-family:${FONT};`;
    header.textContent = `転職するとレベルが1に戻ります。費用: ${JOB_COST} G（現在: ${this.save.gold} G）`;
    this.content.appendChild(header);

    const currentNote = document.createElement('div');
    currentNote.style.cssText = `color:#888899;font-size:11px;margin-bottom:10px;font-family:${FONT};`;
    currentNote.textContent = `現在の職業: ${this.save.className} Lv.${this.save.level}`;
    this.content.appendChild(currentNote);

    CLASS_DEFS.forEach(cls => {
      const isCurrent = cls.name === this.save.className;
      const canAfford = this.save.gold >= JOB_COST;
      const row = document.createElement('div');
      row.style.cssText = `padding:10px;border-radius:6px;margin-bottom:6px;
        background:${isCurrent ? 'rgba(51,68,136,0.3)' : 'rgba(255,255,255,0.04)'};
        border:1px solid ${isCurrent ? 'rgba(212,175,55,0.4)' : 'rgba(60,60,80,0.3)'};`;

      const topRow = document.createElement('div');
      topRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;';
      const nameEl = document.createElement('div');
      nameEl.style.cssText = `color:${isCurrent ? '#FFD700' : '#FFFDE7'};font-size:14px;font-family:${FONT};`;
      nameEl.textContent = cls.name + (isCurrent ? ' （現在）' : '');
      topRow.appendChild(nameEl);

      if (!isCurrent) {
        const btn = document.createElement('button');
        btn.style.cssText = `padding:4px 10px;font-size:11px;font-family:${FONT};pointer-events:auto;cursor:${canAfford ? 'pointer' : 'default'};
          background:${canAfford ? 'rgba(60,50,10,0.9)' : 'rgba(30,30,40,0.6)'};
          color:${canAfford ? '#FFD700' : '#555566'};
          border:1px solid ${canAfford ? 'rgba(212,175,55,0.5)' : 'rgba(60,60,80,0.4)'};border-radius:3px;`;
        btn.textContent = canAfford ? '転職する' : 'G不足';
        if (canAfford) {
          btn.addEventListener('click', () => {
            if (!confirm(`${cls.name}に転職しますか？\nレベルが1に戻り ${JOB_COST} G かかります。`)) return;
            if (!this.save.jobMastery) this.save.jobMastery = {};
            this.save.jobMastery[this.save.className] = (this.save.jobMastery[this.save.className] ?? 0) + 1;
            this.save.gold -= JOB_COST;
            this.save.className = cls.name as ClassName;
            this.save.level = 1;
            this.save.exp = 0;
            const base = calcStats(cls, 1);
            this.save.stats = { hp: base.maxHp, maxHp: base.maxHp, mp: base.maxMp, maxMp: base.maxMp, atk: base.atk, def: base.def, mag: base.mag, spd: base.spd };
            writeSave(this.save);
            this.render();
          });
        }
        topRow.appendChild(btn);
      }
      row.appendChild(topRow);

      const descEl = document.createElement('div');
      descEl.style.cssText = `color:#888899;font-size:11px;font-family:${FONT};`;
      descEl.textContent = cls.desc;
      row.appendChild(descEl);
      this.content.appendChild(row);
    });

    // Craft button
    const sep = document.createElement('div');
    sep.style.cssText = 'height:1px;background:rgba(212,175,55,0.15);margin:12px 0;';
    this.content.appendChild(sep);

    const craftBtn = document.createElement('button');
    craftBtn.style.cssText = `width:100%;padding:10px;background:rgba(60,40,10,0.8);color:#FFD700;border:1px solid rgba(180,120,30,0.6);border-radius:6px;font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    craftBtn.textContent = '⚒ 武器錬金（ボス素材で武器を作る）';
    craftBtn.addEventListener('click', () => { this.close(); if (this.onOpenCraft) this.onOpenCraft(); });
    this.content.appendChild(craftBtn);
  }

  private buildMaps() {
    const owned = this.save.ownedMaps ?? [];

    const gachaBtn = document.createElement('button');
    gachaBtn.style.cssText = `width:100%;padding:10px;background:rgba(40,30,10,0.8);color:#FFD700;border:1px solid rgba(212,175,55,0.5);border-radius:6px;font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;margin-bottom:12px;`;
    gachaBtn.textContent = '✨ 宝の地図ガチャを引く';
    gachaBtn.addEventListener('click', () => { this.close(); if (this.onOpenGacha) this.onOpenGacha(); });
    this.content.appendChild(gachaBtn);

    if (!owned.length) {
      const empty = document.createElement('div');
      empty.style.cssText = `color:#444466;font-size:13px;text-align:center;padding:16px;font-family:${FONT};`;
      empty.textContent = 'まだ地図を持っていない\nガチャ券は敵がたまに落とす';
      this.content.appendChild(empty);
      return;
    }

    const header = document.createElement('div');
    header.style.cssText = `color:#AAAACC;font-size:11px;margin-bottom:8px;font-family:${FONT};`;
    header.textContent = '─── 所持している宝の地図 ───';
    this.content.appendChild(header);

    TREASURE_MAPS.filter(m => owned.includes(m.id)).forEach(mapDef => {
      const prog = (this.save.bossProgress ?? {})[mapDef.id] ?? { count: 0, level: 1 };
      const nextThresh = BOSS_LEVEL_THRESHOLDS[prog.level + 1] ?? Infinity;
      const dropRate = Math.round(getBossDropRate(prog.level) * 100);

      const card = document.createElement('div');
      card.style.cssText = 'padding:10px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(212,175,55,0.3);margin-bottom:8px;';

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div style="color:#FFFDE7;font-size:14px;font-family:${FONT};">🗺 ${mapDef.name}</div>
          <div style="color:#FFD700;font-size:13px;">Lv ${prog.level}</div>
        </div>
        <div style="color:#888899;font-size:11px;font-family:${FONT};margin-bottom:6px;">
          撃破数: ${prog.count} / 次Lv: ${nextThresh === Infinity ? 'MAX' : nextThresh} &nbsp;|&nbsp; 素材ドロップ率: ${dropRate}%
        </div>
      `;

      const enterBtn = document.createElement('button');
      enterBtn.style.cssText = `width:100%;padding:7px;background:rgba(20,40,80,0.8);color:#88CCFF;border:1px solid rgba(68,136,255,0.5);border-radius:4px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
      enterBtn.textContent = 'ダンジョンに入る';
      enterBtn.addEventListener('click', () => {
        this.close();
        if (this.onEnterMap) this.onEnterMap(mapDef.mapId);
      });
      card.appendChild(enterBtn);
      this.content.appendChild(card);
    });
  }

  private buildField() {
    const actions = [
      { id: 'rula', label: '✨ ルーラ', desc: '訪れた場所へ瞬時に移動する' },
      { id: 'releimito', label: '⬆ リレミト', desc: 'ダンジョンから脱出する' },
    ];
    actions.forEach(act => {
      const row = document.createElement('div');
      row.style.cssText = 'padding:10px 6px;background:rgba(255,255,255,0.04);border-radius:4px;margin-bottom:8px;cursor:pointer;pointer-events:auto;';
      const btn = document.createElement('button');
      btn.style.cssText = `display:block;width:100%;padding:10px 0;background:rgba(16,26,56,0.9);color:#FFFDE7;border:1px solid rgba(212,175,55,0.5);border-radius:4px;font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;margin-bottom:4px;`;
      btn.textContent = act.label;
      btn.addEventListener('click', () => {
        this.close();
        if (this.onFieldAction) this.onFieldAction(act.id);
      });
      const desc = document.createElement('div');
      desc.style.cssText = `color:#888899;font-size:11px;font-family:${FONT};padding:0 4px;`;
      desc.textContent = act.desc;
      row.appendChild(btn);
      row.appendChild(desc);
      this.content.appendChild(row);
    });
    const medals = this.save.medals ?? 0;
    const medalRow = document.createElement('div');
    medalRow.style.cssText = 'padding:8px 6px;background:rgba(255,255,255,0.04);border-radius:4px;margin-bottom:8px;';
    medalRow.innerHTML = `<div style="display:flex;justify-content:space-between;"><span style="color:#AAAACC;font-size:12px;font-family:${FONT};">ちいさなメダル</span><span style="color:#FFD700;font-size:12px;font-family:monospace;">${medals} 枚</span></div>`;
    this.content.appendChild(medalRow);
  }

  private buildBook() {
    const book = this.save.monsterBook ?? {};
    if (ENEMIES.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = `color:#444466;font-size:14px;text-align:center;padding:20px;font-family:${FONT};`;
      empty.textContent = 'まだモンスターに出会っていない';
      this.content.appendChild(empty);
      return;
    }
    const header = document.createElement('div');
    header.style.cssText = `color:#AAAACC;font-size:11px;margin-bottom:8px;font-family:${FONT};`;
    const seenCount = Object.keys(book).length;
    header.textContent = `確認済み: ${seenCount}/${ENEMIES.length} 種`;
    this.content.appendChild(header);

    ENEMIES.forEach(enemy => {
      const entry = book[enemy.id];
      const row = document.createElement('div');
      row.style.cssText = 'padding:7px 6px;background:rgba(255,255,255,0.04);border-radius:4px;margin-bottom:4px;';
      if (entry) {
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="color:#FFFDE7;font-size:13px;font-family:${FONT};">${enemy.name}</div>
            <div style="color:#AAAACC;font-size:10px;font-family:monospace;">見: ${entry.seen} / 倒: ${entry.defeated}</div>
          </div>
        `;
      } else {
        row.innerHTML = `<div style="color:#444466;font-size:13px;font-family:${FONT};">？？？？</div>`;
      }
      this.content.appendChild(row);
    });
  }

  private close() {
    writeSave(this.save);
    this.root.style.display='none';
    this.onClose(this.save);
  }

  hide() { this.root.style.display='none'; }
}
