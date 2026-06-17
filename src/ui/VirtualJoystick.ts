import type { Direction } from '../types';

export type JoystickCallback = (dir: Direction | null) => void;

export class VirtualJoystick {
  private root: HTMLElement;
  private outer: HTMLElement;
  private knob: HTMLElement;

  private touchId: number | null = null;
  private pivotX = 0;
  private pivotY = 0;
  private currentDir: Direction | null = null;
  private repeatTimer: ReturnType<typeof setInterval> | null = null;
  private onDir: JoystickCallback;

  private readonly OUTER_R = 44;
  private readonly INNER_R = 20;
  private readonly DEAD = 10;
  private readonly REPEAT_MS = 140;

  constructor(container: HTMLElement, onDir: JoystickCallback) {
    this.onDir = onDir;

    // Touch zone covers the entire container area
    this.root = document.createElement('div');
    this.root.style.cssText = `
      position: absolute; inset: 0;
      pointer-events: auto;
    `;

    // Outer ring: initially hidden, positioned absolutely at touch point
    this.outer = document.createElement('div');
    this.outer.style.cssText = `
      display: none;
      position: absolute;
      width: ${this.OUTER_R * 2}px; height: ${this.OUTER_R * 2}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.10);
      border: 2px solid rgba(255,255,255,0.40);
      pointer-events: none;
    `;

    this.knob = document.createElement('div');
    this.knob.style.cssText = `
      position: absolute;
      width: ${this.INNER_R * 2}px; height: ${this.INNER_R * 2}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.60);
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    `;
    this.outer.appendChild(this.knob);
    this.root.appendChild(this.outer);
    container.appendChild(this.root);

    this.root.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchmove',  this.onTouchMove,  { passive: false });
    window.addEventListener('touchend',   this.onTouchEnd,   { passive: false });
    window.addEventListener('touchcancel',this.onTouchEnd,   { passive: false });

    // Mouse support for desktop
    this.root.addEventListener('mousedown', this.onMouseDown);
  }

  private onTouchStart = (e: TouchEvent) => {
    if (this.touchId !== null) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    this.touchId = touch.identifier;
    this.showAt(touch.clientX, touch.clientY);
    this.process(touch.clientX, touch.clientY);
  };

  private onTouchMove = (e: TouchEvent) => {
    if (this.touchId === null) return;
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        e.preventDefault();
        this.process(touch.clientX, touch.clientY);
        return;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        this.touchId = null;
        this.hide();
        return;
      }
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    this.showAt(e.clientX, e.clientY);
    this.process(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => this.process(ev.clientX, ev.clientY);
    const onUp   = () => {
      this.hide();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  private showAt(clientX: number, clientY: number) {
    this.pivotX = clientX;
    this.pivotY = clientY;
    const rect = this.root.getBoundingClientRect();
    this.outer.style.left = (clientX - rect.left - this.OUTER_R) + 'px';
    this.outer.style.top  = (clientY - rect.top  - this.OUTER_R) + 'px';
    this.outer.style.display = 'block';
    this.knob.style.transform = 'translate(-50%, -50%)';
  }

  private hide() {
    this.outer.style.display = 'none';
    this.setDir(null);
  }

  private process(clientX: number, clientY: number) {
    const dx = clientX - this.pivotX;
    const dy = clientY - this.pivotY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const r = this.OUTER_R;

    let kx = dx, ky = dy;
    if (dist > r) { kx = (dx / dist) * r; ky = (dy / dist) * r; }
    this.knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;

    if (dist < this.DEAD) { this.setDir(null); return; }

    // 8-way direction via angle sectors of 45°
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const a = ((angle % 360) + 360) % 360;
    let newDir: Direction;
    if      (a >= 337.5 || a < 22.5)  newDir = 'right';
    else if (a < 67.5)                 newDir = 'down-right';
    else if (a < 112.5)                newDir = 'down';
    else if (a < 157.5)                newDir = 'down-left';
    else if (a < 202.5)                newDir = 'left';
    else if (a < 247.5)                newDir = 'up-left';
    else if (a < 292.5)                newDir = 'up';
    else                               newDir = 'up-right';
    this.setDir(newDir);
  }

  private setDir(dir: Direction | null) {
    if (dir === this.currentDir) return;
    this.currentDir = dir;
    if (this.repeatTimer) { clearInterval(this.repeatTimer); this.repeatTimer = null; }
    this.onDir(dir);
    if (dir !== null) {
      this.repeatTimer = setInterval(() => this.onDir(this.currentDir), this.REPEAT_MS);
    }
  }

  destroy() {
    if (this.repeatTimer) clearInterval(this.repeatTimer);
    window.removeEventListener('touchmove',  this.onTouchMove);
    window.removeEventListener('touchend',   this.onTouchEnd);
    window.removeEventListener('touchcancel',this.onTouchEnd);
    this.root.remove();
  }
}
