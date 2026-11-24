// ============================================================================
// KADEMELİ GÖREV SİSTEMİ VE EKONOMİK GENİŞLEME KONFİGÜRASYONU (quests.ts)
// Tüm denge sabitleri EXPANSION_CONFIG içinden kolayca ayarlanabilir.
// ============================================================================

import { MANAGEMENT_CONFIG } from './management.js';

export const EXPANSION_CONFIG = {
  // Şube sayısı arttıkça şube başına eklenen günlük yönetim/holding genel gideri (TL)
  holdingOverheadPerBranch: MANAGEMENT_CONFIG.holdingOverheadPerExtraBranchBase,
  // Her ek şubenin yönetim zorluğu çarpanı (gider artışı)
  branchComplexityMultiplier: 0.12,
  // Satış üzerinden alınan yerel belediye & gelir vergisi oranı
  corporateTaxRate: 0.06,
  // Aynı şehir içi yeni şube lojistik çarpanı
  sameCityLogisticsRate: 0.03,
  // Farklı şehir / uzak il tedarik ve soğuk zincir nakliye çarpanı
  remoteCityLogisticsBaseRate: 0.09,
  // Şube kapatma / devretme durumunda açılış maliyetinin nakit iade oranı
  branchCloseRefundRatio: 0.42,
  // Şube kapatmanın şehir ve ülke itibarına etkisi
  branchCloseCityRepPenalty: -7,
  branchCloseBrandRepPenalty: -4,
  // Bir şubede hijyen %35 altına düştüğünde patlak veren skandalın ülke markasına cezası
  scandalBrandRepPenalty: -8,
  scandalCityRepPenalty: -12,
  // Faz 0 & Faz 1 ek sabitler
  baseChefMonthlySalary: MANAGEMENT_CONFIG.baseChefMonthlySalary,
  hqOpeningCostBase: MANAGEMENT_CONFIG.hqOpeningCostBase,
  hqInitialCumulativeProfitBase: MANAGEMENT_CONFIG.hqInitialCumulativeProfitBase
};


