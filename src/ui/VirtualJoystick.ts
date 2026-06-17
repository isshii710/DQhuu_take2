import type { Direction } from '../types';

export type JoystickCallback = (dir: Direction | null) => void;

export class VirtualJoystick {
  private root: HTMLElement;
  private outer: HTMLElement;
  private knob: HTMLElement;
  private zone: HTMLElement;

  private active = false;
  private centerX = 0;
  private centerY = 0;
  private currentDir: Direction | null = null;
  private repeatTimer: ReturnType<typeof setInterval> | null = null;
  private onDir: JoystickCallback;

  private readonly OUTER_R = 44;
  private readonly INNER_R = 20;
  private readonly DEAD = 10;
  private readonly REPEAT_MS = 150;

  constructor(container: HTMLElement, onDir: JoystickCallback) {
    this.onDir = onDir;

    this.root = document.createElement('div');
    this.root.style.cssText = `
      position: absolute;
      bottom: 0; left: 0;
      width: 50%; height: 100px;
      pointer-events: auto;
      display: flex; align-items: center; justify-content: flex-start;
      padding-left: 28px;
    `;

    this.outer = document.createElement('div');
    this.outer.style.cssText = `
      width: ${this.OUTER_R*2}px; height: ${this.OUTER_R*2}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.10);
      border: 2px solid rgba(255,255,255,0.28);
      position: relative;
      flex-shrink: 0;
      pointer-events: auto;
    `;

    this.knob = document.createElement('div');
    this.knob.style.cssText = `
      position: absolute;
      width: ${this.INNER_R*2}px; height: ${this.INNER_R*2}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.55);
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: none;
    `;
    this.outer.appendChild(this.knob);

    // Large transparent touch zone
    this.zone = document.createElement('div');
    this.zone.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: auto;
    `;

    this.root.appendChild(this.outer);
    this.root.appendChild(this.zone);
    container.appendChild(this.root);

    this.zone.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.zone.addEventListener('touchmove',  this.onTouchMove,  { passive: false });
    this.zone.addEventListener('touchend',   this.onTouchEnd,   { passive: false });
    this.zone.addEventListener('touchcancel',this.onTouchEnd,   { passive: false });

    // Mouse support for desktop testing
    this.zone.addEventListener('mousedown', this.onMouseDown);
  }

  private getBounds() {
    const rect = this.outer.getBoundingClientRect();
    return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
  }

  private process(clientX: number, clientY: number) {
    const { cx, cy } = this.getBounds();
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const r = this.OUTER_R;

    if (dist > r) { dx = (dx/dist)*r; dy = (dy/dist)*r; }
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    if (dist < this.DEAD) {
      this.setDir(null);
      return;
    }
    const newDir: Direction = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'right' : 'left')
      : (dy > 0 ? 'down' : 'up');
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

  private resetKnob() {
    this.knob.style.transform = 'translate(-50%, -50%)';
    this.setDir(null);
    this.active = false;
  }

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    this.active = true;
    const t = e.touches[0];
    this.process(t.clientX, t.clientY);
  };
  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.active) return;
    const t = e.touches[0];
    this.process(t.clientX, t.clientY);
  };
  private onTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    this.resetKnob();
  };

  // ─── Mouse (desktop) ─────────────────────────────────────────────────────

  private onMouseDown = (e: MouseEvent) => {
    this.active = true;
    this.process(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => { if (this.active) this.process(ev.clientX, ev.clientY); };
    const onUp   = () => { this.resetKnob(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  destroy() {
    if (this.repeatTimer) clearInterval(this.repeatTimer);
    this.root.remove();
  }
}
