// ============================================================================
// ÇOKLU ŞUBE, BAYİLİK (FRANCHISE) VE TÜRKİYE GENİŞLEME SİSTEMİ (BranchSystem.ts)
// ============================================================================

import { TURKEY_PROVINCES, getDistrictsForProvince } from '../data/turkey_map.js';
import { EXPANSION_CONFIG, QUEST_CATALOG } from '../data/quests.js';
import { MANAGEMENT_CONFIG, REGIONAL_CULTURE_MODIFIERS, LOCAL_RIVAL_CHAINS } from '../data/management.js';
import { INGREDIENTS } from '../data/ingredients.js';
import { RECIPES } from '../data/recipes.js';
import { ReputationSystem } from './ReputationSystem.js';
import { bus } from './EventBus.js';

export class BranchSystem {
  /**
   * Faz 0.3: Türkçe karakter normalizasyonu ile 81 ilin tamamını TURKEY_PROVINCES üzerinden eşler.
   */
  static normalizeTr(str) {
    return (str || '')
      .trim()
      .replace(/İ/g, 'i')
      .replace(/I/g, 'i')
      .replace(/ı/g, 'i')
      .replace(/Ğ/g, 'g')
      .replace(/ğ/g, 'g')
      .replace(/Ü/g, 'u')
      .replace(/ü/g, 'u')
      .replace(/Ş/g, 's')
      .replace(/ş/g, 's')
      .replace(/Ö/g, 'o')
      .replace(/ö/g, 'o')
      .replace(/Ç/g, 'c')
      .replace(/ç/g, 'c')
      .toLowerCase();
  }

  static cityToProvinceId(cityName) {
    if (!cityName) return 'istanbul';
    const norm = this.normalizeTr(cityName);
    const matched = TURKEY_PROVINCES.find(
      (p) => p.id === norm || this.normalizeTr(p.name) === norm || p.plate === norm
    );
    if (matched) return matched.id;
    const partial = TURKEY_PROVINCES.find(
      (p) => this.normalizeTr(p.name).includes(norm) || norm.includes(p.id)
    );
    return partial ? partial.id : 'istanbul';
  }

  /**
   * Faz 0.1: Yeni açılan şube merkezin 2. katını, kaldırım iznini ve eşyalarını bedava kopyalamaz;
   * temel başlangıç dükkanıyla (6x5 grid, seviye 1, 2. katsız, izinsiz, temel tezgah/ocak/masa) başlar.
   */
  static createStarterBranchShopSnapshot(branchName, initialRep) {
    return {
      name: branchName,
      level: 1,
      gridCols: MANAGEMENT_CONFIG.starterBranchGridCols,
      gridRows: MANAGEMENT_CONFIG.starterBranchGridRows,
      hasSidewalkPermit: false,
      hasSecondFloor: false,
      onlineDeliveryEnabled: false,
      onlineCommissionRate: 0.18,
      autoOrderIngredients: true,
      wallColor: 'krem_siva',
      floorStyle: 'klasik_karo',
      hygiene: 90,
      reputation: initialRep,
      decorScore: MANAGEMENT_CONFIG.starterBranchDecorScore,
      seatingCapacity: 6,
      speedBonus: 12,
      donerRollKg: 25,
      donerMaxKg: 25,
      donerCookLevel: 92,
      autoRestockDoner: true,
      trafficMultiplier: 1.0,
      trafficReason: 'Normal Sokak Akışı (%100)',
      placedItems: [
        { instanceId: 'br_ocak_' + Date.now(), itemId: 'doner_ocagi_standart', gx: 1, gy: 0, condition: 100 },
        { instanceId: 'br_tezgah_' + Date.now(), itemId: 'mermer_tezgah', gx: 2, gy: 0, condition: 100 },
        { instanceId: 'br_kasa_' + Date.now(), itemId: 'kasa_pos', gx: 4, gy: 0, condition: 100 },
        { instanceId: 'br_dolap_' + Date.now(), itemId: 'endustriyel_buzdolabi', gx: 0, gy: 0, condition: 100 },
        { instanceId: 'br_masa1_' + Date.now(), itemId: 'tabureli_masa', gx: 1, gy: 2, condition: 100 },
        { instanceId: 'br_masa2_' + Date.now(), itemId: 'aile_masasi_4', gx: 3, gy: 2, condition: 100 }
      ]
    };
  }

  /**
   * Faz 0.5: Yeni şubenin başlangıç mahalle itibarı şehirdeki marka bilinirliğine ve şehir itibarına bağlıdır.
   * O şehirde zaten şubemiz varsa şehir itibarı + şube bonusu ile daha yüksek, yeni şehirse daha düşük başlar.
   */
  static calculateInitialNeighborhoodReputation(state, provinceId) {
    const existingBranchesInCity = (state.branches || []).filter((b) => b.provinceId === provinceId).length;
    const countryRep = state.reputation?.countryReputation || 54;
    const cityRep = state.reputation?.cityReputations?.[provinceId];

    if (existingBranchesInCity > 0 && typeof cityRep === 'number') {
      const fromCity =
        cityRep * MANAGEMENT_CONFIG.existingCityRepWeight +
        countryRep * 0.18 +
        existingBranchesInCity * MANAGEMENT_CONFIG.existingCityBranchBonusPerBranch;
      return Math.max(48, Math.min(MANAGEMENT_CONFIG.maxInitialNeighborhoodRep, Math.round(fromCity)));
    }

    // İlk kez girilen yeni bir şehir: ülke markasının kısmi etkisiyle daha mütevazı başlar
    const knownCityRep = typeof cityRep === 'number' ? (cityRep - 50) * 0.25 : 0;
    const newCityRep =
      MANAGEMENT_CONFIG.newCityBaseNeighborhoodRep +
      countryRep * MANAGEMENT_CONFIG.newCityCountryRepWeight +
      knownCityRep;
    return Math.max(40, Math.min(72, Math.round(newCityRep)));
  }

