// ============================================================================
// ZİNCİR YÖNETİMİ, DELEGASYON, DEPO, BAYİLİK, REKABET VE KÜLTÜR VERİLERİ
// Tüm denge sabitleri burada toplanır; parayla ilgili her sabit inflationIndex ile ölçeklenir.
// ============================================================================

import type { TurkeyRegion } from './turkey_map.ts';

export interface ManagementConfigDef {
  saveVersion: number;
  // Faz 0: Temel şube & usta parasal sabitleri (baz değerler, inflationIndex ile çarpılır)
  baseChefMonthlySalary: number;
  hqOpeningCostBase: number;
  hqInitialCumulativeProfitBase: number;
  starterBranchGridCols: number;
  starterBranchGridRows: number;
  starterBranchDecorScore: number;
  // Yeni şube başlangıç mahalle itibarı katsayıları
  newCityBaseNeighborhoodRep: number;
  newCityCountryRepWeight: number;
  existingCityRepWeight: number;
  existingCityBranchBonusPerBranch: number;
  maxInitialNeighborhoodRep: number;

  // Faz 1.1: Yönetim kademeleri eşikleri
  tierThresholds: {
    ustaMaxBranches: number;     // 1-2 şube: Usta Dönemi
    mudurMinBranches: number;    // 3-5 şube: Müdür Dönemi
    holdingMinBranches: number;  // 6+ şube: Holding Dönemi
  };

  // Faz 1.2: Yönetici (Müdür) sabitleri (baz TL, inflationIndex ile çarpılır)
  branchManagerBaseSalary: number;
  regionalManagerBaseSalary: number;
  managerHiringFeeBase: number;
  managerTrainingCostBase: number;
  managerTrainingSkillGain: number;
  managerPromotionMinSkill: number;
  managerPromotionMinExp: number;
  managerSeveranceMonths: number;
  auditCostBase: number;
  embezzlementHonestyThreshold: number;
  resignationLoyaltyThreshold: number;
  unmanagedBranchHygieneDecayPerDay: number;
  unmanagedBranchEfficiencyPenalty: number;

  // Faz 1.3: Politika ve Otomasyon sabitleri
  defaultSpendingLimitBase: number;
  hygienePolicyDailyCostBase: {
    dusuk: number;
    normal: number;
    yuksek: number;
  };
  hygienePolicyTargetFloor: {
    dusuk: number;
    normal: number;
    yuksek: number;
  };

  // Faz 1.5: Holding genel gideri ve organizasyon indirimi
  holdingOverheadPerExtraBranchBase: number;
  holdingQuadraticFactorBase: number;
  managedBranchOverheadDiscountPct: number;
  regionalManagerOverheadDiscountPct: number;

  // Faz 3: Merkez Depo ve Soğuk Zincir Üssü
  warehouseInvestmentCostBase: number;
  warehouseDailyMaintenanceBase: number;
  warehouseUpgradeCostBase: number;
  warehouseBulkDiscountPctLevel1: number;
  warehouseBulkDiscountPctLevel2: number;
  warehouseColdChainReductionPct: number;

  // Faz 5: Gerçek Bayilik (Franchise) Modeli
  franchiseUpfrontFeeRatio: number; // Açılış maliyetinin kaç katı peşin isim hakkı alınır
  franchiseDefaultRoyaltyPct: number; // Günlük cirodan alınan pay (%10)
  franchiseMinCountryRep: number;
  franchiseMinBranchesRequired: number;
  franchiseAuditCostBase: number;
  franchiseTerminationPenaltyRep: number;
}

