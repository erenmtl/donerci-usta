// ============================================================================
// YATIRIM ARAÇLARI, BANKA KREDİLERİ VE BAŞARIM / ROZET VERİLERİ
// ============================================================================

export interface AchievementDef {
  id: string;
  title: string;
  icon: string;
  description: string;
  rewardCash: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ilk_bin_tl',
    title: 'İlk Siftah & Bereket',
    icon: '🧿',
    description: 'Bir günde 5.000 TL üzerinde ciro yap.',
    rewardCash: 1500
  },
  {
    id: 'yuz_musteri',
    title: 'Döner Bıçağı Durmuyor',
    icon: '🔪',
    description: 'Toplam 100 müşteriye döner servis et.',
    rewardCash: 3000
  },
  {
    id: 'mahallenin_sevileni',
    title: 'Mahallenin Gözbebeği Esnaf',
    icon: '🤝',
    description: 'En az 3 komşu esnafla ilişki puanını 75 üzerine çıkar.',
    rewardCash: 5000
  },
  {
    id: 'dekor_ustasi',
    title: 'Saray Gibi Dükkan',
    icon: '✨',
    description: 'Dükkan dekorasyon puanını 50 üzerine çıkar.',
    rewardCash: 4500
  },
  {
    id: 'ortak_patron',
    title: 'Mahalle Yatırımcısı',
    icon: '💼',
    description: 'Bir komşu esnaf dükkanına ortak ol veya yeni yatırım yap.',
    rewardCash: 6000
  },
  {
    id: 'ikinci_kusak',
    title: 'Babadan Evlada Miras',
    icon: '👨‍👦',
    description: '18 yaşına gelen çocuğunu dükkanda işe başlat veya işi devret.',
    rewardCash: 10000
  },
  {
    id: 'doner_imparatoru',
    title: 'Döner İmparatoru',
    icon: '👑',
    description: 'Net servetini (Nakit + Yatırımlar) 500.000 TL üzerine çıkar ve 2. katı aç.',
    rewardCash: 25000
  }
];

export const INVESTMENT_CATALOG = [
  {
    id: 'gram_altin',
    type: 'altin' as const,
    name: 'Kapalıçarşı Gram Altın',
    icon: '🪙',
    baseUnitValue: 3000,
    dailyYieldRate: 0.003,
    volatility: 0.018,
    description: 'Enflasyona karşı en güvenli geleneksel esnaf limanı. Enflasyon arttıkça değeri yükselir.'
  },
  {
    id: 'doviz_sepeti',
    type: 'doviz' as const,
    name: 'Dolar / Euro Döviz Sepeti (100$ Paket)',
    icon: '💵',
    baseUnitValue: 3500,
    dailyYieldRate: 0.0025,
    volatility: 0.015,
    description: 'Kur artışlarına karşı nakit koruma aracı.'
  },
  {
    id: 'vadeli_mevduat',
    type: 'mevduat' as const,
    name: 'Banka Günlük Vadeli Esnaf Mevduatı',
    icon: '🏦',
    baseUnitValue: 10000,
    dailyYieldRate: 0.0045,
    volatility: 0.0,
    description: 'Sıfır riskle her gün düzenli faiz getirisi kasana eklenir.'
  },
  {
    id: 'kurye_motoru',
    type: 'arac' as const,
    name: 'Paket Servis Motosikleti (50cc)',
    icon: '🛵',
    baseUnitValue: 48000,
    dailyYieldRate: 0.008,
    volatility: 0.004,
    description: 'Online ve telefonlu paket sipariş kapasitesini artırır, günlük ekstra kurye geliri sağlar.'
  },
  {
    id: 'esnaf_minibusu',
    type: 'arac' as const,
    name: 'Soğutuculu Tedarik & Catering Minibüsü',
    icon: '🚐',
    baseUnitValue: 185000,
    dailyYieldRate: 0.009,
    volatility: 0.005,
    description: 'Düğün, mevlit ve fabrika toplu döner siparişlerinden her gün yüksek kira/catering geliri getirir.'
  },
  {
    id: 'yan_sokak_sube',
    type: 'sube' as const,
    name: 'Yan Mahalle "Dönerci Usta Express" 2. Şube',
    icon: '🏪',
    baseUnitValue: 320000,
    dailyYieldRate: 0.012,
    volatility: 0.008,
    description: 'Zincirleşmenin ilk adımı! Her gün düzenli şube kâr payı kasana akar.'
  }
];

export const LOAN_PACKAGES = [
  {
    id: 'esnaf_kefalet_kucuk',
    name: 'Esnaf Kefalet Acil Nakit Kredisi',
    principal: 30000,
    totalRepayment: 36000,
    days: 30,
    description: '30 gün vadeli, düşük faizli esnaf destek kredisi (Günlük 1.200 TL taksit).'
  },
  {
    id: 'buyume_yatirim_kredisi',
    name: 'Dükkan Büyütme & Ekipman Kredisi',
    principal: 80000,
    totalRepayment: 100000,
    days: 40,
    description: '40 gün vadeli yatırım kredisi (Günlük 2.500 TL taksit).'
  },
  {
    id: 'imparatorluk_kredisi',
    name: 'Ticari Şube & Ortaklık Kredisi',
    principal: 200000,
    totalRepayment: 256000,
    days: 40,
    description: 'Büyük ortaklıklar ve 2. kat yatırımı için yüksek limitli ticari kredi (Günlük 6.400 TL taksit).'
  }
];
