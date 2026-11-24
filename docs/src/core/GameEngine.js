// ============================================================================
// ANA OYUN MOTORU (GameEngine) - Gerçekçi Müşteri Akışı, Sosyal Çevre Menüsü & Organik Olaylar
// ============================================================================

import { bus } from './EventBus.js';
import { SaveManager } from './SaveManager.js';
import { NEIGHBORHOOD_TYPES, STARTING_SCENARIOS, FAMILY_TEMPLATES } from '../data/scenarios.js';
import { INGREDIENTS, SUPPLIER_TIERS } from '../data/ingredients.js';
import { RECIPES } from '../data/recipes.js';
import { FURNITURE_CATALOG, WALL_STYLES, FLOOR_STYLES, SHOP_UPGRADES } from '../data/furniture.js';
import { STREET_NPCS } from '../data/npcs.js';
import { RANDOM_EVENTS, SPECIAL_CALENDAR_DAYS, REVIEW_TEMPLATES } from '../data/events.js';
import { ACHIEVEMENTS, INVESTMENT_CATALOG, LOAN_PACKAGES } from '../data/achievements.js';
import { ReputationSystem } from './ReputationSystem.js';
import { QuestSystem } from './QuestSystem.js';
import { BranchSystem } from './BranchSystem.js';
import { ManagementSystem } from './ManagementSystem.js';
import { MANAGEMENT_CONFIG, REGIONAL_CULTURE_MODIFIERS } from '../data/management.js';
import { TURKEY_PROVINCES } from '../data/turkey_map.js';

export class GameEngine {

  tickIntervalId = null;
  customerSpawnAccumulator = 0;
  eventsTriggeredTodayCount = 0;
  nextOrganicEventMinute = 660; // Gün içinde rastgele belirlenen olay saati

  constructor() {
    this.rollNextOrganicEventTime();
    const saved = SaveManager.loadAuto();
    if (saved && saved.initialized) {
      this.state = this.upgradeSavedState(saved);
      this.recalculateShopStats();
    } else {
      this.state = this.createBlankState();
    }
  }

  rollNextOrganicEventTime() {
    // 10:30 (630) ile 18:30 (1110) arasında rastgele bir dakikada organik olay gelişir
    this.nextOrganicEventMinute = 630 + Math.floor(Math.random() * 480);
  }

  createInitialHourlyStats() {
    return [
      { hourLabel: '08:00', revenue: 0, cost: 0, customers: 0 },
      { hourLabel: '10:00', revenue: 0, cost: 0, customers: 0 },
      { hourLabel: '12:00', revenue: 0, cost: 0, customers: 0 },
      { hourLabel: '14:00', revenue: 0, cost: 0, customers: 0 },
      { hourLabel: '16:00', revenue: 0, cost: 0, customers: 0 },
      { hourLabel: '18:00', revenue: 0, cost: 0, customers: 0 },
      { hourLabel: '20:00', revenue: 0, cost: 0, customers: 0 },
      { hourLabel: '22:00', revenue: 0, cost: 0, customers: 0 }
    ];
  }

  createSeededLedgerHistory() {
    return [
      {
        day: 1,
        dateLabel: 'Hazırlık -1',
        revenue: 3800,
        ingredientCost: 1250,
        operatingCost: 950,
        familyCost: 520,
        investmentIncome: 0,
        netProfit: 1080,
        customersServed: 21,
        customersLost: 2,
        inflationIndex: 0.96
      },
      {
        day: 2,
        dateLabel: 'Hazırlık -2',
        revenue: 4250,
        ingredientCost: 1400,
        operatingCost: 980,
        familyCost: 530,
        investmentIncome: 120,
        netProfit: 1460,
        customersServed: 24,
        customersLost: 1,
        inflationIndex: 0.97
      },
      {
        day: 3,
        dateLabel: 'Hazırlık -3',
        revenue: 3950,
        ingredientCost: 1320,
        operatingCost: 1000,
        familyCost: 540,
        investmentIncome: 140,
        netProfit: 1230,
        customersServed: 22,
        customersLost: 3,
        inflationIndex: 0.98
      },
      {
        day: 4,
        dateLabel: 'Hazırlık -4',
        revenue: 4700,
        ingredientCost: 1550,
        operatingCost: 1020,
        familyCost: 550,
        investmentIncome: 160,
        netProfit: 1740,
        customersServed: 27,
        customersLost: 1,
        inflationIndex: 0.99
      },
      {
        day: 5,
        dateLabel: 'Açılış Öncesi',
        revenue: 5150,
        ingredientCost: 1680,
        operatingCost: 1050,
        familyCost: 560,
        investmentIncome: 180,
        netProfit: 2040,
        customersServed: 29,
        customersLost: 1,
        inflationIndex: 1.0
      }
    ];
  }

  upgradeSavedState(saved) {
    if (!saved.finance.hourlyStats || saved.finance.hourlyStats.length === 0) {
      saved.finance.hourlyStats = this.createInitialHourlyStats();
    }
    if (!saved.finance.todayStats.byCustomerType) {
      saved.finance.todayStats.byCustomerType = { ogrenci: 8, isci: 6, aile: 5, turist: 2, esnaf: 4 };
    }
    if (!saved.finance.ledgerHistory || saved.finance.ledgerHistory.length === 0) {
      saved.finance.ledgerHistory = this.createSeededLedgerHistory();
    }
    if (saved.shop.autoOrderIngredients === undefined) {
      saved.shop.autoOrderIngredients = true;
    }
    if (saved.shop.trafficMultiplier === undefined) {
      saved.shop.trafficMultiplier = 1.0;
    }
    if (!saved.shop.trafficReason) {
      saved.shop.trafficReason = 'Normal Sokak Akışı (%100)';
    }
    if (!saved.streetFeed || saved.streetFeed.length === 0) {
      saved.streetFeed = this.createInitialStreetFeed();
    }
    for (const ing of INGREDIENTS) {
      if (saved.inventory[ing.id] && saved.inventory[ing.id].amount < 60) {
        saved.inventory[ing.id].amount = ing.startingStock;
        saved.inventory[ing.id].freshnessDays = ing.shelfLifeDays;
      }
    }
    // Yeni eklenen 14 menü ürününü eski kayıtlara da ekle
    for (const rec of RECIPES) {
      if (!saved.menu[rec.id]) {
        saved.menu[rec.id] = {
          recipeId: rec.id,
          active: rec.socialTag !== 'turist_gurme',
          price: Math.round(rec.baseSuggestedPrice * (saved.finance.inflationIndex || 1)),
          portionFactor: 1.0,
          soldToday: 0,
          soldTotal: Math.floor(Math.random() * 15) + 5
        };
      }
    }

    // Bayileşme, 3 Katmanlı İtibar, Görev, Harita ve Zincir Yönetimi alanlarını eski kayıtlara ekle
    SaveManager.migrateState(saved);
    return saved;
  }

  createInitialStreetFeed() {
    return [
      {
        id: 'sf_1',
        timeLabel: '08:30',
        speaker: 'Kasap Hasan Abi',
        role: 'Öz Güven Kasabı',
        text: 'Hayırlı işler komşu! Bu sabah Balıkesir’den dinlenmiş dana yaprak geldi, senin ocağa çok yakışır.',
        impactLabel: 'Tedarik İlişkisi Aktif',
        tone: 'good'
      },
      {
        id: 'sf_2',
        timeLabel: '09:15',
        speaker: 'Fırıncı Ayşe Abla',
        role: 'Bereket Taş Fırını',
        text: 'İlk fırın susamlı tombik pideleri ve tandır lavaşlarını çırağınla gönderdim, sıcak sıcak sararsın.',
        impactLabel: '+Tazelik & Lezzet',
        tone: 'good'
      },
      {
        id: 'sf_3',
        timeLabel: '10:00',
        speaker: 'Çaycı Rıza Amca',
        role: 'Çınaraltı Çay Ocağı',
        text: 'Esnaf kahvesinde herkes senin menüyü konuşuyor. Sokağın bütçesine göre fiyat belirlersen kapında kuyruk olur!',
        impactLabel: '+Mahalle İtibarı',
        tone: 'info'
      }
    ];
  }

