// ============================================================================
// MALZEMELER, TEDARİKÇİ KALİTE SEVİYELERİ VE RAF ÖMRÜ (SKT) VERİLERİ
// (Dengelenmiş Stok Kapasitesi & Uzun Ömürlü Toptan Paketler)
// ============================================================================


export const SUPPLIER_TIERS = {
  ucuz: {
    id: 'ucuz',
    name: 'Spot / Ucuz Toptancı',
    costMultiplier: 0.78,
    qualityBonus: -10,
    shelfLifeDelta: -1,
    description: '%22 daha ucuz ama tazelik süresi biraz daha kısa.'
  },
  standart: {
    id: 'standart',
    name: 'Mahalle Toptancısı (Standart)',
    costMultiplier: 1.0,
    qualityBonus: 2,
    shelfLifeDelta: 0,
    description: 'Fiyat/performans dengeli, güvenilir esnaf kalitesi.'
  },
  kaliteli: {
    id: 'kaliteli',
    name: 'Özel Çiftlik & Seçkin Tedarik',
    costMultiplier: 1.25,
    qualityBonus: 15,
    shelfLifeDelta: 4,
    description: '%25 daha pahalı ama müşteri memnuniyeti, bahşiş ve itibar kazandırır.'
  }
};

export const INGREDIENTS = [
  {
    id: 'tavuk_eti',
    name: 'Marine Tavuk Döner Eti',
    icon: '🍗',
    unit: 'porsiyon',
    baseCost: 14,
    packSize: 120,
    shelfLifeDays: 10,
    category: 'et',
    startingStock: 240
  },
  {
    id: 'yaprak_et',
    name: 'Zırh & Yaprak Dana Eti',
    icon: '🥩',
    unit: 'porsiyon',
    baseCost: 34,
    packSize: 100,
    shelfLifeDays: 10,
    category: 'et',
    startingStock: 180
  },
  {
    id: 'lavas',
    name: 'Taze Tandır Lavaşı',
    icon: '🫓',
    unit: 'adet',
    baseCost: 3.0,
    packSize: 150,
    shelfLifeDays: 14,
    category: 'unlu',
    startingStock: 300
  },
  {
    id: 'tombik_ekmek',
    name: 'Çıtır Tombik & Pide Ekmek',
    icon: '🥖',
    unit: 'adet',
    baseCost: 3.5,
    packSize: 120,
    shelfLifeDays: 10,
    category: 'unlu',
    startingStock: 240
  },
  {
    id: 'sebze_garnitur',
    name: 'Domates, Soğan & Turşu Karışımı',
    icon: '🍅',
    unit: 'porsiyon',
    baseCost: 3.2,
    packSize: 150,
    shelfLifeDays: 12,
    category: 'sebze_sos',
    startingStock: 300
  },
  {
    id: 'ozel_sos',
    name: 'Hatay Usulü Özel Sos & Tereyağı',
    icon: '🥣',
    unit: 'porsiyon',
    baseCost: 4.0,
    packSize: 150,
    shelfLifeDays: 20,
    category: 'sebze_sos',
    startingStock: 280
  },
  {
    id: 'patates',
    name: 'Kızartmalık Afyon Patatesi',
    icon: '🍟',
    unit: 'porsiyon',
    baseCost: 5.5,
    packSize: 140,
    shelfLifeDays: 25,
    category: 'sebze_sos',
    startingStock: 250
  },
  {
    id: 'ayran',
    name: 'Yayık & Kapalı Ayran',
    icon: '🥛',
    unit: 'adet',
    baseCost: 5.5,
    packSize: 120,
    shelfLifeDays: 25,
    category: 'icecek_tatli',
    startingStock: 240
  },
  {
    id: 'gazli_icecek',
    name: 'Kola / Gazoz / Şalgam',
    icon: '🥤',
    unit: 'adet',
    baseCost: 11,
    packSize: 100,
    shelfLifeDays: 45,
    category: 'icecek_tatli',
    startingStock: 200
  },
  {
    id: 'tatli_sutlac',
    name: 'Fırın Sütlaç & Künefe Porsiyon',
    icon: '🍮',
    unit: 'adet',
    baseCost: 16,
    packSize: 80,
    shelfLifeDays: 12,
    category: 'icecek_tatli',
    startingStock: 140
  }
];