export const QUEST_CATALOG = [
  // ==========================================================================
  // KADEME 1: İLK ŞUBE YETKİSİ (2. Dükkanı Açma Hakkı)
  // ==========================================================================
  {
    id: 'q_t1_customers',
    tier: 1,
    tierTitle: 'Kademe 1 • İlk Şube (2. Dükkan) Açma Yetkisi',
    title: 'Mahallede Ağız Tadı',
    description: 'Toplam 35 müşteriye başarılı şekilde döner servis et.',
    icon: '🌯',
    metric: 'total_customers',
    targetValue: 35,
    rewardCash: 4500,
    rewardBrandRep: 2,
    unlocksMaxBranches: 2
  },
  {
    id: 'q_t1_daily_rev',
    tier: 1,
    tierTitle: 'Kademe 1 • İlk Şube (2. Dükkan) Açma Yetkisi',
    title: 'Kasada Bereket',
    description: 'Tek bir günde en az 4.500 ₺ günlük satış cirosuna ulaş.',
    icon: '💵',
    metric: 'daily_revenue',
    targetValue: 4500,
    rewardCash: 5500,
    rewardBrandRep: 2,
    unlocksMaxBranches: 2
  },
  {
    id: 'q_t1_local_rep',
    tier: 1,
    tierTitle: 'Kademe 1 • İlk Şube (2. Dükkan) Açma Yetkisi',
    title: 'Sokağın Güvenilir Ustası',
    description: 'Aktif şubenin Mahalle İtibarını en az 66 puana çıkar.',
    icon: '⭐',
    metric: 'neighborhood_rep',
    targetValue: 66,
    rewardCash: 5000,
    rewardBrandRep: 3,
    unlocksMaxBranches: 2
  },
  {
    id: 'q_t1_hygiene',
    tier: 1,
    tierTitle: 'Kademe 1 • İlk Şube (2. Dükkan) Açma Yetkisi',
    title: 'Beyaz Önlük & Pırıl Pırıl Tezgah',
    description: 'Dükkan hijyen puanını %88 ve üzerine çıkar.',
    icon: '🧼',
    metric: 'hygiene',
    targetValue: 88,
    rewardCash: 3500,
    rewardBrandRep: 2,
    unlocksMaxBranches: 2
  },

  // ==========================================================================
  // KADEME 2: ŞEHİR İÇİ BÜYÜME YETKİSİ (3. Şube Açma Hakkı)
  // ==========================================================================
  {
    id: 'q_t2_open_second',
    tier: 2,
    tierTitle: 'Kademe 2 • Şehir İçi Zincir (3. Şube) Yetkisi',
    title: 'İkinci Ocak Tütüyor',
    description: 'Harita üzerinden 2. şubeni aç ve aktif şube sayını 2 yap.',
    icon: '🏪',
    metric: 'active_branches',
    targetValue: 2,
    rewardCash: 10000,
    rewardBrandRep: 4,
    unlocksMaxBranches: 3
  },
  {
    id: 'q_t2_city_rep',
    tier: 2,
    tierTitle: 'Kademe 2 • Şehir İçi Zincir (3. Şube) Yetkisi',
    title: 'Şehirde Duyulan Lezzet',
    description: 'Bulunduğun ildeki Şehir İtibarını en az 65 puana ulaştır.',
    icon: '🏙️',
    metric: 'city_rep',
    targetValue: 65,
    rewardCash: 12000,
    rewardBrandRep: 4,
    unlocksMaxBranches: 3
  },
  {
    id: 'q_t2_survive',
    tier: 2,
    tierTitle: 'Kademe 2 • Şehir İçi Zincir (3. Şube) Yetkisi',
    title: 'Esnaf İstikrarı',
    description: 'İflas etmeden en az 4. güne ulaş.',
    icon: '📅',
    metric: 'days_survived',
    targetValue: 4,
    rewardCash: 8000,
    rewardBrandRep: 2,
    unlocksMaxBranches: 3
  },

  // ==========================================================================
  // KADEME 3: ŞEHİRLER ARASI ANADOLU AÇILIMI (5 Şube Yetkisi)
  // ==========================================================================
  {
    id: 'q_t3_three_branches',
    tier: 3,
    tierTitle: 'Kademe 3 • Türkiye Şehirler Arası Bayileşme (5 Şube) Yetkisi',
    title: 'Üçlü Saçayağı',
    description: 'Toplam 3 aktif döner şubesine ulaş.',
    icon: '🏢',
    metric: 'active_branches',
    targetValue: 3,
    rewardCash: 22000,
    rewardBrandRep: 5,
    unlocksMaxBranches: 5
  },
  {
    id: 'q_t3_brand_rep',
    tier: 3,
    tierTitle: 'Kademe 3 • Türkiye Şehirler Arası Bayileşme (5 Şube) Yetkisi',
    title: 'Ulusal Marka Tohumu',
    description: 'Ülke (Türkiye Marka) İtibarını en az 62 puana çıkar.',
    icon: '🇹🇷',
    metric: 'country_rep',
    targetValue: 62,
    rewardCash: 25000,
    rewardBrandRep: 5,
    unlocksMaxBranches: 5
  },
  {
    id: 'q_t3_staff',
    tier: 3,
    tierTitle: 'Kademe 3 • Türkiye Şehirler Arası Bayileşme (5 Şube) Yetkisi',
    title: 'Ustalar Kadrosu',
    description: 'Şubelerinde toplam en az 2 profesyonel personel istihdam et.',
    icon: '👨‍🍳',
    metric: 'staff_count',
    targetValue: 2,
    rewardCash: 15000,
    rewardBrandRep: 3,
    unlocksMaxBranches: 5
  },

  // ==========================================================================
  // KADEME 4: BÖLGESEL DÖNER HOLDİNGİ (8 Şube Yetkisi)
  // ==========================================================================
  {
    id: 'q_t4_multi_city',
    tier: 4,
    tierTitle: 'Kademe 4 • Bölgesel Döner Holdingi (8 Şube) Yetkisi',
    title: 'Şehirler Arası Lezzet Köprüsü',
    description: 'Türkiye haritasında en az 2 farklı ilde aktif şube işlet.',
    icon: '🗺️',
    metric: 'active_cities',
    targetValue: 2,
    rewardCash: 45000,
    rewardBrandRep: 6,
    unlocksMaxBranches: 8
  },
  {
    id: 'q_t4_networth',
    tier: 4,
    tierTitle: 'Kademe 4 • Bölgesel Döner Holdingi (8 Şube) Yetkisi',
    title: 'Güçlü Özsermaye',
    description: 'Toplam net servetini 250.000 ₺ üzerine çıkar.',
    icon: '💼',
    metric: 'net_worth',
    targetValue: 250000,
    rewardCash: 40000,
    rewardBrandRep: 5,
    unlocksMaxBranches: 8
  },

  // ==========================================================================
  // KADEME 5: 81 İL TÜRKİYE DÖNER İMPARATORLUĞU (Sınırsız Şube Yetkisi)
  // ==========================================================================
  {
    id: 'q_t5_five_branches',
    tier: 5,
    tierTitle: 'Kademe 5 • 81 İl Türkiye Döner İmparatorluğu (Sınırsız Şube)',
    title: 'Beşi Bir Yerde Zincir',
    description: 'Türkiye genelinde toplam 5 aktif şubeye ulaş.',
    icon: '👑',
    metric: 'active_branches',
    targetValue: 5,
    rewardCash: 90000,
    rewardBrandRep: 8,
    unlocksMaxBranches: 99
  },
  {
    id: 'q_t5_national_rep',
    tier: 5,
    tierTitle: 'Kademe 5 • 81 İl Türkiye Döner İmparatorluğu (Sınırsız Şube)',
    title: 'Türkiye’nin 1 Numaralı Döner Markası',
    description: 'Ülke (Türkiye Marka) İtibarını 78 puana ulaştır.',
    icon: '🏆',
    metric: 'country_rep',
    targetValue: 78,
    rewardCash: 120000,
    rewardBrandRep: 10,
    unlocksMaxBranches: 99
  }
];
