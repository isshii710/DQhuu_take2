import type { CharacterSave, PartyMember } from '../types';
import { PARTY_MEMBER_DEFS, getPartyMemberDef, createPartyMember } from '../data/partyMembers';
import { getClassDef, expForLevel } from '../data/characters';

export const MAX_PARTY_COMPANIONS = 8;
export const MAX_ACTIVE_COMPANIONS = 3; // プレイヤー含めて4人

/** プレイヤー + アクティブな仲間（最大3人）のPartyMember配列を返す */
export function getActiveCompanions(save: CharacterSave): PartyMember[] {
  return save.party.filter(m => save.activeMemberIds.includes(m.id));
}

/** 加入済みかチェック */
export function isRecruited(save: CharacterSave, memberId: string): boolean {
  return save.party.some(m => m.id === memberId);
}

/** 加入条件を満たしているかチェック（未加入かつフラグ済み） */
export function isRecruitable(save: CharacterSave, memberId: string): boolean {
  if (isRecruited(save, memberId)) return false;
  const def = getPartyMemberDef(memberId);
  if (!def) return false;
  return !!save.flags[def.joinFlag];
}

/** 仲間に加入させる。成功したらtrueを返す。アクティブ枠が空いていれば自動でアクティブにする */
export function recruitMember(save: CharacterSave, memberId: string): boolean {
  if (isRecruited(save, memberId)) return false;
  const def = getPartyMemberDef(memberId);
  if (!def) return false;

  const member = createPartyMember(def, def.joinLevel);
  save.party.push(member);

  // アクティブ枠が空いていれば自動でアクティブにする
  if (save.activeMemberIds.length < MAX_ACTIVE_COMPANIONS) {
    save.activeMemberIds.push(member.id);
  }

  return true;
}

/** 仲間をアクティブ（出撃）にする */
export function setActive(save: CharacterSave, memberId: string): void {
  if (save.activeMemberIds.includes(memberId)) return;
  if (save.activeMemberIds.length >= MAX_ACTIVE_COMPANIONS) return;
  if (!save.party.some(m => m.id === memberId)) return;
  save.activeMemberIds.push(memberId);
}

/** 仲間をベンチ（控え）に移す */
export function setBench(save: CharacterSave, memberId: string): void {
  const idx = save.activeMemberIds.indexOf(memberId);
  if (idx === -1) return;
  save.activeMemberIds.splice(idx, 1);
}

/** アクティブな仲間のEXP付与・レベルアップ。レベルアップしたメンバーのリストを返す */
export function givePartyExp(save: CharacterSave, exp: number): { name: string; newLevel: number }[] {
  const leveled: { name: string; newLevel: number }[] = [];
  const activeCompanions = getActiveCompanions(save);

  for (const member of activeCompanions) {
    member.exp += exp;
    const required = expForLevel(member.level + 1);
    if (member.exp >= required && member.level < 50) {
      member.level++;
      const cls = getClassDef(member.className);
      const g = cls.growthPerLevel;
      member.stats.maxHp  += g.hp;
      member.stats.maxMp  += g.mp;
      member.stats.atk    += g.atk;
      member.stats.def    += g.def;
      member.stats.mag    += g.mag;
      member.stats.spd    += g.spd;
      member.stats.hp = member.stats.maxHp;
      member.stats.mp = member.stats.maxMp;
      leveled.push({ name: member.name, newLevel: member.level });
    }
  }

  return leveled;
}
