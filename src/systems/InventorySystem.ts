import type { CharacterSave, Equipment, InventoryEntry, ItemDef, PartyMember } from '../types';
import { getItem } from '../data/items';

export function addItem(save: CharacterSave, itemId: string, qty = 1): void {
  const entry = save.inventory.find(e => e.itemId === itemId);
  if (entry) {
    entry.qty += qty;
  } else {
    save.inventory.push({ itemId, qty });
  }
}

export function removeItem(save: CharacterSave, itemId: string, qty = 1): boolean {
  const entry = save.inventory.find(e => e.itemId === itemId);
  if (!entry || entry.qty < qty) return false;
  entry.qty -= qty;
  if (entry.qty === 0) {
    save.inventory = save.inventory.filter(e => e.itemId !== itemId);
  }
  return true;
}

export function hasItem(save: CharacterSave, itemId: string): boolean {
  return (save.inventory.find(e => e.itemId === itemId)?.qty ?? 0) > 0;
}

export function equipItem(save: CharacterSave, itemId: string): string | null {
  const item = getItem(itemId);
  if (!item) return '不明なアイテムです';
  if (item.type === 'consumable') return 'このアイテムは装備できません';

  const slot = item.type as keyof Equipment;
  const prev = save.equipment[slot];

  // Swap: return old equip to inventory
  if (prev) addItem(save, prev);

  save.equipment[slot] = itemId;
  removeItem(save, itemId);

  // Recalc derived stats from equipment
  recalcEquipStats(save);
  return null;
}

export function unequipSlot(save: CharacterSave, slot: keyof Equipment): void {
  const itemId = save.equipment[slot];
  if (!itemId) return;
  addItem(save, itemId);
  save.equipment[slot] = null;
  recalcEquipStats(save);
}

export function memberEquipItem(save: CharacterSave, member: PartyMember, itemId: string): string | null {
  const item = getItem(itemId);
  if (!item) return '不明なアイテムです';
  if (item.type === 'consumable') return 'このアイテムは装備できません';
  const slot = item.type as keyof Equipment;
  const prev = member.equipment[slot];
  if (prev) addItem(save, prev);
  member.equipment[slot] = itemId;
  removeItem(save, itemId);
  return null;
}

export function memberUnequipSlot(save: CharacterSave, member: PartyMember, slot: keyof Equipment): void {
  const itemId = member.equipment[slot];
  if (!itemId) return;
  addItem(save, itemId);
  member.equipment[slot] = null;
}

export function recalcEquipStats(save: CharacterSave): void {
  // Equipment bonuses are additive on top of base class stats
  // (stats are stored directly on save.stats; base stats already from level-up)
  // We just note that equipment bonuses are factored in BattleScene for display
}

export function totalEquipBonus(save: CharacterSave): { atk: number; def: number; mag: number; spd: number; mhp: number; mmp: number } {
  const bonus = { atk: 0, def: 0, mag: 0, spd: 0, mhp: 0, mmp: 0 };
  for (const itemId of Object.values(save.equipment)) {
    if (!itemId) continue;
    const item = getItem(itemId);
    if (!item) continue;
    bonus.atk += item.atk ?? 0;
    bonus.def += item.def ?? 0;
    bonus.mag += item.mag ?? 0;
    bonus.spd += item.spd ?? 0;
    bonus.mhp += item.mhp ?? 0;
    bonus.mmp += item.mmp ?? 0;
  }
  return bonus;
}

export function effectiveStats(save: CharacterSave) {
  const b = totalEquipBonus(save);
  return {
    hp:    save.stats.hp,
    maxHp: save.stats.maxHp + b.mhp,
    mp:    save.stats.mp,
    maxMp: save.stats.maxMp + b.mmp,
    atk:   save.stats.atk + b.atk,
    def:   save.stats.def + b.def,
    mag:   save.stats.mag + b.mag,
    spd:   save.stats.spd + b.spd,
  };
}

export function memberTotalEquipBonus(equipment: Equipment): { atk: number; def: number; mag: number; spd: number; mhp: number; mmp: number } {
  const bonus = { atk: 0, def: 0, mag: 0, spd: 0, mhp: 0, mmp: 0 };
  for (const itemId of Object.values(equipment)) {
    if (!itemId) continue;
    const item = getItem(itemId);
    if (!item) continue;
    bonus.atk += item.atk ?? 0;
    bonus.def += item.def ?? 0;
    bonus.mag += item.mag ?? 0;
    bonus.spd += item.spd ?? 0;
    bonus.mhp += item.mhp ?? 0;
    bonus.mmp += item.mmp ?? 0;
  }
  return bonus;
}

export function memberEffectiveStats(member: PartyMember) {
  const b = memberTotalEquipBonus(member.equipment);
  return {
    hp:    member.stats.hp,
    maxHp: member.stats.maxHp + b.mhp,
    mp:    member.stats.mp,
    maxMp: member.stats.maxMp + b.mmp,
    atk:   member.stats.atk + b.atk,
    def:   member.stats.def + b.def,
    mag:   member.stats.mag + b.mag,
    spd:   member.stats.spd + b.spd,
  };
}
