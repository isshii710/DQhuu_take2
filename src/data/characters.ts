import type { ClassDef } from '../types';

export const CLASS_DEFS: ClassDef[] = [
  {
    name: '戦士',
    desc: '剣と盾で戦う正統派の戦士。HPと防御力が高く、前線で活躍する。',
    baseStats: { hp: 45, mp: 10, atk: 14, def: 12, mag: 4, spd: 8 },
    growthPerLevel: { hp: 8, mp: 2, atk: 3, def: 2, mag: 1, spd: 1 },
    skills: [
      { level: 3,  name: 'かまいたち',  mpCost: 5,  desc: '風の刃で全体を攻撃',         magMult: 1.2, targetType: 'enemy' },
      { level: 5,  name: '鼓舞',        mpCost: 6,  desc: '気合を入れて次の攻撃力UP',   magMult: 0, targetType: 'self' },
      { level: 6,  name: '大地割り',    mpCost: 8,  desc: '地面を砕いて敵を怯ませる',   magMult: 1.5, targetType: 'enemy' },
      { level: 10, name: '聖剣の一撃',  mpCost: 15, desc: '聖なる力で大ダメージ',       magMult: 2.5, targetType: 'enemy' },
    ],
    spriteBase: 0,
  },
  {
    name: '魔法使い',
    desc: '強力な攻撃魔法を操る。MPが多く、魔力が高いが体力は低い。',
    baseStats: { hp: 25, mp: 35, atk: 5, def: 4, mag: 16, spd: 10 },
    growthPerLevel: { hp: 4, mp: 6, atk: 1, def: 1, mag: 4, spd: 1 },
    skills: [
      { level: 1,  name: 'ファイア',   mpCost: 4,  desc: '炎の魔法',                    magMult: 1.8, targetType: 'enemy' },
      { level: 3,  name: 'スロウ',     mpCost: 5,  desc: '敵の素早さを下げるデバフ',    magMult: 0,   targetType: 'enemy' },
      { level: 4,  name: 'ブリザード', mpCost: 8,  desc: '氷の魔法で全体攻撃',          magMult: 1.5, targetType: 'enemy' },
      { level: 5,  name: 'ギラ',       mpCost: 7,  desc: '炎で全体を攻撃',              magMult: 1.4, targetType: 'all_enemies' },
      { level: 7,  name: 'イオ',       mpCost: 12, desc: '爆発で全体に大ダメージ',      magMult: 2.0, targetType: 'all_enemies' },
      { level: 8,  name: 'サンダー',   mpCost: 12, desc: '雷を落として大ダメージ',       magMult: 2.2, targetType: 'enemy' },
      { level: 9,  name: 'マヌーサ',   mpCost: 8,  desc: '敵を幻惑し命中率を下げる',    magMult: 0,   targetType: 'enemy' },
      { level: 11, name: 'ラリホー',   mpCost: 9,  desc: '敵を眠りに誘う',              magMult: 0,   targetType: 'enemy' },
      { level: 12, name: 'メテオ',     mpCost: 22, desc: '隕石を落として全体に大打撃',  magMult: 3.5, targetType: 'enemy' },
    ],
    spriteBase: 1,
  },
  {
    name: '回復師',
    desc: '仲間を癒やす回復魔法のエキスパート。MPが多く、サポートに特化。',
    baseStats: { hp: 32, mp: 30, atk: 7, def: 8, mag: 12, spd: 9 },
    growthPerLevel: { hp: 6, mp: 5, atk: 1, def: 2, mag: 3, spd: 1 },
    skills: [
      { level: 1,  name: 'ヒール',     mpCost: 4,  desc: '仲間のHPを回復',               magMult: 2.0, targetType: 'ally' },
      { level: 3,  name: 'ライトアロー',mpCost: 6, desc: '聖なる矢で攻撃',               magMult: 1.6, targetType: 'enemy' },
      { level: 4,  name: 'バリア',     mpCost: 6,  desc: '仲間の防御力を上げるバフ',     magMult: 0,   targetType: 'ally' },
      { level: 5,  name: 'スカラ',     mpCost: 7,  desc: '仲間の守備力を大幅アップ',     magMult: 0,   targetType: 'ally' },
      { level: 7,  name: '全体ヒール', mpCost: 12, desc: '全員のHPを回復',               magMult: 1.8, targetType: 'all_allies' },
      { level: 9,  name: 'ベホマ',     mpCost: 15, desc: '仲間のHPを完全回復',           magMult: 99,  targetType: 'ally' },
      { level: 11, name: '復活の光',   mpCost: 20, desc: '倒れた仲間を蘇生し全回復',    magMult: 3.0, targetType: 'ally' },
    ],
    spriteBase: 2,
  },
  {
    name: '盗賊',
    desc: '素早い動きで敵の目をかく乱。スピードが高く、アイテムを盗む技を持つ。',
    baseStats: { hp: 30, mp: 18, atk: 11, def: 7, mag: 6, spd: 16 },
    growthPerLevel: { hp: 5, mp: 3, atk: 2, def: 1, mag: 1, spd: 3 },
    skills: [
      { level: 2,  name: '二連撃',          mpCost: 4,  desc: '素早く2回攻撃',           magMult: 0.8, targetType: 'enemy' },
      { level: 5,  name: '毒針',            mpCost: 6,  desc: '毒を盛って継続ダメージ',  magMult: 1.0, targetType: 'enemy' },
      { level: 7,  name: '煙幕',            mpCost: 8,  desc: '混乱させて敵を惑わす',    magMult: 0,   targetType: 'enemy' },
      { level: 9,  name: 'シャドウダッシュ', mpCost: 10, desc: '影に潜り大ダメージ',    magMult: 2.0, targetType: 'enemy' },
    ],
    spriteBase: 3,
  },
  {
    name: '勇者',
    desc: 'バランスに優れた上級職。剣と魔法を高水準で使いこなす伝説の戦士。',
    baseStats: { hp: 55, mp: 28, atk: 18, def: 14, mag: 12, spd: 12 },
    growthPerLevel: { hp: 10, mp: 4, atk: 3, def: 2, mag: 2, spd: 2 },
    skills: [
      { level: 1,  name: 'ギガスラッシュ', mpCost: 10, desc: '天空の力で全体に大ダメージ', magMult: 2.0, targetType: 'all_enemies' },
      { level: 3,  name: '聖なる光',       mpCost: 8,  desc: '光で全員のHPを回復',          magMult: 1.5, targetType: 'all_allies' },
      { level: 6,  name: '覇王斬り',       mpCost: 16, desc: '全てを断つ究極の一撃',        magMult: 3.5, targetType: 'enemy' },
      { level: 10, name: '勇者の奇跡',     mpCost: 25, desc: '全員のHPを完全回復',           magMult: 99,  targetType: 'all_allies' },
    ],
    spriteBase: 0,
    unlockFlag: 'quest_maou',
  },
  {
    name: '賢者',
    desc: '魔法と回復の両方を極めた上級職。全魔法を扱え、MPが非常に多い。',
    baseStats: { hp: 30, mp: 60, atk: 6, def: 6, mag: 22, spd: 11 },
    growthPerLevel: { hp: 5, mp: 8, atk: 1, def: 1, mag: 5, spd: 1 },
    skills: [
      { level: 1,  name: 'ヒール',       mpCost: 4,  desc: '仲間のHPを回復',                magMult: 2.0, targetType: 'ally' },
      { level: 1,  name: 'ファイア',     mpCost: 4,  desc: '炎の魔法',                      magMult: 1.8, targetType: 'enemy' },
      { level: 3,  name: '全体ヒール',   mpCost: 12, desc: '全員のHPを回復',                magMult: 1.8, targetType: 'all_allies' },
      { level: 5,  name: 'イオ',         mpCost: 12, desc: '爆発で全体に大ダメージ',        magMult: 2.0, targetType: 'all_enemies' },
      { level: 7,  name: 'ベホマ',       mpCost: 15, desc: '仲間のHPを完全回復',            magMult: 99,  targetType: 'ally' },
      { level: 10, name: '賢者の奇跡',   mpCost: 30, desc: '全体に大魔法＋全員HP回復',      magMult: 4.0, targetType: 'all_enemies' },
    ],
    spriteBase: 1,
    unlockFlag: 'quest_maou',
  },
  {
    name: '魔剣士',
    desc: '闇の魔力を宿した剣士。高い攻撃力と魔法を持ち、強力なダメージを与える。',
    baseStats: { hp: 40, mp: 22, atk: 20, def: 10, mag: 14, spd: 14 },
    growthPerLevel: { hp: 7, mp: 3, atk: 4, def: 1, mag: 2, spd: 2 },
    skills: [
      { level: 1,  name: '魔力斬り',   mpCost: 6,  desc: '魔力を込めた一撃',              magMult: 1.8, targetType: 'enemy' },
      { level: 3,  name: '暗黒剣',     mpCost: 10, desc: '闇の剣で敵全体を攻撃',          magMult: 1.6, targetType: 'all_enemies' },
      { level: 6,  name: '魂の一撃',   mpCost: 14, desc: '魂を削る超強力な斬撃',          magMult: 3.0, targetType: 'enemy' },
      { level: 10, name: '滅びの剣',   mpCost: 20, desc: '全てを滅する最強の闇魔剣',      magMult: 5.0, targetType: 'enemy' },
    ],
    spriteBase: 3,
    unlockFlag: 'quest_maou',
  },
  {
    name: '武闘家',
    desc: '素手で戦う格闘士。素早さと攻撃力が非常に高く、連続攻撃が得意。',
    baseStats: { hp: 48, mp: 8, atk: 22, def: 12, mag: 4, spd: 20 },
    growthPerLevel: { hp: 9, mp: 1, atk: 4, def: 2, mag: 0, spd: 4 },
    skills: [
      { level: 1,  name: '双竜打ち',   mpCost: 4,  desc: '2回連続で素早く攻撃',            magMult: 0.9, targetType: 'enemy' },
      { level: 3,  name: '百裂拳',     mpCost: 8,  desc: '超高速の連続パンチで攻撃',       magMult: 1.2, targetType: 'enemy' },
      { level: 6,  name: '気功波',     mpCost: 10, desc: '気のエネルギーを全体に放つ',     magMult: 1.5, targetType: 'all_enemies' },
      { level: 10, name: '真空破斬拳', mpCost: 18, desc: '真空の拳で必殺の一撃を放つ',    magMult: 4.0, targetType: 'enemy' },
    ],
    spriteBase: 0,
    unlockFlag: 'quest_maou',
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
