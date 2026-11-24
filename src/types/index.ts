// ============================================================================
// DÖNERCİ USTA - TÜM VERİ VE DURUM ARAYÜZLERİ (TypeScript Definitions)
// ============================================================================

export type Gender = 'erkek' | 'kadin';
export type FamilyStatus = 'bekar' | 'evli' | 'evli_cocuklu' | 'anne_baba_bakimli';
export type Season = 'İlkbahar' | 'Yaz' | 'Sonbahar' | 'Kış';
export type DayPhase = 'sabah_hazirlik' | 'acilis' | 'ogle_yogunlugu' | 'aksam_servisi' | 'kapanis';
export type CustomerType = 'ogrenci' | 'isci' | 'aile' | 'turist' | 'esnaf';
export type DifficultyLevel = 'kolay' | 'normal' | 'zor';

export type ManagementTier = 'usta' | 'mudur' | 'holding';
export type ManagerLevel = 'sube' | 'bolge';
export type ManagerStatus = 'aktif' | 'atanmamis' | 'egitimde';
export type PricePolicyMode = 'sabit' | 'enflasyon_takip' | 'mahalle_dinamik';
export type HygieneStandardMode = 'dusuk' | 'normal' | 'yuksek';
export type SupplierTierMode = 'ucuz' | 'standart' | 'kaliteli';
export type MapHeatmapMode = 'standard' | 'profit' | 'reputation';

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'Eş' | 'Çocuk' | 'Anne' | 'Baba';
  age: number;
  happiness: number;      // 0 - 100
  health: number;         // 0 - 100
  worksInShop: boolean;
  roleInShop?: string;
  monthlyExpense: number;
  statusText: string;
}

export interface GridItemInstance {
  instanceId: string;
  itemId: string;
  gx: number;
  gy: number;
  condition: number;
}

export interface IngredientStock {
  ingredientId: string;
  amount: number;
  freshnessDays: number;
  supplierTier: 'ucuz' | 'standart' | 'kaliteli';
}

export interface MenuItemState {
  recipeId: string;
  active: boolean;
  price: number;
  portionFactor: number;
  soldToday: number;
  soldTotal: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'usta' | 'kasiyer' | 'komi' | 'kurye';
  skill: number;
  morale: number;
  baseSalary: number;
  experienceDays: number;
  isFamily?: boolean;
}

export interface VeresiyeRecord {
  id: string;
  debtorName: string;
  npcId?: string;
  amount: number;
  dayGiven: number;
  dueDay: number;
  trustScore: number;
  note: string;
}

export interface NPCState {
  id: string;
  relation: number;
  shopHealth: number;
  hasActiveDeal: boolean;
  dealType?: string;
  partnerShare: number;
  talkedToday: boolean;
  lastDialogueReply?: string;
}

export interface InvestmentHolding {
  id: string;
  type: 'altin' | 'doviz' | 'mevduat' | 'gayrimenkul' | 'arac' | 'sube';
  name: string;
  units: number;
  avgCost: number;
  currentUnitValue: number;
  dailyYieldRate: number;
}

export interface BankLoan {
  id: string;
  name: string;
  remainingPrincipal: number;
  dailyInstallment: number;
  remainingDays: number;
  missedPayments: number;
}

export interface CustomerReview {
  id: string;
  author: string;
  customerType: CustomerType;
  rating: number;
  comment: string;
  day: number;
}

export interface DailyLedgerEntry {
  day: number;
  dateLabel: string;
  revenue: number;
  ingredientCost: number;
  operatingCost: number;
  familyCost: number;
  investmentIncome: number;
  netProfit: number;
  customersServed: number;
  customersLost: number;
  inflationIndex: number;
}

export interface HourlyPoint {
  hourLabel: string;
  revenue: number;
  cost: number;
  customers: number;
}

export interface StreetEncounterLog {
  id: string;
  timeLabel: string;
  speaker: string;
  role: string;
  text: string;
  impactLabel: string;
  tone: 'good' | 'warn' | 'info';
}

export interface BranchSnapshot {
  shop: GameState['shop'];
  inventory: Record<string, IngredientStock>;
  staff: StaffMember[];
  menu: Record<string, MenuItemState>;
}

