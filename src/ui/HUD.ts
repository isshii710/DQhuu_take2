import type { CharacterSave } from '../types';

export class HUD {
  private root: HTMLElement;
  private hpEl: HTMLElement;
  private mpEl: HTMLElement;
  private locationEl: HTMLElement;
  private levelEl: HTMLElement;
  private hpBar: HTMLElement;
  private mpBar: HTMLElement;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.style.cssText = `
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 52px;
      background: rgba(10,10,30,0.92);
      border-top: 1px solid rgba(212,175,55,0.5);
      display: flex;
      align-items: center;
      padding: 0 10px;
      pointer-events: none;
      gap: 8px;
    `;

    // Status (left side) - HP and MP bars
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = 'display:flex;flex-direction:column;gap:4px;min-width:110px;';

    const hpRow = this.makeBarRow('#44FF88', 'HP');
    const mpRow = this.makeBarRow('#6688FF', 'MP');
    this.hpEl  = hpRow.label;
    this.mpEl  = mpRow.label;
    this.hpBar = hpRow.bar;
    this.mpBar = mpRow.bar;
    statusDiv.appendChild(hpRow.row);
    statusDiv.appendChild(mpRow.row);

    // Center - location name
    this.locationEl = document.createElement('div');
    this.locationEl.style.cssText = `
      flex: 1; text-align: center;
      color: #AAAACC; font-size: 11px;
    `;

    // Right - level
    this.levelEl = document.createElement('div');
    this.levelEl.style.cssText = `
      color: #FFD700; font-size: 13px; font-weight: bold;
      min-width: 48px; text-align: right;
    `;

    this.root.appendChild(statusDiv);
    this.root.appendChild(this.locationEl);
    this.root.appendChild(this.levelEl);
    container.appendChild(this.root);
  }

  private makeBarRow(color: string, label: string) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:4px;';

    const lbl = document.createElement('span');
    lbl.style.cssText = `color:${color};font-size:11px;min-width:80px;font-family:monospace;`;
    lbl.textContent = `${label} --/--`;

    const track = document.createElement('div');
    track.style.cssText = 'flex:1;height:5px;background:rgba(255,255,255,0.15);border-radius:3px;overflow:hidden;min-width:40px;';
    const bar = document.createElement('div');
    bar.style.cssText = `height:100%;background:${color};border-radius:3px;transition:width 0.2s;width:100%;`;
    track.appendChild(bar);

    row.appendChild(lbl);
    row.appendChild(track);
    return { row, label: lbl, bar };
  }

  update(save: CharacterSave, locationName: string) {
    const { hp, maxHp, mp, maxMp } = save.stats;
    this.hpEl.textContent = `HP ${hp}/${maxHp}`;
    this.mpEl.textContent = `MP ${mp}/${maxMp}`;
    this.hpBar.style.width = `${Math.max(0, hp/maxHp*100).toFixed(1)}%`;
    this.hpBar.style.background = hp / maxHp < 0.25 ? '#FF4444' : '#44FF88';
    this.mpBar.style.width = `${Math.max(0, mp/maxMp*100).toFixed(1)}%`;
    this.locationEl.textContent = locationName;
    this.levelEl.textContent = `Lv.${save.level}`;
  }

  showMapBanner(name: string) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      color: #FFFDE7;
      font-size: 22px; font-weight: bold;
      text-shadow: 0 0 8px #000, 0 2px 4px #000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.4s;
      white-space: nowrap;
    `;
    banner.textContent = name;
    this.root.parentElement!.appendChild(banner);
    requestAnimationFrame(() => { banner.style.opacity = '1'; });
    setTimeout(() => {
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 600);
    }, 1600);
  }

  show() { this.root.style.display = 'flex'; }
  hide() { this.root.style.display = 'none'; }
}