  createBlankState() {
    const inv = {};
    for (const ing of INGREDIENTS) {
      inv[ing.id] = {
        ingredientId: ing.id,
        amount: ing.startingStock,
        freshnessDays: ing.shelfLifeDays,
        supplierTier: 'standart'
      };
    }

    const menu = {};
    for (const rec of RECIPES) {
      menu[rec.id] = {
        recipeId: rec.id,
        active: rec.socialTag !== 'turist_gurme',
        price: rec.baseSuggestedPrice,
        portionFactor: 1.0,
        soldToday: Math.floor(Math.random() * 4) + 1,
        soldTotal: Math.floor(Math.random() * 25) + 10
      };
    }

    const npcs = {};
    for (const npc of STREET_NPCS) {
      npcs[npc.id] = {
        id: npc.id,
        relation: 55,
        shopHealth: 78,
        hasActiveDeal: false,
        partnerShare: 0,
        talkedToday: false,
        lastDialogueReply: npc.dialogues[0]?.greeting || 'Hayırlı işler komşu!'
      };
    }

    return {
      saveVersion: MANAGEMENT_CONFIG.saveVersion,
      initialized: false,
      difficulty: 'normal',
      theme: 'dark',
      player: {
        name: 'Ahmet Usta',
        age: 32,
        gender: 'erkek',
        city: 'İstanbul',
        neighborhoodType: 'universite_mahallesi',
        scenarioId: 'babadan_miras',
        energy: 100,
        familyTimeRatio: 40
      },
      family: {
        status: 'evli_cocuklu',
        members: [],
        avgHappiness: 84,
        houseRentBase: 14000,
        unpaidBills: 0
      },
      time: {
        day: 1,
        year: 1,
        season: 'İlkbahar',
        minuteOfDay: 480,
        speed: 1,
        phase: 'sabah_hazirlik'
      },
      finance: {
        cash: 45000,
        bankDebt: 0,
        inflationIndex: 1.0,
        monthlyInflationRate: 0.045,
        goldPrice: 3000,
        usdPrice: 35,
        loans: [],
        holdings: [],
        veresiyeList: [
          {
            id: 'ver_init_1',
            debtorName: 'Çırak Osman’ın Babası',
            amount: 450,
            dayGiven: 1,
            dueDay: 8,
            trustScore: 85,
            note: 'Geçen haftadan kalan dürüm hesabı'
          },
          {
            id: 'ver_init_2',
            debtorName: 'Taksici Durağı (4 Dürüm + Ayran)',
            amount: 620,
            dayGiven: 1,
            dueDay: 6,
            trustScore: 92,
            note: 'Vardiya değişiminde ödeyecekler'
          }
        ],
        ledgerHistory: this.createSeededLedgerHistory(),
        hourlyStats: this.createInitialHourlyStats(),
        todayStats: {
          revenue: 0,
          ingredientCost: 0,
          operatingCost: 0,
          familyCost: 0,
          investmentIncome: 0,
          customersServed: 0,
          customersLost: 0,
          tipsEarned: 0,
          onlineOrdersServed: 0,
          byCustomerType: { ogrenci: 8, isci: 5, aile: 4, turist: 2, esnaf: 4 }
        }
      },
      shop: {
        name: 'Meşhur Dönerci Usta',
        level: 1,
        gridCols: 6,
        gridRows: 5,
        hasSidewalkPermit: false,
        hasSecondFloor: false,
        onlineDeliveryEnabled: false,
        onlineCommissionRate: 0.18,
        autoOrderIngredients: true,
        wallColor: 'krem_siva',
        floorStyle: 'klasik_karo',
        hygiene: 86,
        reputation: 64,
        decorScore: 24,
        seatingCapacity: 8,
        speedBonus: 18,
        donerRollKg: 25,
        donerMaxKg: 25,
        donerCookLevel: 92,
        autoRestockDoner: true,
        trafficMultiplier: 1.0,
        trafficReason: 'Normal Sokak Akışı (%100)',
        placedItems: [
          { instanceId: 'init_ocak', itemId: 'doner_ocagi_standart', gx: 1, gy: 0, condition: 100 },
          { instanceId: 'init_tezgah', itemId: 'mermer_tezgah', gx: 2, gy: 0, condition: 100 },
          { instanceId: 'init_kasa', itemId: 'kasa_pos', gx: 4, gy: 0, condition: 100 },
          { instanceId: 'init_dolap', itemId: 'endustriyel_buzdolabi', gx: 0, gy: 0, condition: 100 },
          { instanceId: 'init_masa1', itemId: 'tabureli_masa', gx: 1, gy: 2, condition: 100 },
          { instanceId: 'init_masa2', itemId: 'aile_masasi_4', gx: 3, gy: 2, condition: 100 },
          { instanceId: 'init_bitki', itemId: 'salon_bitkisi', gx: 5, gy: 1, condition: 100 },
          { instanceId: 'init_tabela', itemId: 'neon_tabela', gx: 2, gy: 0, condition: 100 }
        ]
      },
      inventory: inv,
      menu: menu,
      staff: [],
      npcs: npcs,
      streetFeed: this.createInitialStreetFeed(),
      reviews: [
        {
          id: 'rev_1',
          author: 'Mahalleli Kemal',
          customerType: 'esnaf',
          rating: 5,
          comment: 'Hayırlı uğurlu olsun ustam! İlk günkü dönerin kokusu sokağa bereket getirdi.',
          day: 1
        },
        {
          id: 'rev_2',
          author: 'Kampüs_Mert',
          customerType: 'ogrenci',
          rating: 5,
          comment: 'Soslu tavuk dürüm ve yayık ayran efsane, fiyatlar da öğrenci dostu!',
          day: 1
        }
      ],
      unlockedAchievements: [],
      storyLog: [],
      activeBranchId: 'branch_hq',
      branches: [],
      reputation: {
        neighborhoodReputation: 64,
        cityReputations: { istanbul: 62, ankara: 50, izmir: 50, bursa: 50 },
        countryReputation: 54
      },
      quests: {
        completedQuestIds: [],
        currentTier: 1,
        maxAllowedBranches: 1,
        lifetimeCustomersServed: 18
      },
      mapView: {
        level: 'city',
        selectedProvinceId: 'istanbul',
        selectedDistrictId: 'ist_besiktas',
        heatmapMode: 'standard'
      },
      chainManagement: SaveManager.createDefaultChainManagement('istanbul')
    };
  }

  startNewGame(config) {
    const fresh = this.createBlankState();
    const scenario = STARTING_SCENARIOS.find((s) => s.id === config.scenarioId) || STARTING_SCENARIOS[0];
    const famTemplate = FAMILY_TEMPLATES[config.familyStatus] || FAMILY_TEMPLATES.evli_cocuklu;

    fresh.initialized = true;
    fresh.difficulty = config.difficulty;
    fresh.player = {
      name: config.playerName.trim() || 'Ahmet Usta',
      age: config.age || 32,
      gender: config.gender,
      city: config.city || 'İstanbul',
      neighborhoodType: config.neighborhoodType,
      scenarioId: config.scenarioId,
      energy: 100,
      familyTimeRatio: 40
    };

    fresh.shop.name = config.shopName.trim() || `${fresh.player.name}'nın Yeri`;
    fresh.shop.reputation = scenario.startingReputation;
    fresh.shop.hygiene = scenario.startingHygiene;

    fresh.family = {
      status: config.familyStatus,
      members: famTemplate.createMembers(fresh.player.age),
      avgHappiness: 84,
      houseRentBase: famTemplate.houseRentBase,
      unpaidBills: 0
    };

    const diffCashMult = config.difficulty === 'kolay' ? 1.25 : config.difficulty === 'zor' ? 0.8 : 1.0;
    fresh.finance.cash = Math.round(scenario.startingCash * diffCashMult);
    fresh.finance.bankDebt = scenario.startingDebt;
    fresh.finance.monthlyInflationRate = config.difficulty === 'zor' ? 0.065 : config.difficulty === 'kolay' ? 0.03 : 0.045;

    if (scenario.startingDebt > 0) {
      fresh.finance.loans.push({
        id: 'loan_init',
        name: 'Başlangıç Esnaf Kurulum Kredisi',
        remainingPrincipal: scenario.startingDebt,
        dailyInstallment: Math.round(scenario.startingDebt / 40),
        remainingDays: 40,
        missedPayments: 0
      });
    }

    for (const npcId of Object.keys(fresh.npcs)) {
      fresh.npcs[npcId].relation = Math.max(25, Math.min(90, 55 + scenario.bonusRelation));
    }

    fresh.storyLog.push({
      day: 1,
      title: `${fresh.shop.name} Bismillah Diyerek Kepenk Açtı!`,
      text: `${scenario.story} ${fresh.player.city} şehrinde ocağın ilk ateşi yakıldı.`
    });

    this.state = fresh;
    // Seçilen mahallenin sosyal çevresine göre başlangıç menüsünü optimize et
    this.applyNeighborhoodMenuPreset('social_optimal', true);
    this.recalculateShopStats();
    this.state.activeBranchId = 'branch_hq';
    const hqBranch = BranchSystem.createHeadquartersBranch(this.state);
    this.state.branches = [hqBranch];
    this.state.mapView = {
      level: 'city',
      selectedProvinceId: hqBranch.provinceId,
      selectedDistrictId: hqBranch.districtId,
      heatmapMode: 'standard'
    };
    this.state.chainManagement = SaveManager.createDefaultChainManagement(hqBranch.provinceId);
    ReputationSystem.syncReputations(this.state);
    SaveManager.saveAuto(this.state);
    this.startLoop();
    bus.emit('game:initialized', this.state);
    bus.emit('state:updated', this.state);
  }