  static createHeadquartersBranch(state) {
    const provId = this.cityToProvinceId(state.player.city);
    const prov = TURKEY_PROVINCES.find((p) => p.id === provId) || TURKEY_PROVINCES[0];
    const districts = getDistrictsForProvince(provId);
    const matchedDist =
      districts.find((d) => d.neighborhoodType === state.player.neighborhoodType) || districts[0];
    const inf = state.finance?.inflationIndex || 1.0;

    return {
      id: 'branch_hq',
      name: `${state.shop.name} (${matchedDist.name} Merkez)`,
      provinceId: prov.id,
      provinceName: prov.name,
      districtId: matchedDist.id,
      districtName: matchedDist.name,
      neighborhoodType: matchedDist.neighborhoodType,
      isHeadquarters: true,
      isFranchise: false,
      regionName: prov.region,
      neighborhoodReputation: Math.round(state.shop.reputation),
      hygiene: Math.round(state.shop.hygiene),
      decorScore: state.shop.decorScore,
      seatingCapacity: state.shop.seatingCapacity,
      dailyRentBase: matchedDist.dailyRentBase,
      logisticsMultiplier: 1.0,
      openingCostPaid: Math.round(MANAGEMENT_CONFIG.hqOpeningCostBase * inf),
      staffCount: state.staff.length,
      stockHealthPct: 95,
      todayRevenue: state.finance.todayStats.revenue,
      todayIngredientCost: state.finance.todayStats.ingredientCost,
      todayRentAndTax: 0,
      todayLogisticsCost: 0,
      todayStaffCost: 0,
      todayNetProfit: state.finance.todayStats.revenue - state.finance.todayStats.ingredientCost,
      todayCustomers: state.finance.todayStats.customersServed,
      totalCumulativeProfit: Math.round(MANAGEMENT_CONFIG.hqInitialCumulativeProfitBase * inf)
    };
  }

  /**
   * Aktif şubenin verilerini BranchState içine kaydeder.
   */
  static saveActiveToBranch(state) {
    const active = state.branches?.find((b) => b.id === state.activeBranchId);
    if (!active) return;

    active.neighborhoodReputation = Math.round(state.shop.reputation);
    active.hygiene = Math.round(state.shop.hygiene);
    active.decorScore = state.shop.decorScore;
    active.seatingCapacity = state.shop.seatingCapacity;
    active.staffCount = state.staff.length;
    active.todayRevenue = state.finance.todayStats.revenue;
    active.todayIngredientCost = state.finance.todayStats.ingredientCost;
    active.todayCustomers = state.finance.todayStats.customersServed;

    // Stok doluluk yüzdesi
    let stockSum = 0;
    for (const ing of INGREDIENTS) {
      const amt = state.inventory[ing.id]?.amount || 0;
      stockSum += Math.min(100, (amt / ing.startingStock) * 100);
    }
    active.stockHealthPct = Math.round(stockSum / INGREDIENTS.length);

    active.snapshot = {
      shop: JSON.parse(JSON.stringify(state.shop)),
      inventory: JSON.parse(JSON.stringify(state.inventory)),
      staff: JSON.parse(JSON.stringify(state.staff)),
      menu: JSON.parse(JSON.stringify(state.menu))
    };
  }

  /**
   * Oyuncunun yönetim ekranını seçilen şubeye geçirir (Bayiler doğrudan mikro yönetilemez, denetlenir).
   */
  static switchActiveBranch(state, targetBranchId) {
    if (state.activeBranchId === targetBranchId) return true;
    const target = state.branches.find((b) => b.id === targetBranchId);
    if (!target) return false;

    if (target.isFranchise) {
      bus.emit('toast:show', {
        title: `◆ Bayilik Şubesi (${target.districtName})`,
        text: `Bu lokasyon bağımsız bir Franchise bayisidir. Günlük operasyonunu bayi yürütür; Genel Merkez veya Harita üzerinden denetleyebilirsiniz.`,
        type: 'warning'
      });
      return false;
    }

    // Önce mevcut şubenin durumunu kaydet
    this.saveActiveToBranch(state);

    // Hedef şubeyi aktif yap
    state.activeBranchId = target.id;
    state.player.city = target.provinceName;
    state.player.neighborhoodType = target.neighborhoodType;

    if (target.snapshot) {
      state.shop = JSON.parse(JSON.stringify(target.snapshot.shop));
      state.inventory = JSON.parse(JSON.stringify(target.snapshot.inventory));
      state.staff = JSON.parse(JSON.stringify(target.snapshot.staff));
      state.menu = JSON.parse(JSON.stringify(target.snapshot.menu));
    }

    state.shop.name = target.name;
    state.shop.reputation = target.neighborhoodReputation;
    state.shop.hygiene = target.hygiene;
    state.shop.seatingCapacity = target.seatingCapacity;
    state.shop.decorScore = target.decorScore;
    state.finance.todayStats.revenue = target.todayRevenue;
    state.finance.todayStats.ingredientCost = target.todayIngredientCost;
    state.finance.todayStats.customersServed = target.todayCustomers;

    ReputationSystem.syncReputations(state);
    bus.emit('toast:show', {
      title: `🏪 Şube Yönetimi Değiştirildi`,
      text: `Şu an "${target.name}" (${target.provinceName} / ${target.districtName}) şubesini yönetiyorsunuz.`,
      type: 'info'
    });
    bus.emit('state:updated', state);
    return true;
  }

