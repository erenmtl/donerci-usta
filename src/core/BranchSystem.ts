// ============================================================================
// ÇOKLU ŞUBE VE TÜRKİYE BAYİLEŞME SİSTEMİ (BranchSystem.ts)
// Şube açma koşul kontrolü, şubeler arası geçiş, şube kapatma ve zincir muhasebesi
// ============================================================================

import type { GameState, BranchState, IngredientStock, MenuItemState } from '../types/index.ts';
import { TURKEY_PROVINCES, getDistrictsForProvince, type DistrictDef } from '../data/turkey_map.ts';
import { EXPANSION_CONFIG, QUEST_CATALOG } from '../data/quests.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import { RECIPES } from '../data/recipes.ts';
import { ReputationSystem } from './ReputationSystem.ts';
import { bus } from './EventBus.ts';

export class BranchSystem {
  public static cityToProvinceId(cityName: string): string {
    const map: Record<string, string> = {
      'İstanbul': 'istanbul',
      'Ankara': 'ankara',
      'İzmir': 'izmir',
      'Bursa': 'bursa',
      'Hatay': 'hatay',
      'Trabzon': 'trabzon'
    };
    return map[cityName] || 'istanbul';
  }

  public static createHeadquartersBranch(state: GameState) {
    const provId = this.cityToProvinceId(state.player.city);
    const prov = TURKEY_PROVINCES.find((p) => p.id === provId) || TURKEY_PROVINCES[0];
    const districts = getDistrictsForProvince(provId);
    const matchedDist =
      districts.find((d) => d.neighborhoodType === state.player.neighborhoodType) || districts[0];

    return {
      id: 'branch_hq',
      name: `${state.shop.name} (${matchedDist.name} Merkez)`,
      provinceId: prov.id,
      provinceName: prov.name,
      districtId: matchedDist.id,
      districtName: matchedDist.name,
      neighborhoodType: matchedDist.neighborhoodType,
      isHeadquarters: true,
      neighborhoodReputation: Math.round(state.shop.reputation),
      hygiene: Math.round(state.shop.hygiene),
      decorScore: state.shop.decorScore,
      seatingCapacity: state.shop.seatingCapacity,
      dailyRentBase: matchedDist.dailyRentBase,
      logisticsMultiplier: 1.0,
      openingCostPaid: 35000,
      staffCount: state.staff.length,
      stockHealthPct: 95,
      todayRevenue: state.finance.todayStats.revenue,
      todayIngredientCost: state.finance.todayStats.ingredientCost,
      todayRentAndTax: 0,
      todayLogisticsCost: 0,
      todayStaffCost: 0,
      todayNetProfit: state.finance.todayStats.revenue - state.finance.todayStats.ingredientCost,
      todayCustomers: state.finance.todayStats.customersServed,
      totalCumulativeProfit: 12500
    };
  }