  startLoop() {
    if (this.tickIntervalId !== null) {
      window.clearInterval(this.tickIntervalId);
    }
    this.tickIntervalId = window.setInterval(() => this.tick(), 250);
  }

  setSpeed(speed) {
    this.state.time.speed = speed;
    bus.emit('state:updated', this.state);
  }

  tick() {
    if (!this.state.initialized) return;
    if (this.state.time.speed === 0) return;

    const minutesDelta = 1.5 * this.state.time.speed;
    this.state.time.minuteOfDay += minutesDelta;

    this.updateDayPhase();

    if (this.state.time.minuteOfDay >= 510 && this.state.time.minuteOfDay < 1290) {
      this.simulateShopOperations(minutesDelta);
    }

    // ORGANİK RASTGELE OLAY KONTROLÜ (Manuel buton yok; gün içinde duruma göre kendiliğinden gelişir)
    if (
      this.eventsTriggeredTodayCount === 0 &&
      this.state.time.minuteOfDay >= this.nextOrganicEventMinute
    ) {
      this.eventsTriggeredTodayCount += 1;
      // Hijyen düşükse kesin olay tetiklenir, değilse %65 ihtimalle gün içi organik olay gelişir
      if (this.state.shop.hygiene < 68 || Math.random() < 0.65) {
        this.triggerOrganicEvent();
      }
    }

    if (this.state.time.minuteOfDay >= 1320) {
      this.finishDay();
    }

    bus.emit('time:tick', this.state);
  }

  updateDayPhase() {
    const m = this.state.time.minuteOfDay;
    let newPhase = 'sabah_hazirlik';
    if (m < 540) newPhase = 'sabah_hazirlik';
    else if (m < 720) newPhase = 'acilis';
    else if (m < 900) newPhase = 'ogle_yogunlugu';
    else if (m < 1260) newPhase = 'aksam_servisi';
    else newPhase = 'kapanis';

    if (newPhase !== this.state.time.phase) {
      this.state.time.phase = newPhase;
      bus.emit('state:updated', this.state);
    }
  }

  // ==========================================================================
  // SOSYAL ÇEVRE (MAHALLE PROFİLİ) UYUMU, ENFLASYON VE MENÜ OPTİMİZASYONU
  // ==========================================================================

  getNeighborhoodRecipeDemand(recipeId) {
    const rec = RECIPES.find((r) => r.id === recipeId);
    const hood = NEIGHBORHOOD_TYPES.find((n) => n.id === this.state.player.neighborhoodType) || NEIGHBORHOOD_TYPES[0];
    if (!rec) {
      return { score: 50, label: 'Orta Talep', badgeClass: 'badge-neutral', maxBudgetPrice: 150 };
    }

    const w = hood.customerWeights;
    const totalW = w.ogrenci + w.isci + w.aile + w.turist + w.esnaf;
    const baseAppeal = Math.round(
      (rec.appeal.ogrenci * w.ogrenci +
        rec.appeal.isci * w.isci +
        rec.appeal.aile * w.aile +
        rec.appeal.turist * w.turist +
        rec.appeal.esnaf * w.esnaf) /
        Math.max(1, totalW)
    );

    // Faz 4: Bölgesel kültür ve damak tadı etkisi
    const activeBranch = this.state.branches?.find((b) => b.id === this.state.activeBranchId);
    const prov = TURKEY_PROVINCES.find((p) => p.id === (activeBranch?.provinceId || 'istanbul'));
    const region = activeBranch?.regionName || prov?.region || 'Marmara';
    const culture = REGIONAL_CULTURE_MODIFIERS[region] || REGIONAL_CULTURE_MODIFIERS['Marmara'];

    let regionBonusMult = 1.0;
    if (rec.id.includes('et') || rec.id.includes('iskender') || rec.id.includes('beyti')) {
      regionBonusMult = culture.meatPreferenceBonus;
    } else if (rec.id.includes('tavuk')) {
      regionBonusMult = culture.chickenPreferenceBonus;
    } else if (rec.id.includes('kunefe') || rec.id.includes('salgam') || rec.id.includes('sosyete')) {
      regionBonusMult = culture.spicyAndDessertBonus;
    }

    const weightedAppeal = Math.min(100, Math.round(baseAppeal * regionBonusMult));

    const suggested = this.getSuggestedPrice(recipeId);
    // Mahallenin sosyal çevresine göre müşterinin ödeyebileceği tavan fiyat
    let budgetFactor = 1.15;
    if (hood.id === 'universite_mahallesi') budgetFactor = 1.05; // Öğrenci bütçesi hassas
    else if (hood.id === 'carsi_sanayi') budgetFactor = 1.12;
    else if (hood.id === 'aile_semti') budgetFactor = 1.22;
    else if (hood.id === 'turistik_merkez') budgetFactor = 1.42; // Turistler yüksek fiyata açık

    const maxBudgetPrice = Math.round((suggested * budgetFactor) / 5) * 5;

    if (weightedAppeal >= 82) {
      return { score: weightedAppeal, label: '🔥 Bu Sokakta Çok Yüksek Talep', badgeClass: 'badge-success', maxBudgetPrice };
    } else if (weightedAppeal >= 65) {
      return { score: weightedAppeal, label: '👍 Bu Sokakta Dengeli Talep', badgeClass: 'badge-info', maxBudgetPrice };
    } else {
      return { score: weightedAppeal, label: '⚠️ Bu Sokakta Düşük Talep', badgeClass: 'badge-warning', maxBudgetPrice };
    }
  }

  getNeighborhoodMenuFitScore() {
    const activeRecipes = RECIPES.filter((r) => this.state.menu[r.id]?.active);
    if (activeRecipes.length === 0) return 20;

    let sumScore = 0;
    let penalty = 0;

    for (const r of activeRecipes) {
      const demand = this.getNeighborhoodRecipeDemand(r.id);
      const ms = this.state.menu[r.id];
      sumScore += demand.score;

      // Fiyat mahallenin bütçe tavanını aşıyorsa uyum puanı düşer
      if (ms.price > demand.maxBudgetPrice) {
        const overRatio = (ms.price - demand.maxBudgetPrice) / Math.max(1, demand.maxBudgetPrice);
        penalty += Math.min(35, Math.round(overRatio * 80));
      }
    }

    const avg = Math.round(sumScore / activeRecipes.length) - Math.round(penalty / Math.max(1, activeRecipes.length));
    return Math.max(15, Math.min(100, avg));
  }

  applyNeighborhoodMenuPreset(mode, silent = false) {
    const hoodId = this.state.player.neighborhoodType;

    for (const rec of RECIPES) {
      const ms = this.state.menu[rec.id];
      const suggested = this.getSuggestedPrice(rec.id);
      const demand = this.getNeighborhoodRecipeDemand(rec.id);

      if (mode === 'social_optimal') {
        // Sokağın sosyal çevresinde talebi 65 üstü olanları aktif et ve mahalle bütçe tavanını aşmayacak şekilde fiyatla
        ms.active = demand.score >= 64 || rec.category === 'icecek';
        ms.portionFactor = 1.0;
        const freshSuggested = this.getSuggestedPrice(rec.id);
        const freshDemand = this.getNeighborhoodRecipeDemand(rec.id);
        if (hoodId === 'universite_mahallesi') {
          ms.price = Math.min(freshDemand.maxBudgetPrice, Math.max(15, Math.round((freshSuggested * 0.94) / 5) * 5));
        } else if (hoodId === 'carsi_sanayi') {
          ms.price = Math.min(freshDemand.maxBudgetPrice, freshSuggested);
        } else if (hoodId === 'aile_semti') {
          ms.price = Math.min(freshDemand.maxBudgetPrice, Math.round((freshSuggested * 1.05) / 5) * 5);
        } else {
          // Turistik merkez
          ms.active = freshDemand.score >= 58;
          ms.price = Math.min(freshDemand.maxBudgetPrice, Math.round((freshSuggested * 1.12) / 5) * 5);
        }
      } else if (mode === 'ekonomik_surum') {
        ms.active = rec.socialTag === 'ogrenci_favorisi' || rec.socialTag === 'sanayi_esnaf' || rec.category === 'icecek';
        ms.portionFactor = 0.8;
        ms.price = Math.max(15, Math.round((this.getSuggestedPrice(rec.id) * 0.9) / 5) * 5);
      } else if (mode === 'orta_dengeli') {
        ms.active = rec.socialTag !== 'turist_gurme';
        ms.portionFactor = 1.0;
        ms.price = this.getSuggestedPrice(rec.id);
      } else if (mode === 'prestij_gurme') {
        ms.active = rec.socialTag === 'aile_klasik' || rec.socialTag === 'turist_gurme' || rec.category === 'icecek' || rec.category === 'tatli';
        ms.portionFactor = 1.25;
        ms.price = Math.round((this.getSuggestedPrice(rec.id) * 1.12) / 5) * 5;
      }
    }

    if (!silent) {
      bus.emit('toast:show', {
        title: 'Menü & Fiyat Stratejisi Uygulandı 🌯',
        text: `Menü ürünleri ve fiyatlar sokağın sosyal çevresine (%${this.getNeighborhoodMenuFitScore()} Uyum) göre ayarlandı.`,
        type: 'success'
      });
      SaveManager.saveAuto(this.state);
      bus.emit('state:updated', this.state);
    }
  }

