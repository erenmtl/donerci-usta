// ============================================================================
// BİRİM TESTLER VE GERÇEK OYUN MOTORU ZİNCİR DENGE SİMÜLASYONU (Vitest Suite)
// Doğrudan TypeScript kaynak dosyalarını (GameEngine, BranchSystem, ManagementSystem,
// ReputationSystem, QuestSystem, SaveManager) çalıştırarak 1, 3, 6 ve 10 şubeli
// uzun oyun ekonomisini ve delegasyon farkını doğrular.
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

// Headless Node ortamı için localStorage ve window.setInterval/clearInterval polyfill
const memoryStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => memoryStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      memoryStorage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(memoryStorage)) delete memoryStorage[k];
    }
  };
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
    requestAnimationFrame: (cb: any) => cb()
  };
}

import { GameEngine } from '../src/core/GameEngine.ts';
import { BranchSystem } from '../src/core/BranchSystem.ts';
import { ReputationSystem } from '../src/core/ReputationSystem.ts';
import { QuestSystem } from '../src/core/QuestSystem.ts';
import { ManagementSystem } from '../src/core/ManagementSystem.ts';
import { SaveManager } from '../src/core/SaveManager.ts';
import { getDistrictsForProvince, TURKEY_PROVINCES } from '../src/data/turkey_map.ts';

/**
 * Gerçek GameEngine ve BranchSystem/ManagementSystem üzerinde N şubeli 20 günlük simülasyon koşar.
 */
function runRealEngineSimulation(branchCount: number, withDelegation: boolean) {
  const engine = new GameEngine();
  const st = engine.state;
  st.initialized = true;
  st.branches = [BranchSystem.createHeadquartersBranch(st)];
  st.activeBranchId = st.branches[0].id;
  st.finance.cash = 350000;
  st.quests.maxAllowedBranches = 99;
  st.quests.completedQuestIds = ['q_t1_customers', 'q_t1_daily_rev', 'q_t1_local_rep', 'q_t1_hygiene', 'q_t2_open_second', 'q_t2_city_rep', 'q_t2_survive', 'q_t3_three_branches', 'q_t3_brand_rep', 'q_t3_staff', 'q_t4_multi_city', 'q_t4_networth', 'q_t5_five_branches', 'q_t5_national_rep'];
  st.reputation.countryReputation = 78;
  for (const p of TURKEY_PROVINCES) {
    st.reputation.cityReputations[p.id] = 75;
  }

  const istDistricts = getDistrictsForProvince('istanbul');
  const ankDistricts = getDistrictsForProvince('ankara');
  const antDistricts = getDistrictsForProvince('antalya');
  const allTargets = [
    ...istDistricts.slice(1, 5).map((d) => ({ p: 'istanbul', d: d.id })),
    ...ankDistricts.slice(0, 3).map((d) => ({ p: 'ankara', d: d.id })),
    ...antDistricts.slice(0, 3).map((d) => ({ p: 'antalya', d: d.id }))
  ];

  for (let i = 1; i < branchCount; i++) {
    const t = allTargets[i - 1];
    st.finance.cash += 80000; // Açılış sermayesi
    const res = BranchSystem.openNewBranch(st, t.p, t.d);
    expect(res.ok).toBe(true);
  }

  expect(st.branches.length).toBe(branchCount);

  if (withDelegation && branchCount >= 3) {
    // Merkez depo kur (6+ şubede)
    if (branchCount >= 6) {
      st.finance.cash += 200000;
      ManagementSystem.buildOrUpgradeCentralWarehouse(st, 'istanbul');
    }

    // Her arka plan şubesine yetenekli Şube Müdürü ata
    for (const b of st.branches) {
      if (b.isHeadquarters) continue;
      const mgrId = `sim_mgr_${b.id}`;
      st.chainManagement.managers.push({
        id: mgrId,
        name: `Müdür ${b.districtName}`,
        title: 'Deneyimli Şube Müdürü',
        level: 'sube',
        skill: 84,
        honesty: 92,
        loyalty: 90,
        experience: 20,
        baseMonthlySalary: 32000,
        assignedId: b.id,
        status: 'aktif'
      });
      b.managerId = mgrId;
    }

    // 6+ şubede Bölge Müdürleri ata
    if (branchCount >= 6) {
      for (const reg of ['Marmara', 'İç Anadolu', 'Akdeniz']) {
        st.chainManagement.managers.push({
          id: `sim_reg_${reg}`,
          name: `${reg} Bölge Müdürü`,
          title: 'Bölge Direktörü',
          level: 'bolge',
          skill: 88,
          honesty: 95,
          loyalty: 92,
          experience: 35,
          baseMonthlySalary: 58000,
          assignedId: reg,
          status: 'aktif'
        });
      }
    }

    st.chainManagement.chainPolicy.pricePolicy = 'mahalle_dinamik';
    st.chainManagement.chainPolicy.hygieneStandard = 'yuksek';
  }

  let cumulativeChainNetProfit = 0;

  for (let day = 1; day <= 15; day++) {
    // Merkez şube günlük geliri
    st.finance.todayStats.revenue = Math.round(7800 * st.finance.inflationIndex);
    st.finance.todayStats.ingredientCost = Math.round(2500 * st.finance.inflationIndex);
    st.finance.todayStats.customersServed = 52;

    // Arka plan şubeleri 12 saatlik (720 dk) gün içi simülasyonu
    for (let step = 0; step < 12; step++) {
      BranchSystem.simulateBackgroundBranchesIntraday(st, 60);
    }

    const daySummary = BranchSystem.settleAllBranchesEndOfDay(st);
    cumulativeChainNetProfit += daySummary.totalChainNetProfit;
    ManagementSystem.runDailyManagementCycle(st);
    BranchSystem.resetDailyBranchCounters(st);
  }

  return {
    branchCount: st.branches.length,
    tier: st.chainManagement.tier,
    cumulativeChainNetProfit,
    avgDailyNetProfit: Math.round(cumulativeChainNetProfit / 15),
    countryRep: st.reputation.countryReputation
  };
}