  /**
   * Aktif şubenin verilerini BranchState içine kaydeder.
   */
  public static saveActiveToBranch(state: GameState): void {
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
   * Oyuncunun yönetim ekranını seçilen şubeye geçirir (Her şube ayrı yönetilebilir).
   */
  public static switchActiveBranch(state: GameState, targetBranchId: string): boolean {
    if (state.activeBranchId === targetBranchId) return true;
    const target = state.branches.find((b) => b.id === targetBranchId);
    if (!target) return false;

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
   * Bir ilçede yeni şube açmak için gereken iki temel koşulu (Görev/İtibar + Nakit) ve maliyet dökümünü hesaplar.
   */
  public static evaluateDistrictOpening(state: GameState, provinceId: string, district: any) {
    const prov = TURKEY_PROVINCES.find((p) => p.id === provinceId) || TURKEY_PROVINCES[0];
    const inf = state.finance.inflationIndex;
    const realEstateDealMult = state.npcs['emlakci_murat']?.hasActiveDeal ? 0.85 : 1.0;

    const alreadyOpen = state.branches.some((b) => b.districtId === district.id);
    const openingCost = Math.round(district.openingCostBase * inf * realEstateDealMult);
    const dailyRent = Math.round(district.dailyRentBase * inf);

    // Lojistik çarpanı: Merkez şube ile aynı ildeyse düşük, farklı ildeyse mesafe çarpanlı
    const hqProvId = state.branches[0]?.provinceId || 'istanbul';
    const isSameProvince = hqProvId === provinceId;
    const logisticsMultiplier = isSameProvince ? 1.05 : prov.logisticsDistanceFactor;
    const estDailyLogistics = Math.round(
      (isSameProvince ? 180 : 380 * prov.logisticsDistanceFactor) * inf
    );

    // Şube sayısı arttıkça binen holding yönetim yükü
    const nextBranchIndex = state.branches.length + 1;
    const estHoldingOverhead = Math.round(
      EXPANSION_CONFIG.holdingOverheadPerBranch * nextBranchIndex * (1 + (nextBranchIndex - 1) * EXPANSION_CONFIG.branchComplexityMultiplier) * inf
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

    const canOpen =
      !alreadyOpen &&
      isQuestTierCompleted &&
      hasBranchSlot &&
      meetsCityRep &&
      meetsCountryRep &&
      hasEnoughCash;

    const reasons: string[] = [];
    if (alreadyOpen) reasons.push('Bu ilçede zaten aktif bir şubeniz bulunuyor.');
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
      reasons
    };
  }

  /**
   * Seçilen il ve ilçede yeni şube açar.
   */
  public static openNewBranch(state: GameState, provinceId: string, districtId: string): { ok: boolean; msg: string } {
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
    const newInv: Record<string, IngredientStock> = {};
    for (const ing of INGREDIENTS) {
      newInv[ing.id] = {
        ingredientId: ing.id,
        amount: Math.round(ing.startingStock * 0.75),
        freshnessDays: ing.shelfLifeDays,
        supplierTier: 'standart'
      };
    }

    const newMenu: Record<string, MenuItemState> = {};
    for (const rec of RECIPES) {
      newMenu[rec.id] = {
        recipeId: rec.id,
        active: state.menu[rec.id]?.active ?? true,
        price: state.menu[rec.id]?.price || rec.baseSuggestedPrice,
        portionFactor: 1.0,
        soldToday: 0,
        soldTotal: 0
      };
    }

    const baseName = state.branches[0]?.name.split('(')[0].trim() || 'Meşhur Dönerci';
    const newBranchId = `branch_${provinceId}_${district.id}_${Date.now()}`;
    const newBranch: BranchState = {
      id: newBranchId,
      name: `${baseName} (${prov.name} - ${district.name})`,
      provinceId: prov.id,
      provinceName: prov.name,
      districtId: district.id,
      districtName: district.name,
      neighborhoodType: district.neighborhoodType,
      isHeadquarters: false,
      neighborhoodReputation: Math.max(52, Math.round(check.countryRep * 0.9)),
      hygiene: 90,
      decorScore: 22,
      seatingCapacity: 8,
      dailyRentBase: district.dailyRentBase,
      logisticsMultiplier: check.logisticsMultiplier,
      openingCostPaid: check.openingCost,
      staffCount: 1,
      stockHealthPct: 85,
      todayRevenue: 0,
      todayIngredientCost: 0,
      todayRentAndTax: 0,
      todayLogisticsCost: 0,
      todayStaffCost: 0,
      todayNetProfit: 0,
      todayCustomers: 0,
      totalCumulativeProfit: 0,
      snapshot: {
        shop: {
          ...JSON.parse(JSON.stringify(state.shop)),
          name: `${baseName} (${prov.name} - ${district.name})`,
          level: 1,
          hygiene: 90,
          reputation: Math.max(52, Math.round(check.countryRep * 0.9)),
          donerRollKg: 25,
          donerMaxKg: 25
        },
        inventory: newInv,
        staff: [
          {
            id: 'staff_br_' + Date.now(),
            name: `${district.name} Şube Ustası`,
            role: 'usta',
            skill: 72,
            morale: 88,
            baseSalary: 25000,
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
      text: `${prov.name} / ${district.name} lokasyonunda ${state.branches.length}. şubenin ocağı yakıldı!`
    });

    ReputationSystem.syncReputations(state);
    bus.emit('toast:show', {
      title: `🎉 Yeni Şube Açıldı: ${district.name}!`,
      text: `${prov.name} - ${district.name} şubeniz hizmete girdi! Şubeler arasında geçiş yaparak yönetebilirsiniz.`,
      type: 'success'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: `${newBranch.name} başarıyla açıldı!` };
  }

  /**
   * Zarardaki veya nakit ihtiyacı olan bir şubeyi kapatır/devreder (Merkez şube kapatılamaz).
   */
  public static closeOrSellBranch(state: GameState, branchId: string): { ok: boolean; msg: string } {
    const idx = state.branches.findIndex((b) => b.id === branchId);
    if (idx === -1) return { ok: false, msg: 'Şube bulunamadı.' };
    const branch = state.branches[idx];
    if (branch.isHeadquarters || state.branches.length <= 1) {
      return { ok: false, msg: 'Ana Merkez Şube kapatılamaz!' };
    }

    const refund = Math.round(branch.openingCostPaid * EXPANSION_CONFIG.branchCloseRefundRatio);
    state.finance.cash += refund;

    // İtibar etkisi
    const prevCityRep = state.reputation.cityReputations[branch.provinceId] || 55;
    state.reputation.cityReputations[branch.provinceId] = Math.max(
      15,
      prevCityRep + EXPANSION_CONFIG.branchCloseCityRepPenalty
    );
    state.reputation.countryReputation = Math.max(
      15,
      state.reputation.countryReputation + EXPANSION_CONFIG.branchCloseBrandRepPenalty
    );

    // Eğer kapatılan şube şu an aktif yönetilen şubeyse merkeze dön
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
   * Gün içinde arka plandaki diğer şubelerin müşteri, satış, lojistik ve hijyen akışını simüle eder.
   */
  public static simulateBackgroundBranchesIntraday(state: GameState, minutesDelta: number): void {
    if (!state.branches || state.branches.length <= 1) return;
    const inf = state.finance.inflationIndex;

    for (const b of state.branches) {
      if (b.id === state.activeBranchId) {
        // Aktif şubenin verilerini canlı eşitle
        b.todayRevenue = state.finance.todayStats.revenue;
        b.todayIngredientCost = state.finance.todayStats.ingredientCost;
        b.todayCustomers = state.finance.todayStats.customersServed;
        b.neighborhoodReputation = Math.round(state.shop.reputation);
        b.hygiene = Math.round(state.shop.hygiene);
        continue;
      }

      const districts = getDistrictsForProvince(b.provinceId);
      const distDef = districts.find((d) => d.id === b.districtId);
      const potentialFactor = (distDef?.customerPotential || 80) / 85;
      const repFactor = 0.6 + (b.neighborhoodReputation / 100) * 0.8;
      const hygFactor = b.hygiene >= 70 ? 1.05 : b.hygiene >= 50 ? 0.8 : 0.45;

      const arrivalProb = 0.032 * minutesDelta * potentialFactor * repFactor * hygFactor;
      if (Math.random() < arrivalProb) {
        const avgTicket = Math.round(135 * inf * (0.9 + (b.neighborhoodReputation / 100) * 0.25));
        const ingCost = Math.round(avgTicket * 0.36);

        b.todayCustomers += 1;
        b.todayRevenue += avgTicket;
        b.todayIngredientCost += ingCost;

        state.finance.cash += avgTicket - ingCost;
        state.quests.lifetimeCustomersServed = (state.quests.lifetimeCustomersServed || 0) + 1;

        // Şube hijyen ve itibar değişimi
        b.hygiene = Math.max(25, Math.round((b.hygiene - 0.14) * 10) / 10);
        if (b.hygiene >= 72) {
          b.neighborhoodReputation = Math.min(100, Math.round((b.neighborhoodReputation + 0.08) * 10) / 10);
        } else if (b.hygiene < 50) {
          b.neighborhoodReputation = Math.max(15, Math.round((b.neighborhoodReputation - 0.18) * 10) / 10);
        }

        // Skandal kontrolü
        ReputationSystem.checkBranchScandal(state, b.name, b.provinceId, b.hygiene);
      }
    }
  }

  /**
   * Gün sonunda tüm şubelerin kira, vergi, uzak şehir lojistik, personel ve holding yönetim giderlerini keser.
   */
  public static settleAllBranchesEndOfDay(state: GameState) {
    this.saveActiveToBranch(state);
    const inf = state.finance.inflationIndex;
    const branchCount = state.branches.length;

    let totalChainRevenue = 0;
    let totalChainExpenses = 0;

    state.branches.forEach((b, index) => {
      const rent = Math.round(b.dailyRentBase * inf);
      const tax = Math.round(b.todayRevenue * EXPANSION_CONFIG.corporateTaxRate);
      // Uzak şehirlerde tedarik/nakliye maliyeti daha yüksek
      const logistics = b.isHeadquarters
        ? Math.round(120 * inf)
        : Math.round((220 * b.logisticsMultiplier + b.todayIngredientCost * EXPANSION_CONFIG.remoteCityLogisticsBaseRate * (b.logisticsMultiplier - 0.85)) * inf);

      // Şube sayısı arttıkça genel yönetim/holding yükü artar
      const holdingOverhead = b.isHeadquarters
        ? 0
        : Math.round(
            EXPANSION_CONFIG.holdingOverheadPerBranch *
              (1 + index * EXPANSION_CONFIG.branchComplexityMultiplier) *
              inf
          );

      const staffCost = b.isHeadquarters
        ? 0 // Merkez şube personeli zaten ana finishDay içinde kesiliyor
        : Math.round(b.staffCount * 750 * inf);

      b.todayRentAndTax = rent + tax + holdingOverhead;
      b.todayLogisticsCost = logistics;
      b.todayStaffCost = staffCost;

      const branchTotalExpense = b.todayIngredientCost + b.todayRentAndTax + b.todayLogisticsCost + b.todayStaffCost;
      b.todayNetProfit = b.todayRevenue - branchTotalExpense;
      b.totalCumulativeProfit += b.todayNetProfit;

      // Arka plan şubelerinin kira, vergi, lojistik ve personel giderini kasadan düş
      if (!b.isHeadquarters) {
        const nonIngDeduction = b.todayRentAndTax + b.todayLogisticsCost + b.todayStaffCost;
        state.finance.cash -= nonIngDeduction;
        state.finance.todayStats.operatingCost += nonIngDeduction;
        // Sabah temizliğiyle arka plan şubelerinin hijyeni kısmen toparlanır
        b.hygiene = Math.min(95, b.hygiene + 16);
      }

      totalChainRevenue += b.todayRevenue;
      totalChainExpenses += branchTotalExpense;
    });

    ReputationSystem.syncReputations(state);

    return {
      totalChainRevenue,
      totalChainExpenses,
      totalChainNetProfit: totalChainRevenue - totalChainExpenses
    };
  }

  public static resetDailyBranchCounters(state: GameState): void {
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