  getIngredientUnitCost(ingredientId, tierOverride) {
    const def = INGREDIENTS.find((i) => i.id === ingredientId);
    if (!def) return 10;
    const stock = this.state.inventory[ingredientId];
    const tierKey = tierOverride || stock?.supplierTier || 'standart';
    const tier = SUPPLIER_TIERS[tierKey];

    let discountMult = 1.0;
    if (def.category === 'et' && this.state.npcs['kasap_hasan']?.hasActiveDeal) {
      discountMult *= 0.82;
    }
    if (def.category === 'unlu' && this.state.npcs['firinci_ayse']?.hasActiveDeal) {
      discountMult *= 0.80;
    }
    if (def.category === 'sebze_sos' && this.state.npcs['manav_cevdet']?.hasActiveDeal) {
      discountMult *= 0.80;
    }

    // Faz 3: Merkez Depo toplu alım indirimi ve tedarik krizi etkisi
    const wh = this.state.chainManagement?.warehouse;
    if (wh?.built) {
      discountMult *= 1 - wh.bulkDiscountPct;
    }
    if (wh && wh.supplyCrisisDaysLeft > 0) {
      discountMult *= 1.14;
    }

    return Math.round(def.baseCost * this.state.finance.inflationIndex * tier.costMultiplier * discountMult * 10) / 10;
  }

  getRecipeUnitCost(recipeId) {
    const rec = RECIPES.find((r) => r.id === recipeId);
    if (!rec) return 0;
    const menuState = this.state.menu[recipeId];
    const portionFactor = menuState?.portionFactor || 1.0;

    let cost = 0;
    for (const req of rec.ingredients) {
      cost += this.getIngredientUnitCost(req.ingredientId) * req.amount * portionFactor;
    }
    return Math.round(cost);
  }

  getSuggestedPrice(recipeId) {
    const rec = RECIPES.find((r) => r.id === recipeId);
    if (!rec) return 100;
    const menuState = this.state.menu[recipeId];
    const portionFactor = menuState?.portionFactor || 1.0;

    const repBonus = 1 + (this.state.shop.reputation - 50) * 0.003;
    const raw = rec.baseSuggestedPrice * this.state.finance.inflationIndex * portionFactor * repBonus;
    return Math.max(10, Math.round(raw / 5) * 5);
  }

  // ==========================================================================
  // GERÇEKÇİ MÜŞTERİ AKIŞI, SOSYAL ÇEVRE FİLTRESİ VE HİJYEN ETKİSİ
  // ==========================================================================

  simulateShopOperations(minutesDelta) {
    if (this.state.shop.donerRollKg < 3 && this.state.shop.autoRestockDoner) {
      this.restockDonerSkewer(true);
    }
    this.state.shop.donerCookLevel = Math.min(100, this.state.shop.donerCookLevel + minutesDelta * 0.8);

    if (this.state.shop.autoOrderIngredients) {
      for (const ing of INGREDIENTS) {
        const st = this.state.inventory[ing.id];
        if (st && st.amount < 20) {
          const packCost = Math.round(this.getIngredientUnitCost(ing.id, st.supplierTier) * ing.packSize);
          if (this.state.finance.cash >= packCost * 1.5) {
            this.orderIngredientPack(ing.id, st.supplierTier);
          }
        }
      }
    }

    let phaseMult = 0.8;
    if (this.state.time.phase === 'ogle_yogunlugu') phaseMult = 1.45;
    else if (this.state.time.phase === 'aksam_servisi') phaseMult = 1.25;
    else if (this.state.time.phase === 'acilis') phaseMult = 0.7;

    const seasonMult =
      this.state.time.season === 'Yaz'
        ? this.state.shop.hasSidewalkPermit ? 1.2 : 1.08
        : this.state.time.season === 'Kış' ? 0.90 : 1.0;

    const specialDay = SPECIAL_CALENDAR_DAYS[this.state.time.day % 30 || 30];
    const specialMult = specialDay ? specialDay.demandMultiplier : 1.0;

    // İtibar, Hijyen, Sosyal Çevre Menü Uyumu ve Günlük Olay Çarpanı
    const repMult = 0.55 + (this.state.shop.reputation / 100) * 0.75;
    const hygieneMult = this.state.shop.hygiene >= 75 ? 1.08 : this.state.shop.hygiene >= 55 ? 0.88 : 0.55;
    const menuFitMult = 0.55 + (this.getNeighborhoodMenuFitScore() / 100) * 0.65;
    const eventTrafficMult = Math.max(0.35, this.state.shop.trafficMultiplier || 1.0);
    const socialBoost = this.state.npcs['kafe_berkay']?.hasActiveDeal ? 1.12 : 1.0;

    // Gerçekçi baz müşteri geliş hızı (Normal bir günde 20-35 müşteri, büyümüş dükkanda 45-65 müşteri)
    const baseRate = 0.036 + (this.state.shop.level - 1) * 0.012;
    const spawnRatePerMinute =
      baseRate * phaseMult * seasonMult * specialMult * repMult * hygieneMult * menuFitMult * eventTrafficMult * socialBoost;

    this.customerSpawnAccumulator += minutesDelta * spawnRatePerMinute;

    while (this.customerSpawnAccumulator >= 1) {
      this.customerSpawnAccumulator -= 1;
      this.processSingleCustomerArrival();
    }

    // Arka plandaki diğer açık şubelerin gün içi müşteri ve satış akışı
    BranchSystem.simulateBackgroundBranchesIntraday(this.state, minutesDelta);
    ReputationSystem.syncReputations(this.state);
    QuestSystem.evaluateQuests(this.state, this.getNetWorth());
  }

  pickCustomerType() {
    const hood = NEIGHBORHOOD_TYPES.find((n) => n.id === this.state.player.neighborhoodType) || NEIGHBORHOOD_TYPES[0];
    const w = { ...hood.customerWeights };

    for (const placed of this.state.shop.placedItems) {
      const def = FURNITURE_CATALOG.find((f) => f.id === placed.itemId);
      if (def?.effects.customerAppeal) {
        w.ogrenci += def.effects.customerAppeal.ogrenci || 0;
        w.isci += def.effects.customerAppeal.isci || 0;
        w.aile += def.effects.customerAppeal.aile || 0;
        w.turist += def.effects.customerAppeal.turist || 0;
      }
    }

    const total = w.ogrenci + w.isci + w.aile + w.turist + w.esnaf;
    let roll = Math.random() * total;
    const types = ['ogrenci', 'isci', 'aile', 'turist', 'esnaf'];
    for (const t of types) {
      roll -= w[t];
      if (roll <= 0) return t;
    }
    return 'ogrenci';
  }

