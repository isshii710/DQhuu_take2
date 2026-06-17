import type { CharacterSave, MapId } from '../types';
import { TitleScreen } from '../screens/TitleScreen';
import { WorldScreen, type BattleOpts } from '../screens/WorldScreen';
import { BattleScreen } from '../screens/BattleScreen';
import { MenuScreen } from '../screens/MenuScreen';

export class SceneManager {
  private titleScreen: TitleScreen;
  private worldScreen: WorldScreen;
  private battleScreen: BattleScreen;
  private menuScreen: MenuScreen;

  constructor(canvas: HTMLCanvasElement, uiContainer: HTMLElement) {
    // Build screens in this order so title sits on top in DOM z-order
    this.worldScreen  = new WorldScreen(canvas, uiContainer);
    this.battleScreen = new BattleScreen(uiContainer);
    this.menuScreen   = new MenuScreen(uiContainer);
    this.titleScreen  = new TitleScreen(uiContainer, (save, opts) => this.startWorld(save, opts));
  }

  private startWorld(
    save: CharacterSave,
    opts: { isMultiplayer: boolean; isHost?: boolean; fromBattle?: boolean }
  ) {
    this.titleScreen.hide();
    this.worldScreen.activate(
      save,
      opts,
      battleOpts => this.startBattle(battleOpts),
      (s, onClose) => this.menuScreen.open(s, onClose)
    );
  }

  private startBattle(battleOpts: BattleOpts) {
    this.worldScreen.deactivate();
    this.battleScreen.start(
      battleOpts.save,
      battleOpts.enemies,
      { isMultiplayer: battleOpts.isMultiplayer, isHost: battleOpts.isHost, returnMap: battleOpts.returnMap },
      (updatedSave, mapId) => this.endBattle(updatedSave, mapId as MapId, battleOpts)
    );
  }

  private endBattle(save: CharacterSave, mapId: MapId, battleOpts: BattleOpts) {
    this.battleScreen.hide();
    save.position.mapId = mapId;
    this.startWorld(save, {
      isMultiplayer: battleOpts.isMultiplayer,
      isHost: battleOpts.isHost,
      fromBattle: true,
    });
  }
}
