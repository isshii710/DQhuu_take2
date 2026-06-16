import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';
import BootScene from './scenes/BootScene';
import TitleScene from './scenes/TitleScene';
import WorldScene from './scenes/WorldScene';
import BattleScene from './scenes/BattleScene';
import MenuScene from './scenes/MenuScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 4,
  },
  scene: [BootScene, TitleScene, WorldScene, BattleScene, MenuScene],
};

export default new Phaser.Game(config);