  processSingleCustomerArrival() {
    const cType = this.pickCustomerType();

    // Hijyen çok düşükse müşteri kapıdan içeri bakıp vazgeçer!
    if (this.state.shop.hygiene < 55 && Math.random() < 0.45) {
      this.state.finance.todayStats.customersLost += 1;
      this.state.shop.reputation = Math.max(10, this.state.shop.reputation - 0.2);
      return;
    }

    const isOnlineOrder =
      this.state.shop.onlineDeliveryEnabled &&
      (this.state.staff.some((s) => s.role === 'kurye') ||
        this.state.finance.holdings.some((h) => h.id === 'kurye_motoru')) &&
      Math.random() < 0.25;

    const activeMainRecipes = RECIPES.filter(
      (r) => r.category === 'ana_yemek' && this.state.menu[r.id]?.active
    );
    if (activeMainRecipes.length === 0) {
      this.state.finance.todayStats.customersLost += 1;
      return;
    }

    // Müşteri kendi sosyal grubuna uygun ürün arar
    activeMainRecipes.sort((a, b) => b.appeal[cType] - a.appeal[cType]);
    const topMatches = activeMainRecipes.filter((r) => r.appeal[cType] >= 55);
    if (topMatches.length === 0 && Math.random() < 0.65) {
      // Menüde bu müşteri tipine hitap eden ürün yoksa müşteri vazgeçer!
      this.state.finance.todayStats.customersLost += 1;
      return;
    }

    const pool = topMatches.length > 0 ? topMatches : activeMainRecipes;
    const chosenMain = pool[Math.floor(Math.random() * Math.min(3, pool.length))];

    const menuState = this.state.menu[chosenMain.id];
    const demandInfo = this.getNeighborhoodRecipeDemand(chosenMain.id);

    // Fiyat mahallenin bütçe tavanını aşıyorsa müşteri kapıdan döner
    if (menuState.price > demandInfo.maxBudgetPrice) {
      const overPct = (menuState.price - demandInfo.maxBudgetPrice) / Math.max(1, demandInfo.maxBudgetPrice);
      const rejectProb = Math.min(0.92, 0.45 + overPct * 1.8);
      if (Math.random() < rejectProb) {
        this.state.finance.todayStats.customersLost += 1;
        this.state.shop.reputation = Math.max(10, this.state.shop.reputation - 0.15);
        return;
      }
    }

    if (!this.hasIngredientsForRecipe(chosenMain.id) || this.state.shop.donerRollKg <= 0.08) {
      this.state.finance.todayStats.customersLost += 1;
      return;
    }

    const chosenItems = [chosenMain];

    const activeDrinks = RECIPES.filter((r) => r.category === 'icecek' && this.state.menu[r.id]?.active);
    if (activeDrinks.length > 0 && Math.random() < 0.65) {
      const drink = activeDrinks[Math.floor(Math.random() * activeDrinks.length)];
      if (this.hasIngredientsForRecipe(drink.id)) {
        chosenItems.push(drink);
      }
    }

    const activeExtras = RECIPES.filter(
      (r) => (r.category === 'yan_urun' || r.category === 'tatli') && this.state.menu[r.id]?.active && r.appeal[cType] >= 50
    );
    if (activeExtras.length > 0 && Math.random() < 0.30) {
      const extra = activeExtras[Math.floor(Math.random() * activeExtras.length)];
      if (this.hasIngredientsForRecipe(extra.id)) {
        chosenItems.push(extra);
      }
    }

    let orderRevenue = 0;
    let orderCost = 0;

    for (const item of chosenItems) {
      const ms = this.state.menu[item.id];
      this.consumeIngredientsForRecipe(item.id);
      const unitCost = this.getRecipeUnitCost(item.id);
      orderRevenue += ms.price;
      orderCost += unitCost;
      ms.soldToday += 1;
      ms.soldTotal += 1;
    }

    this.state.shop.donerRollKg = Math.max(0, Math.round((this.state.shop.donerRollKg - 0.06) * 100) / 100);

    if (isOnlineOrder) {
      const commission = Math.round(orderRevenue * this.state.shop.onlineCommissionRate);
      orderRevenue -= commission;
      this.state.finance.todayStats.onlineOrdersServed += 1;
    } else if (menuState.price <= demandInfo.maxBudgetPrice && this.state.shop.hygiene >= 78 && Math.random() < 0.25) {
      const tip = Math.round(orderRevenue * 0.08);
      orderRevenue += tip;
      this.state.finance.todayStats.tipsEarned += tip;
    }

    this.state.finance.cash += orderRevenue;
    this.state.finance.todayStats.revenue += orderRevenue;
    this.state.finance.todayStats.ingredientCost += orderCost;
    this.state.finance.todayStats.customersServed += 1;
    this.state.quests.lifetimeCustomersServed = (this.state.quests.lifetimeCustomersServed || 0) + 1;
    this.state.finance.todayStats.byCustomerType[cType] =
      (this.state.finance.todayStats.byCustomerType[cType] || 0) + 1;

    this.recordHourlyTelemetry();

    const hasKomi = this.state.staff.some((s) => s.role === 'komi');
    this.state.shop.hygiene = Math.max(20, this.state.shop.hygiene - (hasKomi ? 0.05 : 0.22));
    const activeBr = this.state.branches?.find((b) => b.id === this.state.activeBranchId);
    ReputationSystem.checkBranchScandal(
      this.state,
      this.state.shop.name,
      activeBr?.provinceId || 'istanbul',
      this.state.shop.hygiene
    );

    if (menuState.price <= demandInfo.maxBudgetPrice && this.state.shop.hygiene >= 72) {
      this.state.shop.reputation = Math.min(100, this.state.shop.reputation + 0.1);
    }

    if (Math.random() < 0.12) {
      this.pushWrittenStreetEncounter(cType, chosenMain.name);
    }
  }

  recordHourlyTelemetry() {
    const m = this.state.time.minuteOfDay;
    const bucketIdx = Math.max(0, Math.min(7, Math.floor((m - 480) / 110)));
    const list = this.state.finance.hourlyStats;
    if (!list || !list[bucketIdx]) return;

    for (let i = bucketIdx; i < list.length; i++) {
      list[i].revenue = this.state.finance.todayStats.revenue;
      list[i].cost = this.state.finance.todayStats.ingredientCost + this.state.finance.todayStats.operatingCost;
      list[i].customers = this.state.finance.todayStats.customersServed;
    }
  }

  pushWrittenStreetEncounter(cType, dishName) {
    const totalMin = Math.floor(this.state.time.minuteOfDay);
    const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const mm = String(totalMin % 60).padStart(2, '0');

    const templates = {
      ogrenci: [
        { speaker: 'Üniversiteli Berk', role: 'Öğrenci Müşteri', text: `Ustam ${dishName} hem bütçemize uygun hem çok doyurucu, kampüs grubuna yazdım!` },
        { speaker: 'Merve & Arkadaşları', role: 'Öğrenci Grubu', text: 'Ders arası sıcak lavaş ve köpüklü ayran ilaç gibi geldi, eline sağlık.' }
      ],
      isci: [
        { speaker: 'Oto Tamircisi Kadir Usta', role: 'Sanayi Esnafı', text: `Öğle paydosunda senin ${dishName} kokusunu duyunca çıraklarla koşa koşa geldik.` },
        { speaker: 'Şantiye Şefi Hakan', role: 'İşçi Müşteri', text: 'Eti bol, ekmeği sıcak! Akşam vardiyasına da paket söyleyeceğiz.' }
      ],
      aile: [
        { speaker: 'Emekli Öğretmen Nermin Hnm.', role: 'Mahalle Sakini', text: `Çocuklarla gönül rahatlığıyla yemek yediğimiz tek temiz dönerci burası.` },
        { speaker: 'Yılmaz Ailesi', role: 'Aile Müşterisi', text: `${dishName} porsiyonları çok doyurucu, hafta sonu misafirlerimizle tekrar geleceğiz.` }
      ],
      turist: [
        { speaker: 'Gurme Gezgin Rehberi', role: 'Yerli Turist', text: `Geleneksel yaprak döner lezzetini bozmayan nadir ustalardansınız, tam puan!` }
      ],
      esnaf: [
        { speaker: 'Terzi Kemal Amca', role: 'Komşu Esnaf', text: 'Komşum kasanda bereket, ocağında huzur eksik olmasın. Çayını içmeye uğrayacağım.' },
        { speaker: 'Kırtasiyeci Nermin Abla', role: 'Komşu Esnaf', text: 'Senin dükkan açıldığından beri sokağımıza canlılık geldi, müşteri ayağı kesilmiyor.' }
      ]
    };

    const pool = templates[cType] || templates.esnaf;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    this.state.streetFeed.unshift({
      id: 'sf_' + Date.now(),
      timeLabel: `${hh}:${mm}`,
      speaker: picked.speaker,
      role: picked.role,
      text: picked.text,
      impactLabel: '+Memnuniyet',
      tone: 'good'
    });

    if (this.state.streetFeed.length > 20) {
      this.state.streetFeed.pop();
    }
  }

