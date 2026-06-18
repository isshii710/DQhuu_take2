import type { CharacterSave } from '../types';
import { QUESTS } from '../data/quests';
import { addItem } from './InventorySystem';
import { writeSave } from './SaveSystem';

export function checkQuestCompletion(save: CharacterSave): string[] {
  if (!save.completedQuests) save.completedQuests = [];
  if (!save.questKills) save.questKills = {};

  const newlyCompleted: string[] = [];

  for (const quest of QUESTS) {
    if (save.completedQuests.includes(quest.id)) continue;

    let completed = false;
    if (quest.killTarget === 'any') {
      const total = Object.values(save.questKills).reduce((s, n) => s + n, 0);
      completed = total >= (quest.killCount ?? 1);
    } else if (quest.killTarget) {
      completed = (save.questKills[quest.killTarget] ?? 0) >= (quest.killCount ?? 1);
    }

    if (completed) {
      save.completedQuests.push(quest.id);
      newlyCompleted.push(quest.id);
      if (quest.rewardGold) save.gold += quest.rewardGold;
      if (quest.rewardItems) {
        for (const itemId of quest.rewardItems) addItem(save, itemId);
      }
      if (quest.rewardFlag) {
        if (!save.flags) save.flags = {};
        save.flags[quest.rewardFlag] = true;
      }
    }
  }

  if (newlyCompleted.length > 0) writeSave(save);
  return newlyCompleted;
}
