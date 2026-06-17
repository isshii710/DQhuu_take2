import { SceneManager } from './engine/SceneManager';
import { preloadAllTextures } from './engine/TextureCache';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const uiContainer = document.getElementById('ui') as HTMLElement;

preloadAllTextures();

new SceneManager(canvas, uiContainer);