  hasIngredientsForRecipe(recipeId) {
    const rec = RECIPES.find((r) => r.id === recipeId);
    if (!rec) return false;
    const portionFactor = this.state.menu[recipeId]?.portionFactor || 1.0;
    for (const req of rec.ingredients) {
      const st = this.state.inventory[req.ingredientId];
      if (!st || st.amount < req.amount * portionFactor * 0.4) return false;
    }
    return true;
  }

  consumeIngredientsForRecipe(recipeId) {
    const rec = RECIPES.find((r) => r.id === recipeId);
    if (!rec) return;
    const portionFactor = this.state.menu[recipeId]?.portionFactor || 1.0;
    for (const req of rec.ingredients) {
      const st = this.state.inventory[req.ingredientId];
      if (st) {
        st.amount = Math.max(0, Math.round((st.amount - req.amount * portionFactor * 0.4) * 10) / 10);
      }
    }
  }

  restockDonerSkewer(silent = false) {
    const tavukSt = this.state.inventory['tavuk_eti'];
    const etSt = this.state.inventory['yaprak_et'];
    if ((tavukSt?.amount || 0) < 5 && (etSt?.amount || 0) < 5) {
      if (!silent) bus.emit('toast:show', { title: 'Depoda Et Kalmadı!', text: 'Şişe döner takmak için Depo sekmesinden et sipariş edin.', type: 'danger' });
      return false;
    }
    this.state.shop.donerRollKg = this.state.shop.donerMaxKg;
    this.state.shop.donerCookLevel = 88;
    if (!silent) {
      bus.emit('toast:show', { title: 'Yeni Döner Şişi Takıldı 🔥', text: `${this.state.shop.donerMaxKg} kg taze döner ocağa yerleştirildi!`, type: 'success' });
      bus.emit('state:updated', this.state);
    }
    return true;
  }

  cleanShopAction() {
    if (this.state.player.energy < 10) {
      bus.emit('toast:show', { title: 'Enerjin Çok Düşük!', text: 'Dinlenmeye ihtiyacın var veya bir komi işe almalısın.', type: 'warning' });
      return;
    }
    this.state.player.energy = Math.max(0, this.state.player.energy - 10);
    this.state.shop.hygiene = Math.min(100, this.state.shop.hygiene + 22);
    for (const item of this.state.shop.placedItems) {
      item.condition = 100;
    }
    bus.emit('toast:show', { title: 'Dükkan Pırıl Pırıl Oldu ✨', text: 'Masalar, tezgah ve ocak tertemiz silindi (+22 Hijyen).', type: 'success' });
    bus.emit('state:updated', this.state);
  }

  // ==========================================================================
  // GÜN SONU KAPANIŞI, MUHASEBE, ENFLASYON VE YAŞLANMA DÖNGÜSÜ
  // ==========================================================================

  finishDay() {
    const st = this.state;

    const hood = NEIGHBORHOOD_TYPES.find((n) => n.id === st.player.neighborhoodType) || NEIGHBORHOOD_TYPES[0];
    const baseDailyShopRent = Math.round(450 * hood.rentMultiplier * st.shop.level * st.finance.inflationIndex);

    let upkeepCost = 0;
    for (const placed of st.shop.placedItems) {
      const def = FURNITURE_CATALOG.find((f) => f.id === placed.itemId);
      if (def) upkeepCost += Math.round(def.dailyUpkeep * st.finance.inflationIndex);
    }

    let staffDailySalary = 0;
    for (const member of st.staff) {
      if (!member.isFamily) {
        staffDailySalary += Math.round((member.baseSalary * st.finance.inflationIndex) / 30);
      }
      member.experienceDays += 1;
      if (member.experienceDays % 15 === 0) {
        member.skill = Math.min(100, member.skill + 2);
      }
    }

    let loanInstallments = 0;
    for (let i = st.finance.loans.length - 1; i >= 0; i--) {
      const loan = st.finance.loans[i];
      loanInstallments += loan.dailyInstallment;
      loan.remainingPrincipal = Math.max(0, loan.remainingPrincipal - loan.dailyInstallment);
      loan.remainingDays -= 1;
      if (loan.remainingDays <= 0 || loan.remainingPrincipal <= 0) {
        st.finance.loans.splice(i, 1);
      }
    }
    st.finance.bankDebt = st.finance.loans.reduce((sum, l) => sum + l.remainingPrincipal, 0);

    const totalOperatingCost = baseDailyShopRent + upkeepCost + staffDailySalary + loanInstallments;
    st.finance.todayStats.operatingCost += totalOperatingCost;
    st.finance.cash -= totalOperatingCost;

    const dailyHouseBase = Math.round((st.family.houseRentBase * st.finance.inflationIndex) / 30);
    const memberDailyCost = st.family.members.reduce(
      (sum, m) => sum + Math.round((m.monthlyExpense * st.finance.inflationIndex) / 30),
      0
    );
    const totalFamilyCost = dailyHouseBase + memberDailyCost;
    st.finance.todayStats.familyCost += totalFamilyCost;
    st.finance.cash -= totalFamilyCost;

    const timeBalanceDelta = (st.player.familyTimeRatio - 35) * 0.08;
    for (const fm of st.family.members) {
      fm.happiness = Math.max(15, Math.min(100, Math.round(fm.happiness + timeBalanceDelta)));
    }
    if (st.family.members.length > 0) {
      st.family.avgHappiness = Math.round(
        st.family.members.reduce((s, m) => s + m.happiness, 0) / st.family.members.length
      );
    }

    let dailyInvestIncome = 0;
    for (const h of st.finance.holdings) {
      const cat = INVESTMENT_CATALOG.find((c) => c.id === h.id);
      const volatility = cat?.volatility || 0.01;
      const randomSwing = (Math.random() - 0.44) * volatility;
      h.currentUnitValue = Math.max(100, Math.round(h.currentUnitValue * (1 + randomSwing + st.finance.monthlyInflationRate / 30)));
      if (h.type === 'mevduat' || h.type === 'arac' || h.type === 'sube') {
        const yieldCash = Math.round(h.units * h.currentUnitValue * h.dailyYieldRate);
        dailyInvestIncome += yieldCash;
      }
    }

    for (const npc of STREET_NPCS) {
      const npcState = st.npcs[npc.id];
      if (npcState && npcState.partnerShare > 0) {
        const shareFactor = npcState.partnerShare / 100;
        const healthFactor = 0.5 + npcState.shopHealth / 100;
        const dividend = Math.round(npc.dailyDividendBase * st.finance.inflationIndex * shareFactor * healthFactor);
        dailyInvestIncome += dividend;
      }
      if (npcState) {
        npcState.talkedToday = false;
      }
    }

    st.finance.cash += dailyInvestIncome;
    st.finance.todayStats.investmentIncome = dailyInvestIncome;

    let spoiledItems = [];
    const hasFridge = st.shop.placedItems.some((p) => p.itemId === 'endustriyel_buzdolabi');
    for (const ing of INGREDIENTS) {
      const stock = st.inventory[ing.id];
      if (stock && stock.amount > 0) {
        if (!hasFridge || Math.random() < 0.45) {
          stock.freshnessDays -= 1;
        }
        if (stock.freshnessDays <= 0) {
          spoiledItems.push(`${ing.name}`);
          stock.amount = Math.round(stock.amount * 0.5);
          stock.freshnessDays = ing.shelfLifeDays;
        }
      }
    }
    if (spoiledItems.length > 0) {
      bus.emit('toast:show', {
        title: 'Depoda SKT Fire Uyarısı ⚠️',
        text: `Bazı malzemelerin tazeliği azaldı: ${spoiledItems.join(', ')}`,
        type: 'warning'
      });
    }

    this.generateDailyCustomerReview();

    // Tüm şubelerin kira, vergi, uzak şehir lojistik ve holding yönetim giderlerini hesapla
    BranchSystem.settleAllBranchesEndOfDay(st);
    // Kademeli yönetim, müdürler, politikalar, karar kutusu ve yönetim raporunu çalıştır
    ManagementSystem.runDailyManagementCycle(st);

    const netProfit =
      st.finance.todayStats.revenue +
      st.finance.todayStats.investmentIncome -
      st.finance.todayStats.ingredientCost -
      st.finance.todayStats.operatingCost -
      st.finance.todayStats.familyCost;

    const entry = {
      day: st.time.day,
      dateLabel: `Yıl ${st.time.year} • ${st.time.season} • Gün ${st.time.day}`,
      revenue: st.finance.todayStats.revenue,
      ingredientCost: st.finance.todayStats.ingredientCost,
      operatingCost: st.finance.todayStats.operatingCost,
      familyCost: st.finance.todayStats.familyCost,
      investmentIncome: st.finance.todayStats.investmentIncome,
      netProfit,
      customersServed: st.finance.todayStats.customersServed,
      customersLost: st.finance.todayStats.customersLost,
      inflationIndex: st.finance.inflationIndex
    };
    st.finance.ledgerHistory.push(entry);
    if (st.finance.ledgerHistory.length > 60) {
      st.finance.ledgerHistory.shift();
    }

    this.checkAchievements();

    st.time.day += 1;
    st.time.minuteOfDay = 480;
    st.time.phase = 'sabah_hazirlik';
    st.player.energy = Math.min(100, 75 + Math.round(st.player.familyTimeRatio * 0.35));
    this.eventsTriggeredTodayCount = 0;
    this.rollNextOrganicEventTime();

    // Yeni günde trafik çarpanı normale yaklaşır
    st.shop.trafficMultiplier = 1.0;
    st.shop.trafficReason = 'Normal Sokak Akışı (%100)';

    if (st.time.day % 10 === 0) {
      const stepInflation = st.finance.monthlyInflationRate / 3;
      st.finance.inflationIndex = Math.round(st.finance.inflationIndex * (1 + stepInflation) * 1000) / 1000;
      st.finance.goldPrice = Math.round(3000 * st.finance.inflationIndex);
      st.finance.usdPrice = Math.round(35 * st.finance.inflationIndex * 10) / 10;
    }

    if ((st.time.day - 1) % 30 === 0 && st.time.day > 1) {
      const seasons = ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];
      const seasonIdx = Math.floor(((st.time.day - 1) / 30) % 4);
      st.time.season = seasons[seasonIdx];

      bus.emit('toast:show', {
        title: `Yeni Mevsim: ${st.time.season} & Enflasyon Güncellemesi`,
        text: `Enflasyon Endeksi x${st.finance.inflationIndex.toFixed(2)} oldu. Menü fiyatlarınızı kontrol edin!`,
        type: 'info'
      });
    }

