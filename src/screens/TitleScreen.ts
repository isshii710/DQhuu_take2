import { hasSave, loadSave, defaultSave, writeSave } from '../systems/SaveSystem';
import type { CharacterSave, ClassName } from '../types';
import { CLASS_DEFS } from '../data/characters';
import { mpManager } from '../systems/MultiplayerManager';

type Screen = 'main' | 'class_select' | 'name_input' | 'multiplayer' | 'mp_create' | 'mp_join';

const FONT = '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, html?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.style.cssText = css;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function btn(label: string, onClick: () => void, extra = ''): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.cssText = `
    display:block; width:220px; padding:14px 0;
    background:rgba(26,26,46,0.9); color:#FFFDE7;
    border:1px solid rgba(212,175,55,0.6);
    border-radius:4px; font-size:18px;
    font-family:${FONT}; cursor:pointer;
    pointer-events:auto; ${extra}
  `;
  b.addEventListener('click', onClick);
  b.addEventListener('mouseenter', () => { b.style.background='rgba(51,68,136,0.9)'; b.style.color='#FFD700'; });
  b.addEventListener('mouseleave', () => { b.style.background='rgba(26,26,46,0.9)'; b.style.color='#FFFDE7'; });
  return b;
}

export class TitleScreen {
  private root: HTMLElement;
  private content: HTMLElement;
  private screen: Screen = 'main';
  private selectedClass = 0;
  private playerName = '主人公';
  private roomInput = '';
  private onStart: (save: CharacterSave, opts: { isMultiplayer: boolean; isHost?: boolean; roomId?: string }) => void;

  constructor(
    container: HTMLElement,
    onStart: (save: CharacterSave, opts: { isMultiplayer: boolean; isHost?: boolean }) => void
  ) {
    this.onStart = onStart;

    this.root = document.createElement('div');
    this.root.style.cssText = `
      position:absolute; inset:0;
      display:flex; flex-direction:column;
      align-items:center; justify-content:flex-start;
      background:linear-gradient(180deg,#0a0a1a 0%,#0d0d2a 100%);
      overflow:hidden;
      pointer-events:none;
    `;

    // Starfield
    const stars = document.createElement('canvas');
    stars.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    this.root.appendChild(stars);
    requestAnimationFrame(() => {
      stars.width = this.root.offsetWidth || 360;
      stars.height = this.root.offsetHeight || 640;
      const sc = stars.getContext('2d')!;
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * stars.width;
        const y = Math.random() * stars.height * 0.65;
        const r = Math.random() < 0.3 ? 1.5 : 1;
        sc.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`;
        sc.beginPath(); sc.arc(x, y, r, 0, Math.PI*2); sc.fill();
      }
    });

    // Title
    const titleWrap = el('div', `
      display:flex;flex-direction:column;align-items:center;
      margin-top:60px;margin-bottom:0;pointer-events:none;
    `);
    const title = el('div', `
      font-size:36px;font-weight:bold;color:#FFD700;
      font-family:${FONT};
      text-shadow:0 0 12px rgba(255,150,0,0.6),2px 2px 0 #000;
      letter-spacing:2px;
    `, 'アルデア伝説');
    const sub = el('div', `
      font-size:13px;color:#AAAAFF;font-family:${FONT};
      margin-top:8px;letter-spacing:1px;
    `, '～失われた聖石を求めて～');
    const divider = el('div', 'width:220px;height:1px;background:rgba(212,175,55,0.5);margin-top:14px;');
    titleWrap.appendChild(title);
    titleWrap.appendChild(sub);
    titleWrap.appendChild(divider);
    this.root.appendChild(titleWrap);

    this.content = el('div', `
      display:flex;flex-direction:column;align-items:center;
      width:100%;flex:1;overflow-y:auto;padding:20px 16px 24px;
      pointer-events:none;
    `);
    this.root.appendChild(this.content);

    container.appendChild(this.root);
    this.renderScreen();
  }

  private clear() {
    this.content.innerHTML = '';
    this.content.style.pointerEvents = 'auto';
  }

  private renderScreen() {
    this.clear();
    switch (this.screen) {
      case 'main':        this.buildMain();        break;
      case 'class_select':this.buildClassSelect(); break;
      case 'name_input':  this.buildNameInput();   break;
      case 'multiplayer': this.buildMultiplayer(); break;
      case 'mp_create':   this.buildMpCreate();    break;
      case 'mp_join':     this.buildMpJoin();      break;
    }
  }

  private buildMain() {
    const wrap = el('div','display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:30px;');

    wrap.appendChild(btn('はじめから', () => { this.screen='class_select'; this.renderScreen(); }));
    const contBtn = btn('つづきから', () => this.continueGame(), hasSave() ? '' : 'opacity:0.4;cursor:default;pointer-events:none;');
    wrap.appendChild(contBtn);
    wrap.appendChild(btn('マルチプレイ', () => { this.screen='multiplayer'; this.renderScreen(); }));

    const ver = el('div','color:#333355;font-size:10px;margin-top:20px;font-family:monospace;','v1.0.0  ©2026 Aldea Legend');
    wrap.appendChild(ver);
    this.content.appendChild(wrap);
  }

  private buildClassSelect() {
    const title = el('div','color:#FFD700;font-size:18px;font-family:'+FONT+';margin-bottom:16px;','職業を選んでください');
    this.content.appendChild(title);

    const grid = el('div','display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:320px;');

    CLASS_DEFS.forEach((cls, i) => {
      const card = document.createElement('div');
      const sel = this.selectedClass === i;
      card.style.cssText = `
        background:${sel ? 'rgba(26,42,90,0.95)' : 'rgba(16,16,30,0.9)'};
        border:1px solid ${sel ? '#FFD700' : 'rgba(51,68,102,0.8)'};
        border-radius:6px; padding:10px 8px;
        cursor:pointer; pointer-events:auto;
        display:flex;flex-direction:column;align-items:center;gap:4px;
        transition:all 0.15s;
      `;
      card.innerHTML = `
        <div style="font-size:16px;color:${sel?'#FFD700':'#FFFDE7'};font-family:${FONT};">${cls.name}</div>
        <div style="font-size:10px;color:#888899;font-family:${FONT};text-align:center;">${cls.desc}</div>
      `;
      card.addEventListener('click', () => { this.selectedClass = i; this.renderScreen(); });
      grid.appendChild(card);
    });
    this.content.appendChild(grid);

    const row = el('div','display:flex;gap:12px;margin-top:16px;');
    row.appendChild(btn('← 戻る', () => { this.screen='main'; this.renderScreen(); }, 'width:96px;font-size:14px;'));
    row.appendChild(btn('決定', () => { this.screen='name_input'; this.renderScreen(); }, 'width:110px;background:rgba(26,74,26,0.9);border-color:rgba(68,187,68,0.6);color:#AAFFAA;'));
    this.content.appendChild(row);
  }

  private buildNameInput() {
    const titleEl = el('div','color:#FFD700;font-size:18px;font-family:'+FONT+';margin-bottom:4px;','名前を入力');
    const subEl   = el('div','color:#AAAACC;font-size:13px;font-family:'+FONT+';margin-bottom:14px;', CLASS_DEFS[this.selectedClass].name + 'として旅立つ');
    this.content.appendChild(titleEl);
    this.content.appendChild(subEl);

    const display = el('div',`
      background:rgba(10,26,58,0.95); border:2px solid rgba(212,175,55,0.7);
      border-radius:4px; padding:10px 20px;
      font-size:20px; color:#FFFDE7;
      font-family:${FONT}; min-width:200px; text-align:center;
      margin-bottom:14px;
    `, this.playerName + '▌');
    this.content.appendChild(display);

    // Cursor blink
    let shown = true;
    const blink = setInterval(() => {
      shown = !shown;
      display.textContent = this.playerName + (shown ? '▌' : '');
    }, 500);

    // Preset names
    const presets = ['主人公','アルテ','ライア','セイン','ルーカ','ミア'];
    const presetGrid = el('div','display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;max-width:280px;margin-bottom:14px;');
    presets.forEach(name => {
      const pb = el('button',`
        padding:10px 0;background:rgba(16,16,30,0.9);color:#FFFDE7;
        border:1px solid rgba(51,68,102,0.8);border-radius:4px;
        font-size:14px;font-family:${FONT};cursor:pointer;pointer-events:auto;
      `, name);
      pb.addEventListener('click', () => {
        this.playerName = name;
        display.textContent = this.playerName + '▌';
        shown = true;
      });
      presetGrid.appendChild(pb);
    });
    this.content.appendChild(presetGrid);

    // Hidden input for real keyboard
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 8;
    input.value = this.playerName;
    input.style.cssText = 'position:fixed;opacity:0;top:0;left:0;width:1px;height:1px;';
    document.body.appendChild(input);
    setTimeout(() => input.focus(), 100);
    input.addEventListener('input', () => {
      this.playerName = input.value || '主人公';
      display.textContent = this.playerName + '▌';
    });

    const row = el('div','display:flex;gap:12px;');
    const backB = btn('← 戻る', () => {
      clearInterval(blink); input.remove();
      this.screen='class_select'; this.renderScreen();
    }, 'width:96px;font-size:14px;');
    const startB = btn('冒険を始める！', () => {
      clearInterval(blink); input.remove();
      this.startNewGame();
    }, 'width:140px;background:rgba(26,74,26,0.9);border-color:rgba(68,187,68,0.6);color:#AAFFAA;font-size:16px;');
    row.appendChild(backB);
    row.appendChild(startB);
    this.content.appendChild(row);
  }

  private buildMultiplayer() {
    const title = el('div','color:#FFD700;font-size:20px;font-family:'+FONT+';margin-bottom:6px;','マルチプレイ');
    const sub   = el('div','color:#AAAACC;font-size:13px;font-family:'+FONT+';margin-bottom:20px;','最大4人でパーティを組んで冒険！');
    this.content.appendChild(title);
    this.content.appendChild(sub);

    const createB = btn('ルームを作る', () => { this.screen='mp_create'; this.renderScreen(); }, 'width:240px;font-size:16px;');
    const joinB   = btn('ルームに参加', () => { this.screen='mp_join';   this.renderScreen(); }, 'width:240px;font-size:16px;margin-top:4px;');
    const backB   = btn('← 戻る', () => { this.screen='main'; this.renderScreen(); }, 'width:120px;font-size:14px;margin-top:16px;');
    this.content.appendChild(createB);
    this.content.appendChild(joinB);
    this.content.appendChild(backB);
  }

  private buildMpCreate() {
    const title  = el('div','color:#FFD700;font-size:20px;font-family:'+FONT+';margin-bottom:16px;','ルームを作る');
    const status = el('div','color:#AAAACC;font-size:14px;font-family:'+FONT+';margin-bottom:16px;text-align:center;','サーバーに接続中…');
    this.content.appendChild(title);
    this.content.appendChild(status);

    const save = loadSave() ?? defaultSave(this.playerName || '勇者', CLASS_DEFS[this.selectedClass].name as ClassName);
    const player = {
      id: '', name: save.name, className: save.className,
      x: save.position.tileX, y: save.position.tileY,
      mapId: save.position.mapId,
      hp: save.stats.hp, maxHp: save.stats.maxHp,
      mp: save.stats.mp, maxMp: save.stats.maxMp,
      level: save.level, ready: false,
    };

    mpManager.connect().then(() => {
      player.id = mpManager.socketId;
      mpManager.createRoom(player as never);
      mpManager.on('room_created', (data: unknown) => {
        const d = data as { roomId: string };
        status.innerHTML = '';
        const box = el('div',`
          background:rgba(10,26,58,0.95);border:2px solid rgba(212,175,55,0.7);
          border-radius:6px;padding:16px 24px;text-align:center;margin-bottom:14px;
        `);
        box.innerHTML = `
          <div style="color:#AAAACC;font-size:12px;font-family:${FONT};">ルームID</div>
          <div style="color:#FFD700;font-size:28px;font-family:monospace;letter-spacing:8px;margin:6px 0;">${d.roomId}</div>
          <div style="color:#8888AA;font-size:12px;font-family:${FONT};">友達にこのIDを伝えてください</div>
        `;
        this.content.appendChild(box);
        const startB = btn('ゲームを開始！', () => {
          mpManager.setReady();
          this.onStart(save, { isMultiplayer: true, isHost: true });
        }, 'background:rgba(26,74,26,0.9);border-color:rgba(68,187,68,0.6);color:#AAFFAA;font-size:16px;');
        this.content.appendChild(startB);
      });
    }).catch(() => {
      status.textContent = '接続に失敗しました。シングルプレイで開始します。';
      setTimeout(() => { writeSave(save); this.onStart(save, { isMultiplayer: false }); }, 2000);
    });

    const backB = btn('← 戻る', () => { mpManager.disconnect(); this.screen='multiplayer'; this.renderScreen(); }, 'width:120px;font-size:14px;margin-top:16px;');
    this.content.appendChild(backB);
  }

  private buildMpJoin() {
    const title   = el('div','color:#FFD700;font-size:20px;font-family:'+FONT+';margin-bottom:16px;','ルームに参加');
    const display = el('div',`
      background:rgba(10,26,58,0.95);border:2px solid rgba(212,175,55,0.7);
      border-radius:4px;padding:10px 24px;
      font-size:24px;color:#FFD700;font-family:monospace;letter-spacing:8px;
      min-width:200px;text-align:center;margin-bottom:14px;
    `, (this.roomInput||'    ') + '▌');
    const status  = el('div','color:#FF8888;font-size:13px;font-family:'+FONT+';margin-bottom:10px;height:18px;');
    this.content.appendChild(title);
    this.content.appendChild(display);
    this.content.appendChild(status);

    const input = document.createElement('input');
    input.type='text'; input.maxLength=4; input.placeholder='XXXX';
    input.style.cssText='position:fixed;opacity:0;top:0;left:0;width:1px;height:1px;';
    document.body.appendChild(input);
    setTimeout(() => input.focus(), 100);
    input.addEventListener('input', () => {
      this.roomInput = input.value.toUpperCase();
      display.textContent = (this.roomInput || '    ') + '▌';
    });

    const joinB = btn('参加する', () => {
      if (this.roomInput.length < 4) { status.textContent='4文字のIDを入力してください'; return; }
      input.remove();
      status.style.color='#AAAACC';
      status.textContent='接続中…';
      const save = loadSave() ?? defaultSave(this.playerName||'旅人', CLASS_DEFS[this.selectedClass].name as ClassName);
      mpManager.connect().then(() => {
        const player = {
          id: mpManager.socketId, name: save.name, className: save.className,
          x: save.position.tileX, y: save.position.tileY, mapId: save.position.mapId,
          hp: save.stats.hp, maxHp: save.stats.maxHp, mp: save.stats.mp, maxMp: save.stats.maxMp,
          level: save.level, ready: false,
        };
        mpManager.joinRoom(this.roomInput, player as never);
        mpManager.on('room_joined', (data: unknown) => {
          const d = data as { roomId: string };
          mpManager.setReady();
          this.onStart(save, { isMultiplayer: true, isHost: false });
        });
        mpManager.on('error', (data: unknown) => {
          status.textContent = (data as { msg: string }).msg;
        });
      }).catch(() => status.textContent='サーバーに接続できません');
    }, 'font-size:16px;');

    const backB = btn('← 戻る', () => { input.remove(); this.screen='multiplayer'; this.renderScreen(); }, 'width:120px;font-size:14px;margin-top:8px;');
    this.content.appendChild(joinB);
    this.content.appendChild(backB);
  }

  private continueGame() {
    const save = loadSave();
    if (!save) return;
    this.onStart(save, { isMultiplayer: false });
  }

  private startNewGame() {
    const className = CLASS_DEFS[this.selectedClass].name as ClassName;
    const name = this.playerName.replace('▌','').trim() || '主人公';
    const save = defaultSave(name, className);
    writeSave(save);
    this.onStart(save, { isMultiplayer: false });
  }

  show() { this.root.style.display = 'flex'; }
  hide() { this.root.style.display = 'none'; }
  destroy() { this.root.remove(); }
}
