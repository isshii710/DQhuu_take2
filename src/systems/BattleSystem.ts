import type { CharacterSave, EnemyDef, PartyMember } from '../types';
import { getClassDef, expForLevel } from '../data/characters';
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

export function buildPartyMemberCombatant(member: PartyMember, index: number): Combatant {
  return {
    id: `party_${member.id}`,
    name: member.name,
    hp: member.stats.hp,
    maxHp: member.stats.maxHp,
    mp: member.stats.mp,
    maxMp: member.stats.maxMp,
    atk: member.stats.atk,
    def: member.stats.def,
    mag: member.stats.mag,
    spd: member.stats.spd,
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
    // If attacker is blind, 40% chance to miss
    if (actor.statusEffects.has('blind') && Math.random() < 0.4) {
      return { actorId: actor.id, targetId: target.id, type: 'attack', missed: true, text: `${actor.name}の攻撃！ しかし外れた！` };
    }
    const variance = 0.9 + Math.random() * 0.2;
    const atkMult = actor.statusEffects.has('atk_up') ? 1.5 : 1.0;
    const defMult = target.statusEffects.has('def_up2') ? 0.4 : target.statusEffects.has('def_up') ? 0.6 : 1.0;
    const spdPenalty = target.statusEffects.has('slow') ? 0.85 : 1.0;
    const dmg = Math.max(1, Math.floor((actor.atk * atkMult - target.def * 0.5 * defMult) * variance * spdPenalty));
    target.hp = Math.max(0, target.hp - dmg);
    actor.statusEffects.delete('atk_up'); // one-shot buff
    return { actorId: actor.id, targetId: target.id, type: 'attack', damage: dmg, text: `${actor.name}の攻撃！ ${target.name}に${dmg}ダメージ！` };
  }

  if (action.type === 'magic') {
    const cls = getClassDef(action.spellName ?? '');
    const s = cls.skills.find(sk => sk.name === action.spellName) ?? cls.skills[0];
    if (actor.mp < s.mpCost) {
      return { actorId: actor.id, type: 'magic', text: `${actor.name}はMPが足りない！` };
    }
    actor.mp = Math.max(0, actor.mp - s.mpCost);

    // Buff: 鼓舞 → actor gains atk_up
    if (action.spellName === '鼓舞') {
      actor.statusEffects.add('atk_up');
      return { actorId: actor.id, targetId: target.id, type: 'magic_buff', text: `${actor.name}は鼓舞した！次の攻撃力が上がった！` };
    }

    // Buff: バリア → target gains def_up
    if (action.spellName === 'バリア') {
      target.statusEffects.add('def_up');
      return { actorId: actor.id, targetId: target.id, type: 'magic_buff', text: `${actor.name}はバリアを唱えた！${target.name}の防御力が上がった！` };
    }

    // Buff: スカラ → target gains def_up2 (stronger defense)
    if (action.spellName === 'スカラ') {
      target.statusEffects.add('def_up2');
      return { actorId: actor.id, targetId: target.id, type: 'magic_buff', text: `${actor.name}はスカラを唱えた！${target.name}の守備力が大幅に上がった！` };
    }

    // Debuff: スロウ → target gains slow
    if (action.spellName === 'スロウ') {
      target.statusEffects.add('slow');
      return { actorId: actor.id, targetId: target.id, type: 'magic_debuff', text: `${actor.name}はスロウを唱えた！${target.name}の素早さが下がった！` };
    }

    // Debuff: マヌーサ → target gains blind
    if (action.spellName === 'マヌーサ') {
      target.statusEffects.add('blind');
      return { actorId: actor.id, targetId: target.id, type: 'magic_debuff', text: `${actor.name}はマヌーサを唱えた！${target.name}は幻惑された！` };
    }

    // Debuff: ラリホー → 70% chance sleep
    if (action.spellName === 'ラリホー') {
      if (Math.random() < 0.7) {
        target.statusEffects.add('sleep');
        return { actorId: actor.id, targetId: target.id, type: 'magic_debuff', text: `${actor.name}はラリホーを唱えた！${target.name}は眠りについた…` };
      } else {
        return { actorId: actor.id, targetId: target.id, type: 'magic_debuff', text: `${actor.name}はラリホーを唱えた！しかし${target.name}には効かなかった` };
      }
    }

    // Debuff: 煙幕 → target gains confuse
    if (action.spellName === '煙幕') {
      target.statusEffects.add('confuse');
      return { actorId: actor.id, targetId: target.id, type: 'magic_debuff', text: `${actor.name}は煙幕を張った！${target.name}は混乱した！` };
    }

    // Debuff: 毒針 → target gains poison (handled per-turn elsewhere)
    if (action.spellName === '毒針') {
      target.statusEffects.add('poison');
      const dmg = Math.max(1, Math.floor(actor.mag * s.magMult * (0.9 + Math.random() * 0.2)));
      target.hp = Math.max(0, target.hp - dmg);
      return { actorId: actor.id, targetId: target.id, type: 'magic_debuff', damage: dmg, text: `${actor.name}は毒針を放った！${target.name}に${dmg}ダメージ＋毒！` };
    }

    // ベホマ: fully restore HP
    if (action.spellName === 'ベホマ') {
      const healed = target.maxHp - target.hp;
      target.hp = target.maxHp;
      return { actorId: actor.id, targetId: target.id, type: 'magic_heal', heal: healed, text: `${actor.name}はベホマを唱えた！${target.name}のHPが完全回復した！` };
    }

    // Healing spells
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

export function applyTurnStartEffects(combatant: Combatant): { skip: boolean; text: string; damage?: number } {
  // Poison: 15 damage each turn
  if (combatant.statusEffects.has('poison')) {
    const dmg = 15;
    combatant.hp = Math.max(0, combatant.hp - dmg);
    return { skip: false, text: `${combatant.name}は毒で${dmg}ダメージを受けた！`, damage: dmg };
  }
  // Sleep: 50% chance to wake up
  if (combatant.statusEffects.has('sleep')) {
    if (Math.random() < 0.5) {
      combatant.statusEffects.delete('sleep');
      return { skip: false, text: `${combatant.name}は目覚めた！` };
    }
    return { skip: true, text: `${combatant.name}は眠っている…` };
  }
  // Paralysis: 40% chance to skip
  if (combatant.statusEffects.has('paralysis')) {
    if (Math.random() < 0.4) {
      return { skip: true, text: `${combatant.name}は体が動かない！` };
    }
  }
  return { skip: false, text: '' };
}

export function isAllDefeated(combatants: Combatant[]): boolean {
  return combatants.every(c => c.hp <= 0);
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
  if (save.exp >= required && save.level < 99) {
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
