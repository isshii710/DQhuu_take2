import type { CharacterSave } from '../types';
import { pullGacha, BOSS_LEVEL_THRESHOLDS, getBossLevel } from '../data/treasureMaps';
import { writeSave } from '../systems/SaveSystem';
import { addItem, removeItem } from '../systems/InventorySystem';

const FONT = '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';
const RARITY_COLOR = ['', '#CCBB44', '#44BBCC', '#AA44FF', '#FF8822', '#FF4444'];
const RARITY_LABEL = ['', '★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★'];

export class GachaScreen {
  private root: HTMLElement;
  private save!: CharacterSave;
  private onClose!: (save: CharacterSave) => void;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.style.cssText = `
      position:absolute;inset:0;display:none;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.85);pointer-events:auto;z-index:30;font-family:${FONT};
    `;
    container.appendChild(this.root);
  }

  open(save: CharacterSave, onClose: (save: CharacterSave) => void) {
    this.save = save;
    this.onClose = onClose;
    this.renderLobby();
    this.root.style.display = 'flex';
  }

  private renderLobby() {
    this.root.innerHTML = '';
    const box = document.createElement('div');
    box.style.cssText = `
      background:rgba(8,8,24,0.98);border:2px solid rgba(212,175,55,0.7);
      border-radius:10px;padding:20px 22px;width:calc(100% - 32px);max-width:320px;
      display:flex;flex-direction:column;gap:12px;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'color:#FFD700;font-size:18px;text-align:center;';
    title.textContent = '✨ 宝の地図ガチャ';
    box.appendChild(title);

    const tickets = (this.save.inventory.find(e => e.itemId === 'gacha_ticket')?.qty) ?? 0;
    const ticketInfo = document.createElement('div');
    ticketInfo.style.cssText = 'color:#AAAACC;font-size:13px;text-align:center;';
    ticketInfo.textContent = `所持ガチャ券: ${tickets} 枚`;
    box.appendChild(ticketInfo);

    // Owned maps list
    const owned = this.save.ownedMaps ?? [];
    if (owned.length) {
      const mapHeader = document.createElement('div');
      mapHeader.style.cssText = 'color:#AAAACC;font-size:11px;text-align:center;';
      mapHeader.textContent = '─── 所持している地図 ───';
      box.appendChild(mapHeader);
      owned.forEach(mapId => {
        const prog = (this.save.bossProgress ?? {})[mapId] ?? { count: 0, level: 1 };
        const nextThresh = BOSS_LEVEL_THRESHOLDS[prog.level + 1] ?? '∞';
        const row = document.createElement('div');
        row.style.cssText = 'background:rgba(255,255,255,0.05);border-radius:4px;padding:6px 8px;font-size:12px;color:#FFFDE7;';
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;">
            <span>${mapId.replace('tmap_','古の地図')}</span>
            <span style="color:#FFD700;">Lv ${prog.level}</span>
          </div>
          <div style="color:#888899;font-size:10px;">撃破数: ${prog.count} / 次Lv: ${nextThresh}</div>
        `;
        box.appendChild(row);
      });
    }

    const pullBtn = document.createElement('button');
    pullBtn.style.cssText = `
      padding:12px;background:${tickets > 0 ? 'rgba(80,60,20,0.9)' : 'rgba(40,40,40,0.6)'};
      color:${tickets > 0 ? '#FFD700' : '#555566'};
      border:1px solid ${tickets > 0 ? 'rgba(212,175,55,0.7)' : 'rgba(80,80,80,0.4)'};
      border-radius:6px;font-size:15px;font-family:${FONT};
      cursor:${tickets > 0 ? 'pointer' : 'default'};pointer-events:auto;
    `;
    pullBtn.textContent = tickets > 0 ? '🗺 ガチャを引く (×1)' : 'ガチャ券がない';
    if (tickets > 0) {
      pullBtn.addEventListener('click', () => this.doPull());
    }
    box.appendChild(pullBtn);

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `padding:8px;background:transparent;color:#AAAACC;border:1px solid rgba(80,80,120,0.5);border-radius:4px;font-size:13px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    closeBtn.textContent = '閉じる';
    closeBtn.addEventListener('click', () => this.close());
    box.appendChild(closeBtn);

    this.root.appendChild(box);
  }

  private doPull() {
    if (!removeItem(this.save, 'gacha_ticket')) return;

    const result = pullGacha();

    // Initialize ownedMaps
    if (!this.save.ownedMaps) this.save.ownedMaps = [];
    if (!this.save.bossProgress) this.save.bossProgress = {};

    // Add to owned maps if new
    if (!this.save.ownedMaps.includes(result.id)) {
      this.save.ownedMaps.push(result.id);
    }

    // Increment boss kill count (gacha pull = +1)
    const prev = this.save.bossProgress[result.id] ?? { count: 0, level: 1 };
    prev.count++;
    prev.level = getBossLevel(prev.count);
    this.save.bossProgress[result.id] = prev;

    writeSave(this.save);
    this.renderResult(result.name, result.rarity, result.id, prev.count, prev.level);
  }

  private renderResult(name: string, rarity: number, mapId: string, count: number, level: number) {
    this.root.innerHTML = '';
    const box = document.createElement('div');
    box.style.cssText = `
      background:rgba(8,8,24,0.98);border:2px solid ${RARITY_COLOR[rarity]};
      border-radius:10px;padding:24px 22px;width:calc(100% - 32px);max-width:320px;
      display:flex;flex-direction:column;gap:14px;align-items:center;
    `;

    const sparkle = document.createElement('div');
    sparkle.style.cssText = `font-size:40px;animation:spin 1s linear;`;
    sparkle.textContent = '🗺';
    box.appendChild(sparkle);

    const rarityEl = document.createElement('div');
    rarityEl.style.cssText = `color:${RARITY_COLOR[rarity]};font-size:14px;`;
    rarityEl.textContent = RARITY_LABEL[rarity];
    box.appendChild(rarityEl);

    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'color:#FFFDE7;font-size:20px;font-weight:bold;';
    nameEl.textContent = name;
    box.appendChild(nameEl);

    const progEl = document.createElement('div');
    progEl.style.cssText = 'color:#AAAACC;font-size:12px;text-align:center;';
    const nextThresh = BOSS_LEVEL_THRESHOLDS[level + 1] ?? '∞';
    progEl.innerHTML = `ボスレベル <span style="color:#FFD700;">Lv ${level}</span><br>撃破数: ${count} / 次Lv: ${nextThresh}`;
    box.appendChild(progEl);

    const hint = document.createElement('div');
    hint.style.cssText = 'color:#888899;font-size:11px;text-align:center;';
    hint.textContent = 'メニュー「地図」からダンジョンに入れます';
    box.appendChild(hint);

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `padding:10px 20px;background:rgba(60,50,10,0.9);color:#FFD700;border:1px solid rgba(212,175,55,0.6);border-radius:6px;font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;`;
    closeBtn.textContent = '確認';
    closeBtn.addEventListener('click', () => this.renderLobby());
    box.appendChild(closeBtn);

    this.root.appendChild(box);
  }

  private close() {
    this.root.style.display = 'none';
    this.onClose(this.save);
  }

  hide() { this.root.style.display = 'none'; }
}