describe('Dönerci Usta - Faz 0..8 Birim Testleri ve Gerçek Motor Denge Simülasyonu', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('Faz 0.1: Yeni açılan şube merkezin 2. katını ve kaldırım iznini bedava kopyalamamalı', () => {
    const starter = BranchSystem.createStarterBranchShopSnapshot('Test Şube', 60);
    expect(starter.hasSecondFloor).toBe(false);
    expect(starter.hasSidewalkPermit).toBe(false);
    expect(starter.seatingCapacity).toBe(6);
    expect(starter.gridCols).toBe(6);
    expect(starter.gridRows).toBe(5);
  });

  it('Faz 0.3: cityToProvinceId 81 ili Türkçe karakter duyarsız doğru eşlemeli', () => {
    expect(BranchSystem.cityToProvinceId('İstanbul')).toBe('istanbul');
    expect(BranchSystem.cityToProvinceId('Antalya')).toBe('antalya');
    expect(BranchSystem.cityToProvinceId('Gaziantep')).toBe('gaziantep');
    expect(BranchSystem.cityToProvinceId('Şanlıurfa')).toBe('sanliurfa');
    expect(BranchSystem.cityToProvinceId('Konya')).toBe('konya');
    expect(BranchSystem.cityToProvinceId('Adana')).toBe('adana');
  });

  it('Faz 0.4: SaveManager.migrateState eski kayıtlardaki eksik alanları doldurmalı', () => {
    const legacySave = {
      initialized: true,
      player: { name: 'Eski Usta', city: 'Adana', neighborhoodType: 'carsi_sanayi' },
      shop: { name: 'Eski Döner', reputation: 65, hygiene: 85, decorScore: 20, seatingCapacity: 8 },
      staff: [],
      finance: { cash: 50000, inflationIndex: 1.2, todayStats: { revenue: 0, ingredientCost: 0, customersServed: 10 } }
    };
    const migrated = SaveManager.migrateState(legacySave);
    expect(migrated).not.toBeNull();
    expect(migrated!.saveVersion).toBe(2);
    expect(migrated!.branches.length).toBe(1);
    expect(migrated!.branches[0].provinceId).toBe('adana');
    expect(migrated!.chainManagement.tier).toBe('usta');
  });

  it('Faz 0.5: Yeni şube başlangıç mahalle itibarı bilinen şehirde yeni şehirden daha yüksek olmalı', () => {
    const engine = new GameEngine();
    const st = engine.state;
    st.reputation.cityReputations['istanbul'] = 78;
    const istRep = BranchSystem.calculateInitialNeighborhoodReputation(st, 'istanbul');
    const newCityRep = BranchSystem.calculateInitialNeighborhoodReputation(st, 'kars');
    expect(istRep).toBeGreaterThan(newCityRep);
  });

  it('Faz 1 & Faz 5 & Faz 7: Politika hiyerarşisi, Bayilik (Franchise) ve yeni şehir haritaları çalışmalı', () => {
    expect(getDistrictsForProvince('antalya').length).toBeGreaterThanOrEqual(4);
    expect(getDistrictsForProvince('adana').length).toBeGreaterThanOrEqual(4);
    expect(getDistrictsForProvince('gaziantep').length).toBeGreaterThanOrEqual(4);
    expect(getDistrictsForProvince('konya').length).toBeGreaterThanOrEqual(3);

    const engine = new GameEngine();
    const st = engine.state;
    st.branches = [BranchSystem.createHeadquartersBranch(st)];
    st.chainManagement.chainPolicy.hygieneStandard = 'normal';
    st.chainManagement.branchPolicies['branch_hq'] = { hygieneStandard: 'yuksek' };
    const eff = ManagementSystem.getEffectivePolicy(st, st.branches[0]);
    expect(eff.hygieneStandard).toBe('yuksek');
  });

  it('Faz 8: Gerçek GameEngine üzerinde 1, 3, 6 ve 10 şubede Delegasyon (Müdür+Politika+Depo) elle yönetimi geçmeli', () => {
    const sim1 = runRealEngineSimulation(1, false);
    const sim3Manual = runRealEngineSimulation(3, false);
    const sim3Delegated = runRealEngineSimulation(3, true);
    const sim6Manual = runRealEngineSimulation(6, false);
    const sim6Delegated = runRealEngineSimulation(6, true);
    const sim10Manual = runRealEngineSimulation(10, false);
    const sim10Delegated = runRealEngineSimulation(10, true);

    expect(sim1.cumulativeChainNetProfit).toBeGreaterThan(0);
    expect(sim3Delegated.tier).toBe('mudur');
    expect(sim6Delegated.tier).toBe('holding');
    expect(sim10Delegated.tier).toBe('holding');

    expect(sim3Delegated.cumulativeChainNetProfit).toBeGreaterThan(sim3Manual.cumulativeChainNetProfit);
    expect(sim6Delegated.cumulativeChainNetProfit).toBeGreaterThan(sim6Manual.cumulativeChainNetProfit);
    expect(sim10Delegated.cumulativeChainNetProfit).toBeGreaterThan(sim10Manual.cumulativeChainNetProfit);
  });
});