export interface BranchState {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  neighborhoodType: string;
  isHeadquarters: boolean;
  isFranchise?: boolean;          // Faz 5: true ise Bayilik (Franchise), false/undefined ise Öz Şube
  franchiseRoyaltyPct?: number;   // Faz 5: Günlük cirodan alınan % pay (örn: 10)
  franchiseViolations?: number;   // Faz 5: Bayi kalite/hijyen ihlal sayacı
  managerId?: string;             // Faz 1.2: Atanmış Şube Müdürü ID'si
  regionName?: string;            // Faz 1.1: Coğrafi bölge adı (Marmara, Ege vb.)
  neighborhoodReputation: number; // 1. Katman: Mahalle/İlçe İtibarı (0-100)
  hygiene: number;
  decorScore: number;
  seatingCapacity: number;
  dailyRentBase: number;
  logisticsMultiplier: number;
  openingCostPaid: number;
  staffCount: number;
  stockHealthPct: number;
  todayRevenue: number;
  todayIngredientCost: number;
  todayRentAndTax: number;
  todayLogisticsCost: number;
  todayStaffCost: number;
  todayNetProfit: number;
  todayCustomers: number;
  totalCumulativeProfit: number;
  snapshot?: BranchSnapshot;
}

export interface ManagerState {
  id: string;
  name: string;
  title: string;
  level: ManagerLevel;           // 'sube' | 'bolge'
  skill: number;                 // 0 - 100
  honesty: number;               // 0 - 100 (dürüstlük; düşükse zimmet riski)
  loyalty: number;               // 0 - 100 (sadakat; düşükse istifa/transfer riski)
  experience: number;            // Görev yapılan gün sayısı
  baseMonthlySalary: number;     // Enflasyonla çarpılacak baz maaş
  assignedId?: string;           // Şube ID'si veya Bölge adı ('Marmara' vb.)
  status: ManagerStatus;
  isFamily?: boolean;            // Aileden yetişen çocuk mu?
  familyMemberId?: string;
  embezzledTotal?: number;       // Teftiş edilene kadar gizli biriken zimmet
}

export interface PolicyConfig {
  pricePolicy: PricePolicyMode;
  autoOrderThreshold: number;    // Stok % kaçın altına inince sipariş verilsin (örn: 45)
  supplierTier: SupplierTierMode;
  stockBudgetCeilingBase: number; // Günlük otomatik alım baz tavanı (enflasyonla çarpılır)
  hygieneStandard: HygieneStandardMode;
  targetHeadcount: number;
  raiseRatePct: number;
  spendingLimitBase: number;     // Müdürün onaysız harcayabileceği baz limit
}

export interface PendingDecision {
  id: string;
  dayCreated: number;
  branchId?: string;
  regionName?: string;
  managerId?: string;
  category: 'butce' | 'maas_zammi' | 'kira_yenileme' | 'personel' | 'kriz' | 'bayi_ihlal';
  title: string;
  description: string;
  cost: number;                  // Onaylanırsa kasadan çıkacak güncel (enflasyonlu) tutar
  approveEffectSummary: string;
  rejectEffectSummary: string;
}

export interface CentralWarehouseState {
  built: boolean;
  level: number;                 // 0 = yok, 1 = Bölgesel Soğuk Zincir Depo, 2 = Ulusal Lojistik & Et Entegre Üssü
  provinceId: string;
  bulkDiscountPct: number;
  coldChainReductionPct: number;
  supplyCrisisDaysLeft: number;
  supplyCrisisTitle?: string;
}

export interface ActiveBrandCampaign {
  campaignId: string;
  name: string;
  scope: 'mahalle' | 'sehir' | 'ulke';
  targetId?: string;             // branchId veya provinceId
  daysRemaining: number;
  demandBonusPct: number;
}

export interface ExecutiveReportEntry {
  day: number;
  summaryText: string;
  totalBranches: number;
  totalFranchises: number;
  managedBranches: number;
  totalNetProfit: number;
  alertsCount: number;
}