    if ((st.time.day - 1) % 120 === 0 && st.time.day > 1) {
      st.time.year += 1;
      st.player.age += 1;
      for (const fm of st.family.members) {
        fm.age += 1;
        if (fm.relation === 'Çocuk' && fm.age === 16) {
          fm.statusText = 'Artık 16 yaşında! Dükkanda harçlıkla yardıma gelebilir.';
        } else if (fm.relation === 'Çocuk' && fm.age >= 18) {
          fm.statusText = 'Yetişkin bir usta adayı! Dükkanda tam zamanlı çalışabilir veya işi devralabilir.';
        }
      }
      st.storyLog.push({
        day: st.time.day,
        title: `${st.time.year}. Yıla Girildi!`,
        text: `${st.player.name} artık ${st.player.age} yaşında. Aile büyümeye ve dükkan kök salmaya devam ediyor.`
      });
    }

    st.finance.hourlyStats = this.createInitialHourlyStats();
    st.finance.todayStats = {
      revenue: 0,
      ingredientCost: 0,
      operatingCost: 0,
      familyCost: 0,
      investmentIncome: 0,
      customersServed: 0,
      customersLost: 0,
      tipsEarned: 0,
      onlineOrdersServed: 0,
      byCustomerType: { ogrenci: 4, isci: 3, aile: 2, turist: 1, esnaf: 2 }
    };
    for (const recId of Object.keys(st.menu)) {
      st.menu[recId].soldToday = 0;
    }
    BranchSystem.resetDailyBranchCounters(st);
    QuestSystem.evaluateQuests(st, this.getNetWorth());

