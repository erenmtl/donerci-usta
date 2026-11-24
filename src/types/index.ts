// ============================================================================
// DÖNERCİ USTA - TÜM VERİ VE DURUM ARAYÜZLERİ (TypeScript Definitions)
// ============================================================================

export type Gender = 'erkek' | 'kadin';
export type FamilyStatus = 'bekar' | 'evli' | 'evli_cocuklu' | 'anne_baba_bakimli';
export type Season = 'İlkbahar' | 'Yaz' | 'Sonbahar' | 'Kış';
export type DayPhase = 'sabah_hazirlik' | 'acilis' | 'ogle_yogunlugu' | 'aksam_servisi' | 'kapanis';
export type CustomerType = 'ogrenci' | 'isci' | 'aile' | 'turist' | 'esnaf';
export type DifficultyLevel = 'kolay' | 'normal' | 'zor';

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
}

export interface GameState {
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

  // BAYİLEŞME, GÖREV, 3 KATMANLI İTİBAR VE HARİTA SİSTEMİ
  activeBranchId: string;
  branches: BranchState[];
  reputation: ReputationHierarchyState;
  quests: QuestProgressState;
  mapView: MapViewState;
}
