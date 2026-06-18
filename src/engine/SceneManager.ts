import type { CharacterSave, MapId } from '../types';
import { TitleScreen } from '../screens/TitleScreen';
import { WorldScreen, type BattleOpts } from '../screens/WorldScreen';
import { BattleScreen } from '../screens/BattleScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { writeSave } from '../systems/SaveSystem';
import { ENEMY_MAP } from '../data/enemies';

export class SceneManager {
  private titleScreen: TitleScreen;
  private worldScreen: WorldScreen;
  private battleScreen: BattleScreen;
  private menuScreen: MenuScreen;

  constructor(canvas: HTMLCanvasElement, uiContainer: HTMLElement) {
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
      (s, onClose, onFieldAction) => this.menuScreen.open(s, onClose, onFieldAction),
    );
  }

  private startBattle(battleOpts: BattleOpts) {
    this.worldScreen.deactivate();
    this.battleScreen.start(
      battleOpts.save,
      battleOpts.enemies,
      { isMultiplayer: battleOpts.isMultiplayer, isHost: battleOpts.isHost, returnMap: battleOpts.returnMap, onDefeat: battleOpts.onDefeat },
      (updatedSave, mapId) => this.endBattle(updatedSave, mapId as MapId, battleOpts)
    );
  }

  private endBattle(save: CharacterSave, mapId: MapId, battleOpts: BattleOpts) {
    this.battleScreen.hide();
    save.position.mapId = mapId;

    const victory = save.stats.hp > 0;
    this.worldScreen.updateMonsterBook(battleOpts.enemies, victory);

    if (victory && battleOpts.bossId) {
      const bossEnemy = ENEMY_MAP[battleOpts.bossId];
      if (bossEnemy?.drops?.length) {
        // Basic boss drop: 30% chance for first drop item
        if (Math.random() < 0.30) {
          const dropId = bossEnemy.drops[0];
          const entry = save.inventory.find(e => e.itemId === dropId);
          if (entry) entry.qty++;
          else save.inventory.push({ itemId: dropId, qty: 1 });
          writeSave(save);
        }
      }
    }

    this.startWorld(save, {
      isMultiplayer: battleOpts.isMultiplayer,
      isHost: battleOpts.isHost,
      fromBattle: true,
    });
  }
}