export const MANAGEMENT_CONFIG: ManagementConfigDef = {
  saveVersion: 2,
  baseChefMonthlySalary: 25000,
  hqOpeningCostBase: 35000,
  hqInitialCumulativeProfitBase: 12500,
  starterBranchGridCols: 6,
  starterBranchGridRows: 5,
  starterBranchDecorScore: 12,

  newCityBaseNeighborhoodRep: 38,
  newCityCountryRepWeight: 0.32,
  existingCityRepWeight: 0.78,
  existingCityBranchBonusPerBranch: 5,
  maxInitialNeighborhoodRep: 85,

  tierThresholds: {
    ustaMaxBranches: 2,
    mudurMinBranches: 3,
    holdingMinBranches: 6
  },

  branchManagerBaseSalary: 32000,
  regionalManagerBaseSalary: 58000,
  managerHiringFeeBase: 8500,
  managerTrainingCostBase: 7500,
  managerTrainingSkillGain: 8,
  managerPromotionMinSkill: 68,
  managerPromotionMinExp: 15,
  managerSeveranceMonths: 0.5,
  auditCostBase: 3500,
  embezzlementHonestyThreshold: 55,
  resignationLoyaltyThreshold: 42,
  unmanagedBranchHygieneDecayPerDay: 3.5,
  unmanagedBranchEfficiencyPenalty: 0.16,

  defaultSpendingLimitBase: 8000,
  hygienePolicyDailyCostBase: {
    dusuk: 90,
    normal: 240,
    yuksek: 460
  },
  hygienePolicyTargetFloor: {
    dusuk: 62,
    normal: 80,
    yuksek: 93
  },

  holdingOverheadPerExtraBranchBase: 260,
  holdingQuadraticFactorBase: 32,
  managedBranchOverheadDiscountPct: 0.42,
  regionalManagerOverheadDiscountPct: 0.25,

  warehouseInvestmentCostBase: 145000,
  warehouseDailyMaintenanceBase: 650,
  warehouseUpgradeCostBase: 110000,
  warehouseBulkDiscountPctLevel1: 0.16,
  warehouseBulkDiscountPctLevel2: 0.26,
  warehouseColdChainReductionPct: 0.45,

  franchiseUpfrontFeeRatio: 0.55,
  franchiseDefaultRoyaltyPct: 10,
  franchiseMinCountryRep: 58,
  franchiseMinBranchesRequired: 3,
  franchiseAuditCostBase: 2500,
  franchiseTerminationPenaltyRep: 2
};

// Yönetici Aday Havuzu Şablonları
export interface ManagerCandidateTemplate {
  name: string;
  title: string;
  skill: number;
  honesty: number;
  loyalty: number;
  salaryMultiplier: number;
  bio: string;
}

export const MANAGER_CANDIDATE_TEMPLATES: ManagerCandidateTemplate[] = [
  {
    name: 'Kemal Özkan',
    title: 'Eski Restoran Şefi',
    skill: 76,
    honesty: 84,
    loyalty: 75,
    salaryMultiplier: 1.08,
    bio: '20 yıllık mutfak ve salon disiplini var. Fireyi asla affetmez.'
  },
  {
    name: 'Selin Demirci',
    title: 'Kurumsal Fast-Food Müdürü',
    skill: 85,
    honesty: 88,
    loyalty: 70,
    salaryMultiplier: 1.22,
    bio: 'Ulusal zincirlerde vardiya ve stok optimizasyonu yönetti.'
  },
  {
    name: 'Tuncay Yılmaz',
    title: 'Pratik Ocakbaşı Ustası',
    skill: 72,
    honesty: 66,
    loyalty: 82,
    salaryMultiplier: 0.94,
    bio: 'Personelle arası harikadır ama kasa defterini biraz gevşek tutar.'
  },
  {
    name: 'Derya Karaca',
    title: 'Gıda Mühendisi & İşletmeci',
    skill: 82,
    honesty: 94,
    loyalty: 80,
    salaryMultiplier: 1.18,
    bio: 'Hijyen ve soğuk zincir standartlarında tavizsizdir.'
  },
  {
    name: 'Bülent Şahin',
    title: 'Hırslı Satış Yöneticisi',
    skill: 79,
    honesty: 48,
    loyalty: 58,
    salaryMultiplier: 0.92,
    bio: 'Ciroyu hızla artırır ancak tedarik faturalarında gözü açık olmak gerekir.'
  },
  {
    name: 'Zeynep Aksoy',
    title: 'Bölge Operasyon Uzmanı',
    skill: 88,
    honesty: 91,
    loyalty: 85,
    salaryMultiplier: 1.28,
    bio: 'Çoklu şube koordinasyonu ve lojistik planlamada birinci sınıf yönetici.'
  },
  {
    name: 'Mehmet Ali Çevik',
    title: 'Emektar Esnaf Kethüdası',
    skill: 69,
    honesty: 95,
    loyalty: 92,
    salaryMultiplier: 0.95,
    bio: 'Eski toprak, kuruşuna dokunmaz, dükkanı kendi malı gibi korur.'
  },
  {
    name: 'Canan Yıldırım',
    title: 'Genç İşletme Mezunu',
    skill: 65,
    honesty: 86,
    loyalty: 78,
    salaryMultiplier: 0.86,
    bio: 'Eğitime çok açık, hızla gelişen dinamik şube yöneticisi.'
  }
];

