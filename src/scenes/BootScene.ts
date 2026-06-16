import Phaser from 'phaser';
import { generatePlayerTextures, generateTileTextures, generateEnemyTextures } from '../sprites/TextureGenerator';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const { width: W, height: H } = this.scale;

    // Loading screen
    const bg = this.add.rectangle(W/2, H/2, W, H, COLORS.SKY);
    const title = this.add.text(W/2, H/2 - 40, 'アルデア伝説', {
      fontSize: '28px',
      color: '#FFD700',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const loading = this.add.text(W/2, H/2 + 20, 'ロード中…', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
    }).setOrigin(0.5);

    // Progress bar
    const barBg = this.add.rectangle(W/2, H/2 + 60, 200, 14, 0x333355);
    const bar   = this.add.rectangle(W/2 - 99, H/2 + 60, 2, 12, COLORS.BORDER).setOrigin(0, 0.5);

    // Generate all textures
    const steps = [
      () => generateTileTextures(this),
      () => generatePlayerTextures(this),
      () => generateEnemyTextures(this),
    ];

    let done = 0;
    const total = steps.length;

    const runNext = () => {
      if (done >= total) {
        this.time.delayedCall(300, () => this.scene.start('TitleScene'));
        return;
      }
      steps[done]();
      done++;
      bar.width = (done / total) * 198 + 2;
      loading.setText(`ロード中… ${Math.floor(done/total*100)}%`);
      this.time.delayedCall(50, runNext);
    };

    this.time.delayedCall(100, runNext);
  }
}
