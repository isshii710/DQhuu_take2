import type { ItemDef } from '../types';

export const ITEMS: ItemDef[] = [
  // ─── Consumables ─────────────────────────────────────────────────────────
  { id: 'herb',      name: '薬草',     type: 'consumable', desc: 'HPを30回復する',       price: 20,  hpRestore: 30 },
  { id: 'potion',    name: 'ポーション',type: 'consumable', desc: 'HPを80回復する',       price: 60,  hpRestore: 80 },
  { id: 'elixir',    name: '万能薬',   type: 'consumable', desc: 'HPを完全回復する',      price: 150, hpRestore: 9999 },
  { id: 'mana_herb', name: '魔力草',   type: 'consumable', desc: 'MPを20回復する',       price: 30,  mpRestore: 20 },
  { id: 'ether',     name: 'エーテル', type: 'consumable', desc: 'MPを50回復する',       price: 80,  mpRestore: 50 },
  { id: 'antidote',  name: '毒消し草', type: 'consumable', desc: '毒状態を回復する',      price: 25,  hpRestore: 0 },

  // ─── Weapons ─────────────────────────────────────────────────────────────
  { id: 'wood_sword', name: '木の剣',  type: 'weapon', desc: '最も基本的な剣',           price: 50,   atk: 4,  tint: 0x8B4513 },
  { id: 'iron_sword', name: '鉄の剣',  type: 'weapon', desc: '頑丈な鉄製の剣',           price: 200,  atk: 10, tint: 0xC0C0C0 },
  { id: 'silver_sword',name:'銀の剣',  type: 'weapon', desc: '魔物に効果的な銀の剣',     price: 600,  atk: 18, mag: 3, tint: 0xE8E8FF },
  { id: 'holy_sword', name: '聖剣フォルス', type: 'weapon', desc: '伝説の聖剣。全魔物に効く', price: 0, atk: 30, mag: 8, tint: 0xFFD700 },
  { id: 'staff',      name: '木の杖',  type: 'weapon', desc: '魔法使い向けの木製の杖',   price: 60,   mag: 6, tint: 0x8B4513 },
  { id: 'crystal_staff',name:'水晶の杖',type:'weapon', desc: '魔力を増幅させる水晶の杖', price: 400,  mag: 15, tint: 0x88CCFF },
  { id: 'dagger',     name: '短剣',    type: 'weapon', desc: '素早い攻撃ができる短剣',   price: 80,   atk: 7, spd: 2, tint: 0xC0C0C0 },
  { id: 'shadow_blade',name:'影刃',    type: 'weapon', desc: '闇の力を宿した短剣',       price: 500,  atk: 16, spd: 4, tint: 0x330066 },

  // ─── Armor ───────────────────────────────────────────────────────────────
  { id: 'cloth',      name: '布の服',  type: 'armor', desc: '最も基本的な衣服',          price: 40,  def: 2, tint: 0xDDCCAA },
  { id: 'leather',    name: '皮の鎧',  type: 'armor', desc: '革製の軽い鎧',              price: 150, def: 6, tint: 0x8B6040 },
  { id: 'chain_mail', name: '鎖かたびら',type:'armor',desc: '鎖状の金属鎧',              price: 450, def: 12, tint: 0xA0A0A0 },
  { id: 'plate_mail', name: '板金鎧', type: 'armor', desc: '重厚な板金鎧',               price: 900, def: 20, tint: 0x8090A0 },
  { id: 'holy_armor', name: '聖騎士の鎧',type:'armor',desc:'聖なる力で守護する鎧',      price: 0,   def: 30, mhp: 20, tint: 0xFFE040 },
  { id: 'robe',       name: '魔法使いのローブ',type:'armor',desc:'魔力を高める特殊な布', price: 120, def: 3, mag: 4, mmp: 10, tint: 0x6600AA },

  // ─── Helmets ─────────────────────────────────────────────────────────────
  { id: 'cloth_hat',  name: '布の帽子',type: 'helmet', desc: '布製の簡素な帽子',         price: 30,  def: 1, tint: 0xDDCCBB },
  { id: 'leather_hat',name: '革の帽子',type: 'helmet', desc: '革製の丈夫な帽子',         price: 100, def: 4, tint: 0x8B6040 },
  { id: 'iron_helm',  name: '鉄の兜',  type: 'helmet', desc: '鉄製の頑丈な兜',           price: 350, def: 9, tint: 0xA0A0A0 },
  { id: 'holy_helm',  name: '聖騎士の兜',type:'helmet',desc:'精霊が宿る神聖な兜',        price: 0,   def: 15, mhp: 10, tint: 0xFFE040 },

  // ─── Accessories ─────────────────────────────────────────────────────────
  { id: 'leather_ring',name:'革のリング',type:'accessory',desc:'基本的な指輪',           price: 50,  spd: 1 },
  { id: 'silver_ring', name:'銀のリング',type:'accessory',desc:'銀製の指輪。魔力が上がる',price:200, mag: 3, mmp: 5 },
  { id: 'guard_bracelet',name:'守護の腕輪',type:'accessory',desc:'身を守る魔力の腕輪',  price: 400, def: 5, mhp: 15 },
  { id: 'speed_boots', name:'俊足の靴', type:'accessory',desc:'素早さが大きく上がる靴',  price: 350, spd: 5 },
];

export const ITEM_MAP: Record<string, ItemDef> = Object.fromEntries(ITEMS.map(i => [i.id, i]));

export function getItem(id: string): ItemDef | undefined {
  return ITEM_MAP[id];
}