// Faz 4: Bölgesel Kültür ve Damak Tadı Çarpanları
export interface RegionalCultureProfile {
  region: TurkeyRegion;
  summary: string;
  meatPreferenceBonus: number;      // Et döner / İskender talep çarpanı
  chickenPreferenceBonus: number;   // Tavuk döner talep çarpanı
  spicyAndDessertBonus: number;     // Künefe, şalgam, baharatlı ürün çarpanı
  priceElasticityMultiplier: number; // <1 ise fiyata daha az duyarlı, >1 ise fiyata çok duyarlı
  summerTourismBoost: number;       // Yaz aylarında (Haziran-Ağustos) müşteri artışı
}

export const REGIONAL_CULTURE_MODIFIERS: Record<TurkeyRegion, RegionalCultureProfile> = {
  'Marmara': {
    region: 'Marmara',
    summary: 'Hızlı servis, paket sipariş ve tombik/kaşarlı dürüm talebi çok yüksek.',
    meatPreferenceBonus: 1.12,
    chickenPreferenceBonus: 1.10,
    spicyAndDessertBonus: 1.05,
    priceElasticityMultiplier: 0.92,
    summerTourismBoost: 1.08
  },
  'Ege': {
    region: 'Ege',
    summary: 'Hijyen, hafif menüler, ayran ve yaz aylarında turistik sahil yoğunluğu öne çıkar.',
    meatPreferenceBonus: 1.06,
    chickenPreferenceBonus: 1.12,
    spicyAndDessertBonus: 1.02,
    priceElasticityMultiplier: 0.95,
    summerTourismBoost: 1.25
  },
  'İç Anadolu': {
    region: 'İç Anadolu',
    summary: 'Doyurucu porsiyon, pilav üstü et döner, öğrenci ve memur dostu menüler sevilir.',
    meatPreferenceBonus: 1.16,
    chickenPreferenceBonus: 1.14,
    spicyAndDessertBonus: 1.04,
    priceElasticityMultiplier: 1.06,
    summerTourismBoost: 1.0
  },
  'Akdeniz': {
    region: 'Akdeniz',
    summary: 'Sosyete/Antakya usulü dürüm, şalgam, künefe ve yaz turizmi talebi zirvededir.',
    meatPreferenceBonus: 1.14,
    chickenPreferenceBonus: 1.15,
    spicyAndDessertBonus: 1.28,
    priceElasticityMultiplier: 0.96,
    summerTourismBoost: 1.32
  },
  'Karadeniz': {
    region: 'Karadeniz',
    summary: 'Tereyağlı İskender, bol etli porsiyon ve samimi esnaf ilgisi sadakat yaratır.',
    meatPreferenceBonus: 1.20,
    chickenPreferenceBonus: 1.02,
    spicyAndDessertBonus: 1.08,
    priceElasticityMultiplier: 1.02,
    summerTourismBoost: 1.12
  },
  'Doğu Anadolu': {
    region: 'Doğu Anadolu',
    summary: 'Yaprak et döner kalitesine çok dikkat edilir; ucuz et kullanılırsa itibar hızlı düşer.',
    meatPreferenceBonus: 1.26,
    chickenPreferenceBonus: 0.92,
    spicyAndDessertBonus: 1.12,
    priceElasticityMultiplier: 1.10,
    summerTourismBoost: 1.0
  },
  'Güneydoğu Anadolu': {
    region: 'Güneydoğu Anadolu',
    summary: 'Et kalitesi, baharat, şalgam ve künefe kültürü çok güçlüdür; lezzet ustası ödüllendirilir.',
    meatPreferenceBonus: 1.28,
    chickenPreferenceBonus: 0.95,
    spicyAndDessertBonus: 1.34,
    priceElasticityMultiplier: 1.04,
    summerTourismBoost: 1.05
  }
};

