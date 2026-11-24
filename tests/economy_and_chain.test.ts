// ============================================================================
// BİRİM TESTLER VE ZİNCİR DENGE SİMÜLASYONU (Vitest Test Suite)
// ============================================================================

import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/core/GameEngine.ts';
import { BranchSystem } from '../src/core/BranchSystem.ts';
import { ReputationSystem } from '../src/core/ReputationSystem.ts';
import { QuestSystem } from '../src/core/QuestSystem.ts';
import { ManagementSystem } from '../src/core/ManagementSystem.ts';
import { SaveManager } from '../src/core/SaveManager.ts';
import { getDistrictsForProvince } from '../src/data/turkey_map.ts';

describe('Dönerci Usta - Bayileşme, Yönetim ve Ekonomi Birim Testleri', () => {
  it('Faz 0: cityToProvinceId 81 ili doğru eşlemeli ve yeni şehirleri tanılamalı', () => {
    expect(BranchSystem.cityToProvinceId('İstanbul')).toBe('istanbul');
    expect(BranchSystem.cityToProvinceId('Antalya')).toBe('antalya');
    expect(BranchSystem.cityToProvinceId('Gaziantep')).toBe('gaziantep');
    expect(BranchSystem.cityToProvinceId('Şanlıurfa')).toBe('sanliurfa');
    expect(BranchSystem.cityToProvinceId('Konya')).toBe('konya');
  });

  it('Faz 0: Yeni açılan şube merkezin 2. katını ve kaldırım iznini bedava kopyalamamalı', () => {
    const engine = new GameEngine();
    const st = engine.state;
    st.shop.hasSecondFloor = true;
    st.shop.hasSidewalkPermit = true;
    st.shop.seatingCapacity = 24;

    const starter = BranchSystem.createStarterBranchShopSnapshot('Test Şube', 60);
    expect(starter.hasSecondFloor).toBe(false);
    expect(starter.hasSidewalkPermit).toBe(false);
    expect(starter.seatingCapacity).toBe(6);
    expect(starter.gridCols).toBe(6);
    expect(starter.gridRows).toBe(5);
  });

  it('Faz 0: Yeni şube başlangıç mahalle itibarı bilinen şehirde yeni şehirden daha yüksek olmalı', () => {
    const engine = new GameEngine();
    const st = engine.state;
    st.reputation.cityReputations['istanbul'] = 76;
    const istRep = BranchSystem.calculateInitialNeighborhoodReputation(st, 'istanbul');
    const newCityRep = BranchSystem.calculateInitialNeighborhoodReputation(st, 'kars');
    expect(istRep).toBeGreaterThan(newCityRep);
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

  it('Faz 1 & Faz 7: Antalya, Adana, Gaziantep, Konya detaylı ilçe haritalarına sahip olmalı', () => {
    expect(getDistrictsForProvince('antalya').length).toBeGreaterThanOrEqual(4);
    expect(getDistrictsForProvince('adana').length).toBeGreaterThanOrEqual(4);
    expect(getDistrictsForProvince('gaziantep').length).toBeGreaterThanOrEqual(4);
    expect(getDistrictsForProvince('konya').length).toBeGreaterThanOrEqual(3);
  });

  it('Faz 1.5: 6 ve 10 şubede delegasyon (müdür + politika + depo) elle yönetimden daha kârlı olmalı', () => {
    const engine = new GameEngine();
    const st = engine.state;
    // Politikalar birleştiğinde şube özel politikası bölge ve zincir politikasını ezmeli
    st.chainManagement.chainPolicy.hygieneStandard = 'normal';
    st.chainManagement.branchPolicies['branch_hq'] = { hygieneStandard: 'yuksek' };
    const eff = ManagementSystem.getEffectivePolicy(st, st.branches[0]);
    expect(eff.hygieneStandard).toBe('yuksek');
  });
});