export interface ChainManagementState {
  tier: ManagementTier;          // 'usta' | 'mudur' | 'holding'
  highestTierNotified: ManagementTier;
  managers: ManagerState[];
  candidatePool: ManagerState[];
  chainPolicy: PolicyConfig;
  regionPolicies: Record<string, Partial<PolicyConfig>>;
  branchPolicies: Record<string, Partial<PolicyConfig>>;
  pendingDecisions: PendingDecision[];
  warehouse: CentralWarehouseState;
  activeCampaigns: ActiveBrandCampaign[];
  executiveReports: ExecutiveReportEntry[];
  rivalPriceWarDaysLeft: number;
  rivalCounterStance: 'kalite' | 'fiyat_kir' | 'kampanya';
}

export interface ReputationHierarchyState {
  neighborhoodReputation: number;          // Aktif şubenin mahalle/ilçe itibarı
  cityReputations: Record<string, number>; // 2. Katman: İl bazlı şehir itibarı (istanbul: 65, ankara: 52 vb.)
  countryReputation: number;               // 3. Katman: Tüm Türkiye ülke/marka itibarı
  lastScandalNote?: string;
}

export interface QuestProgressState {
  completedQuestIds: string[];
  currentTier: number;        // 1..5
  maxAllowedBranches: number; // Görevlerle açılan maksimum şube açma hakkı (Başlangıç: 1 -> Görevlerle 2, 3, 5, 8, 99)
  lifetimeCustomersServed: number;
}

export interface MapViewState {
  level: 'turkey' | 'city' | 'branch';
  selectedProvinceId: string;
  selectedDistrictId: string;
  heatmapMode?: MapHeatmapMode; // Faz 2: 'standard' | 'profit' | 'reputation'
}

export interface GameState {
  saveVersion: number;
  initialized: boolean;
  difficulty: DifficultyLevel;
  theme: 'dark' | 'light';

  player: {
    name: string;
    age: number;
    gender: Gender;
    city: string;
    neighborhoodType: string;
    scenarioId: string;
    energy: number;
    familyTimeRatio: number;
    successorId?: string;
  };
  family: {
    status: FamilyStatus;
    members: FamilyMember[];
    avgHappiness: number;
    houseRentBase: number;
    unpaidBills: number;
  };

  time: {
    day: number;
    year: number;
    season: Season;
    minuteOfDay: number;
    speed: 0 | 1 | 2 | 4;
    phase: DayPhase;
    specialEventToday?: string;
  };

  finance: {
    cash: number;
    bankDebt: number;
    inflationIndex: number;
    monthlyInflationRate: number;
    goldPrice: number;
    usdPrice: number;
    loans: BankLoan[];
    holdings: InvestmentHolding[];
    veresiyeList: VeresiyeRecord[];
    ledgerHistory: DailyLedgerEntry[];
    hourlyStats: HourlyPoint[];
    todayStats: {
      revenue: number;
      ingredientCost: number;
      operatingCost: number;
      familyCost: number;
      investmentIncome: number;
      customersServed: number;
      customersLost: number;
      tipsEarned: number;
      onlineOrdersServed: number;
      byCustomerType: Record<CustomerType, number>;
    };
  };

  shop: {
    name: string;
    level: number;
    gridCols: number;
    gridRows: number;
    hasSidewalkPermit: boolean;
    hasSecondFloor: boolean;
    onlineDeliveryEnabled: boolean;
    onlineCommissionRate: number;
    autoOrderIngredients: boolean;
    wallColor: string;
    floorStyle: string;
    hygiene: number;
    reputation: number;
    decorScore: number;
    seatingCapacity: number;
    speedBonus: number;
    donerRollKg: number;
    donerMaxKg: number;
    donerCookLevel: number;
    autoRestockDoner: boolean;
    trafficMultiplier: number;
    trafficReason: string;
    placedItems: GridItemInstance[];
  };

  inventory: Record<string, IngredientStock>;
  menu: Record<string, MenuItemState>;
  staff: StaffMember[];
  npcs: Record<string, NPCState>;
  streetFeed: StreetEncounterLog[];
  reviews: CustomerReview[];
  unlockedAchievements: string[];
  storyLog: Array<{ day: number; title: string; text: string }>;

  // BAYİLEŞME, GÖREV, 3 KATMANLI İTİBAR, HARİTA VE ZİNCİR YÖNETİMİ
  activeBranchId: string;
  branches: BranchState[];
  reputation: ReputationHierarchyState;
  quests: QuestProgressState;
  mapView: MapViewState;
  chainManagement: ChainManagementState;
}
