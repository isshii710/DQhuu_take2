import type { CharacterSave, EnemyDef, Stats } from '../types';
import { getClassDef, calcStats, expForLevel } from '../data/characters';
import { getItem } from '../data/items';

export interface Combatant {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  mag: number;
  spd: number;
  isEnemy: boolean;
  statusEffects: Set<string>;
}

export interface BattleAction {
  actorId: string;
  type: 'attack' | 'magic' | 'item' | 'run' | 'skip';
  targetId?: string;
  spellName?: string;
  itemId?: string;
}

export interface ActionResult {
  actorId: string;
  targetId?: string;
  type: string;
  damage?: number;
  heal?: number;
  missed?: boolean;
  text: string;
}

export function buildCombatant(save: CharacterSave): Combatant {
  return {
    id: 'player',
    name: save.name,
    hp: save.stats.hp,
    maxHp: save.stats.maxHp,
    mp: save.stats.mp,
    maxMp: save.stats.maxMp,
    atk: save.stats.atk,
    def: save.stats.def,
    mag: save.stats.mag,
    spd: save.stats.spd,
    isEnemy: false,
    statusEffects: new Set(),
  };
}

export function buildEnemyCombatant(e: EnemyDef, index: number): Combatant {
  return {
    id: `enemy_${index}`,
    name: e.name,
    hp: e.hp,
    maxHp: e.hp,
    mp: 0,
    maxMp: 0,
    atk: e.atk,
    def: e.def,
    mag: e.mag,
    spd: e.spd,
    isEnemy: true,
    statusEffects: new Set(),
  };
}

export function resolveAction(actor: Combatant, action: BattleAction, target: Combatant): ActionResult {
  if (action.type === 'attack') {
    const variance = 0.9 + Math.random() * 0.2;
    const dmg = Math.max(1, Math.floor((actor.atk - target.def * 0.5) * variance));
    target.hp = Math.max(0, target.hp - dmg);
    return { actorId: actor.id, targetId: target.id, type: 'attack', damage: dmg, text: `${actor.name}の攻撃！ ${target.name}に${dmg}ダメージ！` };
  }

  if (action.type === 'magic') {
    const cls = getClassDef(action.spellName ?? '');
    const skill = getClassDef(action.spellName ?? '').skills[0]; // fallback
    const allSkills = getClassDef(action.spellName ?? '').skills;
    const s = allSkills.find(sk => sk.name === action.spellName) ?? allSkills[0];
    if (actor.mp < s.mpCost) {
      return { actorId: actor.id, type: 'magic', text: `${actor.name}はMPが足りない！` };
    }
    actor.mp = Math.max(0, actor.mp - s.mpCost);

    // healing spells
    if (action.spellName === 'ヒール' || action.spellName === '全体ヒール' || action.spellName === '復活の光') {
      const healAmt = Math.floor(actor.mag * s.magMult);
      target.hp = Math.min(target.maxHp, target.hp + healAmt);
      return { actorId: actor.id, targetId: target.id, type: 'magic_heal', heal: healAmt, text: `${actor.name}は${s.name}を唱えた！ ${target.name}のHPが${healAmt}回復した！` };
    }

    const variance = 0.9 + Math.random() * 0.2;
    const dmg = Math.max(1, Math.floor(actor.mag * s.magMult * variance - target.def * 0.3));
    target.hp = Math.max(0, target.hp - dmg);
    return { actorId: actor.id, targetId: target.id, type: 'magic', damage: dmg, text: `${actor.name}は${s.name}を唱えた！ ${target.name}に${dmg}のダメージ！` };
  }

  if (action.type === 'item') {
    const item = getItem(action.itemId ?? '');
    if (!item) return { actorId: actor.id, type: 'item', text: `${actor.name}はアイテムを使おうとした…` };
    if (item.hpRestore) {
      const heal = Math.min(item.hpRestore, target.maxHp - target.hp);
      target.hp = Math.min(target.maxHp, target.hp + heal);
      return { actorId: actor.id, targetId: target.id, type: 'item_heal', heal, text: `${actor.name}は${item.name}を使った！ ${target.name}のHPが${heal}回復した！` };
    }
    if (item.mpRestore) {
      const restore = Math.min(item.mpRestore, target.maxMp - target.mp);
      target.mp = Math.min(target.maxMp, target.mp + restore);
      return { actorId: actor.id, targetId: target.id, type: 'item_mp', heal: restore, text: `${actor.name}は${item.name}を使った！ ${target.name}のMPが${restore}回復した！` };
    }
  }

  if (action.type === 'run') {
    return { actorId: actor.id, type: 'run', text: `${actor.name}は逃げ出した！` };
  }

  return { actorId: actor.id, type: 'skip', text: '' };
}

export function enemyAI(enemy: Combatant, players: Combatant[]): BattleAction {
  const alive = players.filter(p => p.hp > 0);
  if (alive.length === 0) return { actorId: enemy.id, type: 'skip' };
  const target = alive[Math.floor(Math.random() * alive.length)];
  return { actorId: enemy.id, type: 'attack', targetId: target.id };
}

export function sortBySpeed(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort((a, b) => b.spd - a.spd + (Math.random() - 0.5));
}

export interface LevelUpResult {
  leveled: boolean;
  newLevel?: number;
  gains?: { hp: number; mp: number; atk: number; def: number; mag: number; spd: number };
}

export function applyExpGain(save: CharacterSave, exp: number): LevelUpResult {
  save.exp += exp;
  const required = expForLevel(save.level + 1);
  if (save.exp >= required && save.level < 50) {
    save.level++;
    const cls = getClassDef(save.className);
    const g = cls.growthPerLevel;
    save.stats.maxHp  += g.hp;
    save.stats.maxMp  += g.mp;
    save.stats.atk    += g.atk;
    save.stats.def    += g.def;
    save.stats.mag    += g.mag;
    save.stats.spd    += g.spd;
    save.stats.hp = save.stats.maxHp;
    save.stats.mp = save.stats.maxMp;
    return { leveled: true, newLevel: save.level, gains: g };
  }
  return { leveled: false };
}
