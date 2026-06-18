import type { CharacterSave, MapId } from '../types';
import { TitleScreen } from '../screens/TitleScreen';
import { WorldScreen, type BattleOpts } from '../screens/WorldScreen';
import { BattleScreen } from '../screens/BattleScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { GachaScreen } from '../screens/GachaScreen';
import { CraftScreen } from '../screens/CraftScreen';
import { getBossDropRate, getBossLevel } from '../data/treasureMaps';
import { addItem } from '../systems/InventorySystem';
import { writeSave } from '../systems/SaveSystem';
import { ENEMY_MAP } from '../data/enemies';

const TMAP_BOSS_TO_MAP: Record<string, string> = {
  tmap_boss_1: 'tmap_1',
  tmap_boss_2: 'tmap_2',
  tmap_boss_3: 'tmap_3',
  tmap_boss_4: 'tmap_4',
  tmap_boss_5: 'tmap_5',
};

export class SceneManager {
  private titleScreen: TitleScreen;
  private worldScreen: WorldScreen;
  private battleScreen: BattleScreen;
  private menuScreen: MenuScreen;
  private gachaScreen: GachaScreen;
  private craftScreen: CraftScreen;

  constructor(canvas: HTMLCanvasElement, uiContainer: HTMLElement) {
    this.worldScreen  = new WorldScreen(canvas, uiContainer);
    this.battleScreen = new BattleScreen(uiContainer);
    this.menuScreen   = new MenuScreen(uiContainer);
    this.gachaScreen  = new GachaScreen(uiContainer);
    this.craftScreen  = new CraftScreen(uiContainer);
    this.titleScreen  = new TitleScreen(uiContainer, (save, opts) => this.startWorld(save, opts));
  }

  private startWorld(
    save: CharacterSave,
    opts: { isMultiplayer: boolean; isHost?: boolean; fromBattle?: boolean }
  ) {
    this.titleScreen.hide();

    const openGacha = () => {
      this.menuScreen.hide();
      this.gachaScreen.open(save, (updated) => {
        save = updated;
        this.startWorld(save, opts);
      });
    };

    const openCraft = () => {
      this.menuScreen.hide();
      this.craftScreen.open(save, (updated) => {
        save = updated;
        this.startWorld(save, opts);
      });
    };

    const enterMap = (mapId: MapId) => {
      this.menuScreen.hide();
      save.position.mapId = mapId;
      save.position.tileX = 7;
      save.position.tileY = 2;
      this.startWorld(save, { isMultiplayer: opts.isMultiplayer, isHost: opts.isHost });
    };

    this.worldScreen.activate(
      save,
      opts,
      battleOpts => this.startBattle(battleOpts),
      (s, onClose, onFieldAction, onOpenGacha, onOpenCraft, onEnterMap) =>
        this.menuScreen.open(s, onClose, onFieldAction, onOpenGacha, onOpenCraft, onEnterMap),
      openGacha,
      openCraft,
      enterMap,
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
      const rawBossId = battleOpts.bossId;
      const progressId = TMAP_BOSS_TO_MAP[rawBossId] ?? rawBossId;

      if (!save.bossProgress) save.bossProgress = {};
      const prog = save.bossProgress[progressId] ?? { count: 0, level: 1 };
      prog.count++;
      prog.level = getBossLevel(prog.count);
      save.bossProgress[progressId] = prog;

      const dropRate = getBossDropRate(prog.level);
      if (Math.random() < dropRate) {
        const enemy = ENEMY_MAP[rawBossId];
        if (enemy?.drops?.length) {
          const mat = enemy.drops[0];
          addItem(save, mat);
        }
      }

      writeSave(save);
    }

    this.startWorld(save, {
      isMultiplayer: battleOpts.isMultiplayer,
      isHost: battleOpts.isHost,
      fromBattle: true,
    });
  }
}