  /**
   * Bir ilçede yeni şube veya bayilik açmak için gereken koşulları ve maliyet dökümünü hesaplar.
   */
  static evaluateDistrictOpening(state, provinceId, district) {
    const prov = TURKEY_PROVINCES.find((p) => p.id === provinceId) || TURKEY_PROVINCES[0];
    const inf = state.finance.inflationIndex;
    const realEstateDealMult = state.npcs['emlakci_murat']?.hasActiveDeal ? 0.85 : 1.0;

    const alreadyOpen = state.branches.some((b) => b.districtId === district.id);
    const openingCost = Math.round(district.openingCostBase * inf * realEstateDealMult);
    const dailyRent = Math.round(district.dailyRentBase * inf);

    // Lojistik çarpanı: Merkez depo varsa soğuk zincir indirimi uygulanır
    const hqProvId = state.branches[0]?.provinceId || 'istanbul';
    const isSameProvince = hqProvId === provinceId;
    const warehouse = state.chainManagement?.warehouse;
    const warehouseColdReduction = warehouse?.built ? warehouse.coldChainReductionPct : 0;

    const rawLogisticsMult = isSameProvince ? 1.05 : prov.logisticsDistanceFactor;
    const logisticsMultiplier = Number(
      Math.max(1.0, 1 + (rawLogisticsMult - 1) * (1 - warehouseColdReduction)).toFixed(2)
    );
    const estDailyLogistics = Math.round(
      (isSameProvince ? 180 : 380 * logisticsMultiplier) * inf
    );

    // Şube sayısı arttıkça binen holding yönetim yükü
    const nextBranchIndex = state.branches.length + 1;
    const estHoldingOverhead = Math.round(
      EXPANSION_CONFIG.holdingOverheadPerBranch *
        nextBranchIndex *
        (1 + (nextBranchIndex - 1) * EXPANSION_CONFIG.branchComplexityMultiplier) *
        inf
    );

    // Koşul 1: Görev Kademesi & Maksimum Şube Hakkı
    const tierQuests = QUEST_CATALOG.filter((q) => q.tier === district.requiredQuestTier);
    const isQuestTierCompleted = tierQuests.every((q) => state.quests.completedQuestIds.includes(q.id));
    const hasBranchSlot = state.branches.length < state.quests.maxAllowedBranches;

    // Koşul 2: Minimum Şehir & Ülke İtibarı
    const cityRep = Math.round(state.reputation.cityReputations[provinceId] || 50);
    const countryRep = Math.round(state.reputation.countryReputation || 54);
    const meetsCityRep = cityRep >= district.minCityRep;
    const meetsCountryRep = countryRep >= district.minCountryRep;

    // Koşul 3: Yeterli Nakit Para
    const hasEnoughCash = state.finance.cash >= openingCost;

    // Faz 0.5: Tahmini başlangıç mahalle itibarı
    const estimatedInitialRep = this.calculateInitialNeighborhoodReputation(state, provinceId);

    // Faz 5: Bayilik (Franchise) verilebilir mi?
    const franchiseUpfrontFee = Math.round(openingCost * MANAGEMENT_CONFIG.franchiseUpfrontFeeRatio);
    const canGrantFranchise =
      !alreadyOpen &&
      state.branches.length >= MANAGEMENT_CONFIG.franchiseMinBranchesRequired &&
      countryRep >= Math.max(MANAGEMENT_CONFIG.franchiseMinCountryRep, district.minCountryRep) &&
      hasBranchSlot;

    const canOpen =
      !alreadyOpen &&
      isQuestTierCompleted &&
      hasBranchSlot &&
      meetsCityRep &&
      meetsCountryRep &&
      hasEnoughCash;

    const reasons = [];
    if (alreadyOpen) reasons.push('Bu ilçede zaten aktif bir şubeniz veya bayiniz bulunuyor.');
    if (!isQuestTierCompleted) reasons.push(`Kademe ${district.requiredQuestTier} görev setinin tamamlanması gerekiyor.`);
    if (!hasBranchSlot) reasons.push(`Mevcut şube açma limitiniz (${state.quests.maxAllowedBranches} Şube) dolu. Yeni görev kademesini tamamlayın.`);
    if (!meetsCityRep) reasons.push(`${prov.name} Şehir İtibarı en az ${district.minCityRep} olmalı (Şu an: ${cityRep}).`);
    if (!meetsCountryRep) reasons.push(`Türkiye Marka İtibarı en az ${district.minCountryRep} olmalı (Şu an: ${countryRep}).`);
    if (!hasEnoughCash) reasons.push(`Yetersiz nakit! (${openingCost.toLocaleString('tr-TR')} ₺ gerekli).`);

    return {
      canOpen,
      alreadyOpen,
      openingCost,
      dailyRent,
      logisticsMultiplier,
      estDailyLogistics,
      estHoldingOverhead,
      isQuestTierCompleted,
      hasBranchSlot,
      meetsCityRep,
      meetsCountryRep,
      hasEnoughCash,
      cityRep,
      countryRep,
      estimatedInitialRep,
      canGrantFranchise,
      franchiseUpfrontFee,
      franchiseRoyaltyPct: MANAGEMENT_CONFIG.franchiseDefaultRoyaltyPct,
      reasons
    };
  }