// Faz 4: Yerel ve Ulusal Rakip Zincirler
export interface LocalRivalChain {
  id: string;
  name: string;
  homeRegion: TurkeyRegion;
  aggression: number; // 0-100 fiyat kırma ve kampanya sıklığı
  qualityScore: number;
  pricePressurePct: number;
  specialty: string;
}

export const LOCAL_RIVAL_CHAINS: LocalRivalChain[] = [
  {
    id: 'rival_marmara_kral',
    name: 'Saraylı Büfe & Döner Zinciri',
    homeRegion: 'Marmara',
    aggression: 78,
    qualityScore: 74,
    pricePressurePct: 0.12,
    specialty: 'Hızlı paket servis ve gece vardiyası'
  },
  {
    id: 'rival_icanadolu_ankara',
    name: 'Başkent Yaprak Dönercisi',
    homeRegion: 'İç Anadolu',
    aggression: 68,
    qualityScore: 82,
    pricePressurePct: 0.10,
    specialty: 'Öğrenci & memur indirimli öğle menüleri'
  },
  {
    id: 'rival_ege_kordon',
    name: 'Kordon Ege Döner & Pide',
    homeRegion: 'Ege',
    aggression: 62,
    qualityScore: 80,
    pricePressurePct: 0.08,
    specialty: 'Turistik sahil şubeleri ve hijyen ödülü'
  },
  {
    id: 'rival_akdeniz_ates',
    name: 'Toros Soslu Dürüm İmparatorluğu',
    homeRegion: 'Akdeniz',
    aggression: 84,
    qualityScore: 77,
    pricePressurePct: 0.15,
    specialty: 'Özel soslu lavaş ve agresif kampanya'
  },
  {
    id: 'rival_guneydogu_hanedan',
    name: 'Zeugma Usta Ocakbaşı & Döner',
    homeRegion: 'Güneydoğu Anadolu',
    aggression: 72,
    qualityScore: 89,
    pricePressurePct: 0.09,
    specialty: 'Zırh kıyması ve odun ateşi yaprak döner'
  },
  {
    id: 'rival_karadeniz_yayla',
    name: 'Yayla Ateşi Karadeniz Döner',
    homeRegion: 'Karadeniz',
    aggression: 65,
    qualityScore: 83,
    pricePressurePct: 0.09,
    specialty: 'Tereyağlı porsiyon ve koyu esnaf sadakati'
  },
  {
    id: 'rival_dogu_serhat',
    name: 'Serhat Cağ & Yaprak Döner',
    homeRegion: 'Doğu Anadolu',
    aggression: 60,
    qualityScore: 86,
    pricePressurePct: 0.08,
    specialty: 'Yüksek gramajlı doğal besi et döner'
  }
];

// Faz 6: Marka Pazarlama Kampanyaları
export interface BrandCampaignDef {
  id: string;
  scope: 'mahalle' | 'sehir' | 'ulke';
  name: string;
  description: string;
  baseCost: number;
  durationDays: number;
  repBoost: number;
  demandBonusPct: number;
  viralChance: number;
}

export const BRAND_CAMPAIGNS: BrandCampaignDef[] = [
  {
    id: 'camp_local_flyer',
    scope: 'mahalle',
    name: 'Mahalle El İlanı & Tadım Tepsisi',
    description: 'Dükkan önünde sıcak döner ikramı ve esnafa indirim kuponu dağıtımı.',
    baseCost: 4200,
    durationDays: 3,
    repBoost: 3.5,
    demandBonusPct: 0.14,
    viralChance: 0.08
  },
  {
    id: 'camp_city_billboard',
    scope: 'sehir',
    name: 'Şehir Metro & Billboard Kampanyası',
    description: 'Bulunduğun ildeki tüm duraklarda ve yerel radyoda markanın reklamı döner.',
    baseCost: 19500,
    durationDays: 5,
    repBoost: 5.5,
    demandBonusPct: 0.20,
    viralChance: 0.18
  },
  {
    id: 'camp_national_tv',
    scope: 'ulke',
    name: 'Ulusal TV & Fenomen Tadım Turu',
    description: 'Türkiye genelinde prime-time reklam ve ünlü gurme kanallarında zincir tanıtımı.',
    baseCost: 68000,
    durationDays: 7,
    repBoost: 8.5,
    demandBonusPct: 0.28,
    viralChance: 0.35
  }
];
