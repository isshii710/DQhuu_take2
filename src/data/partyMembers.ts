import type { ClassName, PartyMember, Equipment } from '../types';
import { getClassDef, calcStats } from './characters';

export interface PartyMemberDef {
  id: string;
  name: string;
  className: ClassName;
  spriteColor: number;
  joinFlag: string;
  joinLevel: number;
  npcId: string;
  preJoinDialogue: string[];
  joinDialogue: string[];
  postJoinDialogue: string[];
}

export const PARTY_MEMBER_DEFS: PartyMemberDef[] = [
  {
    id: 'aria',
    name: 'アリア',
    className: '回復師',
    spriteColor: 0xFF88CC,
    joinFlag: 'village_visited',
    joinLevel: 1,
    npcId: 'npc_aria',
    preJoinDialogue: [
      'あなたが勇者様ですね。',
      'でも…まだ私には一緒に行く勇気が出ません。',
      'またお会いしましょう。',
    ],
    joinDialogue: [
      'みんなのことを守りたいんです！',
      '回復魔法で皆さんを支えます。',
      'アリア、一緒に旅に出ます！',
    ],
    postJoinDialogue: [
      '仲間がいると心強いですね！',
      'いつでも回復しますから、声をかけてください。',
    ],
  },
  {
    id: 'galen',
    name: 'ガレン',
    className: '戦士',
    spriteColor: 0xFFAA44,
    joinFlag: 'world_visited',
    joinLevel: 3,
    npcId: 'npc_galen',
    preJoinDialogue: [
      'お前が勇者か…まだ力が足りなそうだな。',
      'もっと鍛えてから出直してこい。',
    ],
    joinDialogue: [
      '俺が守ってやる！',
      '前線は任せておけ。お前らは後ろで戦え。',
      'ガレン、参上だ！',
    ],
    postJoinDialogue: [
      '安心しろ、俺がいる限り誰も死なせん。',
      'どんな敵でも正面から叩き潰してやる。',
    ],
  },
  {
    id: 'luna',
    name: 'ルナ',
    className: '魔法使い',
    spriteColor: 0x8888FF,
    joinFlag: 'castle_visited',
    joinLevel: 5,
    npcId: 'npc_luna',
    preJoinDialogue: [
      '魔法の研究が忙しくて…',
      '今は一緒に行けないわ。ごめんなさい。',
    ],
    joinDialogue: [
      '魔法の力、貸してあげる！',
      '敵の弱点を突く魔法で一気に畳み掛けましょう。',
      'ルナ、参戦します！',
    ],
    postJoinDialogue: [
      '私の魔法があれば怖いものなし。',
      'どんな敵も魔法で吹き飛ばしてみせる。',
    ],
  },
  {
    id: 'zain',
    name: 'ゼイン',
    className: '盗賊',
    spriteColor: 0x44FFAA,
    joinFlag: 'dungeon_entered',
    joinLevel: 7,
    npcId: 'npc_zain',
    preJoinDialogue: [
      'チッ、この洞窟は危ないぞ。',
      'お前みたいな素人がうろうろするな。',
    ],
    joinDialogue: [
      '罠には気をつけろ。俺が先に見てやる。',
      '盗賊の目は誤魔化せんからな。',
      'ゼイン、しぶしぶ同行してやる。',
    ],
    postJoinDialogue: [
      '罠は全部俺に任せろ。',
      '影から動くのが俺のスタイルだ。',
    ],
  },
  {
    id: 'elda',
    name: 'エルダ',
    className: '回復師',
    spriteColor: 0xFFFFAA,
    joinFlag: 'dungeon_entered',
    joinLevel: 8,
    npcId: 'npc_elda',
    preJoinDialogue: [
      '光の加護がありますように。',
      '今は聖地への祈りを捧げている最中です。',
      '後でまた来てください。',
    ],
    joinDialogue: [
      '光の神が、あなたたちを守れと仰いました。',
      '私の回復術でみなさんを守ります。',
      'エルダ、お伴します！',
    ],
    postJoinDialogue: [
      '光があなた方を導いています。',
      '傷ついたらいつでも呼んでください。',
    ],
  },
  {
    id: 'balt',
    name: 'バルト',
    className: '戦士',
    spriteColor: 0xFF5555,
    joinFlag: 'castle_visited',
    joinLevel: 10,
    npcId: 'npc_balt',
    preJoinDialogue: [
      '貴様、何者だ。勝手にこの場所に来るな。',
      '力を認めてから話しかけろ。',
    ],
    joinDialogue: [
      '合格だ。一緒に行ってやる。',
      '俺の剣の腕、役立ててみせよう。',
      'バルト、同行を許可する。',
    ],
    postJoinDialogue: [
      '俺に任せれば、敵なんぞ一掃してやる。',
      '戦士の誇りにかけて、全力で戦う。',
    ],
  },
  {
    id: 'shena',
    name: 'シェナ',
    className: '魔法使い',
    spriteColor: 0xFF44FF,
    joinFlag: 'castle_visited',
    joinLevel: 13,
    npcId: 'npc_shena',
    preJoinDialogue: [
      '星の瞬きが…まだあなたの運命を示していない。',
      '時を待ちなさい。',
    ],
    joinDialogue: [
      '星の導きにより…あなたと共に行くことを定められました。',
      '宇宙の力を借りて、敵を滅ぼしましょう。',
      'シェナ、星の加護と共に参上！',
    ],
    postJoinDialogue: [
      '星々がこの旅の成功を囁いています。',
      '宇宙のエネルギーをあなた方に送ります。',
    ],
  },
  {
    id: 'rai',
    name: 'ライ',
    className: '盗賊',
    spriteColor: 0x44CCFF,
    joinFlag: 'dungeon_entered',
    joinLevel: 15,
    npcId: 'npc_rai',
    preJoinDialogue: [
      'よう、ここは俺の縄張りだ。',
      '用がないなら出て行ってくれ。',
    ],
    joinDialogue: [
      '生き残ろうぜ。俺も一緒に行く。',
      '速さが命だ。俺についてこい。',
      'ライ、参加してやる！',
    ],
    postJoinDialogue: [
      '生き残ることが最優先だ。無茶はするな。',
      '俺の足の速さ、役に立てよ。',
    ],
  },
];

export function getPartyMemberDef(id: string): PartyMemberDef | undefined {
  return PARTY_MEMBER_DEFS.find(d => d.id === id);
}

export function createPartyMember(def: PartyMemberDef, level: number): PartyMember {
  const cls = getClassDef(def.className);
  const baseStats = calcStats(cls, level);
  const equipment: Equipment = {
    weapon: null,
    armor: null,
    helmet: null,
    accessory: null,
  };
  return {
    id: def.id,
    name: def.name,
    className: def.className,
    level,
    exp: 0,
    stats: {
      hp: baseStats.maxHp,
      maxHp: baseStats.maxHp,
      mp: baseStats.maxMp,
      maxMp: baseStats.maxMp,
      atk: baseStats.atk,
      def: baseStats.def,
      mag: baseStats.mag,
      spd: baseStats.spd,
    },
    equipment,
    spriteColor: def.spriteColor,
  };
}
