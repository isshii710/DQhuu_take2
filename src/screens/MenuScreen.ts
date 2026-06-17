import type { CharacterSave } from '../types';
import type { Equipment } from '../types';
import { ITEMS } from '../data/items';
import { effectiveStats, equipItem, unequipSlot } from '../systems/InventorySystem';
import { writeSave } from '../systems/SaveSystem';

type Tab = 'status'|'equipment'|'items';

const FONT = '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';

export class MenuScreen {
  private root: HTMLElement;
  private content!: HTMLElement;
  private tab: Tab = 'status';
  private save!: CharacterSave;
  private onClose!: (save: CharacterSave) => void;

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

  open(save: CharacterSave, onClose: (save: CharacterSave)=>void) {
    this.save = save;
    this.onClose = onClose;
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
    const tabs: {id:Tab;label:string}[] = [{id:'status',label:'ステータス'},{id:'equipment',label:'装備'},{id:'items',label:'アイテム'}];
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
    else this.buildItems();
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

  private close() {
    writeSave(this.save);
    this.root.style.display='none';
    this.onClose(this.save);
  }

  hide() { this.root.style.display='none'; }
}
