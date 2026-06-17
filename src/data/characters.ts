import type { ClassDef } from '../types';

export const CLASS_DEFS: ClassDef[] = [
  {
    name: '戦士',
    desc: '剣と盾で戦う正統派の戦士。HPと防御力が高く、前線で活躍する。',
    baseStats: { hp: 45, mp: 10, atk: 14, def: 12, mag: 4, spd: 8 },
    growthPerLevel: { hp: 8, mp: 2, atk: 3, def: 2, mag: 1, spd: 1 },
    skills: [
      { level: 3,  name: 'かまいたち',  mpCost: 5,  desc: '風の刃で全体を攻撃',       magMult: 1.2 },
      { level: 6,  name: '大地割り',    mpCost: 8,  desc: '地面を砕いて敵を怯ませる', magMult: 1.5 },
      { level: 10, name: '聖剣の一撃',  mpCost: 15, desc: '聖なる力で大ダメージ',     magMult: 2.5 },
    ],
    spriteBase: 0,
  },
  {
    name: '魔法使い',
    desc: '強力な攻撃魔法を操る。MPが多く、魔力が高いが体力は低い。',
    baseStats: { hp: 25, mp: 35, atk: 5, def: 4, mag: 16, spd: 10 },
    growthPerLevel: { hp: 4, mp: 6, atk: 1, def: 1, mag: 4, spd: 1 },
    skills: [
      { level: 1,  name: 'ファイア',   mpCost: 4,  desc: '炎の魔法',                   magMult: 1.8 },
      { level: 4,  name: 'ブリザード', mpCost: 8,  desc: '氷の魔法で全体攻撃',         magMult: 1.5 },
      { level: 8,  name: 'サンダー',   mpCost: 12, desc: '雷を落として大ダメージ',      magMult: 2.2 },
      { level: 12, name: 'メテオ',     mpCost: 22, desc: '隕石を落として全体に大打撃', magMult: 3.5 },
    ],
    spriteBase: 1,
  },
  {
    name: '回復師',
    desc: '仲間を癒やす回復魔法のエキスパート。MPが多く、サポートに特化。',
    baseStats: { hp: 32, mp: 30, atk: 7, def: 8, mag: 12, spd: 9 },
    growthPerLevel: { hp: 6, mp: 5, atk: 1, def: 2, mag: 3, spd: 1 },
    skills: [
      { level: 1,  name: 'ヒール',     mpCost: 4,  desc: '仲間のHPを回復',              magMult: 2.0 },
      { level: 3,  name: 'ライトアロー',mpCost: 6, desc: '聖なる矢で攻撃',              magMult: 1.6 },
      { level: 7,  name: '全体ヒール', mpCost: 12, desc: '全員のHPを回復',              magMult: 1.8 },
      { level: 11, name: '復活の光',   mpCost: 20, desc: '倒れた仲間を蘇生し全回復',   magMult: 3.0 },
    ],
    spriteBase: 2,
  },
  {
    name: '盗賊',
    desc: '素早い動きで敵の目をかく乱。スピードが高く、アイテムを盗む技を持つ。',
    baseStats: { hp: 30, mp: 18, atk: 11, def: 7, mag: 6, spd: 16 },
    growthPerLevel: { hp: 5, mp: 3, atk: 2, def: 1, mag: 1, spd: 3 },
    skills: [
      { level: 2,  name: '二連撃',     mpCost: 4,  desc: '素早く2回攻撃',              magMult: 0.8 },
      { level: 5,  name: '毒針',       mpCost: 6,  desc: '毒を盛って継続ダメージ',      magMult: 1.0 },
      { level: 9,  name: 'シャドウダッシュ', mpCost: 10, desc: '影に潜り大ダメージ',   magMult: 2.0 },
    ],
    spriteBase: 3,
  },
];

export function getClassDef(name: string): ClassDef {
  return CLASS_DEFS.find(c => c.name === name) ?? CLASS_DEFS[0];
}

export function calcStats(cls: ClassDef, level: number) {
  const g = cls.growthPerLevel;
  return {
    maxHp:  cls.baseStats.hp  + g.hp  * (level - 1),
    maxMp:  cls.baseStats.mp  + g.mp  * (level - 1),
    atk:    cls.baseStats.atk + g.atk * (level - 1),
    def:    cls.baseStats.def + g.def * (level - 1),
    mag:    cls.baseStats.mag + g.mag * (level - 1),
    spd:    cls.baseStats.spd + g.spd * (level - 1),
  };
}

export function expForLevel(level: number): number {
  return Math.floor(level * level * 12 * 1.2);
}