  /**
   * Seçilen il ve ilçede yeni öz şube açar (Faz 0 düzeltmeleriyle).
   */
  static openNewBranch(state, provinceId, districtId) {
    const districts = getDistrictsForProvince(provinceId);
    const district = districts.find((d) => d.id === districtId);
    const prov = TURKEY_PROVINCES.find((p) => p.id === provinceId);
    if (!district || !prov) {
      return { ok: false, msg: 'Lokasyon bilgisi bulunamadı.' };
    }

    const check = this.evaluateDistrictOpening(state, provinceId, district);
    if (!check.canOpen) {
      return { ok: false, msg: check.reasons[0] || 'Şube açma koşulları sağlanmıyor.' };
    }

    // Mevcut şubenin durumunu kaydet
    this.saveActiveToBranch(state);

    // Açılış masrafını kasadan düş
    state.finance.cash -= check.openingCost;
    state.finance.todayStats.operatingCost += check.openingCost;

    // Yeni şube için başlangıç stoku ve menü kopyası oluştur
    const newInv = {};
    const effectiveTier = state.chainManagement?.chainPolicy?.supplierTier || 'standart';
    for (const ing of INGREDIENTS) {
      newInv[ing.id] = {
        ingredientId: ing.id,
        amount: Math.round(ing.startingStock * 0.8),
        freshnessDays: ing.shelfLifeDays,
        supplierTier: effectiveTier
      };
    }

    const newMenu = {};
    for (const rec of RECIPES) {
      newMenu[rec.id] = {
        recipeId: rec.id,
        active: state.menu[rec.id]?.active ?? true,
        price: state.menu[rec.id]?.price || Math.round(rec.baseSuggestedPrice * state.finance.inflationIndex),
        portionFactor: 1.0,
        soldToday: 0,
        soldTotal: 0
      };
    }

    const baseName = state.branches[0]?.name.split('(')[0].trim() || 'Meşhur Dönerci';
    const branchLabel = `${baseName} (${prov.name} - ${district.name})`;
    const initialNeighborhoodRep = check.estimatedInitialRep;
    const starterShop = this.createStarterBranchShopSnapshot(branchLabel, initialNeighborhoodRep);
    const chefBaseSalary = MANAGEMENT_CONFIG.baseChefMonthlySalary;

    const newBranchId = `branch_${provinceId}_${district.id}_${Date.now()}`;
    const newBranch = {
      id: newBranchId,
      name: branchLabel,
      provinceId: prov.id,
      provinceName: prov.name,
      districtId: district.id,
      districtName: district.name,
      neighborhoodType: district.neighborhoodType,
      isHeadquarters: false,
      isFranchise: false,
      regionName: prov.region,
      neighborhoodReputation: initialNeighborhoodRep,
      hygiene: starterShop.hygiene,
      decorScore: starterShop.decorScore,
      seatingCapacity: starterShop.seatingCapacity,
      dailyRentBase: district.dailyRentBase,
      logisticsMultiplier: check.logisticsMultiplier,
      openingCostPaid: check.openingCost,
      staffCount: 1,
      stockHealthPct: 88,
      todayRevenue: 0,
      todayIngredientCost: 0,
      todayRentAndTax: 0,
      todayLogisticsCost: 0,
      todayStaffCost: 0,
      todayNetProfit: 0,
      todayCustomers: 0,
      totalCumulativeProfit: 0,
      snapshot: {
        shop: starterShop,
        inventory: newInv,
        staff: [
          {
            id: 'staff_br_' + Date.now(),
            name: `${district.name} Şube Ustası`,
            role: 'usta',
            skill: 72,
            morale: 88,
            baseSalary: chefBaseSalary,
            experienceDays: 1
          }
        ],
        menu: newMenu
      }
    };

    state.branches.push(newBranch);
    state.storyLog.push({
      day: state.time.day,
      title: `🏪 Yeni Şube Açıldı: ${newBranch.name}!`,
      text: `${prov.name} / ${district.name} lokasyonunda ${state.branches.length}. şubenin ocağı yakıldı! (Başlangıç Mahalle İtibarı: ${initialNeighborhoodRep})`
    });

    ReputationSystem.syncReputations(state);
    bus.emit('toast:show', {
      title: `🎉 Yeni Şube Açıldı: ${district.name}!`,
      text: `${prov.name} - ${district.name} şubeniz hizmete girdi! Başlangıç Mahalle İtibarı: ${initialNeighborhoodRep}.`,
      type: 'success'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: `${newBranch.name} başarıyla açıldı!` };
  }

  /**
   * Faz 5: Seçilen ilçede kendi şubeni açmak yerine Girişimciye İsim Hakkı (Franchise / Bayilik) verir.
   * Peşin isim hakkı bedeli kasaya girer + günlük cirodan %10 royalty alınır, kira/maaş/yatırım masrafı yoktur.
   */
  static grantFranchiseBranch(state, provinceId, districtId) {
    const districts = getDistrictsForProvince(provinceId);
    const district = districts.find((d) => d.id === districtId);
    const prov = TURKEY_PROVINCES.find((p) => p.id === provinceId);
    if (!district || !prov) {
      return { ok: false, msg: 'Lokasyon bilgisi bulunamadı.' };
    }

    const check = this.evaluateDistrictOpening(state, provinceId, district);
    if (!check.canGrantFranchise) {
      return {
        ok: false,
        msg: `Bayilik vermek için en az ${MANAGEMENT_CONFIG.franchiseMinBranchesRequired} şube, yeterli شube hakkı ve ${MANAGEMENT_CONFIG.franchiseMinCountryRep}+ Ülke Marka İtibarı gerekir.`
      };
    }

    this.saveActiveToBranch(state);

    // Peşin isim hakkı (Franchise Fee) kasaya gelir olarak girer!
    state.finance.cash += check.franchiseUpfrontFee;
    state.finance.todayStats.investmentIncome += check.franchiseUpfrontFee;

    const baseName = state.branches[0]?.name.split('(')[0].trim() || 'Meşhur Dönerci';
    const franchiseLabel = `◆ ${baseName} Bayi (${prov.name} - ${district.name})`;
    const initialRep = check.estimatedInitialRep;

    const newBranch = {
      id: `franchise_${provinceId}_${district.id}_${Date.now()}`,
      name: franchiseLabel,
      provinceId: prov.id,
      provinceName: prov.name,
      districtId: district.id,
      districtName: district.name,
      neighborhoodType: district.neighborhoodType,
      isHeadquarters: false,
      isFranchise: true,
      franchiseRoyaltyPct: check.franchiseRoyaltyPct,
      franchiseViolations: 0,
      regionName: prov.region,
      neighborhoodReputation: initialRep,
      hygiene: 84,
      decorScore: 18,
      seatingCapacity: 8,
      dailyRentBase: district.dailyRentBase,
      logisticsMultiplier: check.logisticsMultiplier,
      openingCostPaid: 0,
      staffCount: 2,
      stockHealthPct: 90,
      todayRevenue: 0,
      todayIngredientCost: 0,
      todayRentAndTax: 0,
      todayLogisticsCost: 0,
      todayStaffCost: 0,
      todayNetProfit: 0,
      todayCustomers: 0,
      totalCumulativeProfit: check.franchiseUpfrontFee
    };

    state.branches.push(newBranch);
    state.storyLog.push({
      day: state.time.day,
      title: `🤝 Yeni Bayilik (Franchise) Verildi: ${district.name}`,
      text: `${prov.name}/${district.name} bayisinden +${check.franchiseUpfrontFee.toLocaleString('tr-TR')} ₺ peşin isim hakkı alındı. Günlük cirodan %${check.franchiseRoyaltyPct} pay kasaya akacak.`
    });

    ReputationSystem.syncReputations(state);
    bus.emit('toast:show', {
      title: `◆ Bayilik Sözleşmesi İmzalandı!`,
      text: `${prov.name} - ${district.name} bayisinden +${check.franchiseUpfrontFee.toLocaleString('tr-TR')} ₺ peşin isim hakkı kasaya girdi!`,
      type: 'success'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: `${franchiseLabel} sözleşmesi imzalandı!` };
  }

  /**
   * Zarardaki veya nakit ihtiyacı olan bir şubeyi kapatır veya bayilik sözleşmesini fesheder.
   */
  static closeOrSellBranch(state, branchId) {
    const idx = state.branches.findIndex((b) => b.id === branchId);
    if (idx === -1) return { ok: false, msg: 'Şube bulunamadı.' };
    const branch = state.branches[idx];
    if (branch.isHeadquarters || state.branches.length <= 1) {
      return { ok: false, msg: 'Ana Merkez Şube kapatılamaz!' };
    }

    // Atanmış şube müdürü varsa boşa çıkar
    if (branch.managerId && state.chainManagement?.managers) {
      const mgr = state.chainManagement.managers.find((m) => m.id === branch.managerId);
      if (mgr) {
        mgr.assignedId = undefined;
        mgr.status = 'atanmamis';
      }
    }

    if (branch.isFranchise) {
      state.reputation.countryReputation = Math.max(
        15,
        state.reputation.countryReputation - MANAGEMENT_CONFIG.franchiseTerminationPenaltyRep
      );
      state.branches.splice(idx, 1);
      ReputationSystem.syncReputations(state);
      bus.emit('toast:show', {
        title: `📜 Bayilik Sözleşmesi Feshedildi`,
        text: `${branch.districtName} bayisinin tabelası indirildi.`,
        type: 'warning'
      });
      bus.emit('state:updated', state);
      return { ok: true, msg: 'Bayilik sözleşmesi feshedildi.' };
    }

    const refund = Math.round(branch.openingCostPaid * EXPANSION_CONFIG.branchCloseRefundRatio);
    state.finance.cash += refund;

    const prevCityRep = state.reputation.cityReputations[branch.provinceId] || 55;
    state.reputation.cityReputations[branch.provinceId] = Math.max(
      15,
      prevCityRep + EXPANSION_CONFIG.branchCloseCityRepPenalty
    );
    state.reputation.countryReputation = Math.max(
      15,
      state.reputation.countryReputation + EXPANSION_CONFIG.branchCloseBrandRepPenalty
    );

    if (state.activeBranchId === branch.id) {
      this.switchActiveBranch(state, state.branches[0].id);
    }

    state.branches.splice(idx, 1);
    state.storyLog.push({
      day: state.time.day,
      title: `⚠️ Şube Devredildi / Kapatıldı: ${branch.name}`,
      text: `Hava parası ve demirbaş satışından ${refund.toLocaleString('tr-TR')} ₺ kasaya geri döndü (Marka İtibarı ${EXPANSION_CONFIG.branchCloseBrandRepPenalty}).`
    });

    ReputationSystem.syncReputations(state);
    bus.emit('toast:show', {
      title: `Şube Kapatıldı: ${branch.districtName}`,
      text: `Demirbaş devrinden +${refund.toLocaleString('tr-TR')} ₺ nakit alındı. (Şehir İtibarı ${EXPANSION_CONFIG.branchCloseCityRepPenalty})`,
      type: 'warning'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: 'Şube kapatıldı.' };
  }

  /**
   * Faz 1.5, Faz 3, Faz 4, Faz 5, Faz 6:
   * Arka plandaki şubeleri ve bayileri tek tek müşteri zarı atmak yerine O(1) özet formülle simüle eder.
   * Müdür kalitesi, politika, bölgesel kültür, depo indirimi, kampanya ve rakip baskısı doğrudan hesaba katılır.
   */
  static simulateBackgroundBranchesIntraday(state, minutesDelta) {
    if (!state.branches || state.branches.length <= 1) return;
    const inf = state.finance.inflationIndex;
    const cm = state.chainManagement;

    for (const b of state.branches) {
      if (b.id === state.activeBranchId && !b.isFranchise) {
        b.todayRevenue = state.finance.todayStats.revenue;
        b.todayIngredientCost = state.finance.todayStats.ingredientCost;
        b.todayCustomers = state.finance.todayStats.customersServed;
        b.neighborhoodReputation = Math.round(state.shop.reputation);
        b.hygiene = Math.round(state.shop.hygiene);
        continue;
      }

      const prov = TURKEY_PROVINCES.find((p) => p.id === b.provinceId);
      const regionName = b.regionName || prov?.region || 'Marmara';
      const districts = getDistrictsForProvince(b.provinceId);
      const distDef = districts.find((d) => d.id === b.districtId);

      // 1. Yönetici (Şube Müdürü + Bölge Müdürü) etkisi
      const branchMgr = cm?.managers?.find((m) => m.id === b.managerId || (m.level === 'sube' && m.assignedId === b.id));
      const regionalMgr = cm?.managers?.find((m) => m.level === 'bolge' && m.assignedId === regionName);
      const mgrSkillFactor = branchMgr
        ? 0.92 + (branchMgr.skill / 100) * 0.35
        : b.isFranchise
          ? 0.98
          : 1 - MANAGEMENT_CONFIG.unmanagedBranchEfficiencyPenalty;
      const regionalBonus = regionalMgr ? 1 + (regionalMgr.skill / 100) * 0.12 : 1.0;

      // 2. Bölgesel kültür ve mevsim (turizm) etkisi
      const culture = REGIONAL_CULTURE_MODIFIERS[regionName] || REGIONAL_CULTURE_MODIFIERS['Marmara'];
      const seasonalBoost = state.time.season === 'Yaz' ? culture.summerTourismBoost : 1.0;
      const cultureDemandMult =
        ((culture.meatPreferenceBonus + culture.chickenPreferenceBonus + culture.spicyAndDessertBonus) / 3) *
        seasonalBoost;

      // 3. Aktif reklam kampanyası ve rakip fiyat savaşı etkisi
      let campaignMult = 1.0;
      if (cm?.activeCampaigns) {
        for (const camp of cm.activeCampaigns) {
          if (
            camp.scope === 'ulke' ||
            (camp.scope === 'sehir' && camp.targetId === b.provinceId) ||
            (camp.scope === 'mahalle' && camp.targetId === b.id)
          ) {
            campaignMult += camp.demandBonusPct;
          }
        }
      }

      const rival = LOCAL_RIVAL_CHAINS.find((r) => r.homeRegion === regionName);
      const rivalPressure =
        cm?.rivalPriceWarDaysLeft && cm.rivalPriceWarDaysLeft > 0
          ? cm.rivalCounterStance === 'kampanya' || cm.rivalCounterStance === 'fiyat_kir'
            ? 0.97
            : 1 - (rival?.pricePressurePct || 0.08)
          : 1.0;

      // 4. O(1) Beklenen müşteri akışı (minutesDelta üzerinden deterministik + hafif varyans)
      const potentialFactor = (distDef?.customerPotential || 80) / 82;
      const repFactor = 0.62 + (b.neighborhoodReputation / 100) * 0.78;
      const hygFactor = b.hygiene >= 72 ? 1.06 : b.hygiene >= 52 ? 0.84 : 0.48;
      const stockFactor = b.stockHealthPct >= 40 ? 1.0 : 0.55;

      const expectedRate =
        0.036 *
        minutesDelta *
        potentialFactor *
        repFactor *
        hygFactor *
        stockFactor *
        mgrSkillFactor *
        regionalBonus *
        cultureDemandMult *
        campaignMult *
        rivalPressure;

      // Küçük zaman adımlarında olasılıksal, büyük adımlarda tam sayı + kesir
      const wholeCustomers = Math.floor(expectedRate);
      const fracCustomer = Math.random() < expectedRate - wholeCustomers ? 1 : 0;
      const customersServedNow = wholeCustomers + fracCustomer;

      if (customersServedNow > 0) {
        // Politika fiyat çarpanı
        const branchPol = cm?.branchPolicies?.[b.id];
        const regionPol = cm?.regionPolicies?.[regionName];
        const priceMode = branchPol?.pricePolicy || regionPol?.pricePolicy || cm?.chainPolicy?.pricePolicy || 'enflasyon_takip';
        const pricePolicyMult = priceMode === 'mahalle_dinamik' ? 1.08 : priceMode === 'enflasyon_takip' ? 1.02 : 0.93;

        const avgTicket = Math.round(
          138 * inf * pricePolicyMult * (0.9 + (b.neighborhoodReputation / 100) * 0.26)
        );
        const stepRevenue = avgTicket * customersServedNow;

        // Merkez Depo toplu alım indirimi ve tedarik krizi etkisi
        const warehouseDiscount = cm?.warehouse?.built ? cm.warehouse.bulkDiscountPct : 0;
        const crisisSurcharge = cm?.warehouse?.supplyCrisisDaysLeft && cm.warehouse.supplyCrisisDaysLeft > 0 ? 0.14 : 0;
        const wasteReduction = branchMgr ? (branchMgr.skill / 100) * 0.05 : 0;
        const costRatio = Math.max(0.24, 0.36 * (1 - warehouseDiscount + crisisSurcharge - wasteReduction));
        const stepIngCost = Math.round(stepRevenue * costRatio);

        b.todayCustomers += customersServedNow;
        b.todayRevenue += stepRevenue;
        b.todayIngredientCost += stepIngCost;
        state.quests.lifetimeCustomersServed = (state.quests.lifetimeCustomersServed || 0) + customersServedNow;

        if (b.isFranchise) {
          // Bayilik (Franchise): sadece % royalty payı kasaya net gelir olarak girer
          const royaltyPct = (b.franchiseRoyaltyPct || MANAGEMENT_CONFIG.franchiseDefaultRoyaltyPct) / 100;
          const royaltyGain = Math.round(stepRevenue * royaltyPct);
          b.todayNetProfit += royaltyGain;
          state.finance.cash += royaltyGain;
        } else {
          state.finance.cash += stepRevenue - stepIngCost;
        }

        // Müdür varsa hijyeni korur, müdürsüz şube daha hızlı kirlenir
        const hygieneDrop = branchMgr
          ? Math.max(0.03, 0.12 - (branchMgr.skill / 100) * 0.08)
          : 0.17;
        b.hygiene = Math.max(25, Math.round((b.hygiene - hygieneDrop * customersServedNow) * 10) / 10);

        if (b.hygiene >= 74) {
          b.neighborhoodReputation = Math.min(100, Math.round((b.neighborhoodReputation + 0.07 * customersServedNow) * 10) / 10);
        } else if (b.hygiene < 52) {
          b.neighborhoodReputation = Math.max(15, Math.round((b.neighborhoodReputation - 0.18 * customersServedNow) * 10) / 10);
        }

        // Skandal kontrolü (müdür ve hijyen standardı etkili)
        const hygStd = branchPol?.hygieneStandard || regionPol?.hygieneStandard || cm?.chainPolicy?.hygieneStandard || 'normal';
        ReputationSystem.checkBranchScandal(
          state,
          b.name,
          b.provinceId,
          b.hygiene,
          branchMgr?.skill || 0,
          hygStd
        );
      }
    }
  }

  /**
   * Gün sonunda tüm şubelerin kira, vergi, uzak şehir lojistik, personel, müdür ve holding yönetim giderlerini keser.
   * Müdür ve politika kurulu zincirlerde organizasyon indirimi uygulanır.
   */
  static settleAllBranchesEndOfDay(state) {
    this.saveActiveToBranch(state);
    const inf = state.finance.inflationIndex;
    const cm = state.chainManagement;

    let totalChainRevenue = 0;
    let totalChainExpenses = 0;

    state.branches.forEach((b, index) => {
      if (b.isFranchise) {
        // Bayi kendi kirasını ve personelini öder; oyuncuya sadece royalty kârı yazar
        const royaltyPct = (b.franchiseRoyaltyPct || MANAGEMENT_CONFIG.franchiseDefaultRoyaltyPct) / 100;
        const royaltyProfit = Math.round(b.todayRevenue * royaltyPct);
        b.todayRentAndTax = 0;
        b.todayLogisticsCost = 0;
        b.todayStaffCost = 0;
        b.todayNetProfit = royaltyProfit;
        b.totalCumulativeProfit += royaltyProfit;
        totalChainRevenue += royaltyProfit;
        return;
      }

      const prov = TURKEY_PROVINCES.find((p) => p.id === b.provinceId);
      const regionName = b.regionName || prov?.region || 'Marmara';
      const branchMgr = cm?.managers?.find((m) => m.id === b.managerId || (m.level === 'sube' && m.assignedId === b.id));
      const regionalMgr = cm?.managers?.find((m) => m.level === 'bolge' && m.assignedId === regionName);

      const rent = Math.round(b.dailyRentBase * inf);
      const tax = Math.round(b.todayRevenue * EXPANSION_CONFIG.corporateTaxRate);

      // Merkez Depo soğuk zincir indirimi
      const warehouseColdReduction = cm?.warehouse?.built ? cm.warehouse.coldChainReductionPct : 0;
      const effectiveLogMult = Math.max(1.0, 1 + (b.logisticsMultiplier - 1) * (1 - warehouseColdReduction));

      const logistics = b.isHeadquarters
        ? Math.round(110 * inf)
        : Math.round(
            (200 * effectiveLogMult +
              b.todayIngredientCost * EXPANSION_CONFIG.remoteCityLogisticsBaseRate * (effectiveLogMult - 0.85)) *
              inf
          );

      // Faz 1.5: Şube sayısı arttıkça holding yönetim yükü artar, ANCAK şube müdürü ve bölge müdürü atanmışsa organizasyon indirimi uygulanır!
      let rawHoldingOverhead = b.isHeadquarters
        ? 0
        : (MANAGEMENT_CONFIG.holdingOverheadPerExtraBranchBase +
            index * MANAGEMENT_CONFIG.holdingQuadraticFactorBase) *
          (1 + index * EXPANSION_CONFIG.branchComplexityMultiplier) *
          inf;

      if (branchMgr) {
        rawHoldingOverhead *= 1 - MANAGEMENT_CONFIG.managedBranchOverheadDiscountPct;
      }
      if (regionalMgr) {
        rawHoldingOverhead *= 1 - MANAGEMENT_CONFIG.regionalManagerOverheadDiscountPct;
      }
      const holdingOverhead = Math.round(rawHoldingOverhead);

      const staffCost = b.isHeadquarters
        ? 0 // Merkez şube personeli ana finishDay içinde kesiliyor
        : Math.round(b.staffCount * (MANAGEMENT_CONFIG.baseChefMonthlySalary / 30) * inf);

      const mgrDailySalary = branchMgr ? Math.round((branchMgr.baseMonthlySalary / 30) * inf) : 0;

      b.todayRentAndTax = rent + tax + holdingOverhead;
      b.todayLogisticsCost = logistics;
      b.todayStaffCost = staffCost + mgrDailySalary;

      const branchTotalExpense = b.todayIngredientCost + b.todayRentAndTax + b.todayLogisticsCost + b.todayStaffCost;
      b.todayNetProfit = b.todayRevenue - branchTotalExpense;
      b.totalCumulativeProfit += b.todayNetProfit;

      if (!b.isHeadquarters) {
        const nonIngDeduction = b.todayRentAndTax + b.todayLogisticsCost + b.todayStaffCost;
        state.finance.cash -= nonIngDeduction;
        state.finance.todayStats.operatingCost += nonIngDeduction;

        // Müdürlü şube sabah temizliğini politikaya göre tam yapar, müdürsüz şube hijyen kaybeder
        if (branchMgr) {
          b.hygiene = Math.min(96, b.hygiene + 18 + Math.round(branchMgr.skill * 0.08));
        } else {
          b.hygiene = Math.max(35, Math.min(82, b.hygiene + 6 - MANAGEMENT_CONFIG.unmanagedBranchHygieneDecayPerDay));
        }
      }

      totalChainRevenue += b.todayRevenue;
      totalChainExpenses += branchTotalExpense;
    });

    // Bölge müdürleri ve Merkez Depo günlük bakım gideri
    if (cm) {
      let hqExtraCost = 0;
      for (const m of cm.managers) {
        if (m.level === 'bolge' && m.assignedId) {
          hqExtraCost += Math.round((m.baseMonthlySalary / 30) * inf);
        }
      }
      if (cm.warehouse?.built) {
        hqExtraCost += Math.round(MANAGEMENT_CONFIG.warehouseDailyMaintenanceBase * cm.warehouse.level * inf);
      }
      if (hqExtraCost > 0) {
        state.finance.cash -= hqExtraCost;
        state.finance.todayStats.operatingCost += hqExtraCost;
        totalChainExpenses += hqExtraCost;
      }
    }

    ReputationSystem.syncReputations(state);

    return {
      totalChainRevenue,
      totalChainExpenses,
      totalChainNetProfit: totalChainRevenue - totalChainExpenses
    };
  }

  static resetDailyBranchCounters(state) {
    for (const b of state.branches || []) {
      b.todayRevenue = 0;
      b.todayIngredientCost = 0;
      b.todayRentAndTax = 0;
      b.todayLogisticsCost = 0;
      b.todayStaffCost = 0;
      b.todayNetProfit = 0;
      b.todayCustomers = 0;
    }
  }
}
