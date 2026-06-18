import type { CharacterSave } from '../types';
import type { Equipment } from '../types';
import { ITEMS } from '../data/items';
import { ENEMIES } from '../data/enemies';
import { effectiveStats, equipItem, unequipSlot } from '../systems/InventorySystem';
import { writeSave } from '../systems/SaveSystem';
import { setActive, setBench, MAX_ACTIVE_COMPANIONS } from '../systems/PartySystem';
import { QUESTS } from '../data/quests';

type Tab = 'status'|'equipment'|'items'|'party'|'field'|'book'|'quests';

const FONT = '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';

export class MenuScreen {
  private root: HTMLElement;
  private content!: HTMLElement;
  private tab: Tab = 'status';
  private save!: CharacterSave;
  private onClose!: (save: CharacterSave) => void;
  private onFieldAction?: (action: string) => void;

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

  open(save: CharacterSave, onClose: (save: CharacterSave)=>void, onFieldAction?: (action: string) => void) {
    this.save = save;
    this.onClose = onClose;
    this.onFieldAction = onFieldAction;
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
    const tabs: {id:Tab;label:string}[] = [{id:'status',label:'ステータス'},{id:'equipment',label:'装備'},{id:'items',label:'アイテム'},{id:'party',label:'パーティ'},{id:'quests',label:'クエスト'},{id:'field',label:'フィールド'},{id:'book',label:'図鑑'}];
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
    else if (this.tab==='quests') this.buildQuests();
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
    const slots: {key:keyof Equipment;label:string}[] = [
      {key:'weapon',label:'武器'},{key:'armor',label:'防具'},
      {key:'helmet',label:'兜'},{key:'accessory',label:'アクセ'},
    ];
    slots.forEach(({key,label})=>{
      const equippedId = this.save.equipment[key];
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
        unBtn.addEventListener('click',()=>{unequipSlot(this.save,key);writeSave(this.save);this.render();});
        row.appendChild(unBtn);
      }
      this.content.appendChild(row);
    });

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
      equippables.slice(0,6).forEach(entry=>{
        const item=ITEMS.find(i=>i.id===entry.itemId)!;
        const row=document.createElement('div');
        row.style.cssText='display:flex;align-items:center;padding:7px 6px;background:rgba(255,255,255,0.04);border-radius:4px;margin-bottom:4px;cursor:pointer;pointer-events:auto;';
        row.innerHTML=`<div style="color:#FFFDE7;font-size:13px;flex:1;font-family:${FONT};">${item.name}</div>`;
        row.addEventListener('click',()=>{equipItem(this.save,entry.itemId);writeSave(this.save);this.render();});
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

  private buildQuests() {
    const completed = this.save.completedQuests ?? [];
    const kills = this.save.questKills ?? {};

    const header = document.createElement('div');
    header.style.cssText = `color:#AAAACC;font-size:11px;margin-bottom:8px;font-family:${FONT};`;
    header.textContent = `達成: ${completed.length}/${QUESTS.length} クエスト`;
    this.content.appendChild(header);

    QUESTS.forEach(quest => {
      const isDone = completed.includes(quest.id);
      const card = document.createElement('div');
      card.style.cssText = `padding:10px;border-radius:6px;margin-bottom:6px;
        background:${isDone ? 'rgba(40,80,40,0.3)' : 'rgba(255,255,255,0.04)'};
        border:1px solid ${isDone ? 'rgba(68,200,68,0.4)' : 'rgba(60,60,80,0.3)'};`;

      let progress = '';
      if (quest.killTarget && quest.killTarget !== 'any' && quest.killCount) {
        const cur = kills[quest.killTarget] ?? 0;
        progress = `${Math.min(cur, quest.killCount)}/${quest.killCount}`;
      } else if (quest.killTarget === 'any' && quest.killCount) {
        const total = Object.values(kills).reduce((s, n) => s + n, 0);
        progress = `${Math.min(total, quest.killCount)}/${quest.killCount}`;
      }

      let reward = '';
      if (quest.rewardGold) reward += `${quest.rewardGold} G `;
      if (quest.rewardItems?.length) reward += `アイテム×${quest.rewardItems.length} `;
      if (quest.rewardFlag) reward += '上級職解放';

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div style="color:${isDone ? '#44FF88' : '#FFFDE7'};font-size:13px;font-family:${FONT};">${isDone ? '✓ ' : ''}${quest.name}</div>
          ${progress ? `<div style="color:#AAAACC;font-size:11px;font-family:monospace;">${progress}</div>` : ''}
        </div>
        <div style="color:#888899;font-size:11px;font-family:${FONT};margin-bottom:2px;">${quest.desc}</div>
        ${reward ? `<div style="color:#FFD700;font-size:10px;font-family:${FONT};">報酬: ${reward}</div>` : ''}
      `;
      this.content.appendChild(card);
    });
  }

  private close() {
    writeSave(this.save);
    this.root.style.display='none';
    this.onClose(this.save);
  }

  hide() { this.root.style.display='none'; }
}
