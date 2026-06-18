import type { CharacterSave } from '../types';
import { CRAFT_RECIPES } from '../data/items';
import { ITEM_MAP } from '../data/items';
import { addItem, removeItem, hasItem } from '../systems/InventorySystem';
import { writeSave } from '../systems/SaveSystem';

const FONT = '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';

export class CraftScreen {
  private root: HTMLElement;
  private save!: CharacterSave;
  private onClose!: (save: CharacterSave) => void;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.style.cssText = `
      position:absolute;inset:0;display:none;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.82);pointer-events:auto;z-index:30;font-family:${FONT};
    `;
    container.appendChild(this.root);
  }

  open(save: CharacterSave, onClose: (save: CharacterSave) => void) {
    this.save = save;
    this.onClose = onClose;
    this.render();
    this.root.style.display = 'flex';
  }

  private render() {
    this.root.innerHTML = '';
    const box = document.createElement('div');
    box.style.cssText = `
      background:rgba(8,8,24,0.98);border:2px solid rgba(180,120,30,0.7);
      border-radius:10px;padding:16px 18px;width:calc(100% - 32px);max-width:340px;
      max-height:85vh;display:flex;flex-direction:column;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;';
    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-size:17px;';
    title.textContent = '⚒ 武器錬金';
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:none;border:none;color:#AAAACC;font-size:20px;cursor:pointer;pointer-events:auto;';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(title);
    header.appendChild(closeBtn);
    box.appendChild(header);

    const list = document.createElement('div');
    list.style.cssText = 'overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px;';

    CRAFT_RECIPES.forEach(recipe => {
      const result = ITEM_MAP[recipe.result];
      if (!result) return;

      const canCraft = recipe.materials.every(m => {
        const entry = this.save.inventory.find(e => e.itemId === m.itemId);
        return (entry?.qty ?? 0) >= m.qty;
      }) && this.save.gold >= recipe.gold;

      const card = document.createElement('div');
      card.style.cssText = `
        padding:10px;border-radius:6px;
        background:${canCraft ? 'rgba(60,50,10,0.6)' : 'rgba(255,255,255,0.04)'};
        border:1px solid ${canCraft ? 'rgba(212,175,55,0.5)' : 'rgba(60,60,80,0.4)'};
      `;

      const topRow = document.createElement('div');
      topRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;';
      const nameEl = document.createElement('div');
      nameEl.style.cssText = `color:${canCraft ? '#FFFDE7' : '#666677'};font-size:13px;`;
      nameEl.textContent = result.name;
      const costEl = document.createElement('div');
      costEl.style.cssText = `color:${this.save.gold >= recipe.gold ? '#FFD700' : '#FF6666'};font-size:12px;`;
      costEl.textContent = `${recipe.gold} G`;
      topRow.appendChild(nameEl);
      topRow.appendChild(costEl);
      card.appendChild(topRow);

      const matsEl = document.createElement('div');
      matsEl.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;';
      recipe.materials.forEach(m => {
        const mat = ITEM_MAP[m.itemId];
        if (!mat) return;
        const held = this.save.inventory.find(e => e.itemId === m.itemId)?.qty ?? 0;
        const ok = held >= m.qty;
        const chip = document.createElement('div');
        chip.style.cssText = `padding:2px 6px;border-radius:3px;font-size:10px;background:rgba(255,255,255,0.06);color:${ok ? '#88FF88' : '#FF8888'};`;
        chip.textContent = `${mat.name} ×${m.qty} (${held})`;
        matsEl.appendChild(chip);
      });
      card.appendChild(matsEl);

      if (result.desc) {
        const descEl = document.createElement('div');
        descEl.style.cssText = 'color:#888899;font-size:10px;margin-bottom:6px;';
        descEl.textContent = result.desc;
        card.appendChild(descEl);
      }

      const craftBtn = document.createElement('button');
      craftBtn.style.cssText = `
        width:100%;padding:6px;font-size:12px;font-family:${FONT};
        background:${canCraft ? 'rgba(80,60,10,0.9)' : 'rgba(30,30,40,0.6)'};
        color:${canCraft ? '#FFD700' : '#444455'};
        border:1px solid ${canCraft ? 'rgba(212,175,55,0.6)' : 'rgba(60,60,80,0.4)'};
        border-radius:4px;cursor:${canCraft ? 'pointer' : 'default'};pointer-events:auto;
      `;
      craftBtn.textContent = canCraft ? '⚒ 錬金する' : '素材不足';
      if (canCraft) {
        craftBtn.addEventListener('click', () => {
          recipe.materials.forEach(m => removeItem(this.save, m.itemId, m.qty));
          this.save.gold -= recipe.gold;
          addItem(this.save, recipe.result);
          writeSave(this.save);
          this.render();
        });
      }
      card.appendChild(craftBtn);
      list.appendChild(card);
    });

    box.appendChild(list);
    this.root.appendChild(box);
  }

  private close() {
    this.root.style.display = 'none';
    this.onClose(this.save);
  }

  hide() { this.root.style.display = 'none'; }
}