    SaveManager.saveAuto(st);
    bus.emit('day:finished', entry);
    bus.emit('state:updated', st);
  }

  generateDailyCustomerReview() {
    const st = this.state;
    if (st.finance.todayStats.customersServed === 0) return;

    const lostRatio = st.finance.todayStats.customersLost / Math.max(1, st.finance.todayStats.customersServed);
    let pool = REVIEW_TEMPLATES.positive;
    let rating = 5;

    if (st.shop.hygiene < 55 || lostRatio > 0.35) {
      pool = REVIEW_TEMPLATES.negative;
      rating = 2;
    } else if (st.shop.hygiene < 75 || lostRatio > 0.15) {
      pool = REVIEW_TEMPLATES.neutral;
      rating = 3;
    }

    const comment = pool[Math.floor(Math.random() * pool.length)];
    const names = ['Gurme_Mert34', 'Ayşe_K', 'Sanayici_Kenan', 'Kampüs_Gezgini', 'Mahalleli_Hasan'];
    st.reviews.unshift({
      id: 'rev_' + Date.now(),
      author: names[Math.floor(Math.random() * names.length)],
      customerType: this.pickCustomerType(),
      rating,
      comment,
      day: st.time.day
    });
    if (st.reviews.length > 25) st.reviews.pop();
  }

  recalculateShopStats() {
    const st = this.state;
    let seating = st.shop.hasSidewalkPermit ? 6 : 0;
    if (st.shop.hasSecondFloor) seating += 8;

    let decor = st.shop.hasSidewalkPermit ? 8 : 0;
    if (st.shop.hasSecondFloor) decor += 16;

    let speed = 10;
    let donerMax = 15;

    const wall = WALL_STYLES.find((w) => w.id === st.shop.wallColor);
    const floor = FLOOR_STYLES.find((f) => f.id === st.shop.floorStyle);
    if (wall) decor += wall.decorBonus;
    if (floor) decor += floor.decorBonus;

    for (const placed of st.shop.placedItems) {
      const def = FURNITURE_CATALOG.find((f) => f.id === placed.itemId);
      if (!def) continue;
      seating += def.effects.seating || 0;
      decor += def.effects.decorBonus || 0;
      speed += def.effects.speedBonus || 0;
      donerMax += def.effects.donerMaxKgBonus || 0;
    }

    for (const member of st.staff) {
      if (member.role === 'usta') speed += Math.round(member.skill * 0.25);
      if (member.role === 'kasiyer') speed += Math.round(member.skill * 0.18);
    }

    st.shop.seatingCapacity = Math.max(4, seating);
    st.shop.decorScore = decor;
    st.shop.speedBonus = speed;
    st.shop.donerMaxKg = Math.max(25, donerMax);
  }

  buyAndPlaceFurniture(itemId, gx = 0, gy = 0) {
    const def = FURNITURE_CATALOG.find((f) => f.id === itemId);
    if (!def) return { ok: false, msg: 'Ekipman bulunamadı.' };

    const price = Math.round(def.basePrice * this.state.finance.inflationIndex);
    if (this.state.finance.cash < price) {
      return { ok: false, msg: `Yetersiz nakit! (${price.toLocaleString('tr-TR')} TL gerekli)` };
    }

    this.state.finance.cash -= price;
    this.state.finance.todayStats.operatingCost += price;
    this.state.shop.placedItems.push({
      instanceId: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      itemId: def.id,
      gx,
      gy,
      condition: 100
    });

    if (def.effects.hygieneBonus) {
      this.state.shop.hygiene = Math.min(100, this.state.shop.hygiene + def.effects.hygieneBonus);
    }

    this.recalculateShopStats();
    this.checkAchievements();
    SaveManager.saveAuto(this.state);
    bus.emit('state:updated', this.state);
    return { ok: true, msg: `${def.name} satın alındı ve dükkana kuruldu!` };
  }

  sellPlacedFurniture(instanceId) {
    const idx = this.state.shop.placedItems.findIndex((p) => p.instanceId === instanceId);
    if (idx === -1) return;
    const item = this.state.shop.placedItems[idx];
    const def = FURNITURE_CATALOG.find((f) => f.id === item.itemId);
    const refund = def ? Math.round(def.basePrice * this.state.finance.inflationIndex * 0.5) : 1000;
    this.state.shop.placedItems.splice(idx, 1);
    this.state.finance.cash += refund;
    this.recalculateShopStats();
    SaveManager.saveAuto(this.state);
    bus.emit('toast:show', { title: 'Ekipman İkinci El Satıldı', text: `${refund.toLocaleString('tr-TR')} TL kasaya eklendi.`, type: 'info' });
    bus.emit('state:updated', this.state);
  }

  orderIngredientPack(ingredientId, tier) {
    const def = INGREDIENTS.find((i) => i.id === ingredientId);
    if (!def) return { ok: false, msg: 'Malzeme bulunamadı.' };

    const unitCost = this.getIngredientUnitCost(ingredientId, tier);
    const totalCost = Math.round(unitCost * def.packSize);

    if (this.state.finance.cash < totalCost) {
      return { ok: false, msg: `Yetersiz bakiye! (${totalCost.toLocaleString('tr-TR')} TL gerekli)` };
    }

    this.state.finance.cash -= totalCost;
    this.state.finance.todayStats.ingredientCost += totalCost;

    const st = this.state.inventory[ingredientId];
    const tierDef = SUPPLIER_TIERS[tier];
    st.amount = Math.round((st.amount + def.packSize) * 10) / 10;
    st.supplierTier = tier;
    st.freshnessDays = Math.max(4, def.shelfLifeDays + tierDef.shelfLifeDelta);

    if (tier === 'kaliteli') {
      this.state.shop.reputation = Math.min(100, this.state.shop.reputation + 0.5);
    } else if (tier === 'ucuz') {
      this.state.shop.reputation = Math.max(10, this.state.shop.reputation - 0.6);
    }

    SaveManager.saveAuto(this.state);
    bus.emit('state:updated', this.state);
    return { ok: true, msg: `+${def.packSize} ${def.unit} ${def.name} depoya eklendi.` };
  }

  hireStaff(candidate) {
    const hiringFee = Math.round(candidate.baseSalary * this.state.finance.inflationIndex * 0.25);
    if (this.state.finance.cash < hiringFee) {
      return { ok: false, msg: `İşe giriş sigorta/peşinat ödemesi için ${hiringFee.toLocaleString('tr-TR')} TL gerekli.` };
    }
    this.state.finance.cash -= hiringFee;
    this.state.finance.todayStats.operatingCost += hiringFee;
    this.state.staff.push({
      ...candidate,
      id: 'staff_' + Date.now(),
      experienceDays: 1
    });
    this.recalculateShopStats();
    SaveManager.saveAuto(this.state);
    bus.emit('state:updated', this.state);
    return { ok: true, msg: `${candidate.name} dükkanda işe başladı!` };
  }

  trainStaff(staffId) {
    const member = this.state.staff.find((s) => s.id === staffId);
    if (!member) return;
    const cost = Math.round(2500 * this.state.finance.inflationIndex);
    if (this.state.finance.cash < cost) {
      bus.emit('toast:show', { title: 'Yetersiz Nakit', text: `Eğitim için ${cost.toLocaleString('tr-TR')} TL gerekli.`, type: 'warning' });
      return;
    }
    this.state.finance.cash -= cost;
    this.state.finance.todayStats.operatingCost += cost;
    member.skill = Math.min(100, member.skill + 10);
    member.morale = Math.min(100, member.morale + 12);
    this.recalculateShopStats();
    bus.emit('toast:show', { title: 'Personel Eğitimi Tamamlandı', text: `${member.name} ustalık ve moral kazandı!`, type: 'success' });
    bus.emit('state:updated', this.state);
  }

  fireStaff(staffId) {
    const idx = this.state.staff.findIndex((s) => s.id === staffId);
    if (idx === -1) return;
    const member = this.state.staff[idx];
    if (member.isFamily) {
      const fm = this.state.family.members.find((m) => m.name === member.name);
      if (fm) fm.worksInShop = false;
    }
    this.state.staff.splice(idx, 1);
    this.recalculateShopStats();
    bus.emit('state:updated', this.state);
  }

  // ==========================================================================
  // ORGANİK RASTGELE OLAYLAR (HİJYEN, MÜŞTERİ YOĞUNLUĞU, ESNAF, AİLE)
  // ==========================================================================

  triggerOrganicEvent() {
    let pool = RANDOM_EVENTS;

    // Hijyen 72 altındaysa hijyen olaylarının ağırlığı artar
    if (this.state.shop.hygiene < 72 && Math.random() < 0.65) {
      const hygEvents = RANDOM_EVENTS.filter((e) => e.category === 'hijyen');
      if (hygEvents.length > 0) pool = hygEvents;
    }

    const ev = pool[Math.floor(Math.random() * pool.length)];
    this.state.time.speed = 0;
    bus.emit('event:triggered', ev);
    bus.emit('state:updated', this.state);
  }

  applyEventChoice(eventId, choiceIndex) {
    const ev = RANDOM_EVENTS.find((e) => e.id === eventId);
    if (!ev || !ev.choices[choiceIndex]) return;
    const choice = ev.choices[choiceIndex];
    const eff = choice.effects;
    const inf = this.state.finance.inflationIndex;

    if (eff.cashDelta) {
      const scaledCash = Math.round(eff.cashDelta * inf);
      this.state.finance.cash += scaledCash;
      if (scaledCash > 0) this.state.finance.todayStats.revenue += scaledCash;
      else this.state.finance.todayStats.operatingCost += Math.abs(scaledCash);
    }
    if (eff.reputationDelta) {
      this.state.shop.reputation = Math.max(5, Math.min(100, this.state.shop.reputation + eff.reputationDelta));
    }
    if (eff.hygieneDelta) {
      this.state.shop.hygiene = Math.max(10, Math.min(100, this.state.shop.hygiene + eff.hygieneDelta));
    }
    if (eff.energyDelta) {
      this.state.player.energy = Math.max(0, Math.min(100, this.state.player.energy + eff.energyDelta));
    }
    if (eff.familyHappinessDelta) {
      for (const m of this.state.family.members) {
        m.happiness = Math.max(10, Math.min(100, m.happiness + eff.familyHappinessDelta));
      }
    }
    if (eff.inflationDelta) {
      this.state.finance.inflationIndex = Math.round((this.state.finance.inflationIndex + eff.inflationDelta) * 1000) / 1000;
    }
    if (eff.trafficMultiplierDelta) {
      this.state.shop.trafficMultiplier = Math.max(
        0.4,
        Math.min(1.6, Math.round(((this.state.shop.trafficMultiplier || 1.0) + eff.trafficMultiplierDelta) * 100) / 100)
      );
      const pct = Math.round(this.state.shop.trafficMultiplier * 100);
      this.state.shop.trafficReason = `${ev.title} (%${pct} Yoğunluk)`;
    }
    if (eff.addVeresiye) {
      this.state.finance.veresiyeList.push({
        id: 'ver_' + Date.now(),
        debtorName: eff.addVeresiye.debtorName,
        amount: Math.round(eff.addVeresiye.amount * inf),
        dayGiven: this.state.time.day,
        dueDay: this.state.time.day + 10,
        trustScore: eff.addVeresiye.trustScore,
        note: eff.addVeresiye.note
      });
    }

    bus.emit('toast:show', { title: ev.title, text: choice.outcomeText, type: 'info' });
    this.state.time.speed = 1;
    SaveManager.saveAuto(this.state);
    bus.emit('state:updated', this.state);
  }

  getNetWorth() {
    const holdingsVal = this.state.finance.holdings.reduce((s, h) => s + h.units * h.currentUnitValue, 0);
    let partnerVal = 0;
    for (const npc of STREET_NPCS) {
      const st = this.state.npcs[npc.id];
      if (st && st.partnerShare > 0) {
        partnerVal += Math.round(npc.partnerBaseValuation * this.state.finance.inflationIndex * (st.partnerShare / 100));
      }
    }
    return Math.round(this.state.finance.cash + holdingsVal + partnerVal - this.state.finance.bankDebt);
  }

  checkAchievements() {
    const st = this.state;
    const unlock = (id) => {
      if (st.unlockedAchievements.includes(id)) return;
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return;
      st.unlockedAchievements.push(id);
      const reward = Math.round(def.rewardCash * st.finance.inflationIndex);
      st.finance.cash += reward;
      st.storyLog.push({
        day: st.time.day,
        title: `Başarım Kazanıldı: ${def.title} ${def.icon}`,
        text: `${def.description} (+${reward.toLocaleString('tr-TR')} TL Ödül)`
      });
      bus.emit('toast:show', {
        title: `🏆 Başarım: ${def.title}`,
        text: `${def.description} (+${reward.toLocaleString('tr-TR')} TL)`,
        type: 'success'
      });
    };

    if (st.finance.todayStats.revenue >= 5000) unlock('ilk_bin_tl');

    const totalSold = Object.values(st.menu).reduce((s, m) => s + m.soldTotal, 0);
    if (totalSold >= 100) unlock('yuz_musteri');

    const goodFriends = Object.values(st.npcs).filter((n) => n.relation >= 75).length;
    if (goodFriends >= 3) unlock('mahallenin_sevileni');

    if (st.shop.decorScore >= 50) unlock('dekor_ustasi');

    const hasPartner = Object.values(st.npcs).some((n) => n.partnerShare > 0) || st.finance.holdings.length > 0;
    if (hasPartner) unlock('ortak_patron');

    if (st.family.members.some((m) => m.worksInShop) || st.player.successorId) unlock('ikinci_kusak');

    if (this.getNetWorth() >= 500000 && st.shop.hasSecondFloor) unlock('doner_imparatoru');
  }
}
